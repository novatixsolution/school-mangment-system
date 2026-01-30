'use client'

import { useEffect, useState } from 'react'
import { Plus, Download, Eye, Trash2, DollarSign, Filter, Search, FileText, Calendar, TrendingUp, Users, AlertCircle, AlertTriangle, CheckCircle2, Clock, Edit } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { Challan, ChallanFilters } from '@/types/challan'
import { formatCurrency } from '@/lib/utils'
import { getUnpaidStudents } from '@/lib/unpaid-students'
import { getCollectionStats, CollectionStats } from '@/lib/collection-analytics'
import { GenerateChallanModal } from '@/components/challans/GenerateChallanModal'
import { ChallanDetailsModal } from '@/components/challans/ChallanDetailsModal'
import { StudentsWithoutChallansModal } from '@/components/challans/StudentsWithoutChallansModal'
import { IndividualChallanModal } from '@/components/challans/IndividualChallanModal'
import { EditChallanModal } from '@/components/challans/EditChallanModal'
import { UnpaidStudentsModal } from '@/components/challans/UnpaidStudentsModal'
import { CollectionCalendarModal } from '@/components/challans/CollectionCalendarModal'

export default function ChallansPage() {
    const [challans, setChallans] = useState<Challan[]>([])
    const [loading, setLoading] = useState(true)
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [isStudentsWithoutChallansOpen, setIsStudentsWithoutChallansOpen] = useState(false)
    const [isIndividualChallanOpen, setIsIndividualChallanOpen] = useState(false)
    const [isEditChallanOpen, setIsEditChallanOpen] = useState(false)
    const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null)
    const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>()
    const [editChallanId, setEditChallanId] = useState<string | null>(null)
    const [isUnpaidStudentsOpen, setIsUnpaidStudentsOpen] = useState(false)
    const [isCollectionCalendarOpen, setIsCollectionCalendarOpen] = useState(false)
    const [filters, setFilters] = useState<ChallanFilters>({
        month: '',
        status: '',
        searchQuery: ''
    })
    const [selectedClass, setSelectedClass] = useState<string>('all')
    const [classes, setClasses] = useState<any[]>([])
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        paid: 0,
        overdue: 0,
        totalAmount: 0,
        paidAmount: 0,
        studentsWithoutChallans: 0,
        unpaidStudentsCount: 0,
        criticalUnpaidCount: 0
    })
    const [collectionStats, setCollectionStats] = useState<CollectionStats>({
        totalCollected: 0,
        monthlyCollection: 0,
        todayCollection: 0,
        weekCollection: 0,
        collectionRate: 0,
        avgDailyCollection: 0,
        totalChallans: 0,
        paidChallans: 0
    })

    useEffect(() => {
        fetchChallans()
        fetchClasses()
        fetchStudentsWithoutChallans()
        fetchUnpaidStats()
        fetchCollectionStats()
    }, [filters, selectedClass])

    const fetchChallans = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('fee_challans')
                .select(`
                    *,
                    student:students(
                        id,
                        name,
                        student_id,
                        roll_number,
                        class:classes(class_name)
                    )
                `)
                .order('created_at', { ascending: false })

            // Apply filters
            if (filters.month) {
                query = query.eq('month', filters.month)
            }
            if (filters.status) {
                query = query.eq('status', filters.status)
            }
            if (filters.searchQuery) {
                query = query.or(`challan_number.ilike.%${filters.searchQuery}%,student.name.ilike.%${filters.searchQuery}%`)
            }

            const { data, error } = await query

            if (error) throw error

            setChallans(data || [])
            calculateStats(data || [])
        } catch (error) {
            console.error('Error fetching challans:', error)
            toast.error('Failed to load challans')
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = (data: Challan[]) => {
        const total = data.length
        const pending = data.filter(c => c.status === 'pending').length
        const paid = data.filter(c => c.status === 'paid').length
        const overdue = data.filter(c => c.status === 'overdue').length
        const totalAmount = data.reduce((sum, c) => sum + c.total_amount, 0)
        const paidAmount = data.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.total_amount, 0)

        setStats(prev => ({ ...prev, total, pending, paid, overdue, totalAmount, paidAmount }))
    }

    const fetchClasses = async () => {
        try {
            const { data } = await supabase
                .from('classes')
                .select('id, class_name')
                .order('class_name')
            setClasses(data || [])
        } catch (error) {
            console.error('Error fetching classes:', error)
        }
    }

    const fetchStudentsWithoutChallans = async () => {
        try {
            const currentDate = new Date()
            const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

            // Get all active students
            const { data: allStudents } = await supabase
                .from('students')
                .select('id')
                .eq('status', 'active')

            // Get all challans for current month
            const { data: challans } = await supabase
                .from('fee_challans')
                .select('student_id')
                .eq('month', currentMonth)

            const challanStudentIds = new Set(challans?.map(c => c.student_id) || [])
            const studentsWithoutChallans = allStudents?.filter(s => !challanStudentIds.has(s.id)).length || 0

            setStats(prev => ({ ...prev, studentsWithoutChallans }))
        } catch (error) {
            console.error('Error fetching students without challans:', error)
        }
    }

    const fetchUnpaidStats = async () => {
        try {
            const result = await getUnpaidStudents()
            setStats(prev => ({
                ...prev,
                unpaidStudentsCount: result.students.length,
                criticalUnpaidCount: result.criticalCount
            }))
        } catch (error) {
            console.error('Error fetching unpaid stats:', error)
        }
    }

    const fetchCollectionStats = async () => {
        try {
            const stats = await getCollectionStats()
            setCollectionStats(stats)
        } catch (error) {
            console.error('Error fetching collection stats:', error)
        }
    }

    const handleMarkPaid = async (challanId: string) => {
        try {
            const { error } = await supabase
                .from('fee_challans')
                .update({
                    status: 'paid',
                    paid_date: new Date().toISOString()
                })
                .eq('id', challanId)

            if (error) throw error

            toast.success('Challan marked as paid')
            fetchChallans()
        } catch (error) {
            console.error('Error marking paid:', error)
            toast.error('Failed to update challan')
        }
    }

    const handleDelete = async (challanId: string) => {
        // Find the challan to delete
        const challan = challans.find(c => c.id === challanId)
        if (!challan) {
            toast.error('Challan not found')
            return
        }

        // Show appropriate confirmation message
        const confirmMessage = challan.status === 'paid'
            ? `⚠️ This challan is PAID (Rs ${challan.total_amount?.toLocaleString() || 0}). Deleting will remove the payment record. Continue?`
            : `Delete this ${challan.status} challan (Rs ${challan.total_amount?.toLocaleString() || 0})?`

        if (!confirm(confirmMessage)) return

        try {
            // If challan has a payment, we need to handle it carefully
            if (challan.payment_id) {
                console.log('Challan has payment record:', challan.payment_id)

                // Step 1: Set payment_id to null in challan to break the foreign key reference
                const { error: nullifyError } = await supabase
                    .from('fee_challans')
                    .update({ payment_id: null })
                    .eq('id', challanId)

                if (nullifyError) {
                    console.error('Error nullifying payment_id:', nullifyError)
                    throw new Error('Failed to update challan: ' + nullifyError.message)
                }

                // Step 2: Now delete the payment record
                console.log('Deleting payment record:', challan.payment_id)
                const { error: paymentError } = await supabase
                    .from('fee_payments')
                    .delete()
                    .eq('id', challan.payment_id)

                if (paymentError) {
                    console.error('Payment delete error:', paymentError)
                    throw new Error('Failed to delete payment record: ' + paymentError.message)
                }
            }

            // Now delete the challan
            console.log('Deleting challan:', challanId)
            const { error: challanError } = await supabase
                .from('fee_challans')
                .delete()
                .eq('id', challanId)

            if (challanError) {
                console.error('Challan delete error:', challanError)
                throw new Error('Failed to delete challan: ' + challanError.message)
            }

            // Success message based on status
            const successMessage = challan.status === 'paid'
                ? 'Paid challan and payment record deleted successfully'
                : 'Challan deleted successfully'

            toast.success(successMessage)
            await fetchChallans()
        } catch (error: any) {
            console.error('Error deleting challan:', error)
            toast.error(error.message || 'Failed to delete challan')
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { className: string; label: string }> = {
            pending: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
            paid: { className: 'bg-green-100 text-green-800 border-green-200', label: 'Paid' },
            overdue: { className: 'bg-red-100 text-red-800 border-red-200', label: 'Overdue' },
            cancelled: { className: 'bg-slate-100 text-slate-800 border-slate-200', label: 'Cancelled' }
        }

        const variant = variants[status] || variants.pending
        return (
            <Badge variant="default" className={variant.className}>
                {variant.label}
            </Badge>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Challan Management</h1>
                        <p className="text-sm text-slate-500 mt-1">Generate and track fee challans</p>
                    </div>
                    <Button onClick={() => setIsGenerateModalOpen(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Challans
                    </Button>
                </div>

                {/* Stats Cards - Enhanced with Gradients and Click Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total Challans */}
                    <Card className="border-2 border-indigo-200 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-indigo-50 to-blue-50">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-600">Total Challans</p>
                                    <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <FileText className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending */}
                    <Card
                        onClick={() => setFilters({ ...filters, status: 'pending' })}
                        className="border-2 border-yellow-200 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-yellow-50 to-orange-50"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-600">Pending</p>
                                    <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Paid - with percentage */}
                    <Card
                        onClick={() => setFilters({ ...filters, status: 'paid' })}
                        className="border-2 border-green-200 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-600">Paid</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold text-green-600 mt-1">{stats.paid}</p>
                                        <p className="text-xs font-semibold text-green-500">
                                            {stats.total > 0 ? `${Math.round((stats.paid / stats.total) * 100)}%` : '0%'}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Overdue */}
                    <Card
                        onClick={() => setFilters({ ...filters, status: 'overdue' })}
                        className="border-2 border-red-200 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-red-50 to-pink-50"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-600">Overdue</p>
                                    <p className="text-3xl font-bold text-red-600 mt-1">{stats.overdue}</p>
                                    {stats.overdue > 0 && (
                                        <p className="text-xs text-red-500 font-medium mt-1">⚠️ Urgent</p>
                                    )}
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <AlertCircle className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Students Without Challans - NEW! */}
                    <Card
                        onClick={() => setIsStudentsWithoutChallansOpen(true)}
                        className="border-2 border-orange-200 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-orange-50 to-amber-50"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-600">No Challans</p>
                                    <p className="text-3xl font-bold text-orange-600 mt-1">{stats.studentsWithoutChallans}</p>
                                    {stats.studentsWithoutChallans > 0 && (
                                        <p className="text-xs text-orange-500 font-medium mt-1">📝 Generate</p>
                                    )}
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Unpaid Students - NEW! */}
                    <Card
                        onClick={() => setIsUnpaidStudentsOpen(true)}
                        className="border-2 border-red-200 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-red-50 to-rose-50"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-600">Unpaid Students</p>
                                    <p className="text-3xl font-bold text-red-600 mt-1">{stats.unpaidStudentsCount}</p>
                                    {stats.criticalUnpaidCount > 0 && (
                                        <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {stats.criticalUnpaidCount} Critical
                                        </p>
                                    )}
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <AlertTriangle className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Collection Stats - Enhanced */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-slate-900">Collection Analytics</h3>
                        <Button
                            onClick={() => setIsCollectionCalendarOpen(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Collection Calendar
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        {/* Today's Collection */}
                        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-slate-600 mb-1">Today's Collection</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(collectionStats.todayCollection)}</p>
                            </CardContent>
                        </Card>

                        {/* This Week */}
                        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-slate-600 mb-1">This Week</p>
                                <p className="text-2xl font-bold text-blue-600">{formatCurrency(collectionStats.weekCollection)}</p>
                            </CardContent>
                        </Card>

                        {/* This Month */}
                        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-slate-600 mb-1">This Month</p>
                                <p className="text-2xl font-bold text-purple-600">{formatCurrency(collectionStats.monthlyCollection)}</p>
                            </CardContent>
                        </Card>

                        {/* Avg Daily */}
                        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-slate-600 mb-1">Avg Daily (30d)</p>
                                <p className="text-2xl font-bold text-orange-600">{formatCurrency(collectionStats.avgDailyCollection)}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Total Collected (All Time)</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold text-teal-600 mt-1">{formatCurrency(collectionStats.totalCollected)}</p>
                                        <p className="text-sm font-semibold text-teal-500">
                                            {collectionStats.collectionRate.toFixed(1)}% rate
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">{collectionStats.paidChallans} of {collectionStats.totalChallans} paid</p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <TrendingUp className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">Total Outstanding</p>
                                    <p className="text-3xl font-bold text-purple-600 mt-1">{formatCurrency(stats.totalAmount - stats.paidAmount)}</p>
                                    <p className="text-xs text-slate-600 mt-1">{stats.pending} pending challans</p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <DollarSign className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input
                                placeholder="Search by challan number or student..."
                                value={filters.searchQuery}
                                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                                className="col-span-2"
                            />
                            <Input
                                type="month"
                                value={filters.month}
                                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                            />
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="h-10 px-3 rounded-lg border-2 border-slate-200 bg-white text-sm"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Challans List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6 animate-pulse">
                            <FileText className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]"
                                style={{
                                    backgroundSize: '200% 100%',
                                    animation: 'shimmer 1.5s ease-in-out infinite',
                                }}
                            />
                        </div>
                        <p className="text-sm text-slate-500 mt-4">Loading challans...</p>
                    </div>
                ) : challans.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-4">
                                <FileText className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Challans Found</h3>
                            <p className="text-sm text-slate-500 mb-6">Start by generating challans for your students</p>
                            <Button onClick={() => setIsGenerateModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Generate Challans
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b-2 border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Challan #</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Month</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Due Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {challans.map((challan) => (
                                    <tr key={challan.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-mono text-sm font-semibold text-indigo-600">{challan.challan_number}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-slate-900">{(challan.student as any)?.name}</p>
                                                    {challan.is_first_challan && (
                                                        <span className="text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-0.5 rounded-full font-semibold">
                                                            🆕 FIRST
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">{(challan.student as any)?.class?.class_name} | Roll: {(challan.student as any)?.roll_number}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-700">{new Date(challan.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-lg font-bold text-green-700">{formatCurrency(challan.total_amount)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(challan.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600">{new Date(challan.due_date).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedChallan(challan)
                                                        setIsDetailsModalOpen(true)
                                                    }}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <FileText className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(`/owner/challans/print/${challan.id}`, '_blank')}
                                                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Print
                                                </Button>
                                                {challan.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditChallanId(challan.id)
                                                                setIsEditChallanOpen(true)
                                                            }}
                                                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                        >
                                                            <Edit className="h-4 w-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleMarkPaid(challan.id)}
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        >
                                                            <DollarSign className="h-4 w-4 mr-1" />
                                                            Mark Paid
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(challan.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Generate Modal */}
            <GenerateChallanModal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                onSuccess={() => {
                    fetchChallans()
                    fetchStudentsWithoutChallans()
                }}
            />

            {/* Challan Details Modal */}
            <ChallanDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false)
                    setSelectedChallan(null)
                }}
                challan={selectedChallan}
            />

            {/* Students Without Challans Modal - NEW! */}
            <StudentsWithoutChallansModal
                isOpen={isStudentsWithoutChallansOpen}
                onClose={() => setIsStudentsWithoutChallansOpen(false)}
                onGenerated={() => {
                    fetchChallans()
                    fetchStudentsWithoutChallans()
                }}
                onOpenIndividualModal={(studentId) => {
                    setSelectedStudentId(studentId)
                    setIsIndividualChallanOpen(true)
                }}
            />

            {/* Individual Challan Modal - NEW! */}
            <IndividualChallanModal
                isOpen={isIndividualChallanOpen}
                onClose={() => {
                    setIsIndividualChallanOpen(false)
                    setSelectedStudentId(undefined)
                }}
                studentId={selectedStudentId}
                onGenerated={() => {
                    fetchChallans()
                    fetchStudentsWithoutChallans()
                }}
            />

            {/* Edit Challan Modal - NEW! */}
            {editChallanId && (
                <EditChallanModal
                    isOpen={isEditChallanOpen}
                    onClose={() => {
                        setIsEditChallanOpen(false)
                        setEditChallanId(null)
                    }}
                    challanId={editChallanId}
                    onUpdated={() => {
                        fetchChallans()
                        setIsEditChallanOpen(false)
                        setEditChallanId(null)
                    }}
                />
            )}

            {/* Unpaid Students Modal - NEW! */}
            <UnpaidStudentsModal
                isOpen={isUnpaidStudentsOpen}
                onClose={() => setIsUnpaidStudentsOpen(false)}
                onUpdated={() => {
                    fetchChallans()
                    fetchUnpaidStats()
                }}
            />

            {/* Collection Calendar Modal - NEW! */}
            <CollectionCalendarModal
                isOpen={isCollectionCalendarOpen}
                onClose={() => setIsCollectionCalendarOpen(false)}
            />
        </DashboardLayout>
    )
}
