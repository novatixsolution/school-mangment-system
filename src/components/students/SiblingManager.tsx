'use client'

import { useState, useEffect } from 'react'
import { Users, X, Plus, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SiblingManagerProps {
    studentId: string
    currentSiblingGroupId?: string | null
    onUpdate: () => void
}

interface Student {
    id: string
    name: string
    roll_number?: string
    gender: string
    class?: { class_name: string }
    section?: { section_name: string }
}

interface SiblingGroup {
    id: string
    family_name?: string
    primary_parent_name?: string
    primary_parent_cnic?: string
    primary_parent_phone?: string
}

export function SiblingManager({ studentId, currentSiblingGroupId, onUpdate }: SiblingManagerProps) {
    const [open, setOpen] = useState(false)
    const [siblings, setSiblings] = useState<Student[]>([])
    const [availableStudents, setAvailableStudents] = useState<Student[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [groupInfo, setGroupInfo] = useState<SiblingGroup | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            fetchSiblings()
            fetchAvailableStudents()
        }
    }, [open, currentSiblingGroupId])

    const fetchSiblings = async () => {
        if (!currentSiblingGroupId) return

        try {
            // Fetch group info
            const { data: groupData } = await supabase
                .from('sibling_groups')
                .select('*')
                .eq('id', currentSiblingGroupId)
                .single()

            setGroupInfo(groupData)

            // Fetch all siblings in this group
            const { data: siblingsData } = await supabase
                .from('students')
                .select(`
          id,
          name,
          roll_number,
          gender,
          class:classes(class_name),
          section:sections(section_name)
        `)
                .eq('sibling_group_id', currentSiblingGroupId)
                .neq('id', studentId)

            setSiblings(siblingsData || [])
        } catch (error) {
            console.error('Error fetching siblings:', error)
        }
    }

    const fetchAvailableStudents = async () => {
        try {
            const { data } = await supabase
                .from('students')
                .select(`
          id,
          name,
          roll_number,
          gender,
          class:classes(class_name),
          section:sections(section_name)
        `)
                .is('sibling_group_id', null)
                .neq('id', studentId)
                .ilike('name', `%${searchQuery}%`)
                .limit(20)

            setAvailableStudents(data || [])
        } catch (error) {
            console.error('Error fetching students:', error)
        }
    }

    const createNewGroup = async () => {
        setLoading(true)
        try {
            // Create new sibling group
            const { data: newGroup, error } = await supabase
                .from('sibling_groups')
                .insert({
                    family_name: 'New Family'
                })
                .select()
                .single()

            if (error) throw error

            // Link current student to group
            await supabase
                .from('students')
                .update({ sibling_group_id: newGroup.id })
                .eq('id', studentId)

            toast.success('Sibling group created!')
            setGroupInfo(newGroup)
            onUpdate()
        } catch (error) {
            console.error('Error creating group:', error)
            toast.error('Failed to create sibling group')
        } finally {
            setLoading(false)
        }
    }

    const linkSibling = async (siblingId: string) => {
        setLoading(true)
        try {
            let groupId = currentSiblingGroupId

            // If no group exists, create one
            if (!groupId) {
                const { data: newGroup } = await supabase
                    .from('sibling_groups')
                    .insert({})
                    .select()
                    .single()

                groupId = newGroup?.id

                // Link current student
                await supabase
                    .from('students')
                    .update({ sibling_group_id: groupId })
                    .eq('id', studentId)
            }

            // Link the sibling
            const { error } = await supabase
                .from('students')
                .update({ sibling_group_id: groupId })
                .eq('id', siblingId)

            if (error) throw error

            toast.success('Sibling linked successfully!')
            fetchSiblings()
            fetchAvailableStudents()
            onUpdate()
        } catch (error) {
            console.error('Error linking sibling:', error)
            toast.error('Failed to link sibling')
        } finally {
            setLoading(false)
        }
    }

    const unlinkSibling = async (siblingId: string) => {
        if (!confirm('Are you sure you want to unlink this sibling?')) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('students')
                .update({ sibling_group_id: null })
                .eq('id', siblingId)

            if (error) throw error

            toast.success('Sibling unlinked')
            fetchSiblings()
            fetchAvailableStudents()
            onUpdate()
        } catch (error) {
            console.error('Error unlinking sibling:', error)
            toast.error('Failed to unlink sibling')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} variant="outline" size="sm">
                <LinkIcon className="h-4 w-4 mr-2" />
                Manage Siblings
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Manage Siblings
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Current Siblings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span>Current Siblings ({siblings.length})</span>
                                    {!currentSiblingGroupId && (
                                        <Button size="sm" onClick={createNewGroup} disabled={loading}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Family Group
                                        </Button>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {siblings.length === 0 ? (
                                    <p className="text-sm text-slate-600 text-center py-4">
                                        No siblings linked yet
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {siblings.map((sibling) => (
                                            <div
                                                key={sibling.id}
                                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sibling.gender === 'male' ? 'bg-blue-100' : 'bg-pink-100'
                                                        }`}>
                                                        {sibling.gender === 'male' ? '👦' : '👧'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{sibling.name}</p>
                                                        <p className="text-sm text-slate-600">
                                                            {sibling.class?.class_name || 'No Class'}
                                                            {sibling.section?.section_name && ` - ${sibling.section.section_name}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => unlinkSibling(sibling.id)}
                                                    disabled={loading}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Add Sibling */}
                        {currentSiblingGroupId && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Link New Sibling</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Search Students</Label>
                                        <Input
                                            placeholder="Search by name..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyUp={fetchAvailableStudents}
                                        />
                                    </div>

                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {availableStudents.length === 0 ? (
                                            <p className="text-sm text-slate-600 text-center py-4">
                                                No students found
                                            </p>
                                        ) : (
                                            availableStudents.map((student) => (
                                                <div
                                                    key={student.id}
                                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${student.gender === 'male' ? 'bg-blue-100' : 'bg-pink-100'
                                                            }`}>
                                                            {student.gender === 'male' ? '👦' : '👧'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{student.name}</p>
                                                            <p className="text-xs text-slate-600">
                                                                {student.class?.class_name || 'No Class'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => linkSibling(student.id)}
                                                        disabled={loading}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Link
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
