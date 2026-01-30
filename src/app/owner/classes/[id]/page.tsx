'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, TrendingUp, DollarSign, BookOpen, Calendar, GraduationCap } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

// Import all modals
import { AddSubjectModal } from '@/components/classes/AddSubjectModal'
import { DeleteConfirmModal } from '@/components/classes/DeleteConfirmModal'
import { AssignTeacherModal } from '@/components/classes/AssignTeacherModal'
import { AttendanceModal } from '@/components/classes/AttendanceModal'
import { FeeStatusModal } from '@/components/classes/FeeStatusModal'
import { TimetableModal } from '@/components/classes/TimetableModal'

interface ClassDetail {
    id: string
    class_name: string
    medium?: string
    description?: string
}

interface Student {
    id: string
    name: string
    roll_number?: string
    photo_url?: string
    status: string
    feeStatus?: 'paid' | 'pending' | 'partial'
    amountPaid?: number
    amountDue?: number
}

interface Teacher {
    id: string
    name: string
    email?: string
    phone?: string
}

interface TeacherAssignment {
    id: string
    teacherId: string
    teacherName: string
    subject: string
}

export default function ClassDetailPage() {
    const params = useParams()
    const router = useRouter()
    const classId = params.id as string

    // Core data
    const [classData, setClassData] = useState<ClassDetail | null>(null)
    const [students, setStudents] = useState<Student[]>([])
    const [subjects, setSubjects] = useState<string[]>([])
    const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([])
    const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([])
    const [loading, setLoading] = useState(true)

    // Stats
    const [stats, setStats] = useState({
        studentCount: 0,
        attendance: 85,
        feesPaid: 80
    })

    // Modal states - Subjects
    const [showAddSubject, setShowAddSubject] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteSubjectIndex, setDeleteSubjectIndex] = useState<number | null>(null)

    // Modal states - Teachers
    const [showAssignTeacher, setShowAssignTeacher] = useState(false)

    // Modal states - Features
    const [showAttendance, setShowAttendance] = useState(false)
    const [showFeeStatus, setShowFeeStatus] = useState(false)
    const [showTimetable, setShowTimetable] = useState(false)
    const [timetableData, setTimetableData] = useState<any>(null)

    useEffect(() => {
        if (classId) {
            fetchClassDetails()
            fetchStaffTeachers()
            loadDummyData() // TODO: Replace with real database calls
        }
    }, [classId])

    const fetchClassDetails = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('id', classId)
                .single()

            if (error) throw error
            if (data) setClassData(data)
        } catch (error) {
            console.error('Error fetching class:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStaffTeachers = async () => {
        try {
            const { data, error } = await supabase
                .from('staff')
                .select('id, name, email, phone')
                .eq('status', 'active')

            if (data) {
                setAvailableTeachers(data)
            }
        } catch (error) {
            console.error('Error fetching teachers:', error)
        }
    }

    // TODO: Replace with real database
    const loadDummyData = () => {
        // Dummy subjects
        setSubjects(['Mathematics', 'English', 'Science', 'Urdu', 'Islamiat'])

        // Dummy students
        const dummyStudents: Student[] = [
            { id: '1', name: 'Ahmed Khan', roll_number: '101', status: 'active', feeStatus: 'paid', amountPaid: 5000, amountDue: 0 },
            { id: '2', name: 'Fatima Ali', roll_number: '102', status: 'active', feeStatus: 'pending', amountPaid: 0, amountDue: 5000 },
            { id: '3', name: 'Hassan Raza', roll_number: '103', status: 'active', feeStatus: 'partial', amountPaid: 2500, amountDue: 2500 },
            { id: '4', name: 'Zainab Malik', roll_number: '104', status: 'active', feeStatus: 'paid', amountPaid: 5000, amountDue: 0 },
            { id: '5', name: 'Bilal Ahmed', roll_number: '105', status: 'active', feeStatus: 'pending', amountPaid: 0, amountDue: 5000 },
            { id: '6', name: 'Ayesha Siddiqui', roll_number: '106', status: 'active', feeStatus: 'paid', amountPaid: 5000, amountDue: 0 },
        ]
        setStudents(dummyStudents)

        // Dummy teacher assignments
        setTeacherAssignments([
            { id: '1', teacherId: 'staff-1', teacherName: 'Ms. Sara Khan', subject: 'Mathematics' },
            { id: '2', teacherId: 'staff-2', teacherName: 'Mr. Ahmed Ali', subject: 'English' },
            { id: '3', teacherId: 'staff-3', teacherName: 'Ms. Fatima', subject: 'Science' },
        ])

        setStats({
            studentCount: dummyStudents.length,
            attendance: 85,
            feesPaid: 80
        })
    }

    // Subject handlers
    const handleAddSubjectSubmit = (subjectName: string) => {
        if (subjects.includes(subjectName)) {
            alert('Subject already exists!')
            return
        }
        setSubjects([...subjects, subjectName])
    }

    const handleDeleteSubjectClick = (index: number) => {
        setDeleteSubjectIndex(index)
        setShowDeleteConfirm(true)
    }

    const handleDeleteSubjectConfirm = () => {
        if (deleteSubjectIndex === null) return

        const subjectToDelete = subjects[deleteSubjectIndex]

        // Remove subject
        const newSubjects = subjects.filter((_, i) => i !== deleteSubjectIndex)
        setSubjects(newSubjects)

        // Remove all teacher assignments for this subject
        const newAssignments = teacherAssignments.filter(a => a.subject !== subjectToDelete)
        setTeacherAssignments(newAssignments)

        setDeleteSubjectIndex(null)
    }

    // Teacher assignment handlers
    const handleAssignTeacher = (teacherId: string, teacherName: string, subject: string) => {
        // Remove old assignment if exists
        const filtered = teacherAssignments.filter(a => a.subject !== subject)

        // Add new assignment
        const newAssignment: TeacherAssignment = {
            id: Date.now().toString(),
            teacherId,
            teacherName,
            subject
        }

        setTeacherAssignments([...filtered, newAssignment])
    }

    const handleUnassignTeacher = (assignmentId: string) => {
        if (confirm('Remove this teacher assignment?')) {
            setTeacherAssignments(teacherAssignments.filter(a => a.id !== assignmentId))
        }
    }

    // Attendance handlers
    const handleAttendanceSubmit = (attendance: Record<string, 'present' | 'absent' | 'late'>) => {
        console.log('Attendance submitted:', attendance)
        // TODO: Save to database
        alert('Attendance saved successfully!')
    }

    // Timetable handlers
    const handleSaveTimetable = (timetable: any) => {
        setTimetableData(timetable)
        console.log('Timetable saved:', timetable)
        // TODO: Save to database
        alert('Timetable saved successfully!')
    }

    // Get delete confirmation data
    const getDeleteConfirmData = () => {
        if (deleteSubjectIndex === null) return { title: '', message: '', affectedItems: [] }

        const subjectToDelete = subjects[deleteSubjectIndex]
        const affectedTeachers = teacherAssignments
            .filter(a => a.subject === subjectToDelete)
            .map(a => a.teacherName)

        return {
            title: 'Delete Subject',
            message: `Are you sure you want to delete "${subjectToDelete}"?`,
            affectedItems: affectedTeachers
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading class details...</div>
                </div>
            </DashboardLayout>
        )
    }

    if (!classData) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Class not found</div>
                </div>
            </DashboardLayout>
        )
    }

    const confirmData = getDeleteConfirmData()
    const uniqueTeachersCount = new Set(teacherAssignments.map(a => a.teacherId)).size

    return (
        <DashboardLayout>
            <div className="p-3 space-y-3">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-4 text-white relative">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/owner/classes')}
                        className="gap-2 bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white absolute left-4"
                        size="sm"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    <div className="flex items-center justify-center gap-3">
                        <GraduationCap className="h-8 w-8" />
                        <div className="text-center">
                            <h1 className="text-2xl font-bold">{classData.class_name}</h1>
                            {classData.medium && (
                                <p className="text-white/90 text-sm">{classData.medium}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-12 gap-3">
                    {/* LEFT COLUMN - Subjects (4 cols) */}
                    <div className="col-span-4">
                        <Card className="border-2 border-pink-300 h-full shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-md">
                                            <BookOpen className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">Subjects</h3>
                                            <p className="text-2xl font-bold text-pink-600">{subjects.length}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAddSubject(true)}
                                        className="text-xs bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all font-semibold shadow-md hover:shadow-lg whitespace-nowrap"
                                    >
                                        + Add
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {subjects.map((subject, idx) => {
                                        const colors = [
                                            'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-400 text-blue-800',
                                            'bg-gradient-to-r from-green-50 to-green-100 border-green-400 text-green-800',
                                            'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-400 text-purple-800',
                                            'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400 text-orange-800',
                                            'bg-gradient-to-r from-cyan-50 to-cyan-100 border-cyan-400 text-cyan-800',
                                        ]
                                        return (
                                            <div key={idx} className={`${colors[idx % colors.length]} border-l-4 p-4 rounded-lg flex items-center justify-between hover:shadow-lg transition-all cursor-pointer`}>
                                                <span className="text-sm font-bold">{subject}</span>
                                                <button
                                                    onClick={() => handleDeleteSubjectClick(idx)}
                                                    className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xl transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* MIDDLE COLUMN - Stats (4 cols) */}
                    <div className="col-span-4 space-y-3">
                        {/* Students */}
                        <Card className="border-2 border-blue-300 shadow-md hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-white to-blue-50">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                                            <Users className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800">Students</h3>
                                            <p className="text-xs text-slate-500">View below</p>
                                        </div>
                                    </div>
                                    <p className="text-4xl font-bold text-blue-600">{stats.studentCount}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Attendance */}
                        <Card
                            className="border-2 border-green-300 shadow-md hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-white to-green-50"
                            onClick={() => setShowAttendance(true)}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                                            <TrendingUp className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800">Attendance</h3>
                                            <p className="text-xs text-slate-500">Overall average</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-bold text-green-600">{stats.attendance}%</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowAttendance(true)
                                            }}
                                            className="mt-2 text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                                        >
                                            Take Today
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Fee Collection */}
                        <Card
                            className="border-2 border-yellow-300 shadow-md hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-white to-yellow-50"
                            onClick={() => setShowFeeStatus(true)}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                                            <DollarSign className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800">Fee Collection</h3>
                                            <p className="text-xs text-slate-500">This month</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-bold text-yellow-600">{stats.feesPaid}%</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowFeeStatus(true)
                                            }}
                                            className="mt-2 text-xs bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timetable */}
                        <Card
                            className="border-2 border-indigo-300 shadow-md hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-white to-indigo-50"
                            onClick={() => setShowTimetable(true)}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg">
                                            <Calendar className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800">Timetable</h3>
                                            <p className="text-xs text-slate-500">Weekly schedule</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setShowTimetable(true)
                                        }}
                                        className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700"
                                    >
                                        Build Schedule
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN - Teachers (4 cols) */}
                    <div className="col-span-4">
                        <Card className="border-2 border-purple-300 h-full shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md">
                                            <GraduationCap className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">Teachers</h3>
                                            <p className="text-2xl font-bold text-purple-600">{uniqueTeachersCount}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAssignTeacher(true)}
                                        className="text-xs bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all font-semibold shadow-md hover:shadow-lg whitespace-nowrap"
                                    >
                                        Assign
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {teacherAssignments.map((assignment) => {
                                        const colorMap: any = {
                                            0: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-400',
                                            1: 'bg-gradient-to-r from-green-50 to-green-100 border-green-400',
                                            2: 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-400',
                                            3: 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400',
                                            4: 'bg-gradient-to-r from-cyan-50 to-cyan-100 border-cyan-400',
                                        }
                                        const colorIndex = teacherAssignments.indexOf(assignment) % 5

                                        return (
                                            <div key={assignment.id} className={`${colorMap[colorIndex]} border-l-4 p-4 rounded-lg hover:shadow-lg transition-all`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm font-bold text-slate-800">{assignment.teacherName}</p>
                                                    <button
                                                        onClick={() => handleUnassignTeacher(assignment.id)}
                                                        className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center font-bold text-lg transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                <p className="text-sm text-slate-700 font-medium flex items-center gap-1">
                                                    <span className="text-purple-500">→</span> {assignment.subject}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* All Modals */}
            <AddSubjectModal
                open={showAddSubject}
                onClose={() => setShowAddSubject(false)}
                onAdd={handleAddSubjectSubmit}
            />

            <DeleteConfirmModal
                open={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false)
                    setDeleteSubjectIndex(null)
                }}
                onConfirm={handleDeleteSubjectConfirm}
                title={confirmData.title}
                message={confirmData.message}
                affectedItems={confirmData.affectedItems}
            />

            <AssignTeacherModal
                open={showAssignTeacher}
                onClose={() => setShowAssignTeacher(false)}
                subjects={subjects}
                availableTeachers={availableTeachers}
                currentAssignments={teacherAssignments}
                onAssign={handleAssignTeacher}
            />

            <AttendanceModal
                open={showAttendance}
                onClose={() => setShowAttendance(false)}
                students={students}
                onSubmit={handleAttendanceSubmit}
                date={new Date()}
            />

            <FeeStatusModal
                open={showFeeStatus}
                onClose={() => setShowFeeStatus(false)}
                students={students}
                monthlyFee={5000}
            />

            <TimetableModal
                open={showTimetable}
                onClose={() => setShowTimetable(false)}
                subjects={subjects}
                teachers={teacherAssignments.map(a => ({ name: a.teacherName, subject: a.subject }))}
                onSave={handleSaveTimetable}
            />
        </DashboardLayout>
    )
}
