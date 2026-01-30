'use client'

import { useState, useEffect } from 'react'
import { Users, X, ChevronRight, ChevronDown, Eye, Edit, Phone, IdCard, GraduationCap, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface SiblingGroup {
    id: string
    father_name: string
    father_cnic: string
    group_name?: string
    students: any[]
}

interface SiblingGroupsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SiblingGroupsModal({ isOpen, onClose }: SiblingGroupsModalProps) {
    const [groups, setGroups] = useState<SiblingGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (isOpen) {
            fetchSiblingGroups()
        }
    }, [isOpen])

    const fetchSiblingGroups = async () => {
        setLoading(true)
        try {
            const { data: groupsData, error } = await supabase
                .from('sibling_groups')
                .select(`
                    *,
                    students:students(*)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setGroups(groupsData || [])

            // Auto-expand all groups
            const allGroupIds = new Set((groupsData || []).map(g => g.id))
            setExpandedGroups(allGroupIds)
        } catch (error) {
            console.error('Error fetching sibling groups:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleGroup = (groupId: string) => {
        const newExpanded = new Set(expandedGroups)
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId)
        } else {
            newExpanded.add(groupId)
        }
        setExpandedGroups(newExpanded)
    }

    const formatCNIC = (cnic: string) => {
        if (!cnic || cnic.length !== 13) return cnic || 'N/A'
        return `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`
    }

    const getTotalChildren = () => {
        return groups.reduce((sum, group) => sum + (group.students?.length || 0), 0)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-600 to-blue-600 flex items-center justify-center shadow-lg">
                                <Users className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Sibling Groups</h2>
                                <p className="text-sm text-slate-600">Family Management & Performance Overview</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex gap-3">
                                <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200">
                                    <p className="text-xs text-slate-500">Total Families</p>
                                    <p className="text-2xl font-bold text-purple-600">{groups.length}</p>
                                </div>
                                <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200">
                                    <p className="text-xs text-slate-500">Total Children</p>
                                    <p className="text-2xl font-bold text-pink-600">{getTotalChildren()}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl p-2.5 transition-all shadow-sm"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Sibling Groups Found</h3>
                            <p className="text-slate-500">Sibling groups will automatically be created when multiple students share the same parent CNIC.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Table Header */}
                            <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl p-4 grid grid-cols-12 gap-4 items-center font-semibold text-sm text-slate-700 border border-slate-200">
                                <div className="col-span-1"></div>
                                <div className="col-span-3">Parent Information</div>
                                <div className="col-span-2">CNIC</div>
                                <div className="col-span-2">Contact</div>
                                <div className="col-span-2">Children</div>
                                <div className="col-span-2">Actions</div>
                            </div>

                            {/* Table Rows */}
                            {groups.map((group) => (
                                <FamilyRow
                                    key={group.id}
                                    group={group}
                                    isExpanded={expandedGroups.has(group.id)}
                                    onToggle={() => toggleGroup(group.id)}
                                    formatCNIC={formatCNIC}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function FamilyRow({ group, isExpanded, onToggle, formatCNIC }: {
    group: SiblingGroup,
    isExpanded: boolean,
    onToggle: () => void,
    formatCNIC: (cnic: string) => string
}) {
    const getFirstStudent = () => group.students?.[0]
    const student = getFirstStudent()

    return (
        <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all">
            {/* Parent Row */}
            <div
                className="grid grid-cols-12 gap-4 p-4 items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={onToggle}
            >
                <div className="col-span-1 flex justify-center">
                    {isExpanded ?
                        <ChevronDown className="h-5 w-5 text-slate-400" /> :
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                    }
                </div>

                <div className="col-span-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                            {group.father_name?.[0] || 'F'}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{group.father_name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">Father</p>
                        </div>
                    </div>
                </div>

                <div className="col-span-2">
                    <div className="flex items-center gap-2 text-sm">
                        <IdCard className="h-4 w-4 text-slate-400" />
                        <span className="font-mono text-slate-700">{formatCNIC(group.father_cnic)}</span>
                    </div>
                </div>

                <div className="col-span-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700">{student?.father_phone || 'N/A'}</span>
                    </div>
                </div>

                <div className="col-span-2">
                    <Badge variant="default" className="bg-purple-100 text-purple-700 font-semibold">
                        {group.students?.length || 0} {group.students?.length === 1 ? 'Child' : 'Children'}
                    </Badge>
                </div>

                <div className="col-span-2 flex gap-2">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View All
                    </Button>
                </div>
            </div>

            {/* Children Rows (Expanded) */}
            {isExpanded && (
                <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                    <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Children Details</p>
                    </div>
                    <div className="divide-y divide-slate-200">
                        {group.students?.map((student, idx) => (
                            <StudentRow key={student.id} student={student} index={idx} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function StudentRow({ student, index }: { student: any, index: number }) {
    return (
        <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-blue-50 transition-colors">
            <div className="col-span-1 flex justify-center">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                </span>
            </div>

            <div className="col-span-3">
                <div className="flex items-center gap-3">
                    <Avatar name={student.name || 'Student'} src={student.photo_url} size="md" />
                    <div>
                        <p className="font-semibold text-slate-900">{student.name}</p>
                        <p className="text-xs text-slate-500">Roll: {student.roll_number || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div className="col-span-2">
                <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{student.class_name || 'N/A'}</span>
                </div>
            </div>

            <div className="col-span-2">
                <Badge variant={student.status === 'active' ? 'success' : 'warning'}>
                    {student.status}
                </Badge>
            </div>

            <div className="col-span-2">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-slate-600">Performance</span>
                </div>
            </div>

            <div className="col-span-2 flex gap-2">
                <Link href={`/owner/admissions/${student.id}`}>
                    <Button variant="outline" size="sm">
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                    </Button>
                </Link>
                <Link href={`/owner/students/${student.id}`}>
                    <Button variant="outline" size="sm">
                        <Eye className="h-3.5 w-3.5" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
