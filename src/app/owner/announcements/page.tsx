'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Megaphone, Globe, BookOpen, Users } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { Announcement, AnnouncementTarget } from '@/types/announcement'
import { Class, Section } from '@/types/class'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

export default function AnnouncementsPage() {
    const { profile } = useAuth()
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        target: 'school' as AnnouncementTarget,
        target_id: '',
        expires_at: '',
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [announcementsRes, classesRes, sectionsRes] = await Promise.all([
                supabase.from('announcements').select('*, creator:profiles(id, name)').order('created_at', { ascending: false }),
                supabase.from('classes').select('*').eq('status', 'active').order('class_name'),
                supabase.from('sections').select('*, class:classes(id, class_name)').eq('status', 'active').order('section_name'),
            ])

            if (announcementsRes.error) throw announcementsRes.error
            if (classesRes.error) throw classesRes.error
            if (sectionsRes.error) throw sectionsRes.error

            setAnnouncements(announcementsRes.data || [])
            setClasses(classesRes.data || [])
            setSections(sectionsRes.data || [])
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load announcements')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!formData.title || !formData.content) {
            toast.error('Please fill in all required fields')
            return
        }

        try {
            const { error } = await supabase.from('announcements').insert({
                title: formData.title,
                content: formData.content,
                target: formData.target,
                target_id: formData.target !== 'school' ? formData.target_id : null,
                expires_at: formData.expires_at || null,
                created_by: profile?.id,
            })

            if (error) throw error

            toast.success('Announcement created')
            setIsModalOpen(false)
            resetForm()
            fetchData()
        } catch (error: any) {
            console.error('Error creating announcement:', error)
            toast.error('Failed to create announcement', error.message)
        }
    }

    const handleUpdate = async () => {
        if (!selectedAnnouncement) return

        try {
            const { error } = await supabase
                .from('announcements')
                .update({
                    title: formData.title,
                    content: formData.content,
                    target: formData.target,
                    target_id: formData.target !== 'school' ? formData.target_id : null,
                    expires_at: formData.expires_at || null,
                })
                .eq('id', selectedAnnouncement.id)

            if (error) throw error

            toast.success('Announcement updated')
            setIsModalOpen(false)
            resetForm()
            fetchData()
        } catch (error: any) {
            console.error('Error updating announcement:', error)
            toast.error('Failed to update announcement', error.message)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return

        try {
            const { error } = await supabase.from('announcements').delete().eq('id', id)
            if (error) throw error

            toast.success('Announcement deleted')
            fetchData()
        } catch (error: any) {
            console.error('Error deleting announcement:', error)
            toast.error('Failed to delete announcement', error.message)
        }
    }

    const openEditModal = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement)
        setFormData({
            title: announcement.title,
            content: announcement.content,
            target: announcement.target,
            target_id: announcement.target_id || '',
            expires_at: announcement.expires_at?.split('T')[0] || '',
        })
        setIsModalOpen(true)
    }

    const resetForm = () => {
        setSelectedAnnouncement(null)
        setFormData({ title: '', content: '', target: 'school', target_id: '', expires_at: '' })
    }

    const getTargetIcon = (target: AnnouncementTarget) => {
        switch (target) {
            case 'school':
                return <Globe className="h-4 w-4" />
            case 'class':
                return <BookOpen className="h-4 w-4" />
            case 'section':
                return <Users className="h-4 w-4" />
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
                        <p className="text-slate-500 mt-1">Broadcast messages to school</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <Plus className="h-5 w-5 mr-2" />
                        New Announcement
                    </Button>
                </div>

                {/* Announcements List */}
                <div className="space-y-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-6">
                                    <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
                                    <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                                </CardContent>
                            </Card>
                        ))
                    ) : announcements.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">No announcements yet</p>
                                <Button className="mt-4" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                                    <Plus className="h-5 w-5 mr-2" />
                                    Create Your First Announcement
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        announcements.map((announcement) => (
                            <Card key={announcement.id} className="card-hover">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex-shrink-0">
                                                <Megaphone className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg text-slate-900">{announcement.title}</h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    By {announcement.creator?.name || 'Unknown'} • {formatDate(announcement.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="info" className="flex items-center gap-1">
                                            {getTargetIcon(announcement.target)}
                                            {announcement.target === 'school' ? 'All School' : announcement.target}
                                        </Badge>
                                    </div>

                                    <p className="text-slate-600 mb-4 whitespace-pre-wrap">{announcement.content}</p>

                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                        <Button variant="ghost" size="sm" onClick={() => openEditModal(announcement)}>
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(announcement.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={selectedAnnouncement ? 'Edit Announcement' : 'New Announcement'}
                size="lg"
            >
                <div className="space-y-4">
                    <Input
                        label="Title *"
                        placeholder="Enter announcement title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <Textarea
                        label="Content *"
                        placeholder="Write your announcement..."
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="min-h-[150px]"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Target</label>
                            <select
                                className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white"
                                value={formData.target}
                                onChange={(e) => setFormData({ ...formData, target: e.target.value as AnnouncementTarget, target_id: '' })}
                            >
                                <option value="school">Entire School</option>
                                <option value="class">Specific Class</option>
                                <option value="section">Specific Section</option>
                            </select>
                        </div>
                        {formData.target === 'class' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Class</label>
                                <select
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white"
                                    value={formData.target_id}
                                    onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                                >
                                    <option value="">Select Class</option>
                                    {classes.map((cls) => (
                                        <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {formData.target === 'section' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Section</label>
                                <select
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white"
                                    value={formData.target_id}
                                    onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                                >
                                    <option value="">Select Section</option>
                                    {sections.map((section) => (
                                        <option key={section.id} value={section.id}>
                                            {section.class?.class_name} - {section.section_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <Input
                        label="Expires At (Optional)"
                        type="date"
                        value={formData.expires_at}
                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button onClick={selectedAnnouncement ? handleUpdate : handleCreate}>
                            {selectedAnnouncement ? 'Update' : 'Create'} Announcement
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    )
}
