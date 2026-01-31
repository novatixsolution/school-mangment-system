'use client'

import { useEffect, useState } from 'react'
import { Search, Eye, Edit, GraduationCap, Filter, DollarSign, X, Check, Upload, CreditCard, Users } from 'lucide-react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { Student } from '@/types/student'
import { Class, Section } from '@/types/class'
import { formatCurrency } from '@/lib/utils'
import { calculateAttendancePercentage, type AttendanceRecord } from '@/lib/attendance-utils'
import { BulkImportModal } from '@/components/students/BulkImportModal'
import { ExportStudents } from '@/components/students/ExportStudents'
import { IDCardGenerator } from '@/components/students/IDCardGenerator'
import { SiblingGroupsModal } from '@/components/students/SiblingGroupsModal'

interface ExtendedStudent extends Student {
    custom_fee?: number
    attendancePercentage?: number
    // New student-level fee columns
    original_tuition_fee?: number
    original_admission_fee?: number
    original_exam_fee?: number
    original_other_fee?: number
    custom_tuition_fee?: number
    use_custom_fees?: boolean
    fee_discount?: number
}

export default function StudentsPage() {
    const [students, setStudents] = useState<ExtendedStudent[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [classFilter, setClassFilter] = useState('')
    const [genderFilter, setGenderFilter] = useState('')
    const [sectionFilter, setSectionFilter] = useState('')
    const [sections, setSections] = useState<Section[]>([])

    // Set Fee Modal
    const [isSetFeeModalOpen, setIsSetFeeModalOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<ExtendedStudent | null>(null)
    const [customFee, setCustomFee] = useState('')
    const [savingFee, setSavingFee] = useState(false)

    // Bulk Import Modal
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)

    // ID Card Generator
    const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false)
    const [selectedStudentsForID, setSelectedStudentsForID] = useState<ExtendedStudent[]>([])

    // Sibling Groups Modal
    const [isSiblingGroupsModalOpen, setIsSiblingGroupsModalOpen] = useState(false)

    useEffect(() => {
        fetchData()
    }, [classFilter, genderFilter, sectionFilter])

    useEffect(() => {
        if (classFilter) {
            fetchSections()
        } else {
            setSections([])
            setSectionFilter('')
        }
    }, [classFilter])

    const fetchSections = async () => {
        try {
            const { data } = await supabase
                .from('sections')
                .select('*')
                .eq('class_id', classFilter)
                .order('section_name')
            setSections(data || [])
        } catch (error) {
            console.error('Error fetching sections:', error)
        }
    }

    const fetchData = async () => {
        try {
            // Fetch classes for filter
            const { data: classesData } = await supabase
                .from('classes')
                .select('*')
                .eq('status', 'active')
                .order('class_name')

            setClasses(classesData || [])

            // Fetch students with fee information
            let query = supabase
                .from('students')
                .select(`
                    *,
                    class:classes(id, class_name),
                    section:sections(id, section_name),
                    original_tuition_fee,
                    original_admission_fee,
                    original_exam_fee,
                    original_other_fee,
                    custom_tuition_fee,
                    use_custom_fees,
                    fee_discount
                `)
                .eq('status', 'active')
                .order('name')

            if (classFilter) {
                query = query.eq('class_id', classFilter)
            }

            if (genderFilter) {
                query = query.eq('gender', genderFilter)
            }

            if (sectionFilter) {
                query = query.eq('section_id', sectionFilter)
            }

            const { data, error } = await query

            if (error) throw error

            // Fetch attendance data for last 30 days for each student
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('student_id, status')
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

            // Calculate attendance percentage for each student
            const studentsWithAttendance = (data || []).map(student => {
                const studentRecords: any[] = (attendanceData || []).filter(
                    (record: any) => record.student_id === student.id
                )
                const attendancePercentage = calculateAttendancePercentage(studentRecords as AttendanceRecord[])
                return { ...student, attendancePercentage }
            })

            setStudents(studentsWithAttendance)
        } catch (error) {
            console.error('Error fetching students:', error)
            toast.error('Failed to load students')
        } finally {
            setLoading(false)
        }
    }

    const openSetFeeModal = (student: ExtendedStudent) => {
        setSelectedStudent(student)
        // Use custom_tuition_fee if use_custom_fees is true, otherwise use original
        const currentFee = student.use_custom_fees && student.custom_tuition_fee
            ? student.custom_tuition_fee
            : (student.original_tuition_fee || '')
        setCustomFee(currentFee.toString())
        setIsSetFeeModalOpen(true)
    }

    const handleSetFee = async () => {
        if (!selectedStudent) return

        const fee = parseFloat(customFee)
        if (isNaN(fee) || fee < 0) {
            toast.error('Please enter a valid fee amount')
            return
        }

        setSavingFee(true)

        try {
            // Update both custom_tuition_fee AND enable use_custom_fees flag
            const { error } = await supabase
                .from('students')
                .update({
                    custom_tuition_fee: fee,
                    use_custom_fees: true  // Enable custom fee usage
                })
                .eq('id', selectedStudent.id)

            if (error) throw error

            toast.success(`Custom fee set to ${formatCurrency(fee)} for ${selectedStudent.name}`)
            setIsSetFeeModalOpen(false)
            fetchData()

        } catch (error: any) {
            console.error('Error setting fee:', error)
            toast.error('Failed to set fee', error.message)
        } finally {
            setSavingFee(false)
        }
    }

    const filteredStudents = students.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.father_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Students</h1>
                        <p className="text-slate-500 mt-1">{students.length} total students</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsSiblingGroupsModalOpen(true)}
                            variant="outline"
                            className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:border-purple-300 text-purple-700"
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Sibling Groups
                        </Button>
                        <Button onClick={() => setIsBulkImportOpen(true)} variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                        </Button>
                        <ExportStudents students={students} />
                        <Button
                            onClick={() => {
                                setSelectedStudentsForID(students)
                                setIsIDCardModalOpen(true)
                            }}
                            disabled={students.length === 0}
                        >
                            <CreditCard className="h-4 w-4 mr-2" />
                            ID Cards
                        </Button>
                    </div>
                </div>

                {/* Modern Filters */}
                <Card className="bg-white border-2">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    placeholder="Search by name, roll number, or father name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 h-11"
                                />
                            </div>

                            {/* Class Filter */}
                            <div className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-indigo-600" />
                                <select
                                    className="h-11 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900 min-w-[180px] font-medium"
                                    value={classFilter}
                                    onChange={(e) => setClassFilter(e.target.value)}
                                >
                                    <option value="">All Classes</option>
                                    {classes.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.class_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Section Filter - Shows when class selected */}
                            {classFilter && sections.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">📚</span>
                                    <select
                                        className="h-11 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900 min-w-[160px] font-medium"
                                        value={sectionFilter}
                                        onChange={(e) => setSectionFilter(e.target.value)}
                                    >
                                        <option value="">All Sections</option>
                                        {sections.map((section) => (
                                            <option key={section.id} value={section.id}>
                                                Section {section.section_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Gender Filter - Pills */}
                            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
                                <button
                                    onClick={() => setGenderFilter('')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${genderFilter === ''
                                        ? 'bg-white shadow-sm text-indigo-600'
                                        : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setGenderFilter('male')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${genderFilter === 'male'
                                        ? 'bg-white shadow-sm text-blue-600'
                                        : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    Boys
                                </button>
                                <button
                                    onClick={() => setGenderFilter('female')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${genderFilter === 'female'
                                        ? 'bg-white shadow-sm text-pink-600'
                                        : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    Girls
                                </button>
                            </div>
                        </div>

                        {/* Active Filters Summary */}
                        {(classFilter || genderFilter || sectionFilter || searchQuery) && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                <p className="text-sm text-slate-500">Active filters:</p>
                                {classFilter && (
                                    <Badge variant="default" className="gap-1">
                                        {classes.find(c => c.id === classFilter)?.class_name}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setClassFilter('')}
                                        />
                                    </Badge>
                                )}
                                {sectionFilter && (
                                    <Badge variant="default" className="gap-1">
                                        Section {sections.find(s => s.id === sectionFilter)?.section_name}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setSectionFilter('')}
                                        />
                                    </Badge>
                                )}
                                {genderFilter && (
                                    <Badge variant="default" className="gap-1">
                                        {genderFilter === 'male' ? 'Boys' : 'Girls'}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setGenderFilter('')}
                                        />
                                    </Badge>
                                )}
                                {searchQuery && (
                                    <Badge variant="default" className="gap-1">
                                        "{searchQuery}"
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => setSearchQuery('')}
                                        />
                                    </Badge>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Students Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                <GraduationCap className="h-8 w-8 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">
                                Loading students...
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
                    ) : filteredStudents.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <GraduationCap className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                {searchQuery || classFilter || genderFilter || sectionFilter
                                    ? 'No students found'
                                    : 'No students yet'}
                            </h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-sm text-center">
                                {searchQuery || classFilter || genderFilter || sectionFilter
                                    ? 'Try adjusting your filters to find students.'
                                    : 'Start by adding your first student through the admissions process.'}
                            </p>
                            {!(searchQuery || classFilter || genderFilter || sectionFilter) && (
                                <Link href="/owner/admissions/new">
                                    <Button>
                                        <GraduationCap className="h-4 w-4 mr-2" />
                                        Add First Student
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        filteredStudents.map((student) => {
                            const isMale = student.gender === 'male'
                            const accentColor = isMale ? 'blue' : 'pink'
                            const bgGradient = isMale
                                ? 'from-blue-50 to-indigo-50'
                                : 'from-pink-50 to-purple-50'

                            return (
                                <Card
                                    key={student.id}
                                    className={`card-hover group overflow-hidden border-t-4 ${isMale ? 'border-t-blue-500' : 'border-t-pink-500'
                                        } hover:shadow-xl transition-all duration-300`}
                                >
                                    <CardContent className="p-0">
                                        {/* Header with Gradient */}
                                        <div className={`bg-gradient-to-r ${bgGradient} px-4 pt-4 pb-3`}>
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Avatar name={student.name} size="lg" />
                                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${isMale ? 'bg-blue-500' : 'bg-pink-500'
                                                        } flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                                                        {isMale ? '👦' : '👧'}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-base text-slate-900 truncate">
                                                        {student.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-slate-600 font-medium">
                                                            {student.roll_number ? `#${student.roll_number}` : 'No Roll'}
                                                        </span>
                                                        {(() => {
                                                            const resolvedTuitionFee = student.use_custom_fees && student.custom_tuition_fee
                                                                ? student.custom_tuition_fee
                                                                : (student.original_tuition_fee || 0)

                                                            if (resolvedTuitionFee > 0) {
                                                                const isCustom = student.use_custom_fees && student.custom_tuition_fee !== null
                                                                return (
                                                                    <div className={`flex items-center gap-0.5 ${isCustom ? 'text-blue-600 bg-blue-50 border border-blue-200' : 'text-green-600 bg-green-50 border border-green-200'} px-2 py-0.5 rounded-full shadow-sm`}>
                                                                        <DollarSign className="h-3 w-3" />
                                                                        <span className="text-xs font-semibold">
                                                                            {formatCurrency(resolvedTuitionFee)}
                                                                        </span>
                                                                        <span className="text-[10px] ml-0.5 opacity-75">
                                                                            {isCustom ? '(Custom)' : '(Original)'}
                                                                        </span>
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="px-4 py-3 bg-white">
                                            {/* Badges */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${isMale
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-pink-100 text-pink-700'
                                                    }`}>
                                                    <GraduationCap className="h-3 w-3" />
                                                    {student.class?.class_name || 'No Class'}
                                                </div>
                                                {student.section && (
                                                    <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                                                        {student.section.section_name}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="space-y-1.5 text-xs mb-3">
                                                {student.father_name && (
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${isMale ? 'bg-blue-400' : 'bg-pink-400'
                                                            }`} />
                                                        <span className="font-medium">Father:</span>
                                                        <span className="truncate">{student.father_name}</span>
                                                    </div>
                                                )}
                                                {student.father_phone && (
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${isMale ? 'bg-blue-400' : 'bg-pink-400'
                                                            }`} />
                                                        <span className="font-medium">Phone:</span>
                                                        <span>{student.father_phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Fee Breakdown */}
                                            {(() => {
                                                const resolvedTuitionFee = student.use_custom_fees && student.custom_tuition_fee
                                                    ? student.custom_tuition_fee
                                                    : (student.original_tuition_fee || 0)
                                                const isCustom = student.use_custom_fees && student.custom_tuition_fee !== null

                                                if (resolvedTuitionFee > 0 || (student.original_admission_fee || 0) > 0 || (student.original_exam_fee || 0) > 0) {
                                                    return (
                                                        <div className="mb-3 p-2 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="text-xs font-semibold text-green-800">Fee Breakdown</span>
                                                                {isCustom && (
                                                                    <Badge variant="default" className="text-[10px] bg-blue-500 h-4 px-1.5">Custom</Badge>
                                                                )}
                                                            </div>
                                                            <div className="space-y-1 text-xs">
                                                                {resolvedTuitionFee > 0 && (
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-slate-600">Tuition:</span>
                                                                        <span className="font-semibold text-slate-900">{formatCurrency(resolvedTuitionFee)}</span>
                                                                    </div>
                                                                )}
                                                                {(student.original_admission_fee || 0) > 0 && (
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-slate-600">Admission:</span>
                                                                        <span className="font-semibold text-slate-900">{formatCurrency(student.original_admission_fee || 0)}</span>
                                                                    </div>
                                                                )}
                                                                {(student.original_exam_fee || 0) > 0 && (
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-slate-600">Exam:</span>
                                                                        <span className="font-semibold text-slate-900">{formatCurrency(student.original_exam_fee || 0)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            })()}

                                            {/* Stats - Attendance */}
                                            <div className="mb-3 p-2 bg-slate-50 rounded-lg">
                                                {/* Attendance */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-medium text-slate-600">Attendance</span>
                                                        <span className={`text-xs font-bold ${(student.attendancePercentage || 0) >= 75 ? 'text-green-600' : 'text-orange-600'
                                                            }`}>
                                                            {student.attendancePercentage || 0}%
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${(student.attendancePercentage || 0) >= 75 ? 'bg-green-500' : 'bg-orange-500'
                                                                }`}
                                                            style={{ width: `${student.attendancePercentage || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                                                <Link href={`/owner/students/${student.id}`} className="flex-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`w-full text-xs h-8 ${isMale
                                                            ? 'hover:bg-blue-50 hover:text-blue-700'
                                                            : 'hover:bg-pink-50 hover:text-pink-700'
                                                            }`}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        View
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openSetFeeModal(student)}
                                                    className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 text-xs h-8"
                                                >
                                                    <DollarSign className="h-3 w-3 mr-1" />
                                                    Fee
                                                </Button>
                                                <Link href={`/owner/students/${student.id}/edit`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`text-xs h-8 px-2 ${isMale
                                                            ? 'hover:bg-blue-50 hover:text-blue-700'
                                                            : 'hover:bg-pink-50 hover:text-pink-700'
                                                            }`}
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Set Fee Modal */}
            <Modal
                isOpen={isSetFeeModalOpen}
                onClose={() => setIsSetFeeModalOpen(false)}
                title="Set Monthly Fee"
                size="sm"
            >
                {selectedStudent && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-sm text-slate-500">Student</p>
                            <p className="font-semibold text-slate-900">{selectedStudent.name}</p>
                            <p className="text-sm text-slate-500">{selectedStudent.class?.class_name}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Monthly Fee Amount (PKR)
                            </label>
                            <Input
                                type="number"
                                placeholder="Enter fee amount"
                                value={customFee}
                                onChange={(e) => setCustomFee(e.target.value)}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                This fee will auto-fill when collecting payment for this student
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsSetFeeModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSetFee}
                                disabled={savingFee}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {savingFee ? 'Saving...' : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Save Fee
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Bulk Import Modal */}
            <BulkImportModal
                open={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                onSuccess={() => {
                    fetchData()
                    setIsBulkImportOpen(false)
                }}
            />

            {/* ID Card Generator Modal */}
            <IDCardGenerator
                open={isIDCardModalOpen}
                onClose={() => setIsIDCardModalOpen(false)}
                students={selectedStudentsForID}
            />

            {/* Sibling Groups Modal */}
            <SiblingGroupsModal
                isOpen={isSiblingGroupsModalOpen}
                onClose={() => setIsSiblingGroupsModalOpen(false)}
            />
        </DashboardLayout>
    )
}
