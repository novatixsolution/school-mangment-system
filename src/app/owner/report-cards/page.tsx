'use client'

import { useEffect, useState } from 'react'
import {
    FileText, Download, Eye, Users, Trophy, TrendingUp,
    Filter, Printer, CheckCircle, Clock, Lock, Search,
    ChevronDown, BarChart3
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import {
    calculateTotalMarks,
    calculatePercentage,
    calculateGrade,
    calculatePositions,
    calculateClassStatistics,
    calculateSubjectRanks,
    getPositionSuffix,
    isInTop3,
    getGradeColor,
    StudentResult,
    ClassStatistics,
    DEFAULT_GRADE_CONFIG
} from '@/lib/results-calculator'
import {
    downloadReportCard,
    downloadBulkReportCards,
    getReportCardBase64,
    ReportCardData,
    SchoolInfo,
    DEFAULT_TEMPLATE
} from '@/lib/pdf-generator'

interface Exam {
    id: string
    name: string
    class_id: string
    start_date: string
    end_date: string
    class?: { id: string; class_name: string }
}

interface Student {
    id: string
    name: string
    roll_number: string
    father_name: string
    class_id: string
    section_id: string
    section?: { id: string; section_name: string }
}

interface Mark {
    id: string
    exam_id: string
    student_id: string
    subject_id: string
    obtained_marks: number
    subject?: { id: string; name: string }
}

interface Subject {
    id: string
    name: string
    class_id: string
}

export default function ReportCardsPage() {
    const { profile } = useAuth()
    const [exams, setExams] = useState<Exam[]>([])
    const [selectedExam, setSelectedExam] = useState<string>('')
    const [students, setStudents] = useState<Student[]>([])
    const [marks, setMarks] = useState<Mark[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Results
    const [results, setResults] = useState<StudentResult[]>([])
    const [classStats, setClassStats] = useState<ClassStatistics | null>(null)

    // Preview modal
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewData, setPreviewData] = useState<string>('')
    const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null)

    // School info (can be made configurable)
    const schoolInfo: SchoolInfo = {
        name: 'EduManager School',
        address: '123 Education Street, Knowledge City',
        phone: '+92 300 1234567',
        email: 'info@edumanager.com'
    }

    useEffect(() => {
        fetchExams()
    }, [])

    useEffect(() => {
        if (selectedExam) {
            fetchExamData()
        }
    }, [selectedExam])

    const fetchExams = async () => {
        try {
            const { data, error } = await supabase
                .from('exams')
                .select('*, class:classes(id, class_name)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setExams(data || [])

            if (data && data.length > 0) {
                setSelectedExam(data[0].id)
            }
        } catch (error) {
            console.error('Error fetching exams:', error)
            toast.error('Failed to load exams')
        } finally {
            setLoading(false)
        }
    }

    const fetchExamData = async () => {
        if (!selectedExam) return
        setLoading(true)

        try {
            const exam = exams.find(e => e.id === selectedExam)
            if (!exam) return

            // Fetch students, marks, and subjects for this exam's class
            const [studentsRes, marksRes, subjectsRes] = await Promise.all([
                supabase
                    .from('students')
                    .select('*, section:sections(id, section_name)')
                    .eq('class_id', exam.class_id)
                    .eq('status', 'active')
                    .order('roll_number'),
                supabase
                    .from('marks')
                    .select('*, subject:subjects(id, name)')
                    .eq('exam_id', selectedExam),
                supabase
                    .from('subjects')
                    .select('*')
                    .eq('class_id', exam.class_id)
            ])

            if (studentsRes.error) throw studentsRes.error
            if (marksRes.error) throw marksRes.error
            if (subjectsRes.error) throw subjectsRes.error

            setStudents(studentsRes.data || [])
            setMarks(marksRes.data || [])
            setSubjects(subjectsRes.data || [])

            // Calculate results
            calculateResults(studentsRes.data || [], marksRes.data || [], subjectsRes.data || [])
        } catch (error) {
            console.error('Error fetching exam data:', error)
            toast.error('Failed to load exam data')
        } finally {
            setLoading(false)
        }
    }

    const calculateResults = (
        studentList: Student[],
        marksList: Mark[],
        subjectList: Subject[]
    ) => {
        // Group marks by student
        const studentMarks: Record<string, Mark[]> = {}
        marksList.forEach(mark => {
            if (!studentMarks[mark.student_id]) {
                studentMarks[mark.student_id] = []
            }
            studentMarks[mark.student_id].push(mark)
        })

        // Calculate result for each student
        const studentResults: StudentResult[] = studentList.map(student => {
            const studentMarksList = studentMarks[student.id] || []

            const subjects = subjectList.map(subject => {
                const mark = studentMarksList.find(m => m.subject_id === subject.id)
                return {
                    subjectId: subject.id,
                    subjectName: subject.name,
                    obtainedMarks: mark?.obtained_marks || 0,
                    maxMarks: 100 // Default max marks
                }
            })

            const totals = calculateTotalMarks(subjects)
            const percentage = calculatePercentage(totals.obtained, totals.max)
            const grade = calculateGrade(percentage)

            return {
                studentId: student.id,
                studentName: student.name,
                rollNumber: student.roll_number || '-',
                subjects,
                totalObtained: totals.obtained,
                totalMax: totals.max,
                percentage,
                grade,
                position: null,
                subjectRanks: {}
            }
        })

        // Calculate positions
        const positions = calculatePositions(
            studentResults.map(r => ({ studentId: r.studentId, percentage: r.percentage }))
        )

        // Calculate subject ranks
        const subjectRankData = marksList.map(m => ({
            studentId: m.student_id,
            subjectId: m.subject_id,
            marks: m.obtained_marks
        }))
        const subjectRanks = calculateSubjectRanks(subjectRankData)

        // Update results with positions and ranks
        studentResults.forEach(result => {
            result.position = positions[result.studentId] || null
            result.subjectRanks = subjectRanks[result.studentId] || {}
        })

        // Sort by position
        studentResults.sort((a, b) => (a.position || 999) - (b.position || 999))

        setResults(studentResults)

        // Calculate class statistics
        const stats = calculateClassStatistics(
            studentResults.map(r => ({
                studentId: r.studentId,
                name: r.studentName,
                percentage: r.percentage
            }))
        )
        setClassStats(stats)
    }

    const handlePreview = (result: StudentResult) => {
        const exam = exams.find(e => e.id === selectedExam)
        const student = students.find(s => s.id === result.studentId)

        if (!exam || !student || !classStats) return

        const reportData: ReportCardData = {
            student: {
                name: student.name,
                rollNumber: student.roll_number || '-',
                fatherName: student.father_name || '-',
                className: exam.class?.class_name || '',
                sectionName: student.section?.section_name || ''
            },
            exam: {
                name: exam.name,
                year: new Date(exam.start_date).getFullYear().toString()
            },
            result,
            classStats,
            remarks: result.percentage >= 33 ? 'Promoted to next class' : 'Needs improvement'
        }

        setSelectedStudent(result)
        const base64 = getReportCardBase64(schoolInfo, reportData)
        setPreviewData(base64)
        setPreviewOpen(true)
    }

    const handleDownloadSingle = (result: StudentResult) => {
        const exam = exams.find(e => e.id === selectedExam)
        const student = students.find(s => s.id === result.studentId)

        if (!exam || !student || !classStats) return

        const reportData: ReportCardData = {
            student: {
                name: student.name,
                rollNumber: student.roll_number || '-',
                fatherName: student.father_name || '-',
                className: exam.class?.class_name || '',
                sectionName: student.section?.section_name || ''
            },
            exam: {
                name: exam.name,
                year: new Date(exam.start_date).getFullYear().toString()
            },
            result,
            classStats,
            remarks: result.percentage >= 33 ? 'Promoted to next class' : 'Needs improvement'
        }

        downloadReportCard(schoolInfo, reportData)
        toast.success('Report card downloaded!')
    }

    const handleDownloadAll = async () => {
        if (!classStats || results.length === 0) return

        setGenerating(true)
        const exam = exams.find(e => e.id === selectedExam)
        if (!exam) return

        try {
            const reportDataList: ReportCardData[] = results.map(result => {
                const student = students.find(s => s.id === result.studentId)
                return {
                    student: {
                        name: student?.name || '',
                        rollNumber: student?.roll_number || '-',
                        fatherName: student?.father_name || '-',
                        className: exam.class?.class_name || '',
                        sectionName: student?.section?.section_name || ''
                    },
                    exam: {
                        name: exam.name,
                        year: new Date(exam.start_date).getFullYear().toString()
                    },
                    result,
                    classStats,
                    remarks: result.percentage >= 33 ? 'Promoted to next class' : 'Needs improvement'
                }
            })

            await downloadBulkReportCards(schoolInfo, reportDataList)
            toast.success(`Downloaded ${results.length} report cards as ZIP!`)
        } catch (error) {
            console.error('Error generating bulk PDFs:', error)
            toast.error('Failed to generate report cards')
        } finally {
            setGenerating(false)
        }
    }

    const currentExam = exams.find(e => e.id === selectedExam)
    const filteredResults = results.filter(r =>
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Report Cards</h1>
                        <p className="text-slate-500 mt-1">Generate and download student report cards</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleDownloadAll}
                            disabled={generating || results.length === 0}
                        >
                            {generating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-2" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="h-5 w-5 mr-2" />
                                    Download All (ZIP)
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Exam Selector & Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Select Exam
                                </label>
                                <select
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900"
                                    value={selectedExam}
                                    onChange={(e) => setSelectedExam(e.target.value)}
                                >
                                    <option value="">Select an exam</option>
                                    {exams.map(exam => (
                                        <option key={exam.id} value={exam.id}>
                                            {exam.name} - {exam.class?.class_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Search Student
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        placeholder="Search by name or roll number..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Class Statistics */}
                {classStats && classStats.totalStudents > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <Users className="h-8 w-8 opacity-80" />
                                    <div>
                                        <p className="text-2xl font-bold">{classStats.totalStudents}</p>
                                        <p className="text-xs opacity-80">Total Students</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="h-8 w-8 opacity-80" />
                                    <div>
                                        <p className="text-2xl font-bold">{classStats.averagePercentage.toFixed(1)}%</p>
                                        <p className="text-xs opacity-80">Class Average</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="h-8 w-8 opacity-80" />
                                    <div>
                                        <p className="text-2xl font-bold">{classStats.highestPercentage.toFixed(1)}%</p>
                                        <p className="text-xs opacity-80">Highest</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-8 w-8 opacity-80" />
                                    <div>
                                        <p className="text-2xl font-bold">{classStats.passCount}</p>
                                        <p className="text-xs opacity-80">Passed</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <Trophy className="h-8 w-8 opacity-80" />
                                    <div>
                                        <p className="text-2xl font-bold">{classStats.failCount}</p>
                                        <p className="text-xs opacity-80">Failed</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <Trophy className="h-8 w-8 opacity-80" />
                                    <div>
                                        <p className="text-lg font-bold">
                                            {classStats.top3.length > 0 ? classStats.top3[0].name.split(' ')[0] : '-'}
                                        </p>
                                        <p className="text-xs opacity-80">Topper</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Top 3 Students */}
                {classStats && classStats.top3.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                Top 3 Positions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {classStats.top3.map((student, index) => (
                                    <div
                                        key={student.studentId}
                                        className={`flex items-center gap-4 p-4 rounded-xl ${index === 0 ? 'bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300' :
                                                index === 1 ? 'bg-gradient-to-r from-slate-100 to-gray-100 border-2 border-slate-300' :
                                                    'bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300'
                                            }`}
                                    >
                                        <div className={`flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-xl ${index === 0 ? 'bg-amber-500' :
                                                index === 1 ? 'bg-slate-400' :
                                                    'bg-orange-400'
                                            }`}>
                                            {student.position}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{student.name}</p>
                                            <p className="text-sm text-slate-600">{student.percentage.toFixed(2)}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Results Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Student Results ({filteredResults.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                        <div className="w-10 h-10 bg-slate-200 rounded-full" />
                                        <div className="flex-1">
                                            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                                            <div className="h-3 bg-slate-200 rounded w-1/4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredResults.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">
                                    {selectedExam ? 'No results found' : 'Select an exam to view results'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th>Pos</th>
                                            <th>Roll No</th>
                                            <th>Student Name</th>
                                            <th>Obtained</th>
                                            <th>Total</th>
                                            <th>Percentage</th>
                                            <th>Grade</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredResults.map((result) => (
                                            <tr key={result.studentId}>
                                                <td>
                                                    {isInTop3(result.position) ? (
                                                        <Badge variant={
                                                            result.position === 1 ? 'warning' :
                                                                result.position === 2 ? 'default' :
                                                                    'info'
                                                        }>
                                                            {getPositionSuffix(result.position!)}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-400">
                                                            {result.position ? getPositionSuffix(result.position) : '-'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="font-mono">{result.rollNumber}</td>
                                                <td className="font-medium">{result.studentName}</td>
                                                <td>{result.totalObtained}</td>
                                                <td>{result.totalMax}</td>
                                                <td className="font-semibold">{result.percentage.toFixed(2)}%</td>
                                                <td>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getGradeColor(result.grade)}`}>
                                                        {result.grade}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handlePreview(result)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDownloadSingle(result)}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Preview Modal */}
            <Modal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                title={`Report Card - ${selectedStudent?.studentName}`}
                size="lg"
            >
                <div className="space-y-4">
                    {previewData && (
                        <iframe
                            src={previewData}
                            className="w-full h-[600px] border rounded-lg"
                            title="Report Card Preview"
                        />
                    )}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                            Close
                        </Button>
                        <Button onClick={() => selectedStudent && handleDownloadSingle(selectedStudent)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    )
}
