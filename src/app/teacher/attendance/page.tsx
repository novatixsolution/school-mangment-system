'use client'

import { useEffect, useState } from 'react'
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertTriangle, ShieldAlert } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'

interface Section {
    id: string
    section_name: string
    class_id: string
    teacher_id: string | null
    class: {
        id: string
        class_name: string
    }
}

interface Student {
    id: string
    name: string
    roll_number: string
    class_id: string
    section_id: string
}

interface AttendanceRecord {
    student_id: string
    status: 'present' | 'absent' | 'late' | 'leave'
}

export default function TeacherAttendance() {
    const { user, profile } = useAuth()
    const [assignedSections, setAssignedSections] = useState<Section[]>([])
    const [selectedSection, setSelectedSection] = useState<string>('')
    const [students, setStudents] = useState<Student[]>([])
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
    const [existingAttendance, setExistingAttendance] = useState<Record<string, string>>({})
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [hasNoAssignment, setHasNoAssignment] = useState(false)

    useEffect(() => {
        if (profile?.id) {
            fetchAssignedSections()
        }
    }, [profile?.id])

    useEffect(() => {
        if (selectedSection) {
            fetchStudents()
            fetchExistingAttendance()
        }
    }, [selectedSection, selectedDate])

    const fetchAssignedSections = async () => {
        if (!profile?.id) return

        try {
            // Get sections where this teacher is assigned
            const { data, error } = await supabase
                .from('sections')
                .select('*, class:classes(id, class_name)')
                .eq('teacher_id', profile.id)
                .eq('status', 'active')

            if (error) throw error

            console.log('Assigned sections:', data)

            if (!data || data.length === 0) {
                setHasNoAssignment(true)
            } else {
                setAssignedSections(data)
                setSelectedSection(data[0].id) // Auto-select first section
            }
        } catch (error) {
            console.error('Error fetching assigned sections:', error)
            toast.error('Failed to load assigned classes')
        } finally {
            setLoading(false)
        }
    }

    const fetchStudents = async () => {
        if (!selectedSection) return

        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('section_id', selectedSection)
                .eq('status', 'active')
                .order('roll_number')

            if (error) throw error

            setStudents(data || [])

            // Initialize attendance state for all students
            const initialAttendance: Record<string, AttendanceRecord> = {}
            data?.forEach(student => {
                initialAttendance[student.id] = {
                    student_id: student.id,
                    status: 'present' // Default to present
                }
            })
            setAttendance(initialAttendance)
        } catch (error) {
            console.error('Error fetching students:', error)
            toast.error('Failed to load students')
        }
    }

    const fetchExistingAttendance = async () => {
        if (!selectedSection) return

        try {
            const { data, error } = await supabase
                .from('attendance')
                .select('student_id, status')
                .eq('section_id', selectedSection)
                .eq('date', selectedDate)

            if (error) throw error

            const existing: Record<string, string> = {}
            data?.forEach(record => {
                existing[record.student_id] = record.status
            })
            setExistingAttendance(existing)

            // Update attendance state with existing records
            if (data && data.length > 0) {
                const updatedAttendance = { ...attendance }
                data.forEach(record => {
                    if (updatedAttendance[record.student_id]) {
                        updatedAttendance[record.student_id].status = record.status
                    }
                })
                setAttendance(updatedAttendance)
            }
        } catch (error) {
            console.error('Error fetching existing attendance:', error)
        }
    }

    const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'leave') => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                status
            }
        }))
    }

    const markAllPresent = () => {
        const updated: Record<string, AttendanceRecord> = {}
        students.forEach(student => {
            updated[student.id] = {
                student_id: student.id,
                status: 'present'
            }
        })
        setAttendance(updated)
        toast.info('Marked all students as present')
    }

    const markAllAbsent = () => {
        const updated: Record<string, AttendanceRecord> = {}
        students.forEach(student => {
            updated[student.id] = {
                student_id: student.id,
                status: 'absent'
            }
        })
        setAttendance(updated)
        toast.info('Marked all students as absent')
    }

    const handleSubmit = async () => {
        if (!selectedSection || !profile?.id) return

        const section = assignedSections.find(s => s.id === selectedSection)
        if (!section) {
            toast.error('Access Denied', 'You are not assigned to this class')
            return
        }

        // Verify teacher is still assigned
        if (section.teacher_id !== profile.id) {
            toast.error('Access Denied', 'You are not the assigned teacher for this class')
            return
        }

        setSubmitting(true)

        try {
            const attendanceRecords = Object.values(attendance).map(record => ({
                student_id: record.student_id,
                class_id: section.class_id,
                section_id: selectedSection,
                date: selectedDate,
                status: record.status,
                marked_by: profile.id
            }))

            // Delete existing attendance for this date (if any) and insert new
            await supabase
                .from('attendance')
                .delete()
                .eq('section_id', selectedSection)
                .eq('date', selectedDate)

            const { error } = await supabase
                .from('attendance')
                .insert(attendanceRecords)

            if (error) throw error

            toast.success('Attendance saved successfully!')
            fetchExistingAttendance()
        } catch (error: any) {
            console.error('Error saving attendance:', error)
            toast.error('Failed to save attendance', error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'present':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'absent':
                return <XCircle className="h-5 w-5 text-red-500" />
            case 'late':
                return <Clock className="h-5 w-5 text-amber-500" />
            case 'leave':
                return <AlertTriangle className="h-5 w-5 text-blue-500" />
            default:
                return null
        }
    }

    const getStatusCounts = () => {
        const counts = { present: 0, absent: 0, late: 0, leave: 0 }
        Object.values(attendance).forEach(record => {
            counts[record.status]++
        })
        return counts
    }

    const statusCounts = getStatusCounts()
    const selectedSectionData = assignedSections.find(s => s.id === selectedSection)

    // Show access denied if no assignments
    if (!loading && hasNoAssignment) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
                        <ShieldAlert className="h-10 w-10 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">No Class Assigned</h1>
                    <p className="text-slate-500 text-center max-w-md">
                        You are not assigned to any class yet. Please contact the school administrator to get assigned to a class.
                    </p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Mark Attendance</h1>
                        <p className="text-slate-500 mt-1">
                            {selectedSectionData
                                ? `${selectedSectionData.class.class_name} - Section ${selectedSectionData.section_name}`
                                : 'Select a class to mark attendance'
                            }
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-end gap-4">
                            {/* Section Selector - Only shows assigned sections */}
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Your Assigned Classes
                                </label>
                                <select
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                >
                                    {assignedSections.map((section) => (
                                        <option key={section.id} value={section.id}>
                                            {section.class.class_name} - Section {section.section_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Selector */}
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                                <input
                                    type="date"
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    max={format(new Date(), 'yyyy-MM-dd')}
                                />
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={markAllPresent}>
                                    All Present
                                </Button>
                                <Button variant="outline" size="sm" onClick={markAllAbsent}>
                                    All Absent
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4 flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold text-green-700">{statusCounts.present}</p>
                                <p className="text-sm text-green-600">Present</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-4 flex items-center gap-3">
                            <XCircle className="h-8 w-8 text-red-500" />
                            <div>
                                <p className="text-2xl font-bold text-red-700">{statusCounts.absent}</p>
                                <p className="text-sm text-red-600">Absent</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Clock className="h-8 w-8 text-amber-500" />
                            <div>
                                <p className="text-2xl font-bold text-amber-700">{statusCounts.late}</p>
                                <p className="text-sm text-amber-600">Late</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertTriangle className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold text-blue-700">{statusCounts.leave}</p>
                                <p className="text-sm text-blue-600">Leave</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Student List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Students ({students.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                        <div className="w-10 h-10 bg-slate-200 rounded-full" />
                                        <div className="flex-1">
                                            <div className="h-4 bg-slate-200 rounded w-1/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">No students found in this class</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {students.map((student, index) => (
                                    <div
                                        key={student.id}
                                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${attendance[student.id]?.status === 'present' ? 'bg-green-50 border-green-200' :
                                                attendance[student.id]?.status === 'absent' ? 'bg-red-50 border-red-200' :
                                                    attendance[student.id]?.status === 'late' ? 'bg-amber-50 border-amber-200' :
                                                        'bg-blue-50 border-blue-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-slate-700 font-semibold border">
                                                {student.roll_number || index + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium text-slate-900">{student.name}</p>
                                                {existingAttendance[student.id] && (
                                                    <span className="text-xs text-slate-500">
                                                        Already marked: {existingAttendance[student.id]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {['present', 'absent', 'late', 'leave'].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusChange(student.id, status as any)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${attendance[student.id]?.status === status
                                                            ? status === 'present' ? 'bg-green-500 text-white' :
                                                                status === 'absent' ? 'bg-red-500 text-white' :
                                                                    status === 'late' ? 'bg-amber-500 text-white' :
                                                                        'bg-blue-500 text-white'
                                                            : 'bg-white text-slate-600 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {students.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-200">
                                <Button
                                    className="w-full"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </div>
                                    ) : (
                                        'Save Attendance'
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
