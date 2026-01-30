'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Eye, CheckCircle, XCircle, Clock, DollarSign, Check } from 'lucide-react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { Admission, AdmissionStatus } from '@/types/student'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface Student {
    id: string
    name: string
    custom_fee?: number
}

export default function AdmissionsPage() {
    const [admissions, setAdmissions] = useState<Admission[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<AdmissionStatus | 'all'>('all')
    const { hasPermission } = useAuth()

    // Set Fee Modal State
    const [isSetFeeModalOpen, setIsSetFeeModalOpen] = useState(false)
    const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [customFee, setCustomFee] = useState('')
    const [savingFee, setSavingFee] = useState(false)

    useEffect(() => {
        fetchAdmissions()
    }, [statusFilter])

    const fetchAdmissions = async () => {
        try {
            let query = supabase
                .from('admissions')
                .select('*, class:classes(id, class_name), section:sections(id, section_name)')
                .order('created_at', { ascending: false })

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter)
            }

            const { data, error } = await query

            if (error) throw error
            setAdmissions(data || [])
        } catch (error) {
            console.error('Error fetching admissions:', error)
            toast.error('Failed to load admissions')
        } finally {
            setLoading(false)
        }
    }

    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
    const [approvingAdmission, setApprovingAdmission] = useState<Admission | null>(null)
    const [approvalFee, setApprovalFee] = useState('')
    const [admissionFee, setAdmissionFee] = useState('')
    const [approving, setApproving] = useState(false)

    const handleApproveClick = (admission: Admission) => {
        setApprovingAdmission(admission)
        setApprovalFee('')
        setAdmissionFee('')
        setIsApproveModalOpen(true)
    }

    const handleApprove = async () => {
        if (!approvingAdmission || !hasPermission('admissions.approve')) {
            toast.error('You do not have permission to approve admissions')
            return
        }

        setApproving(true)

        try {
            // Update admission status
            const { error: admissionError } = await supabase
                .from('admissions')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                })
                .eq('id', approvingAdmission.id)

            if (admissionError) throw admissionError

            // Create student record with optional fees
            const studentData: any = {
                admission_id: approvingAdmission.id,
                class_id: approvingAdmission.class_id,
                section_id: approvingAdmission.section_id,
                name: approvingAdmission.student_name,
                dob: approvingAdmission.dob,
                gender: approvingAdmission.gender,
                photo_url: approvingAdmission.photo_url,
                father_name: approvingAdmission.father_name,
                father_phone: approvingAdmission.father_phone,
                status: 'active',
            }

            // Add fees if provided
            if (approvalFee && parseFloat(approvalFee) > 0) {
                studentData.custom_fee = parseFloat(approvalFee)
            }
            if (admissionFee && parseFloat(admissionFee) > 0) {
                studentData.admission_fee = parseFloat(admissionFee)
            }

            const { error: studentError } = await supabase
                .from('students')
                .insert(studentData)

            if (studentError) throw studentError

            toast.success('Admission approved and student created successfully!')
            setIsApproveModalOpen(false)
            setApprovingAdmission(null)
            fetchAdmissions()
        } catch (error: any) {
            console.error('Error approving admission:', error)
            toast.error('Failed to approve admission', error.message)
        } finally {
            setApproving(false)
        }
    }

    const handleReject = async (id: string) => {
        if (!hasPermission('admissions.reject')) {
            toast.error('You do not have permission to reject admissions')
            return
        }

        if (!confirm('Are you sure you want to reject this admission?')) return

        try {
            const { error } = await supabase
                .from('admissions')
                .update({ status: 'rejected' })
                .eq('id', id)

            if (error) throw error

            toast.success('Admission rejected')
            fetchAdmissions()
        } catch (error: any) {
            console.error('Error rejecting admission:', error)
            toast.error('Failed to reject admission', error.message)
        }
    }

    const openSetFeeModal = async (admission: Admission) => {
        setSelectedAdmission(admission)

        // Find the student record for this admission
        try {
            const { data: student } = await supabase
                .from('students')
                .select('id, name, custom_fee')
                .eq('admission_id', admission.id)
                .single()

            if (student) {
                setSelectedStudent(student)
                setCustomFee(student.custom_fee?.toString() || '')
            } else {
                toast.error('Student record not found. Please approve the admission first.')
                return
            }
        } catch (error) {
            toast.error('Could not find student record')
            return
        }

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
            const { error } = await supabase
                .from('students')
                .update({ custom_fee: fee })
                .eq('id', selectedStudent.id)

            if (error) throw error

            toast.success(`Monthly fee set to ${formatCurrency(fee)} for ${selectedStudent.name}`)
            setIsSetFeeModalOpen(false)
            setSelectedAdmission(null)
            setSelectedStudent(null)
            setCustomFee('')

        } catch (error: any) {
            console.error('Error setting fee:', error)
            toast.error('Failed to set fee', error.message)
        } finally {
            setSavingFee(false)
        }
    }

    const filteredAdmissions = admissions.filter(
        (a) =>
            a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.father_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = {
        total: admissions.length,
        pending: admissions.filter((a) => a.status === 'pending').length,
        approved: admissions.filter((a) => a.status === 'approved').length,
        rejected: admissions.filter((a) => a.status === 'rejected').length,
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Admissions</h1>
                        <p className="text-slate-500 mt-1">Manage student admissions</p>
                    </div>
                    {hasPermission('admissions.create') && (
                        <Link href="/owner/admissions/new">
                            <Button>
                                <Plus className="h-5 w-5 mr-2" />
                                New Admission
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-500">Total</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
                        <CardContent className="p-4">
                            <p className="text-sm text-amber-600">Pending</p>
                            <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
                        <CardContent className="p-4">
                            <p className="text-sm text-emerald-600">Approved</p>
                            <p className="text-2xl font-bold text-emerald-700">{stats.approved}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-50 to-red-100">
                        <CardContent className="p-4">
                            <p className="text-sm text-red-600">Rejected</p>
                            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Search by student or parent name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter(status)}
                                className="capitalize"
                            >
                                {status}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Admissions Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Father Name</th>
                                    <th>Class</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-16">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                                    <Clock className="h-8 w-8 text-indigo-600" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                                                    Loading admissions...
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
                                        </td>
                                    </tr>
                                ) : filteredAdmissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                    <Clock className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                                    {searchQuery ? 'No admissions found' : 'No admissions yet'}
                                                </h3>
                                                <p className="text-slate-500 text-sm mb-6 max-w-sm">
                                                    {searchQuery
                                                        ? 'Try adjusting your search or filter to find what you\'re looking for.'
                                                        : 'Start by adding your first student admission to get started with managing enrollments.'
                                                    }
                                                </p>
                                                {!searchQuery && hasPermission('admissions.create') && (
                                                    <Link href="/owner/admissions/new">
                                                        <Button>
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add First Admission
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAdmissions.map((admission) => (
                                        <tr key={admission.id}>
                                            <td>
                                                <div>
                                                    <p className="font-medium text-slate-900">{admission.student_name}</p>
                                                    <p className="text-sm text-slate-500">{admission.gender}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <p className="text-slate-900">{admission.father_name}</p>
                                                    <p className="text-sm text-slate-500">{admission.father_phone}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <p className="text-slate-900">
                                                    {admission.class?.class_name || '-'}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {admission.section?.section_name || '-'}
                                                </p>
                                            </td>
                                            <td>
                                                <Badge
                                                    variant={
                                                        admission.status === 'approved'
                                                            ? 'success'
                                                            : admission.status === 'rejected'
                                                                ? 'error'
                                                                : 'warning'
                                                    }
                                                >
                                                    {admission.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                                    {admission.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                    {admission.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                                    {admission.status}
                                                </Badge>
                                            </td>
                                            <td className="text-slate-500">
                                                {formatDate(admission.created_at)}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/owner/admissions/${admission.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>

                                                    {/* Set Fee Button - Only for approved admissions */}
                                                    {admission.status === 'approved' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openSetFeeModal(admission)}
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            title="Set Monthly Fee"
                                                        >
                                                            <DollarSign className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {admission.status === 'pending' && (
                                                        <>
                                                            {hasPermission('admissions.approve') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleApproveClick(admission)}
                                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {hasPermission('admissions.reject') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleReject(admission.id)}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Set Fee Modal */}
            <Modal
                isOpen={isSetFeeModalOpen}
                onClose={() => setIsSetFeeModalOpen(false)}
                title="Set Monthly Fee"
                size="sm"
            >
                {selectedAdmission && selectedStudent && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-sm text-slate-500">Student</p>
                            <p className="font-semibold text-slate-900">{selectedAdmission.student_name}</p>
                            <p className="text-sm text-slate-500 mt-1">
                                Father: {selectedAdmission.father_name}
                            </p>
                            <p className="text-sm text-slate-500">
                                Class: {selectedAdmission.class?.class_name}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Monthly Fee Amount (PKR)
                            </label>
                            <Input
                                type="number"
                                placeholder="Enter fee amount e.g. 5000"
                                value={customFee}
                                onChange={(e) => setCustomFee(e.target.value)}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                This fee will auto-fill when collecting payment and will be used for auto-generated challans.
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

            {/* Approve Admission Modal */}
            <Modal
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                title="Approve Admission"
                size="md"
            >
                {approvingAdmission && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                            <p className="text-sm text-green-600 font-medium mb-2">Student Details</p>
                            <p className="text-lg font-bold text-slate-900">{approvingAdmission.student_name}</p>
                            <p className="text-sm text-slate-600">
                                Father: {approvingAdmission.father_name}
                            </p>
                            <p className="text-sm text-slate-600">
                                Class: {approvingAdmission.class?.class_name} - {approvingAdmission.section?.section_name}
                            </p>
                        </div>

                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                            <p className="text-sm text-indigo-600 font-medium mb-3">💡 Set Fees Now (Optional)</p>
                            <p className="text-xs text-slate-600 mb-4">
                                You can set fees during approval to save time. Leave blank to set later.
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Monthly Fee (PKR)
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 2000 (Optional)"
                                        value={approvalFee}
                                        onChange={(e) => setApprovalFee(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Overrides class default fee
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Admission Fee (PKR)
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 5000 (Optional)"
                                        value={admissionFee}
                                        onChange={(e) => setAdmissionFee(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        One-time admission fee
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleApprove}
                                disabled={approving}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {approving ? 'Approving...' : (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve & Create Student
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    )
}
