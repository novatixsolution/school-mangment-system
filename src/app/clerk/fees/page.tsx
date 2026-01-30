'use client'

import { useEffect, useState, useRef } from 'react'
import { Search, DollarSign, Plus, Check, Users, X } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { getStudentFeeBreakdown } from '@/lib/fee-utils'

interface Student {
    id: string
    name: string
    father_name: string
    roll_number: string
    class_id: string
    section_id: string
    custom_fee?: number
    class?: { id: string; class_name: string }
    section?: { id: string; section_name: string }
}

interface Class {
    id: string
    class_name: string
}

interface FeePayment {
    id: string
    student_id: string
    amount: number
    payment_method: string
    payment_date: string
    received_by: string
    notes?: string
    student?: Student
}

interface FeeBreakdown {
    monthlyFee: number
    examFee: number
    admissionFee: number
    discount: number
    baseFee: number
    total: number
}

export default function ClerkFeesPage() {
    const { profile } = useAuth()
    const [classes, setClasses] = useState<Class[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [recentPayments, setRecentPayments] = useState<FeePayment[]>([])
    const [loading, setLoading] = useState(true)

    // Pay Fee Modal State
    const [isPayModalOpen, setIsPayModalOpen] = useState(false)
    const [selectedClass, setSelectedClass] = useState('')
    const [studentSearch, setStudentSearch] = useState('')
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('cash')
    const [paymentNotes, setPaymentNotes] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null)

    const searchRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        // Close suggestions when clicking outside
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchData = async () => {
        try {
            // Fetch classes
            const { data: classesData } = await supabase
                .from('classes')
                .select('id, class_name')
                .eq('status', 'active')
                .order('class_name')

            setClasses(classesData || [])

            // Fetch all students with custom_fee
            const { data: studentsData } = await supabase
                .from('students')
                .select('*, class:classes(id, class_name), section:sections(id, section_name)')
                .eq('status', 'active')
                .order('name')

            setStudents(studentsData || [])

            // Fetch recent payments
            const { data: paymentsData } = await supabase
                .from('fee_payments')
                .select('*, student:students(id, name, father_name, class:classes(class_name))')
                .order('created_at', { ascending: false })
                .limit(20)

            setRecentPayments(paymentsData || [])

        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    // Filter students based on class and search
    const filteredStudents = students.filter(s => {
        const matchesClass = !selectedClass || s.class_id === selectedClass
        const searchLower = studentSearch.toLowerCase()
        const matchesSearch = !studentSearch ||
            s.name.toLowerCase().includes(searchLower) ||
            s.father_name?.toLowerCase().includes(searchLower) ||
            s.roll_number?.toLowerCase().includes(searchLower)
        return matchesClass && matchesSearch
    })

    const handleSelectStudent = async (student: Student) => {
        setSelectedStudent(student)
        setStudentSearch(`${student.name} / ${student.father_name}`)
        setShowSuggestions(false)

        // Get complete fee breakdown
        const breakdown = await getStudentFeeBreakdown(student.id)
        setFeeBreakdown(breakdown)

        // Auto-fill with monthly fee
        setPaymentAmount(breakdown.monthlyFee.toString())
    }

    const fetchDefaultFee = async (classId: string) => {
        try {
            const { data } = await supabase
                .from('fee_structures')
                .select('amount')
                .eq('class_id', classId)
                .eq('fee_type', 'Tuition Fee')
                .single()

            if (data) {
                setPaymentAmount(data.amount.toString())
            }
        } catch (error) {
            console.log('No default fee found')
        }
    }

    const handlePayFee = async () => {
        if (!selectedStudent) {
            toast.error('Please select a student')
            return
        }
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        setSubmitting(true)

        try {
            // Insert payment
            const { data: paymentData, error: paymentError } = await supabase
                .from('fee_payments')
                .insert({
                    student_id: selectedStudent.id,
                    amount: parseFloat(paymentAmount),
                    payment_method: paymentMethod,
                    payment_date: new Date().toISOString(),
                    received_by: profile?.id,
                    notes: paymentNotes || null
                })
                .select()
                .single()

            if (paymentError) throw paymentError

            // Check for pending challans and mark as paid
            const { data: pendingChallans } = await supabase
                .from('fee_challans')
                .select('id')
                .eq('student_id', selectedStudent.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(1)

            if (pendingChallans && pendingChallans.length > 0) {
                // Mark the oldest pending challan as paid
                await supabase
                    .from('fee_challans')
                    .update({
                        status: 'paid',
                        paid_date: new Date().toISOString(),
                        payment_id: paymentData.id
                    })
                    .eq('id', pendingChallans[0].id)
            }

            toast.success(`Payment of ${formatCurrency(parseFloat(paymentAmount))} recorded for ${selectedStudent.name}`)

            // Reset form
            resetPayForm()
            setIsPayModalOpen(false)
            fetchData()

        } catch (error: any) {
            console.error('Payment error:', error)
            toast.error('Failed to record payment', error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const resetPayForm = () => {
        setSelectedClass('')
        setStudentSearch('')
        setSelectedStudent(null)
        setPaymentAmount('')
        setPaymentMethod('cash')
        setPaymentNotes('')
    }

    const openPayModal = () => {
        resetPayForm()
        setIsPayModalOpen(true)
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Fee Collection</h1>
                        <p className="text-slate-500 mt-1">Collect and manage student fees</p>
                    </div>
                    <Button onClick={openPayModal} className="bg-gradient-to-r from-green-600 to-emerald-600">
                        <Plus className="h-5 w-5 mr-2" />
                        Pay Fee
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100">Today's Collection</p>
                                    <p className="text-3xl font-bold mt-1">
                                        {formatCurrency(recentPayments
                                            .filter(p => new Date(p.payment_date).toDateString() === new Date().toDateString())
                                            .reduce((sum, p) => sum + p.amount, 0)
                                        )}
                                    </p>
                                </div>
                                <DollarSign className="h-12 w-12 text-green-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-500">Total Students</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">{students.length}</p>
                                </div>
                                <Users className="h-12 w-12 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-500">Recent Payments</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">{recentPayments.length}</p>
                                </div>
                                <Check className="h-12 w-12 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Payments Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Payments</CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Class</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={5}>
                                                <div className="h-12 bg-slate-100 rounded animate-pulse" />
                                            </td>
                                        </tr>
                                    ))
                                ) : recentPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-slate-500">
                                            No payments recorded yet
                                        </td>
                                    </tr>
                                ) : (
                                    recentPayments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>
                                                <p className="font-medium text-slate-900">{payment.student?.name}</p>
                                                <p className="text-sm text-slate-500">{payment.student?.father_name}</p>
                                            </td>
                                            <td>{payment.student?.class?.class_name}</td>
                                            <td className="font-semibold text-green-600">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                            <td>
                                                <Badge variant="default">{payment.payment_method}</Badge>
                                            </td>
                                            <td>{formatDate(payment.payment_date)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Pay Fee Modal */}
            <Modal
                isOpen={isPayModalOpen}
                onClose={() => setIsPayModalOpen(false)}
                title="Pay Fee"
                size="lg"
            >
                <div className="space-y-4">
                    {/* Class Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Select Class
                        </label>
                        <select
                            className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900"
                            value={selectedClass}
                            onChange={(e) => {
                                setSelectedClass(e.target.value)
                                setSelectedStudent(null)
                                setStudentSearch('')
                                setPaymentAmount('')
                            }}
                        >
                            <option value="">All Classes</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Student Search with Autocomplete */}
                    <div ref={searchRef} className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Search Student
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                className="w-full h-11 pl-10 pr-10 rounded-lg border-2 border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
                                placeholder="Type student name or father's name..."
                                value={studentSearch}
                                onChange={(e) => {
                                    setStudentSearch(e.target.value)
                                    setShowSuggestions(true)
                                    if (!e.target.value) setSelectedStudent(null)
                                }}
                                onFocus={() => setShowSuggestions(true)}
                            />
                            {selectedStudent && (
                                <button
                                    onClick={() => {
                                        setSelectedStudent(null)
                                        setStudentSearch('')
                                        setPaymentAmount('')
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && studentSearch && !selectedStudent && (
                            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-60 overflow-y-auto">
                                {filteredStudents.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500">
                                        No students found
                                    </div>
                                ) : (
                                    filteredStudents.slice(0, 10).map((student) => (
                                        <button
                                            key={student.id}
                                            onClick={() => handleSelectStudent(student)}
                                            className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-slate-100 last:border-0"
                                        >
                                            <p className="font-medium text-slate-900">
                                                {student.name}
                                                <span className="text-slate-400 font-normal"> / {student.father_name}</span>
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {student.class?.class_name} - {student.section?.section_name} | Roll: {student.roll_number}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Selected Student Info */}
                    {selectedStudent && (
                        <>
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                                <p className="text-sm text-indigo-600 font-medium">Selected Student</p>
                                <p className="text-lg font-bold text-slate-900">{selectedStudent.name}</p>
                                <p className="text-sm text-slate-600">
                                    Father: {selectedStudent.father_name} |
                                    Class: {selectedStudent.class?.class_name} |
                                    Roll: {selectedStudent.roll_number}
                                </p>
                            </div>

                            {/* Fee Breakdown */}
                            {feeBreakdown && feeBreakdown.baseFee > 0 && (
                                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                    <p className="text-sm text-green-600 font-medium mb-2">Fee Breakdown</p>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Base Monthly Fee:</span>
                                            <span className="font-medium text-slate-900">{formatCurrency(feeBreakdown.baseFee)}</span>
                                        </div>
                                        {feeBreakdown.discount > 0 && (
                                            <div className="flex justify-between text-red-600">
                                                <span>Discount:</span>
                                                <span className="font-medium">- {formatCurrency(feeBreakdown.discount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-1 border-t border-green-300">
                                            <span className="font-semibold text-slate-900">Total:</span>
                                            <span className="font-bold text-green-700">{formatCurrency(feeBreakdown.monthlyFee)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Payment Amount */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Payment Amount (PKR)
                        </label>
                        <Input
                            type="number"
                            placeholder="Enter amount"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Payment Method
                        </label>
                        <select
                            className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="online">Online</option>
                            <option value="easypaisa">Easypaisa</option>
                            <option value="jazzcash">JazzCash</option>
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Notes (Optional)
                        </label>
                        <textarea
                            className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:outline-none"
                            rows={2}
                            placeholder="Any additional notes..."
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsPayModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePayFee}
                            disabled={submitting || !selectedStudent || !paymentAmount}
                            className="bg-gradient-to-r from-green-600 to-emerald-600"
                        >
                            {submitting ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Record Payment
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    )
}
