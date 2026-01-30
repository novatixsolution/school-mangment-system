import { useState, useEffect } from 'react'
import { X, Edit, DollarSign, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { updateChallan } from '@/lib/challan-updater'

interface Props {
    isOpen: boolean
    onClose: () => void
    challanId: string
    onUpdated: () => void
}

export function EditChallanModal({ isOpen, onClose, challanId, onUpdated }: Props) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [challan, setChallan] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    // Editable fields
    const [monthlyFee, setMonthlyFee] = useState(0)
    const [admissionFee, setAdmissionFee] = useState(0)
    const [examFee, setExamFee] = useState(0)
    const [otherFees, setOtherFees] = useState(0)
    const [discount, setDiscount] = useState(0)
    const [month, setMonth] = useState('')
    const [dueDate, setDueDate] = useState('')

    useEffect(() => {
        if (isOpen && challanId) {
            fetchChallanData()
        }
    }, [isOpen, challanId])

    const fetchChallanData = async () => {
        try {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('fee_challans')
                .select(`
                    *,
                    student:students(name, roll_number, class:classes(class_name))
                `)
                .eq('id', challanId)
                .single()

            if (fetchError) throw fetchError

            if (!data) {
                throw new Error('Challan not found')
            }

            // Check if challan can be edited
            if (data.status !== 'pending') {
                setError(`Cannot edit ${data.status} challan. Only pending challans can be edited.`)
                return
            }

            setChallan(data)

            // Set editable fields
            setMonthlyFee(data.monthly_fee || 0)
            setAdmissionFee(data.admission_fee || 0)
            setExamFee(data.exam_fee || 0)
            setOtherFees(data.other_fees || 0)
            setDiscount(data.discount || 0)
            setMonth(data.month || '')
            setDueDate(data.due_date || '')

        } catch (err: any) {
            console.error('Error fetching challan:', err)
            setError(err.message || 'Failed to load challan')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!challan) return

        try {
            setSaving(true)
            setError(null)

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('User not authenticated')
            }

            // Update challan
            const result = await updateChallan({
                challanId: challan.id,
                monthlyFee,
                admissionFee,
                examFee,
                otherFees,
                discount,
                month,
                dueDate,
                userId: user.id
            })

            if (!result.success) {
                throw new Error(result.error || 'Failed to update challan')
            }

            console.log('✅ Challan updated successfully')
            onUpdated()
            onClose()

        } catch (err: any) {
            console.error('Error updating challan:', err)
            setError(err.message || 'Failed to update challan')
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    const totalAmount = monthlyFee + admissionFee + examFee + otherFees - discount
    const hasChanges = challan && (
        monthlyFee !== challan.monthly_fee ||
        admissionFee !== challan.admission_fee ||
        examFee !== challan.exam_fee ||
        otherFees !== challan.other_fees ||
        discount !== challan.discount ||
        month !== challan.month ||
        dueDate !== challan.due_date
    )

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Edit className="h-6 w-6" />
                            <div>
                                <h2 className="text-xl font-bold">Edit Challan</h2>
                                {challan && (
                                    <p className="text-sm text-purple-100">
                                        {challan.challan_number} • {challan.student?.name}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 text-slate-600">Loading challan...</p>
                    </div>
                ) : error ? (
                    <div className="p-8">
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={onClose} variant="outline">Close</Button>
                        </div>
                    </div>
                ) : challan ? (
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            {/* Student Info */}
                            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                                <h3 className="font-semibold text-slate-900 mb-2 text-sm">Student Information</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-slate-600">Name:</span>
                                        <span className="ml-2 font-medium">{challan.student?.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Class:</span>
                                        <span className="ml-2 font-medium">{challan.student?.class?.class_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Roll No:</span>
                                        <span className="ml-2 font-medium">{challan.student?.roll_number}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-600">Status:</span>
                                        <span className="ml-2 font-medium capitalize">{challan.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Month & Due Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        <Calendar className="inline h-4 w-4 mr-1" />
                                        Month
                                    </label>
                                    <input
                                        type="month"
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Fee Breakdown */}
                            <div className="border-2 border-purple-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-purple-600" />
                                    Fee Breakdown
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                        <label className="text-sm font-medium text-slate-700">Monthly Tuition Fee</label>
                                        <input
                                            type="number"
                                            value={monthlyFee}
                                            onChange={(e) => setMonthlyFee(parseFloat(e.target.value) || 0)}
                                            className="w-28 px-3 py-2 text-sm border rounded-lg text-right focus:ring-2 focus:ring-purple-500"
                                            min="0"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                        <label className="text-sm font-medium text-slate-700">Admission Fee</label>
                                        <input
                                            type="number"
                                            value={admissionFee}
                                            onChange={(e) => setAdmissionFee(parseFloat(e.target.value) || 0)}
                                            className="w-28 px-3 py-2 text-sm border rounded-lg text-right focus:ring-2 focus:ring-purple-500"
                                            min="0"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                        <label className="text-sm font-medium text-slate-700">Exam Fee</label>
                                        <input
                                            type="number"
                                            value={examFee}
                                            onChange={(e) => setExamFee(parseFloat(e.target.value) || 0)}
                                            className="w-28 px-3 py-2 text-sm border rounded-lg text-right focus:ring-2 focus:ring-purple-500"
                                            min="0"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                        <label className="text-sm font-medium text-slate-700">Other Fees (Lab, Sports, etc.)</label>
                                        <input
                                            type="number"
                                            value={otherFees}
                                            onChange={(e) => setOtherFees(parseFloat(e.target.value) || 0)}
                                            className="w-28 px-3 py-2 text-sm border rounded-lg text-right focus:ring-2 focus:ring-purple-500"
                                            min="0"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-300 bg-orange-50">
                                        <label className="text-sm font-medium text-orange-900">Discount</label>
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                            className="w-28 px-3 py-2 text-sm border rounded-lg text-right focus:ring-2 focus:ring-orange-500"
                                            min="0"
                                        />
                                    </div>

                                    {/* Total */}
                                    <div className="pt-3 border-t-2 border-purple-400 bg-gradient-to-r from-purple-100 to-indigo-100 -mx-4 -mb-4 px-4 pb-4 mt-4 rounded-b-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-900">Total Amount</span>
                                            <span className="text-2xl font-bold text-purple-600">
                                                {formatCurrency(Math.max(0, totalAmount))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Changes Indicator */}
                            {hasChanges && (
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                    <p className="text-sm text-blue-900 font-medium">You have unsaved changes</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* Footer */}
                {!loading && !error && challan && (
                    <div className="border-t p-5 bg-slate-50">
                        <div className="flex gap-3 justify-end">
                            <Button
                                onClick={onClose}
                                variant="outline"
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                                disabled={saving || !hasChanges}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
