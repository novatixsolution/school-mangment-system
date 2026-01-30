'use client'

import { useEffect, useState } from 'react'
import {
    Calendar as CalendarIcon, Check, X, Clock, Save, Download, FileText,
    Search, Users, TrendingUp, BarChart3, Filter, Copy, Zap, Eye, AlertCircle,
    ChevronRight, User
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { Student } from '@/types/student'
import { Class, Section } from '@/types/class'
import { AttendanceStatus } from '@/types/attendance'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar'
import { StudentAttendanceHistory } from '@/components/attendance/StudentAttendanceHistory'
import { AdvancedExportModal } from '@/components/attendance/AdvancedExportModal'
import {
    calculateAttendancePercentage,
    getQuickDatePresets,
    isFutureDate,
    isToday,
    formatDate
} from '@/lib/attendance-utils'
import {
    generateAttendancePDF,
    exportAttendanceToExcel,
    fetchStudentAttendanceRecords,
    type AttendanceReportData
} from '@/lib/attendance-export'

export default function AttendancePage() {
    const { profile } = useAuth()
    const [classes, setClasses] = useState<Class[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedSection, setSelectedSection] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
    const [existingAttendance, setExistingAttendance] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [genderFilter, setGenderFilter] = useState<'' | 'male' | 'female'>('')
    const [statusFilter, setStatusFilter] = useState<'' | AttendanceStatus>('')

    // Modals
    const [showCalendar, setShowCalendar] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [showAdvancedExport, setShowAdvancedExport] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [calendarData, setCalendarData] = useState<Record<string, { present: number; total: number; percentage: number }>>({})

    // Templates
    const [savedTemplates, setSavedTemplates] = useState<Record<string, Record<string, AttendanceStatus>>>({})

    useEffect(() => {
        fetchClassesAndSections()
        loadCalendarData()
    }, [])

    useEffect(() => {
        if (selectedClass && selectedSection) {
            fetchStudents()
            fetchExistingAttendance()
        }
    }, [selectedClass, selectedSection, selectedDate])

    // Auto-select section if class has only one section
    useEffect(() => {
        if (selectedClass) {
            const classSections = sections.filter(s => s.class_id === selectedClass)
            if (classSections.length === 1) {
                setSelectedSection(classSections[0].id)
            }
        }
    }, [selectedClass, sections])

    const fetchClassesAndSections = async () => {
        try {
            const [classesRes, sectionsRes] = await Promise.all([
                supabase.from('classes').select('*').eq('status', 'active').order('class_name'),
                supabase.from('sections').select('*').eq('status', 'active').order('section_name'),
            ])

            if (classesRes.data) setClasses(classesRes.data)
            if (sectionsRes.data) setSections(sectionsRes.data)
        } catch (error) {
            console.error('Error fetching classes:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStudents = async () => {
        try {
            console.log('🔍 Fetching students with:', {
                selectedClass,
                selectedSection,
                className: classes.find(c => c.id === selectedClass)?.class_name,
                sectionName: sections.find(s => s.id === selectedSection)?.section_name
            })

            let query = supabase
                .from('students')
                .select('*')
                .eq('class_id', selectedClass)
                .eq('status', 'active')
                .order('name')

            // Only filter by section if one is selected
            // This allows students without section_id to still appear
            if (selectedSection) {
                query = query.eq('section_id', selectedSection)
            }

            const { data, error } = await query

            if (error) {
                console.error('❌ Error fetching students:', error)
                throw error
            }

            console.log(`✅ Found ${data?.length || 0} students`, data)

            // Check for students without section_id
            const studentsWithoutSection = data?.filter(s => !s.section_id) || []
            if (studentsWithoutSection.length > 0) {
                console.warn(`⚠️ ${studentsWithoutSection.length} students have no section_id:`,
                    studentsWithoutSection.map(s => s.name))
                toast.warning(`${studentsWithoutSection.length} students have no section assigned. Please update their records.`)
            }

            setStudents(data || [])

            // Initialize attendance with 'present' for all students
            const initialAttendance: Record<string, AttendanceStatus> = {}
            data?.forEach((student) => {
                initialAttendance[student.id] = 'present'
            })
            setAttendance(initialAttendance)
        } catch (error) {
            console.error('Error fetching students:', error)
            toast.error('Failed to load students')
        }
    }

    const fetchExistingAttendance = async () => {
        try {
            console.log('📋 Fetching existing attendance for:', { selectedClass, selectedSection, selectedDate })

            let query = supabase
                .from('attendance')
                .select('*')
                .eq('class_id', selectedClass)
                .eq('date', selectedDate)

            // Only filter by section if specified
            if (selectedSection) {
                query = query.eq('section_id', selectedSection)
            }

            const { data, error } = await query

            if (error) {
                console.error('❌ Error fetching attendance:', error)
                throw error
            }

            console.log(`📊 Found ${data?.length || 0} existing attendance records`, data)

            if (data && data.length > 0) {
                const existing: Record<string, string> = {}
                const attendanceRecord: Record<string, AttendanceStatus> = {}
                data.forEach((record) => {
                    existing[record.student_id] = record.id
                    attendanceRecord[record.student_id] = record.status as AttendanceStatus
                })
                setExistingAttendance(existing)
                setAttendance(attendanceRecord)
                console.log('✅ Loaded existing attendance for', Object.keys(attendanceRecord).length, 'students')
            } else {
                setExistingAttendance({})
                console.log('📝 No existing attendance found - starting fresh')
            }
        } catch (error) {
            console.error('Error fetching attendance:', error)
        }
    }

    const loadCalendarData = async () => {
        try {
            // Get last 60 days of attendance data
            const sixtyDaysAgo = new Date()
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

            const { data, error } = await supabase
                .from('attendance')
                .select('date, status')
                .gte('date', sixtyDaysAgo.toISOString().split('T')[0])

            if (error) throw error

            // Group by date and calculate percentages
            const grouped: Record<string, { present: number; total: number }> = {}

            data?.forEach(record => {
                if (!grouped[record.date]) {
                    grouped[record.date] = { present: 0, total: 0 }
                }
                grouped[record.date].total++
                if (record.status === 'present' || record.status === 'late') {
                    grouped[record.date].present++
                }
            })

            const calData: Record<string, { present: number; total: number; percentage: number }> = {}
            Object.entries(grouped).forEach(([date, stats]) => {
                calData[date] = {
                    ...stats,
                    percentage: Math.round((stats.present / stats.total) * 100)
                }
            })

            setCalendarData(calData)
        } catch (error) {
            console.error('Error loading calendar data:', error)
        }
    }

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: status,
        }))
    }

    const handleMarkAll = (status: AttendanceStatus) => {
        const newAttendance: Record<string, AttendanceStatus> = {}
        filteredStudents.forEach((student) => {
            newAttendance[student.id] = status
        })
        setAttendance((prev) => ({ ...prev, ...newAttendance }))
        toast.success(`Marked ${filteredStudents.length} students as ${status}`)
    }

    const handleMarkByGender = (gender: 'male' | 'female', status: AttendanceStatus) => {
        const genderStudents = filteredStudents.filter(s => s.gender === gender)
        const newAttendance: Record<string, AttendanceStatus> = {}
        genderStudents.forEach((student) => {
            newAttendance[student.id] = status
        })
        setAttendance((prev) => ({ ...prev, ...newAttendance }))
        toast.success(`Marked ${genderStudents.length} ${gender} students as ${status}`)
    }

    const handleCopyFromDate = async (sourceDate: string) => {
        try {
            const { data, error } = await supabase
                .from('attendance')
                .select('student_id, status')
                .eq('class_id', selectedClass)
                .eq('section_id', selectedSection)
                .eq('date', sourceDate)

            if (error) throw error

            if (data && data.length > 0) {
                const copiedAttendance: Record<string, AttendanceStatus> = {}
                data.forEach(record => {
                    copiedAttendance[record.student_id] = record.status as AttendanceStatus
                })
                setAttendance((prev) => ({ ...prev, ...copiedAttendance }))
                toast.success(`Copied attendance from ${formatDate(sourceDate)}`)
            } else {
                toast.error('No attendance found for selected date')
            }
        } catch (error) {
            console.error('Error copying attendance:', error)
            toast.error('Failed to copy attendance')
        }
    }

    const handleSaveTemplate = () => {
        const templateName = prompt('Enter template name:')
        if (templateName) {
            setSavedTemplates(prev => ({
                ...prev,
                [templateName]: { ...attendance }
            }))
            toast.success(`Template "${templateName}" saved`)
        }
    }

    const handleLoadTemplate = (templateName: string) => {
        const template = savedTemplates[templateName]
        if (template) {
            setAttendance(template)
            toast.success(`Loaded template "${templateName}"`)
        }
    }

    const handleSave = async () => {
        if (!selectedClass || !selectedSection || !profile) {
            toast.error('Please select class and section')
            return
        }

        if (isFutureDate(selectedDate)) {
            toast.error('Cannot mark attendance for future dates')
            return
        }

        setSaving(true)

        try {
            const records = Object.entries(attendance).map(([studentId, status]) => ({
                student_id: studentId,
                class_id: selectedClass,
                section_id: selectedSection,
                date: selectedDate,
                status,
                marked_by: profile.id,
            }))

            // Delete existing records for this date
            if (Object.keys(existingAttendance).length > 0) {
                await supabase
                    .from('attendance')
                    .delete()
                    .eq('class_id', selectedClass)
                    .eq('section_id', selectedSection)
                    .eq('date', selectedDate)
            }

            // Insert new records
            const { error } = await supabase.from('attendance').insert(records)

            if (error) throw error

            toast.success('✨ Attendance saved successfully!')
            fetchExistingAttendance()
            loadCalendarData()
        } catch (error: any) {
            console.error('Error saving attendance:', error)
            toast.error('Failed to save attendance', error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleExport = async (format: 'pdf' | 'excel') => {
        if (!selectedClass || !selectedSection || students.length === 0) {
            toast.error('Please select class and section first')
            return
        }

        const className = classes.find(c => c.id === selectedClass)?.class_name || 'Unknown'
        const sectionName = sections.find(s => s.id === selectedSection)?.section_name || 'Unknown'

        // Fetch attendance records for each student (last 30 days)
        const reportStudents = await Promise.all(
            students.map(async (student) => {
                const records = await fetchStudentAttendanceRecords(
                    student.id,
                    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
                )
                const percentage = calculateAttendancePercentage(records)

                return {
                    name: student.name,
                    rollNumber: student.roll_number || 'N/A',
                    status: attendance[student.id] || 'Present',
                    attendance: `${percentage}%`
                }
            })
        )

        const reportData: AttendanceReportData = {
            title: isToday(selectedDate) ? "Today's Attendance Report" : `Attendance Report - ${formatDate(selectedDate)}`,
            date: formatDate(selectedDate),
            className,
            sectionName,
            students: reportStudents,
            summary: {
                total: students.length,
                present: Object.values(attendance).filter(s => s === 'present').length,
                absent: Object.values(attendance).filter(s => s === 'absent').length,
                late: Object.values(attendance).filter(s => s === 'late').length,
                leave: Object.values(attendance).filter(s => s === 'leave').length,
                percentage: students.length > 0
                    ? Math.round(((Object.values(attendance).filter(s => s === 'present' || s === 'late').length) / students.length) * 100)
                    : 0
            }
        }

        if (format === 'pdf') {
            await generateAttendancePDF(reportData)
        } else {
            exportAttendanceToExcel(reportData)
        }

        toast.success(`Report exported as ${format.toUpperCase()}`)
    }

    const filteredSections = sections.filter((s) => s.class_id === selectedClass)

    // Apply filters to students
    const filteredStudents = students.filter(student => {
        // Search filter
        const matchesSearch = searchQuery === '' ||
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())

        // Gender filter
        const matchesGender = genderFilter === '' || student.gender === genderFilter

        // Status filter
        const matchesStatus = statusFilter === '' || attendance[student.id] === statusFilter

        return matchesSearch && matchesGender && matchesStatus
    })

    const stats = {
        present: Object.values(attendance).filter((s) => s === 'present').length,
        absent: Object.values(attendance).filter((s) => s === 'absent').length,
        late: Object.values(attendance).filter((s) => s === 'late').length,
        leave: Object.values(attendance).filter((s) => s === 'leave').length,
        total: students.length,
        percentage: students.length > 0
            ? Math.round(((Object.values(attendance).filter(s => s === 'present' || s === 'late').length) / students.length) * 100)
            : 0
    }

    const quickDates = getQuickDatePresets()

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                        <CalendarIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold">Attendance Management</h1>
                                        <p className="text-purple-100 text-sm mt-1">
                                            {isToday(selectedDate) ? "Mark today's attendance" : `Viewing attendance for ${formatDate(selectedDate)}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => setShowCalendar(true)}
                                    variant="outline"
                                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                                >
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    Calendar View
                                </Button>
                                <div className="h-8 w-px bg-white/30" />
                                <Button
                                    onClick={() => handleExport('pdf')}
                                    variant="outline"
                                    disabled={students.length === 0}
                                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    PDF
                                </Button>
                                <Button
                                    onClick={() => handleExport('excel')}
                                    variant="outline"
                                    disabled={filteredStudents.length === 0}
                                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Excel
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAdvancedExport(true)}
                                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                >
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Advanced Export
                                </Button>
                                <div className="h-8 w-px bg-white/30" />
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || students.length === 0}
                                    className="bg-white text-purple-600 hover:bg-purple-50"
                                >
                                    <Save className="h-5 w-5 mr-2" />
                                    {saving ? 'Saving...' : 'Save Attendance'}
                                </Button>
                            </div>
                        </div>

                        {/* Quick Stats in Header */}
                        {students.length > 0 && (
                            <div className="grid grid-cols-5 gap-4 mt-6">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                    <p className="text-sm text-purple-100">Total</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-emerald-300">{stats.present}</p>
                                    <p className="text-sm text-purple-100">Present</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-red-300">{stats.absent}</p>
                                    <p className="text-sm text-purple-100">Absent</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-orange-300">{stats.late}</p>
                                    <p className="text-sm text-purple-100">Late</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-300">{stats.leave}</p>
                                    <p className="text-sm text-purple-100">Leave</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Decorative background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
                </div>

                {/* Modern Filters Panel */}
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-indigo-600" />
                            Filters & Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Main Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Date Picker */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Class Select */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Class</label>
                                <select
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                    value={selectedClass}
                                    onChange={(e) => {
                                        setSelectedClass(e.target.value)
                                        setSelectedSection('')
                                        setStudents([])
                                    }}
                                >
                                    <option value="">Select Class</option>
                                    {classes.map((cls) => (
                                        <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Section Select */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Section</label>
                                <select
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all disabled:opacity-50"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    disabled={!selectedClass}
                                >
                                    <option value="">Select Section</option>
                                    {filteredSections.map((section) => (
                                        <option key={section.id} value={section.id}>Section {section.section_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Student Search */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Search Student</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        placeholder="Name or roll number..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-11"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Date Shortcuts */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-700">Quick Dates:</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDate(quickDates.today)}
                                className={selectedDate === quickDates.today ? 'bg-indigo-50 border-indigo-300' : ''}
                            >
                                Today
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDate(quickDates.yesterday)}
                                className={selectedDate === quickDates.yesterday ? 'bg-indigo-50 border-indigo-300' : ''}
                            >
                                Yesterday
                            </Button>
                        </div>

                        {/* Filter Pills */}
                        {students.length > 0 && (
                            <div className="flex items-center gap-4 pt-4 border-t">
                                {/* Gender Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-700">Gender:</span>
                                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                        {['', 'male', 'female'].map((gender) => (
                                            <button
                                                key={gender}
                                                onClick={() => setGenderFilter(gender as any)}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${genderFilter === gender
                                                    ? 'bg-white shadow-sm text-indigo-600'
                                                    : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                            >
                                                {gender === '' ? 'All' : gender === 'male' ? 'Boys' : 'Girls'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-700">Status:</span>
                                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                        {(['', 'present', 'absent', 'late', 'leave'] as const).map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setStatusFilter(status as any)}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${statusFilter === status
                                                    ? 'bg-white shadow-sm text-indigo-600'
                                                    : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                            >
                                                {status === '' ? 'All' : status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bulk Actions */}
                        {students.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                                <span className="text-sm font-medium text-slate-700 mr-2">
                                    <Zap className="h-4 w-4 inline mr-1" />
                                    Bulk Actions:
                                </span>

                                <Button variant="outline" size="sm" onClick={() => handleMarkAll('present')} className="text-green-600 border-green-300">
                                    <Check className="h-4 w-4 mr-1" />
                                    All Present
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleMarkAll('absent')} className="text-red-600 border-red-300">
                                    <X className="h-4 w-4 mr-1" />
                                    All Absent
                                </Button>

                                <div className="h-6 w-px bg-slate-300" />

                                <Button variant="outline" size="sm" onClick={() => handleMarkByGender('male', 'present')}>
                                    Boys Present
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleMarkByGender('female', 'present')}>
                                    Girls Present
                                </Button>

                                <div className="h-6 w-px bg-slate-300" />

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const yesterday = new Date(selectedDate)
                                        yesterday.setDate(yesterday.getDate() - 1)
                                        handleCopyFromDate(yesterday.toISOString().split('T')[0])
                                    }}
                                >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy from Yesterday
                                </Button>

                                <Button variant="outline" size="sm" onClick={handleSaveTemplate}>
                                    Save as Template
                                </Button>

                                {Object.keys(savedTemplates).length > 0 && (
                                    <select
                                        className="h-9 px-3 rounded-md border border-slate-300 text-sm"
                                        onChange={(e) => e.target.value && handleLoadTemplate(e.target.value)}
                                        value=""
                                    >
                                        <option value="">Load Template</option>
                                        {Object.keys(savedTemplates).map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Students List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-600" />
                                Students ({filteredStudents.length})
                                {Object.keys(existingAttendance).length > 0 && (
                                    <Badge variant="success" className="ml-2">
                                        <Check className="h-3 w-3 mr-1" />
                                        Attendance Marked
                                    </Badge>
                                )}
                            </CardTitle>
                            {filteredStudents.length !== students.length && (
                                <p className="text-sm text-slate-500">
                                    Showing {filteredStudents.length} of {students.length} students
                                </p>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!selectedClass || !selectedSection ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CalendarIcon className="h-8 w-8 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Select Class & Section</h3>
                                <p className="text-slate-500">Please select a class and section to view students</p>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-16">
                                <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-lg font-semibold text-slate-700 mb-2">No students found</p>
                                <p className="text-slate-500 mb-4">
                                    {students.length === 0 ? (
                                        <>
                                            No students found in {classes.find(c => c.id === selectedClass)?.class_name}
                                            {selectedSection && ` - ${sections.find(s => s.id === selectedSection)?.section_name}`}
                                        </>
                                    ) : (
                                        'Try adjusting your filters'
                                    )}
                                </p>
                                {students.length === 0 && (
                                    <div className="inline-flex flex-col gap-2 text-left bg-blue-50 p-4 rounded-lg text-sm text-blue-700 max-w-md">
                                        <p className="font-semibold">💡 Possible reasons:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            <li>No students added to this class yet</li>
                                            <li>Students might be assigned to a different section</li>
                                            <li>Students might not have section assigned (check admissions)</li>
                                            <li>Students might be marked as inactive</li>
                                        </ul>
                                        <p className="text-xs mt-2">Check browser console (F12) for detailed logs</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredStudents.map((student) => {
                                    const isMale = student.gender === 'male'
                                    const currentStatus = attendance[student.id] || 'present'

                                    return (
                                        <div
                                            key={student.id}
                                            className="group bg-white border-2 border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-indigo-300 transition-all"
                                        >
                                            {/* Student Info */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <Avatar name={student.name} size="md" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900 truncate">{student.name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {student.roll_number ? `Roll #${student.roll_number}` : 'No Roll'}
                                                        <span className="mx-2">•</span>
                                                        {isMale ? '👦 Boy' : '👧 Girl'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudent(student)
                                                        setShowHistory(true)
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="View attendance history"
                                                >
                                                    <Eye className="h-5 w-5 text-indigo-600" />
                                                </button>
                                            </div>

                                            {/* Status Buttons */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['present', 'absent', 'late', 'leave'] as AttendanceStatus[]).map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleStatusChange(student.id, status)}
                                                        className={cn(
                                                            'px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                                                            currentStatus === status
                                                                ? status === 'present'
                                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                                                    : status === 'absent'
                                                                        ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                                                                        : status === 'late'
                                                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                                                                            : 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                                                                : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                                                        )}
                                                    >
                                                        {status === 'present' && <Check className="h-4 w-4 inline mr-1" />}
                                                        {status === 'absent' && <X className="h-4 w-4 inline mr-1" />}
                                                        {status === 'late' && <Clock className="h-4 w-4 inline mr-1" />}
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Attendance Percentage Progress */}
                {students.length > 0 && (
                    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Class Attendance Rate</p>
                                    <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.percentage}%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-600">
                                        {stats.present + stats.late} / {stats.total} students
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {stats.percentage >= 90 ? '🎉 Excellent!' : stats.percentage >= 75 ? '✅ Good' : '⚠️ Needs Improvement'}
                                    </p>
                                </div>
                            </div>
                            <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                                    style={{ width: `${stats.percentage}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modals */}
            {/* Calendar Modal */}
            <AttendanceCalendar
                open={showCalendar}
                onClose={() => setShowCalendar(false)}
                onDateSelect={(date) => setSelectedDate(date)}
                attendanceData={calendarData}
                className={classes.find(c => c.id === selectedClass)?.class_name}
                sectionName={sections.find(s => s.id === selectedSection)?.section_name}
            />

            {/* Student History Modal */}
            {selectedStudent && (
                <StudentAttendanceHistory
                    open={showHistory}
                    onClose={() => {
                        setShowHistory(false)
                        setSelectedStudent(null)
                    }}
                    studentId={selectedStudent.id}
                    studentName={selectedStudent.name}
                />
            )}

            {/* Advanced Export Modal */}
            <AdvancedExportModal
                open={showAdvancedExport}
                onClose={() => setShowAdvancedExport(false)}
                selectedClass={selectedClass}
                selectedSection={selectedSection}
                className={classes.find(c => c.id === selectedClass)?.class_name}
                sectionName={sections.find(s => s.id === selectedSection)?.section_name}
            />
        </DashboardLayout>
    )
}
