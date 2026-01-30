'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Edit, Trash2, BookOpen, Users, UserCheck, Sparkles, X } from 'lucide-react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { Class, Section } from '@/types/class'
import { Profile } from '@/types/permissions'

export default function ClassesManagement() {
    const router = useRouter()
    const [classes, setClasses] = useState<Class[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [teachers, setTeachers] = useState<Profile[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isClassModalOpen, setIsClassModalOpen] = useState(false)
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
    const [selectedClass, setSelectedClass] = useState<Class | null>(null)
    const [selectedSection, setSelectedSection] = useState<Section | null>(null)
    const [classFormData, setClassFormData] = useState({
        class_name: '',
        medium: 'English',
        status: 'active' as 'active' | 'inactive',
    })
    const [sectionFormData, setSectionFormData] = useState({
        class_id: '',
        section_name: '',
        teacher_id: '' as string | null,
        status: 'active' as 'active' | 'inactive',
    })
    const [selectedSectionForDetails, setSelectedSectionForDetails] = useState<Section | null>(null)
    const [sectionDetailsPosition, setSectionDetailsPosition] = useState({ x: 0, y: 0 })
    const [creatingClass, setCreatingClass] = useState(false)
    const [creatingSect, setCreatingSection] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Get date 30 days ago for attendance
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const [classesRes, sectionsRes, teachersRes, studentsRes, attendanceRes] = await Promise.all([
                supabase.from('classes').select('*').order('class_name'),
                supabase.from('sections').select('*, class:classes(id, class_name), teacher:profiles(id, name, email)').order('section_name'),
                supabase.from('profiles').select('*').eq('role', 'TEACHER').eq('status', 'active'),
                supabase.from('students').select('id, class_id, section_id, status'),
                supabase.from('attendance').select('student_id, status, date').gte('date', thirtyDaysAgo.toISOString().split('T')[0]),
            ])

            if (classesRes.error) throw classesRes.error
            if (sectionsRes.error) throw sectionsRes.error
            if (teachersRes.error) throw teachersRes.error

            setClasses(classesRes.data || [])
            setSections(sectionsRes.data || [])
            setTeachers(teachersRes.data || [])
            setStudents(studentsRes.data || [])
            setAttendanceData(attendanceRes.data || [])
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load classes')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateClass = async () => {
        if (!classFormData.class_name) {
            toast.error('Please enter class name')
            return
        }

        setCreatingClass(true)
        try {
            const { data: newClass, error } = await supabase
                .from('classes')
                .insert({
                    class_name: classFormData.class_name,
                    medium: classFormData.medium,
                    status: classFormData.status,
                })
                .select()
                .single()

            if (error) throw error

            // Auto-create Section A for this new class
            const { error: sectionError } = await supabase.from('sections').insert([{
                class_id: newClass.id,
                section_name: 'A',
                capacity: 40,
                status: 'active',
                teacher_id: null
            }])

            if (sectionError) {
                console.error('Failed to create default section:', sectionError)
                toast.success('Class created successfully (Section A failed to create)')
            } else {
                toast.success('Class and Section A created successfully')
            }

            setIsClassModalOpen(false)
            resetClassForm()
            fetchData()
        } catch (error: any) {
            console.error('Error creating class:', error)
            toast.error('Failed to create class', error.message)
        } finally {
            setCreatingClass(false)
        }
    }

    const handleUpdateClass = async () => {
        if (!selectedClass) return

        setCreatingClass(true)
        try {
            const { error } = await supabase
                .from('classes')
                .update({
                    class_name: classFormData.class_name,
                    medium: classFormData.medium,
                    status: classFormData.status,
                })
                .eq('id', selectedClass.id)

            if (error) throw error

            toast.success('Class updated successfully')
            setIsClassModalOpen(false)
            resetClassForm()
            fetchData()
        } catch (error: any) {
            console.error('Error updating class:', error)
            toast.error('Failed to update class', error.message)
        } finally {
            setCreatingClass(false)
        }
    }

    const handleDeleteClass = async (id: string) => {
        if (!confirm('Are you sure? This will delete all associated sections!')) return

        try {
            const { error } = await supabase.from('classes').delete().eq('id', id)
            if (error) throw error

            toast.success('Class deleted')
            fetchData()
        } catch (error: any) {
            console.error('Error deleting class:', error)
            toast.error('Failed to delete class', error.message)
        }
    }

    const handleCreateSection = async () => {
        if (!sectionFormData.class_id || !sectionFormData.section_name) {
            toast.error('Please fill in all required fields')
            return
        }

        setCreatingSection(true)
        try {
            const { error } = await supabase
                .from('sections')
                .insert({
                    class_id: sectionFormData.class_id,
                    section_name: sectionFormData.section_name,
                    capacity: 40, // Default capacity
                    teacher_id: sectionFormData.teacher_id || null,
                    status: sectionFormData.status,
                })

            if (error) throw error

            toast.success('Section created successfully')
            setIsSectionModalOpen(false)
            resetSectionForm()
            fetchData()
        } catch (error: any) {
            console.error('Error creating section:', error)
            toast.error('Failed to create section', error.message)
        } finally {
            setCreatingSection(false)
        }
    }

    const handleUpdateSection = async () => {
        if (!selectedSection) return

        setCreatingSection(true)
        try {
            const { error } = await supabase
                .from('sections')
                .update({
                    class_id: sectionFormData.class_id,
                    section_name: sectionFormData.section_name,
                    teacher_id: sectionFormData.teacher_id || null,
                    status: sectionFormData.status,
                })
                .eq('id', selectedSection.id)

            if (error) throw error

            toast.success('Section updated successfully')
            setIsSectionModalOpen(false)
            resetSectionForm()
            fetchData()
        } catch (error: any) {
            console.error('Error updating section:', error)
            toast.error('Failed to update section', error.message)
        } finally {
            setCreatingSection(false)
        }
    }

    const handleDeleteSection = async (id: string) => {
        if (!confirm('Are you sure you want to delete this section?')) return

        try {
            const { error } = await supabase.from('sections').delete().eq('id', id)
            if (error) throw error

            toast.success('Section deleted')
            fetchData()
        } catch (error: any) {
            console.error('Error deleting section:', error)
            toast.error('Failed to delete section', error.message)
        }
    }

    const openEditClassModal = (cls: Class) => {
        setSelectedClass(cls)
        setClassFormData({
            class_name: cls.class_name,
            medium: cls.medium,
            status: cls.status,
        })
        setIsClassModalOpen(true)
    }

    const openEditSectionModal = (section: Section) => {
        setSelectedSection(section)
        setSectionFormData({
            class_id: section.class_id,
            section_name: section.section_name,
            teacher_id: section.teacher_id || '',
            status: section.status,
        })
        setIsSectionModalOpen(true)
    }

    const resetClassForm = () => {
        setSelectedClass(null)
        setClassFormData({ class_name: '', medium: 'English', status: 'active' })
    }

    const resetSectionForm = () => {
        setSelectedSection(null)
        setSectionFormData({ class_id: '', section_name: '', teacher_id: '', status: 'active' })
    }

    const getSectionsForClass = (classId: string) => {
        return sections.filter((s) => s.class_id === classId)
    }

    const getTeacherName = (teacherId: string | null) => {
        if (!teacherId) return null
        const teacher = teachers.find(t => t.id === teacherId)
        return teacher?.name || null
    }

    const handleSectionBadgeClick = (section: Section, event: React.MouseEvent) => {
        event.stopPropagation()
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
        setSectionDetailsPosition({ x: rect.left, y: rect.bottom + 5 })
        setSelectedSectionForDetails(section)
    }

    const getSectionDetails = (sectionId: string) => {
        const sectionStudents = students.filter(s => s.section_id === sectionId)
        const totalStudents = sectionStudents.length
        const activeStudents = sectionStudents.filter(s => s.status === 'active').length

        // Calculate attendance
        const studentIds = sectionStudents.map(s => s.id)
        const sectionAttendance = attendanceData.filter(a => studentIds.includes(a.student_id))
        const presentCount = sectionAttendance.filter(a => a.status === 'present').length
        const attendancePercentage = sectionAttendance.length > 0
            ? Math.round((presentCount / sectionAttendance.length) * 100)
            : 0

        return { totalStudents, activeStudents, attendancePercentage }
    }

    const filteredClasses = classes.filter((c) =>
        c.class_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Classes & Sections</h1>
                        <p className="text-slate-500 mt-1">Manage your school classes and sections</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => { resetSectionForm(); setIsSectionModalOpen(true); }}>
                            <Plus className="h-5 w-5 mr-2" />
                            Add Section
                        </Button>
                        <Button onClick={() => { resetClassForm(); setIsClassModalOpen(true); }}>
                            <Plus className="h-5 w-5 mr-2" />
                            Add Class
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search classes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12"
                    />
                </div>

                {/* Classes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                <BookOpen className="h-8 w-8 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">
                                Loading classes...
                            </h3>
                            <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar"></div>
                            </div>
                            <style jsx>{`
                                @keyframes loading-bar {
                                    0% { width: 0%; margin-left: 0%; }
                                    50% { width: 75%; margin-left: 0%; }
                                    100% { width: 0%; margin-left: 100%; }
                                }
                                .animate-loading-bar {
                                    animation: loading-bar 1.5s ease-in-out infinite;
                                }
                            `}</style>
                        </div>
                    ) : filteredClasses.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <BookOpen className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                {searchQuery ? 'No classes found' : 'No classes yet'}
                            </h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-sm text-center">
                                {searchQuery
                                    ? 'Try adjusting your search to find classes.'
                                    : 'Start by creating your first class to organize students into sections and manage their education.'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => { resetClassForm(); setIsClassModalOpen(true); }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Class
                                </Button>
                            )}
                        </div>
                    ) : (
                        filteredClasses.map((cls, index) => {
                            const classSections = getSectionsForClass(cls.id)
                            const assignedTeachers = classSections.filter(s => s.teacher_id).length

                            // Calculate real metrics from database
                            const classStudents = students.filter(s => s.class_id === cls.id)
                            const totalStudents = classStudents.length
                            const activeStudents = classStudents.filter(s => s.status === 'active').length
                            const inactiveStudents = classStudents.filter(s => s.status === 'inactive').length

                            // Calculate attendance percentage (last 30 days)
                            const studentIds = classStudents.map(s => s.id)
                            const classAttendance = attendanceData.filter(a => studentIds.includes(a.student_id))
                            const presentCount = classAttendance.filter(a => a.status === 'present').length
                            const attendancePercentage = classAttendance.length > 0
                                ? Math.round((presentCount / classAttendance.length) * 100)
                                : 0

                            // Different color schemes for variety
                            const colorSchemes = [
                                { border: 'border-t-pink-500', bg: 'from-pink-500', icon: 'bg-pink-100 text-pink-600', badge: 'bg-pink-50 text-pink-600' },
                                { border: 'border-t-blue-500', bg: 'from-blue-500', icon: 'bg-blue-100 text-blue-600', badge: 'bg-blue-50 text-blue-600' },
                                { border: 'border-t-purple-500', bg: 'from-purple-500', icon: 'bg-purple-100 text-purple-600', badge: 'bg-purple-50 text-purple-600' },
                                { border: 'border-t-indigo-500', bg: 'from-indigo-500', icon: 'bg-indigo-100 text-indigo-600', badge: 'bg-indigo-50 text-indigo-600' },
                                { border: 'border-t-cyan-500', bg: 'from-cyan-500', icon: 'bg-cyan-100 text-cyan-600', badge: 'bg-cyan-50 text-cyan-600' },
                                { border: 'border-t-emerald-500', bg: 'from-emerald-500', icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-50 text-emerald-600' },
                            ]
                            const colorScheme = colorSchemes[index % colorSchemes.length]

                            return (
                                <Card
                                    key={cls.id}
                                    className={`group overflow-hidden border-t-[3px] ${colorScheme.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
                                    onClick={() => router.push(`/owner/classes/${cls.id}`)}
                                >
                                    <CardContent className="p-0">
                                        {/* Header Section */}
                                        <div className="p-4 pb-3">
                                            <div className="flex items-start justify-between mb-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${colorScheme.icon} group-hover:scale-110 transition-transform duration-300`}>
                                                        <BookOpen className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                            {cls.class_name}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                                            <span className="inline-block w-1 h-1 rounded-full bg-slate-400"></span>
                                                            {cls.medium} Medium
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant={cls.status === 'active' ? 'success' : 'warning'} className="text-xs">
                                                    {cls.status}
                                                </Badge>
                                            </div>

                                            {/* Stats Row */}
                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                <div className={`p-2 rounded-lg ${colorScheme.badge} text-center relative overflow-hidden`}>
                                                    <div className="text-lg font-bold">{totalStudents}</div>
                                                    <div className="text-[10px] font-medium mt-0.5">Students</div>
                                                    {totalStudents > 0 && (
                                                        <div className="flex items-center justify-center gap-0.5 mt-1">
                                                            <span className="text-[9px] text-green-600 font-bold">{activeStudents}</span>
                                                            <span className="text-[8px] text-slate-400">/</span>
                                                            <span className="text-[9px] text-red-500 font-bold">{inactiveStudents}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-2 rounded-lg bg-blue-50 text-blue-700 text-center relative">
                                                    <div className="text-lg font-bold">{attendancePercentage}%</div>
                                                    <div className="text-[10px] font-medium mt-0.5">Attendance</div>
                                                    {/* Progress bar */}
                                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-200">
                                                        <div
                                                            className="h-full bg-blue-600 transition-all duration-500"
                                                            style={{ width: `${attendancePercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="p-2 rounded-lg bg-purple-50 text-purple-700 text-center">
                                                    <div className="text-lg font-bold">{classSections.length}</div>
                                                    <div className="text-[10px] font-medium mt-0.5">Sections</div>
                                                    <div className="text-[9px] text-purple-600 mt-0.5 font-medium">{assignedTeachers} Teachers</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sections List */}
                                        <div className="px-4 pb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-semibold text-slate-700">
                                                    Class Sections
                                                </p>
                                            </div>
                                            <div className="space-y-1.5">
                                                {classSections.length === 0 ? (
                                                    <div className="text-center py-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                                                        <Users className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                                                        <span className="text-xs text-slate-400">No sections</span>
                                                    </div>
                                                ) : (
                                                    classSections.map((section) => (
                                                        <div
                                                            key={section.id}
                                                            className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all duration-200 group/section"
                                                        >
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <div
                                                                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover/section:bg-indigo-100 transition-colors cursor-pointer hover:scale-110 duration-200"
                                                                    onClick={(e) => handleSectionBadgeClick(section, e)}
                                                                    title="Click to view section details"
                                                                >
                                                                    <span className="font-bold text-sm text-slate-700 group-hover/section:text-indigo-700">
                                                                        {section.section_name}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-medium text-xs text-slate-700 truncate">Section {section.section_name}</span>
                                                                    </div>
                                                                    {section.teacher_id ? (
                                                                        <div className="flex items-center gap-1 mt-0.5">
                                                                            <UserCheck className="h-3 w-3 text-green-500 flex-shrink-0" />
                                                                            <span className="text-[10px] text-green-600 font-medium truncate">
                                                                                {(section as any).teacher?.name || 'Assigned'}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1 mt-0.5">
                                                                            <span className="text-[10px] text-amber-500 font-medium">⚠️ No teacher</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 ml-1">
                                                                <button
                                                                    onClick={() => openEditSectionModal(section)}
                                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all duration-200"
                                                                    title="Edit section"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
                                                                    title="Delete section"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Footer */}
                                        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); openEditClassModal(cls); }}
                                                className="hover:bg-white hover:text-indigo-600 transition-all duration-200 text-xs h-8 px-3"
                                            >
                                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 text-xs h-8 px-3"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                                Delete
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Class Modal */}
            <Modal
                isOpen={isClassModalOpen}
                onClose={() => { setIsClassModalOpen(false); resetClassForm(); }}
                title={selectedClass ? 'Edit Class' : 'Add New Class'}
                size="md"
            >
                <div className="space-y-4">
                    <Input
                        label="Class Name"
                        placeholder="e.g., Class 1, Grade 10, Nursery"
                        value={classFormData.class_name}
                        onChange={(e) => setClassFormData({ ...classFormData, class_name: e.target.value })}
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Medium</label>
                        <select
                            className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900"
                            value={classFormData.medium}
                            onChange={(e) => setClassFormData({ ...classFormData, medium: e.target.value })}
                        >
                            <option value="English">English</option>
                            <option value="Urdu">Urdu</option>
                            <option value="Both">Both</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                        <select
                            className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900"
                            value={classFormData.status}
                            onChange={(e) => setClassFormData({ ...classFormData, status: e.target.value as 'active' | 'inactive' })}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => { setIsClassModalOpen(false); resetClassForm(); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={selectedClass ? handleUpdateClass : handleCreateClass}
                            disabled={creatingClass}
                            className="min-w-[120px]"
                        >
                            {creatingClass ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    {selectedClass ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>{selectedClass ? 'Update' : 'Create'} Class</>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Section Modal */}
            <Modal
                isOpen={isSectionModalOpen}
                onClose={() => { setIsSectionModalOpen(false); resetSectionForm(); }}
                title={selectedSection ? 'Edit Section' : 'Add New Section'}
                size="lg"
            >
                <div className="space-y-5">
                    {/* 2-Column Grid for compact layout */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Class Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                <BookOpen className="inline h-4 w-4 mr-1.5 text-indigo-500" />
                                Class
                            </label>
                            <select
                                className="w-full h-11 px-3.5 rounded-lg border-2 border-slate-200 bg-white text-slate-900 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                value={sectionFormData.class_id}
                                onChange={(e) => setSectionFormData({ ...sectionFormData, class_id: e.target.value })}
                            >
                                <option value="">Select Class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.class_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Section Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                <Users className="inline h-4 w-4 mr-1.5 text-indigo-500" />
                                Section Name
                            </label>
                            <Input
                                placeholder="e.g., A, B, C"
                                value={sectionFormData.section_name}
                                onChange={(e) => setSectionFormData({ ...sectionFormData, section_name: e.target.value })}
                                className="h-11"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                <Sparkles className="inline h-4 w-4 mr-1.5 text-indigo-500" />
                                Status
                            </label>
                            <select
                                className="w-full h-11 px-3.5 rounded-lg border-2 border-slate-200 bg-white text-slate-900 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                value={sectionFormData.status}
                                onChange={(e) => setSectionFormData({ ...sectionFormData, status: e.target.value as 'active' | 'inactive' })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Teacher Assignment - Full Width with better styling */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                        <label className="block text-sm font-semibold text-slate-800 mb-2.5">
                            <UserCheck className="inline h-4 w-4 mr-1.5 text-indigo-600" />
                            Assign Class Teacher
                        </label>
                        <select
                            className="w-full h-11 px-3.5 rounded-lg border-2 border-indigo-200 bg-white text-slate-900 hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                            value={sectionFormData.teacher_id || ''}
                            onChange={(e) => setSectionFormData({ ...sectionFormData, teacher_id: e.target.value || null })}
                        >
                            <option value="">No Teacher Assigned</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.name} ({teacher.email})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-indigo-700 mt-2 flex items-start gap-1.5">
                            <span className="mt-0.5">ℹ️</span>
                            <span>Assigned teacher can mark attendance for this section</span>
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                        <Button
                            variant="outline"
                            onClick={() => { setIsSectionModalOpen(false); resetSectionForm(); }}
                            className="px-5"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={selectedSection ? handleUpdateSection : handleCreateSection}
                            disabled={creatingSect}
                            className="px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 min-w-[140px]"
                        >
                            {creatingSect ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    {selectedSection ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>{selectedSection ? 'Update' : 'Create'} Section</>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Section Details Popup */}
            {selectedSectionForDetails && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                        onClick={() => setSelectedSectionForDetails(null)}
                    />
                    {/* Popup Card - Centered */}
                    <div
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl border-2 border-indigo-200 p-5 w-80 animate-in fade-in zoom-in duration-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <span className="font-bold text-xl text-white">
                                        {selectedSectionForDetails.section_name}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900">Section {selectedSectionForDetails.section_name}</h4>
                                    <p className="text-xs text-slate-500">Quick Statistics</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedSectionForDetails(null)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {(() => {
                            const details = getSectionDetails(selectedSectionForDetails.id)
                            return (
                                <>
                                    {/* Stats */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-indigo-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                    <Users className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">Total Students</span>
                                            </div>
                                            <span className="text-2xl font-bold text-indigo-600">{details.totalStudents}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                                    <UserCheck className="h-4 w-4 text-green-600" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">Active Students</span>
                                            </div>
                                            <span className="text-2xl font-bold text-green-600">{details.activeStudents}</span>
                                        </div>

                                        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                                        <BookOpen className="h-4 w-4 text-purple-600" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">Attendance</span>
                                                </div>
                                                <span className="text-2xl font-bold text-purple-600">{details.attendancePercentage}%</span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full h-2.5 bg-purple-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full shadow-sm"
                                                    style={{ width: `${details.attendancePercentage}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1.5 text-center">Last 30 days average</p>
                                        </div>
                                    </div>
                                </>
                            )
                        })()}
                    </div>
                </>
            )}
        </DashboardLayout>
    )
}
