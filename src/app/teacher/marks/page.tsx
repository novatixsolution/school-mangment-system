'use client'

import { useEffect, useState } from 'react'
import { Save, ClipboardList, ShieldAlert, Info } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { Exam } from '@/types/exam'
import { Student } from '@/types/student'
import { Subject } from '@/types/class'
import { useAuth } from '@/contexts/AuthContext'
import { getTeacherExams, getClassIdsFromSections, hasAssignedClasses } from '@/lib/teacher-data-filter'

export default function TeacherMarksPage() {
    const { profile } = useAuth()
    const [exams, setExams] = useState<Exam[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [selectedExam, setSelectedExam] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')
    const [marks, setMarks] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (profile?.id) {
            fetchExams()
        }
    }, [profile?.id])

    useEffect(() => {
        if (selectedExam) {
            fetchExamDetails()
        }
    }, [selectedExam])

    useEffect(() => {
        if (selectedExam && selectedSubject) {
            fetchStudentsAndMarks()
        }
    }, [selectedExam, selectedSubject])

    const fetchExams = async () => {
        if (!profile?.id) return

        try {
            // Fetch exams only for teacher's assigned classes
            const { data } = await getTeacherExams(profile.id)
            setExams(data)
        } catch (error) {
            console.error('Error fetching exams:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchExamDetails = async () => {
        const exam = exams.find((e) => e.id === selectedExam)
        if (!exam) return

        try {
            const { data: subjectsData } = await supabase
                .from('subjects')
                .select('*')
                .eq('class_id', exam.class_id)

            setSubjects(subjectsData || [])
        } catch (error) {
            console.error('Error fetching subjects:', error)
        }
    }

    const fetchStudentsAndMarks = async () => {
        const exam = exams.find((e) => e.id === selectedExam)
        if (!exam) return

        try {
            // Fetch students
            const { data: studentsData } = await supabase
                .from('students')
                .select('*')
                .eq('class_id', exam.class_id)
                .eq('status', 'active')
                .order('name')

            setStudents(studentsData || [])

            // Fetch existing marks
            const { data: marksData } = await supabase
                .from('marks')
                .select('*')
                .eq('exam_id', selectedExam)
                .eq('subject_id', selectedSubject)

            const marksMap: Record<string, string> = {}
            marksData?.forEach((m) => {
                marksMap[m.student_id] = m.obtained_marks?.toString() || ''
            })
            setMarks(marksMap)
        } catch (error) {
            console.error('Error fetching students:', error)
        }
    }

    const handleMarkChange = (studentId: string, value: string) => {
        setMarks((prev) => ({
            ...prev,
            [studentId]: value,
        }))
    }

    const handleSave = async () => {
        if (!selectedExam || !selectedSubject) {
            toast.error('Please select exam and subject')
            return
        }

        setSaving(true)
        try {
            // Delete existing marks
            await supabase
                .from('marks')
                .delete()
                .eq('exam_id', selectedExam)
                .eq('subject_id', selectedSubject)

            // Insert new marks
            const marksToInsert = Object.entries(marks)
                .filter(([_, value]) => value !== '')
                .map(([studentId, value]) => ({
                    exam_id: selectedExam,
                    student_id: studentId,
                    subject_id: selectedSubject,
                    obtained_marks: parseFloat(value),
                }))

            if (marksToInsert.length > 0) {
                const { error } = await supabase.from('marks').insert(marksToInsert)
                if (error) throw error
            }

            toast.success('Marks saved successfully')
        } catch (error: any) {
            console.error('Error saving marks:', error)
            toast.error('Failed to save marks', error.message)
        } finally {
            setSaving(false)
        }
    }

    // Show message if no classes assigned
    if (!loading && !hasAssignedClasses(profile)) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
                        <ShieldAlert className="h-10 w-10 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">No Classes Assigned</h1>
                    <p className="text-slate-500 text-center max-w-md">
                        You are not assigned to any classes yet. Please contact the school administrator to get assigned to classes.
                    </p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Marks Entry</h1>
                        <p className="text-slate-500 mt-1">Enter student marks for exams</p>
                    </div>
                    <Button onClick={handleSave} disabled={saving || !selectedExam || !selectedSubject}>
                        <Save className="h-5 w-5 mr-2" />
                        {saving ? 'Saving...' : 'Save Marks'}
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Exam</label>
                                <select
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white"
                                    value={selectedExam}
                                    onChange={(e) => {
                                        setSelectedExam(e.target.value)
                                        setSelectedSubject('')
                                        setStudents([])
                                        setMarks({})
                                    }}
                                >
                                    <option value="">Select Exam</option>
                                    {exams.map((exam) => (
                                        <option key={exam.id} value={exam.id}>
                                            {exam.name} - {exam.class?.class_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Subject</label>
                                <select
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white"
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    disabled={!selectedExam}
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Marks Entry */}
                <Card>
                    <CardHeader>
                        <CardTitle>Students ({students.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!selectedExam || !selectedSubject ? (
                            <div className="text-center py-12 text-slate-500">
                                <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p>Please select an exam and subject</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <p>No students found for this class</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {students.map((student) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{student.name}</p>
                                                <p className="text-sm text-slate-500">
                                                    {student.roll_number || 'No Roll #'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Marks"
                                                className="w-24 text-center"
                                                value={marks[student.id] || ''}
                                                onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                                min="0"
                                                max="100"
                                            />
                                            <span className="text-slate-400">/ 100</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
