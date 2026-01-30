'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from './DateRangePicker'
import { Download, FileText, FileSpreadsheet, User, Users, School } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'

interface Student {
    id: string
    name: string
    roll_number?: string
}

interface AdvancedExportModalProps {
    open: boolean
    onClose: () => void
    selectedClass?: string
    selectedSection?: string
    className?: string
    sectionName?: string
}

type ExportScope = 'student' | 'class' | 'school'
type ExportFormat = 'pdf' | 'excel'

export function AdvancedExportModal({
    open,
    onClose,
    selectedClass,
    selectedSection,
    className,
    sectionName
}: AdvancedExportModalProps) {
    const [scope, setScope] = useState<ExportScope>('class')
    const [format, setFormat] = useState<ExportFormat>('excel')
    const [dateMode, setDateMode] = useState<'single' | 'range'>('range')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [students, setStudents] = useState<Student[]>([])
    const [selectedStudent, setSelectedStudent] = useState('')
    const [exporting, setExporting] = useState(false)
    const [recordCount, setRecordCount] = useState(0)

    useEffect(() => {
        if (scope === 'student' && selectedClass) {
            fetchStudents()
        }
    }, [scope, selectedClass])

    useEffect(() => {
        if (open) {
            estimateRecordCount()
        }
    }, [scope, selectedStudent, selectedClass, startDate, endDate, open])

    const fetchStudents = async () => {
        if (!selectedClass) return

        let query = supabase
            .from('students')
            .select('id, name, roll_number')
            .eq('class_id', selectedClass)
            .eq('status', 'active')
            .order('name')

        if (selectedSection) {
            query = query.eq('section_id', selectedSection)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching students:', error)
            return
        }

        setStudents(data || [])
        if (data && data.length > 0) {
            setSelectedStudent(data[0].id)
        }
    }

    const estimateRecordCount = async () => {
        try {
            let query = supabase
                .from('attendance')
                .select('id', { count: 'exact', head: true })
                .gte('date', startDate)
                .lte('date', endDate)

            if (scope === 'student' && selectedStudent) {
                query = query.eq('student_id', selectedStudent)
            } else if (scope === 'class' && selectedClass) {
                query = query.eq('class_id', selectedClass)
                if (selectedSection) {
                    query = query.eq('section_id', selectedSection)
                }
            }

            const { count, error } = await query

            if (!error) {
                setRecordCount(count || 0)
            }
        } catch (error) {
            console.error('Error estimating count:', error)
        }
    }

    const handleExport = async () => {
        if (scope === 'student' && !selectedStudent) {
            toast.error('Please select a student')
            return
        }

        if (scope === 'class' && (!selectedClass || !selectedSection)) {
            toast.error('Please select class and section from the main page')
            return
        }

        setExporting(true)

        try {
            // Import export functions dynamically
            const exportLib = await import('@/lib/attendance-export-advanced')

            if (scope === 'student') {
                const studentData = students.find(s => s.id === selectedStudent)
                if (format === 'excel') {
                    await exportLib.exportStudentAttendanceRange(
                        selectedStudent,
                        studentData?.name || 'Student',
                        startDate,
                        endDate
                    )
                } else {
                    await exportLib.generateStudentAttendancePDF(
                        selectedStudent,
                        studentData?.name || 'Student',
                        startDate,
                        endDate
                    )
                }
            } else if (scope === 'class') {
                if (format === 'excel') {
                    await exportLib.exportClassAttendanceRange(
                        selectedClass!,
                        selectedSection!,
                        className || 'Class',
                        sectionName || 'Section',
                        startDate,
                        endDate
                    )
                } else {
                    await exportLib.generateClassAttendancePDF(
                        selectedClass!,
                        selectedSection!,
                        className || 'Class',
                        sectionName || 'Section',
                        startDate,
                        endDate
                    )
                }
            } else if (scope === 'school') {
                if (format === 'excel') {
                    await exportLib.exportSchoolAttendanceRange(startDate, endDate)
                } else {
                    await exportLib.generateSchoolAttendancePDF(startDate, endDate)
                }
            }

            toast.success('Export completed successfully!')
            onClose()
        } catch (error: any) {
            console.error('Export error:', error)
            toast.error('Export failed: ' + error.message)
        } finally {
            setExporting(false)
        }
    }

    return (
        <Modal isOpen={open} onClose={onClose} title="Advanced Export Options" size="lg">
            <div className="space-y-6">
                {/* Export Scope */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Export Scope
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setScope('student')}
                            className={`p-4 rounded-lg border-2 transition-all ${scope === 'student'
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <User className={`h-6 w-6 mx-auto mb-2 ${scope === 'student' ? 'text-indigo-600' : 'text-slate-400'
                                }`} />
                            <div className="text-sm font-medium text-slate-900">Single Student</div>
                            <div className="text-xs text-slate-500 mt-1">Full history</div>
                        </button>

                        <button
                            onClick={() => setScope('class')}
                            className={`p-4 rounded-lg border-2 transition-all ${scope === 'class'
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <Users className={`h-6 w-6 mx-auto mb-2 ${scope === 'class' ? 'text-indigo-600' : 'text-slate-400'
                                }`} />
                            <div className="text-sm font-medium text-slate-900">Full Class</div>
                            <div className="text-xs text-slate-500 mt-1">All students</div>
                        </button>

                        <button
                            onClick={() => setScope('school')}
                            className={`p-4 rounded-lg border-2 transition-all ${scope === 'school'
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <School className={`h-6 w-6 mx-auto mb-2 ${scope === 'school' ? 'text-indigo-600' : 'text-slate-400'
                                }`} />
                            <div className="text-sm font-medium text-slate-900">Whole School</div>
                            <div className="text-xs text-slate-500 mt-1">Summary</div>
                        </button>
                    </div>
                </div>

                {/* Student Selection (if scope is student) */}
                {scope === 'student' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Select Student
                        </label>
                        <select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        >
                            {students.length === 0 ? (
                                <option>No students available</option>
                            ) : (
                                students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.name} {student.roll_number ? `(${student.roll_number})` : ''}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                )}

                {/* Date Range Picker */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Date Range
                    </label>
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onRangeChange={(start, end) => {
                            setStartDate(start)
                            setEndDate(end)
                        }}
                        mode={dateMode}
                        onModeChange={setDateMode}
                    />
                </div>

                {/* Export Format */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Export Format
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setFormat('excel')}
                            className={`p-4 rounded-lg border-2 transition-all ${format === 'excel'
                                ? 'border-green-500 bg-green-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <FileSpreadsheet className={`h-6 w-6 mx-auto mb-2 ${format === 'excel' ? 'text-green-600' : 'text-slate-400'
                                }`} />
                            <div className="text-sm font-medium text-slate-900">Excel / CSV</div>
                            <div className="text-xs text-slate-500 mt-1">Spreadsheet format</div>
                        </button>

                        <button
                            onClick={() => setFormat('pdf')}
                            className={`p-4 rounded-lg border-2 transition-all ${format === 'pdf'
                                ? 'border-red-500 bg-red-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <FileText className={`h-6 w-6 mx-auto mb-2 ${format === 'pdf' ? 'text-red-600' : 'text-slate-400'
                                }`} />
                            <div className="text-sm font-medium text-slate-900">PDF Report</div>
                            <div className="text-xs text-slate-500 mt-1">Print-ready</div>
                        </button>
                    </div>
                </div>

                {/* Preview Info */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm">
                        <div className="font-semibold text-blue-900 mb-2">Export Preview:</div>
                        <div className="space-y-1 text-blue-800">
                            <div>📊 <strong>Scope:</strong> {
                                scope === 'student' ? `Single student (${students.find(s => s.id === selectedStudent)?.name || 'Select student'})` :
                                    scope === 'class' ? `${className || 'Class'} - ${sectionName || 'Section'}` :
                                        'Whole school summary'
                            }</div>
                            <div>📅 <strong>Period:</strong> {startDate === endDate ? startDate : `${startDate} to ${endDate}`}</div>
                            <div>📄 <strong>Format:</strong> {format.toUpperCase()}</div>
                            <div>📈 <strong>Est. Records:</strong> {recordCount} attendance records</div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={exporting}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={exporting || (scope === 'student' && !selectedStudent)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {exporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
