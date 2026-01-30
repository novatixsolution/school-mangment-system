'use client'

import { useEffect, useState } from 'react'
import { Users, BookOpen, Calendar, ClipboardCheck, ArrowRight, ShieldAlert } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
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

interface AttendanceStats {
    total: number
    present: number
    absent: number
    marked_today: boolean
}

export default function TeacherDashboard() {
    const { profile } = useAuth()
    const [assignedSections, setAssignedSections] = useState<Section[]>([])
    const [studentCount, setStudentCount] = useState(0)
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
        total: 0,
        present: 0,
        absent: 0,
        marked_today: false
    })
    const [loading, setLoading] = useState(true)
    const [hasNoAssignment, setHasNoAssignment] = useState(false)

    useEffect(() => {
        if (profile?.id) {
            fetchDashboardData()
        }
    }, [profile?.id])

    const fetchDashboardData = async () => {
        if (!profile?.id) return

        try {
            // Get assigned sections
            const { data: sections, error: sectionsError } = await supabase
                .from('sections')
                .select('*, class:classes(id, class_name)')
                .eq('teacher_id', profile.id)
                .eq('status', 'active')

            if (sectionsError) throw sectionsError

            if (!sections || sections.length === 0) {
                setHasNoAssignment(true)
                setLoading(false)
                return
            }

            setAssignedSections(sections)

            // Get student count for assigned sections
            const sectionIds = sections.map(s => s.id)
            const { count: studentsCount, error: studentsError } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .in('section_id', sectionIds)
                .eq('status', 'active')

            if (studentsError) throw studentsError
            setStudentCount(studentsCount || 0)

            // Get today's attendance stats
            const today = format(new Date(), 'yyyy-MM-dd')
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('status')
                .in('section_id', sectionIds)
                .eq('date', today)

            if (attendanceError) throw attendanceError

            const stats: AttendanceStats = {
                total: attendanceData?.length || 0,
                present: attendanceData?.filter(a => a.status === 'present').length || 0,
                absent: attendanceData?.filter(a => a.status === 'absent').length || 0,
                marked_today: (attendanceData?.length || 0) > 0
            }
            setAttendanceStats(stats)

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Show message if no class assigned
    if (!loading && hasNoAssignment) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
                        <ShieldAlert className="h-10 w-10 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">No Class Assigned</h1>
                    <p className="text-slate-500 text-center max-w-md mb-6">
                        You are not assigned to any class yet. Please contact the school administrator to get assigned to a class.
                    </p>
                    <p className="text-sm text-slate-400">
                        Once assigned, you'll be able to:
                    </p>
                    <ul className="text-sm text-slate-500 mt-2 space-y-1">
                        <li>• View your assigned class students</li>
                        <li>• Mark daily attendance</li>
                        <li>• Enter exam marks</li>
                    </ul>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Welcome, {profile?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-slate-500 mt-1">Here's your class overview for today</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-indigo-100">Assigned Classes</p>
                                    <p className="text-3xl font-bold mt-1">
                                        {loading ? '-' : assignedSections.length}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100">Total Students</p>
                                    <p className="text-3xl font-bold mt-1">
                                        {loading ? '-' : studentCount}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                                    <Users className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-amber-100">Today's Attendance</p>
                                    <p className="text-3xl font-bold mt-1">
                                        {loading ? '-' : attendanceStats.marked_today ? `${attendanceStats.present}/${attendanceStats.total}` : 'Not Marked'}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                                    <Calendar className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`text-white ${attendanceStats.marked_today ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-pink-600'}`}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={attendanceStats.marked_today ? 'text-green-100' : 'text-red-100'}>
                                        Attendance Status
                                    </p>
                                    <p className="text-xl font-bold mt-1">
                                        {loading ? '-' : attendanceStats.marked_today ? '✓ Completed' : '✗ Pending'}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                                    <ClipboardCheck className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assigned Classes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-500" />
                            Your Assigned Classes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="animate-pulse p-4 bg-slate-50 rounded-lg">
                                        <div className="h-5 bg-slate-200 rounded w-1/3" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {assignedSections.map((section) => (
                                    <div
                                        key={section.id}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {section.class.class_name} - Section {section.section_name}
                                                </p>
                                                <p className="text-sm text-slate-500">Class Teacher</p>
                                            </div>
                                        </div>
                                        <Link href="/teacher/attendance">
                                            <Button variant="ghost" size="sm">
                                                Mark Attendance
                                                <ArrowRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Link href="/teacher/attendance">
                                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                                    <Calendar className="h-6 w-6 text-indigo-500" />
                                    <span>Mark Attendance</span>
                                </Button>
                            </Link>
                            <Link href="/teacher/marks">
                                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                                    <ClipboardCheck className="h-6 w-6 text-emerald-500" />
                                    <span>Enter Marks</span>
                                </Button>
                            </Link>
                            <Link href="/teacher/students">
                                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                                    <Users className="h-6 w-6 text-amber-500" />
                                    <span>View Students</span>
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
