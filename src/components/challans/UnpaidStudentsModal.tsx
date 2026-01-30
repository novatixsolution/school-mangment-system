import { useState, useEffect } from 'react'
import { X, AlertTriangle, DollarSign, Eye, CheckCircle2, Download, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { getUnpaidStudents, markStudentPaid, UnpaidStudent } from '@/lib/unpaid-students'

interface Props {
    isOpen: boolean
    onClose: () => void
    onUpdated?: () => void
}

export function UnpaidStudentsModal({ isOpen, onClose, onUpdated }: Props) {
    const [loading, setLoading] = useState(false)
    const [students, setStudents] = useState<UnpaidStudent[]>([])
    const [totalUnpaid, setTotalUnpaid] = useState(0)
    const [criticalCount, setCriticalCount] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClass, setSelectedClass] = useState<string>('all')

    useEffect(() => {
        if (isOpen) {
            fetchUnpaidStudents()
        }
    }, [isOpen])

    const fetchUnpaidStudents = async () => {
        setLoading(true)
        try {
            const result = await getUnpaidStudents()
            setStudents(result.students)
            setTotalUnpaid(result.totalUnpaid)
            setCriticalCount(result.criticalCount)
        } catch (error) {
            console.error('Error fetching unpaid students:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkPaid = async (studentId: string, studentName: string) => {
        if (!confirm(`Mark all pending challans as PAID for ${studentName}?`)) {
            return
        }

        try {
            const result = await markStudentPaid(studentId)
            if (result.success) {
                alert(`✅ All challans marked as paid for ${studentName}`)
                fetchUnpaidStudents()
                onUpdated?.()
            } else {
                alert(`❌ Error: ${result.error}`)
            }
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`)
        }
    }

    const handleExport = () => {
        // Prepare CSV data
        const headers = ['Name', 'Class', 'Roll No', 'Student ID', 'Pending Challans', 'Total Unpaid', 'Days Overdue']
        const rows = filteredStudents.map(s => [
            s.name,
            s.class_name,
            s.roll_number,
            s.student_id || 'N/A',
            s.pending_challans_count,
            s.total_unpaid,
            s.days_overdue
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n')

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `unpaid_students_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    if (!isOpen) return null

    // Filter students by search and class
    const filteredStudents = students.filter(student => {
        const matchesSearch = !searchQuery ||
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.student_id?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesClass = selectedClass === 'all' || student.class_id === selectedClass

        return matchesSearch && matchesClass
    })

    // Group by class
    const studentsByClass = filteredStudents.reduce((acc, student) => {
        if (!acc[student.class_name]) {
            acc[student.class_name] = []
        }
        acc[student.class_name].push(student)
        return acc
    }, {} as Record<string, UnpaidStudent[]>)

    // Get unique classes for filter
    const classes = Array.from(new Set(students.map(s => ({ id: s.class_id, name: s.class_name }))))
        .sort((a, b) => a.name.localeCompare(b.name))

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-7 w-7" />
                            <div>
                                <h2 className="text-2xl font-bold">Unpaid Students</h2>
                                <p className="text-sm text-red-100 mt-1">
                                    {students.length} student{students.length !== 1 ? 's' : ''} with pending payments
                                    {criticalCount > 0 && (
                                        <span className="ml-2 bg-red-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {criticalCount} Critical ({'>'}30 days)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 border-b-2 border-red-200">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-3 border-2 border-red-200">
                            <p className="text-xs text-slate-600 mb-1">Total Students</p>
                            <p className="text-2xl font-bold text-slate-900">{filteredStudents.length}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border-2 border-orange-200">
                            <p className="text-xs text-slate-600 mb-1">Total Unpaid</p>
                            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalUnpaid)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border-2 border-red-300">
                            <p className="text-xs text-slate-600 mb-1">Critical Cases</p>
                            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b bg-slate-50">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, roll number, or student ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                                />
                            </div>
                        </div>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                        >
                            <option value="all">All Classes</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                        <Button
                            onClick={handleExport}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Students List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="mt-4 text-slate-600">Loading unpaid students...</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="p-12 text-center">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                {students.length === 0 ? 'All Clear!' : 'No Results'}
                            </h3>
                            <p className="text-slate-600">
                                {students.length === 0
                                    ? 'No students have pending payments.'
                                    : 'No students match your search criteria.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {Object.entries(studentsByClass).map(([className, classStudents]) => (
                                <div key={className}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Users className="h-5 w-5 text-red-600" />
                                        <h3 className="font-bold text-slate-900">{className}</h3>
                                        <span className="text-sm text-slate-500">({classStudents.length})</span>
                                    </div>
                                    <div className="space-y-2">
                                        {classStudents.map(student => (
                                            <div
                                                key={student.id}
                                                className={`p-4 rounded-lg border-2 transition-all ${student.days_overdue > 30
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-orange-200 bg-orange-50/50 hover:bg-orange-50'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h4 className="font-bold text-slate-900">{student.name}</h4>
                                                            {student.days_overdue > 30 && (
                                                                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                                                    URGENT
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-5 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-slate-600">Roll:</span>
                                                                <span className="ml-1 font-medium">{student.roll_number}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600">Student ID:</span>
                                                                <span className="ml-1 font-medium">{student.student_id || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600">Pending:</span>
                                                                <span className="ml-1 font-bold text-orange-600">
                                                                    {student.pending_challans_count} challan{student.pending_challans_count !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600">Total:</span>
                                                                <span className="ml-1 font-bold text-red-600">
                                                                    {formatCurrency(student.total_unpaid)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600">Overdue:</span>
                                                                <span className={`ml-1 font-bold ${student.days_overdue > 30 ? 'text-red-600' : 'text-orange-600'
                                                                    }`}>
                                                                    {student.days_overdue} days
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => window.open(`/owner/students/${student.id}`, '_blank')}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleMarkPaid(student.id, student.name)}
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                                            Mark Paid
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-4 bg-slate-50 flex justify-between items-center">
                    <p className="text-sm text-slate-600">
                        Showing {filteredStudents.length} of {students.length} students
                    </p>
                    <Button onClick={onClose} variant="outline">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    )
}
