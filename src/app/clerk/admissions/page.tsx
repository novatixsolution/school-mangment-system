'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Eye, DollarSign, Check, UserMinus, GraduationCap, XCircle, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { Admission } from '@/types/student'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Student {
    id: string
    name: string
    custom_fee?: number
    status: string
}

export default function ClerkAdmissionsPage() {
    const [admissions, setAdmissions] = useState<Admission[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Set Fee Modal
    const [isSetFeeModalOpen, setIsSetFeeModalOpen] = useState(false)
    const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [customFee, setCustomFee] = useState('')
    const [savingFee, setSavingFee] = useState(false)

    // Status Modal
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
    const [savingStatus, setSavingStatus] = useState(false)

    useEffect(() => {
        fetchAdmissions()
    }, [])

    const fetchAdmissions = async () => {
        try {
            const { data, error } = await supabase
                .from('admissions')
                .select('*, class:classes(id, class_name), section:sections(id, section_name)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setAdmissions(data || [])
        } catch (error) {
            console.error('Error fetching admissions:', error)
            toast.error('Failed to load admissions')
        } finally {
            setLoading(false)
        }
    }

    const filteredAdmissions = admissions.filter(
        (a) =>
            a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.father_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Open Set Fee Modal
    const openSetFeeModal = async (admission: Admission) => {
        if (admission.status !== 'approved') {
            toast.error('Only approved admissions can have fee set')
            return
        }

        setSelectedAdmission(admission)

        try {
            const { data: student, error } = await supabase
                .from('students')
                .select('id, name, custom_fee, status')
                .eq('admission_id', admission.id)
                .maybeSingle()

            if (error) {
                console.error('Database error:', error)
                toast.error('Database error while fetching student')
                return
            }

            if (student) {
                setSelectedStudent(student)
                setCustomFee(student.custom_fee?.toString() || '')
                setIsSetFeeModalOpen(true)
            } else {
                toast.error('Student record not found. Please approve the admission first.')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load student record')
        }
    }

    // Handle Set Fee
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

            toast.success(`Monthly fee set to ${formatCurrency(fee)}`)
            setIsSetFeeModalOpen(false)
            setSelectedAdmission(null)
            setSelectedStudent(null)
            setCustomFee('')
        } catch (error: any) {
            toast.error('Failed to set fee', error.message)
        } finally {
            setSavingFee(false)
        }
    }

    // Open Status Modal
    const openStatusModal = async (admission: Admission) => {
        if (admission.status !== 'approved') {
            toast.error('Only approved admissions can change status')
            return
        }

        setSelectedAdmission(admission)

        try {
            const { data: student, error } = await supabase
                .from('students')
                .select('id, name, custom_fee, status')
                .eq('admission_id', admission.id)
                .maybeSingle()

            if (error) {
                console.error('Database error:', error)
                toast.error('Database error while fetching student')
                return
            }

            if (student) {
                setSelectedStudent(student)
                setIsStatusModalOpen(true)
            } else {
                toast.error('Student record not found. Please approve the admission first.')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load student record')
        }
    }

    // Handle Status Change
    const handleStatusChange = async (newStatus: string) => {
        if (!selectedStudent) return

        setSavingStatus(true)

        try {
            const { error } = await supabase
                .from('students')
                .update({ status: newStatus })
                .eq('id', selectedStudent.id)

            if (error) throw error

            toast.success(`Student status changed to ${newStatus}`)
            setIsStatusModalOpen(false)
            setSelectedAdmission(null)
            setSelectedStudent(null)
        } catch (error: any) {
            toast.error('Failed to update status', error.message)
        } finally {
            setSavingStatus(false)
        }
    }

    const statusOptions = [
        { value: 'active', label: 'Active', icon: Check, color: 'text-green-600 bg-green-50 hover:bg-green-100' },
        { value: 'inactive', label: 'Inactive', icon: XCircle, color: 'text-gray-600 bg-gray-50 hover:bg-gray-100' },
        { value: 'passed', label: 'Passed Out', icon: GraduationCap, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
        { value: 'left', label: 'Left School', icon: UserMinus, color: 'text-red-600 bg-red-50 hover:bg-red-100' },
    ]

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Admissions</h1>
                        <p className="text-slate-500 mt-1">Manage student admissions</p>
                    </div>
                    <Link href="/clerk/admissions/new">
                        <Button>
                            <Plus className="h-5 w-5 mr-2" />
                            New Admission
                        </Button>
                    </Link>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search admissions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12"
                    />
                </div>

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
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={6}>
                                                <div className="h-12 bg-slate-100 rounded animate-pulse" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredAdmissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-slate-500">
                                            No admissions found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAdmissions.map((admission) => (
                                        <tr key={admission.id}>
                                            <td>
                                                <p className="font-medium text-slate-900">{admission.student_name}</p>
                                            </td>
                                            <td>{admission.father_name}</td>
                                            <td>{admission.class?.class_name || '-'}</td>
                                            <td>
                                                <Badge
                                                    variant={
                                                        admission.status === 'approved' ? 'success' :
                                                            admission.status === 'rejected' ? 'error' : 'warning'
                                                    }
                                                >
                                                    {admission.status}
                                                </Badge>
                                            </td>
                                            <td>{formatDate(admission.created_at)}</td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    {/* View Button */}
                                                    <Link href={`/clerk/admissions/${admission.id}`}>
                                                        <Button variant="ghost" size="sm" title="View Details">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>

                                                    {/* Set Fee Button - Only for approved */}
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

                                                    {/* Status Change Button - Only for approved */}
                                                    {admission.status === 'approved' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openStatusModal(admission)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            title="Change Student Status"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
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
                                This fee will auto-fill in fee collection and auto-generated challans.
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

            {/* Status Change Modal */}
            <Modal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                title="Change Student Status"
                size="sm"
            >
                {selectedAdmission && selectedStudent && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-sm text-slate-500">Student</p>
                            <p className="font-semibold text-slate-900">{selectedAdmission.student_name}</p>
                            <p className="text-sm text-slate-500 mt-1">
                                Current Status: <Badge variant="success">{selectedStudent.status}</Badge>
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                                Select New Status
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {statusOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleStatusChange(option.value)}
                                        disabled={savingStatus || selectedStudent.status === option.value}
                                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${option.color} ${selectedStudent.status === option.value ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                                    >
                                        <option.icon className="h-5 w-5" />
                                        <span className="font-medium">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    )
}
