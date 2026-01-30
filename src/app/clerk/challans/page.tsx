'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText, Plus, Search, Printer, Eye, Ban } from 'lucide-react'
import { generateChallan, getStudentFeeBreakdown } from '@/lib/fee-utils'
import { ChallanPrint } from '@/components/fees/ChallanPrint'
import { format } from 'date-fns'

interface Student {
    id: string
    name: string
    father_name: string
    roll_number: string
    class_id: string
    class?: {
        id: string
        class_name: string
    }
}

interface Challan {
    id: string
    challan_number: string
    student_id: string
    month: string
    monthly_fee: number
    exam_fee: number
    admission_fee: number
    other_fees: number
    discount: number
    total_amount: number
    status: 'pending' | 'paid' | 'overdue' | 'cancelled'
    due_date: string
    paid_date?: string
    created_at: string
    student?: Student
}

export default function ChallansPage() {
    const { profile } = useAuth()
    const [challans, setChallans] = useState<Challan[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [includeExamFee, setIncludeExamFee] = useState(false)
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [studentSearch, setStudentSearch] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [viewChallan, setViewChallan] = useState<any>(null)
    const [filterStatus, setFilterStatus] = useState<string>('all')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch challans
            const { data: challansData, error: challansError } = await supabase
                .from('fee_challans')
                .select(`
                    *,
                    student:students(
                        id, name, father_name, roll_number,
                        class:classes(id, class_name)
                    )
                `)
                .order('created_at', { ascending: false })

            if (challansError) throw challansError
            setChallans(challansData || [])

            // Fetch students
            const { data: studentsData, error: studentsError } = await supabase
                .from('students')
                .select('*, class:classes(id, class_name)')
                .eq('status', 'active')
                .order('name')

            if (studentsError) throw studentsError
            setStudents(studentsData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const filteredStudents = students.filter(s => {
        const query = studentSearch.toLowerCase()
        return (
            s.name.toLowerCase().includes(query) ||
            s.father_name?.toLowerCase().includes(query) ||
            s.roll_number?.toLowerCase().includes(query)
        )
    })

    const handleGenerateChallan = async () => {
        if (!selectedStudent || !profile?.id) return

        setGenerating(true)
        try {
            const result = await generateChallan(
                selectedStudent.id,
                selectedMonth,
                profile.id,
                includeExamFee
            )

            if (!result.success) throw new Error('Failed to generate challan')

            toast.success('Challan generated successfully!')
            setIsGenerateModalOpen(false)
            resetForm()
            fetchData()
        } catch (error: any) {
            console.error('Error generating challan:', error)
            toast.error('Failed to generate challan', error.message)
        } finally {
            setGenerating(false)
        }
    }

    const resetForm = () => {
        setSelectedStudent(null)
        setStudentSearch('')
        setSelectedMonth(format(new Date(), 'yyyy-MM'))
        setIncludeExamFee(false)
    }

    const handleViewChallan = async (challan: Challan) => {
        // Format challan for print component
        const printData = {
            challan_number: challan.challan_number,
            student: {
                name: challan.student?.name || '',
                father_name: challan.student?.father_name || '',
                roll_number: challan.student?.roll_number || '',
                class_name: challan.student?.class?.class_name || ''
            },
            month: challan.month,
            monthly_fee: challan.monthly_fee,
            exam_fee: challan.exam_fee,
            admission_fee: challan.admission_fee,
            other_fees: challan.other_fees,
            discount: challan.discount,
            total_amount: challan.total_amount,
            due_date: challan.due_date,
            generated_date: challan.created_at,
            status: challan.status
        }
        setViewChallan(printData)
    }

    const handleCancelChallan = async (challanId: string) => {
        if (!confirm('Are you sure you want to cancel this challan?')) return

        try {
            const { error } = await supabase
                .from('fee_challans')
                .update({ status: 'cancelled' })
                .eq('id', challanId)

            if (error) throw error

            toast.success('Challan cancelled')
            fetchData()
        } catch (error) {
            console.error('Error cancelling challan:', error)
            toast.error('Failed to cancel challan')
        }
    }

    const filteredChallans = challans.filter(c =>
        filterStatus === 'all' || c.status === filterStatus
    )

    const stats = {
        total: challans.length,
        pending: challans.filter(c => c.status === 'pending').length,
        paid: challans.filter(c => c.status === 'paid').length,
        overdue: challans.filter(c => c.status === 'overdue').length
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Fee Challans</h1>
                        <p className="text-slate-500 mt-1">Generate and manage student fee challans</p>
                    </div>
                    <Button
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Generate Challan
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-100">
                                    <FileText className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                                    <p className="text-sm text-slate-500">Total Challans</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-100">
                                    <FileText className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                                    <p className="text-sm text-slate-500">Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100">
                                    <FileText className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{stats.paid}</p>
                                    <p className="text-sm text-slate-500">Paid</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-100">
                                    <FileText className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{stats.overdue}</p>
                                    <p className="text-sm text-slate-500">Overdue</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex gap-2">
                            {['all', 'pending', 'paid', 'overdue', 'cancelled'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Challans List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Challans List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : filteredChallans.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p>No challans found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Challan #</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Student</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Month</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Amount</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Due Date</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredChallans.map((challan) => (
                                            <tr key={challan.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="py-3 px-4">
                                                    <span className="font-mono text-sm">{challan.challan_number}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="font-medium text-slate-900">{challan.student?.name}</p>
                                                    <p className="text-sm text-slate-500">{challan.student?.class?.class_name}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {format(new Date(challan.month + '-01'), 'MMM yyyy')}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-slate-900">
                                                    {formatCurrency(challan.total_amount)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge
                                                        variant={
                                                            challan.status === 'paid' ? 'success' :
                                                                challan.status === 'pending' ? 'warning' :
                                                                    challan.status === 'overdue' ? 'error' : 'default'
                                                        }
                                                    >
                                                        {challan.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {formatDate(challan.due_date)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleViewChallan(challan)}
                                                            className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="View & Print"
                                                        >
                                                            <Eye className="h-4 w-4 text-indigo-600" />
                                                        </button>
                                                        {challan.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleCancelChallan(challan.id)}
                                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Cancel"
                                                            >
                                                                <Ban className="h-4 w-4 text-red-600" />
                                                            </button>
                                                        )}
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

            {/* Generate Challan Modal */}
            <Modal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                title="Generate Fee Challan"
                size="lg"
            >
                <div className="space-y-4">
                    {/* Student Search */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Select Student
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                className="w-full h-11 pl-10 pr-4 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:outline-none"
                                placeholder="Search student..."
                                value={studentSearch}
                                onChange={(e) => {
                                    setStudentSearch(e.target.value)
                                    setShowSuggestions(true)
                                }}
                                onFocus={() => setShowSuggestions(true)}
                            />
                        </div>

                        {/* Suggestions */}
                        {showSuggestions && studentSearch && !selectedStudent && (
                            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto">
                                {filteredStudents.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500">No students found</div>
                                ) : (
                                    filteredStudents.slice(0, 10).map((student) => (
                                        <button
                                            key={student.id}
                                            onClick={() => {
                                                setSelectedStudent(student)
                                                setStudentSearch(`${student.name} / ${student.father_name}`)
                                                setShowSuggestions(false)
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b last:border-0"
                                        >
                                            <p className="font-medium">{student.name}</p>
                                            <p className="text-sm text-slate-500">
                                                {student.class?.class_name} | Roll: {student.roll_number}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {selectedStudent && (
                        <div className="p-4 bg-indigo-50 rounded-lg">
                            <p className="text-sm text-indigo-600 font-medium">Selected Student</p>
                            <p className="font-semibold text-slate-900">{selectedStudent.name}</p>
                            <p className="text-sm text-slate-600">
                                {selectedStudent.class?.class_name} | Roll: {selectedStudent.roll_number}
                            </p>
                        </div>
                    )}

                    {/* Month */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Fee Month
                        </label>
                        <input
                            type="month"
                            className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:outline-none"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>

                    {/* Include Exam Fee */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="includeExam"
                            checked={includeExamFee}
                            onChange={(e) => setIncludeExamFee(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <label htmlFor="includeExam" className="text-sm text-slate-700">
                            Include Exam Fee
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGenerateChallan}
                            disabled={!selectedStudent || generating}
                        >
                            {generating ? 'Generating...' : 'Generate Challan'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Print Challan */}
            {viewChallan && (
                <ChallanPrint
                    challan={viewChallan}
                    onClose={() => setViewChallan(null)}
                />
            )}
        </DashboardLayout>
    )
}
