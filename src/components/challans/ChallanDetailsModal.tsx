'use client'

import { useState } from 'react'
import { X, Printer } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Challan } from '@/types/challan'
import { formatCurrency } from '@/lib/utils'

interface ChallanDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    challan: Challan | null
}

export function ChallanDetailsModal({ isOpen, onClose, challan }: ChallanDetailsModalProps) {
    if (!challan) return null

    const monthYear = challan.month
        ? new Date(challan.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : ''

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB')
    }

    const handlePrint = () => {
        window.open(`/owner/challans/print/${challan.id}`, '_blank')
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
            <div className="space-y-4">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl -mt-6 -mx-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold">Fee Challan</h2>
                                {challan.is_first_challan && (
                                    <span className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
                                        🆕 FIRST CHALLAN - New Admission
                                    </span>
                                )}
                            </div>
                            <p className="text-indigo-100 text-sm mt-1">Payment Collection Form</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-indigo-200 uppercase">Challan No.</p>
                            <p className="text-2xl font-mono font-bold">{challan.challan_number}</p>
                        </div>
                    </div>
                </div>

                {/* Student & Date Info */}
                <div className="grid grid-cols-2 gap-6 px-6">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-semibold">Student Name</label>
                        <p className="text-lg font-semibold text-slate-900 mt-1">
                            {(challan.student as any)?.name || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-semibold">Class / Roll No</label>
                        <p className="text-lg font-semibold text-slate-900 mt-1">
                            {(challan.student as any)?.class?.class_name || '—'} / {(challan.student as any)?.roll_number || '—'}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-semibold">Month</label>
                        <p className="text-lg font-semibold text-slate-900 mt-1">{monthYear}</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-semibold">Due Date</label>
                        <p className="text-lg font-semibold text-red-600 mt-1">{formatDate(challan.due_date)}</p>
                    </div>
                </div>

                {/* Fee Breakdown Table */}
                <div className="px-6">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase mb-3">Fee Breakdown</h3>
                    <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-100 border-b-2 border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Amount (PKR)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {challan.monthly_fee > 0 && (
                                    <tr>
                                        <td className="px-6 py-3 text-sm text-slate-700">Monthly Tuition & Fees</td>
                                        <td className="px-6 py-3 text-sm text-right font-medium text-slate-900">
                                            {formatCurrency(challan.monthly_fee)}
                                        </td>
                                    </tr>
                                )}
                                {challan.exam_fee > 0 && (
                                    <tr>
                                        <td className="px-6 py-3 text-sm text-slate-700">Examination Fee</td>
                                        <td className="px-6 py-3 text-sm text-right font-medium text-slate-900">
                                            {formatCurrency(challan.exam_fee)}
                                        </td>
                                    </tr>
                                )}
                                {challan.admission_fee > 0 && (
                                    <tr>
                                        <td className="px-6 py-3 text-sm text-slate-700">Admission Fee</td>
                                        <td className="px-6 py-3 text-sm text-right font-medium text-slate-900">
                                            {formatCurrency(challan.admission_fee)}
                                        </td>
                                    </tr>
                                )}
                                {challan.other_fees > 0 && (
                                    <tr>
                                        <td className="px-6 py-3 text-sm text-slate-700">Other Fees</td>
                                        <td className="px-6 py-3 text-sm text-right font-medium text-slate-900">
                                            {formatCurrency(challan.other_fees)}
                                        </td>
                                    </tr>
                                )}
                                {(challan.previous_balance ?? 0) > 0 && (
                                    <tr className="bg-orange-50">
                                        <td className="px-6 py-3 text-sm font-semibold text-orange-700">
                                            Previous Balance (Unpaid)
                                        </td>
                                        <td className="px-6 py-3 text-sm text-right font-bold text-orange-700">
                                            {formatCurrency(challan.previous_balance!)}
                                        </td>
                                    </tr>
                                )}
                                {challan.discount > 0 && (
                                    <tr className="bg-green-50">
                                        <td className="px-6 py-3 text-sm font-semibold text-green-700">
                                            Discount / Scholarship
                                        </td>
                                        <td className="px-6 py-3 text-sm text-right font-bold text-green-700">
                                            -{formatCurrency(challan.discount)}
                                        </td>
                                    </tr>
                                )}
                                <tr className="bg-gradient-to-r from-indigo-600 to-purple-600">
                                    <td className="px-6 py-4 text-sm font-bold text-white uppercase">
                                        Total Payable Amount
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-3xl font-bold text-white">
                                            {formatCurrency(challan.total_amount)}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-semibold">Payment Status</label>
                            <div className="mt-2">
                                {challan.status === 'paid' && (
                                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 border-2 border-green-200">
                                        ✓ Paid on {challan.paid_date ? formatDate(challan.paid_date) : 'N/A'}
                                    </span>
                                )}
                                {challan.status === 'pending' && (
                                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border-2 border-yellow-200">
                                        ⏳ Payment Pending
                                    </span>
                                )}
                                {challan.status === 'overdue' && (
                                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-800 border-2 border-red-200">
                                        ⚠ Overdue
                                    </span>
                                )}
                            </div>
                        </div>
                        {challan.notes && (
                            <div className="max-w-sm">
                                <label className="text-xs text-slate-500 uppercase font-semibold">Notes</label>
                                <p className="text-sm text-slate-600 mt-1 italic">{challan.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div className="px-6 py-4 bg-slate-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Payment Instructions:</h4>
                    <ul className="text-xs text-slate-600 space-y-1">
                        <li>• Payment can be made at school office during business hours</li>
                        <li>• Please bring this challan when making payment</li>
                        <li>• Late payment may result in additional charges</li>
                        <li>• For queries, contact school administration</li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 px-6 pb-4 border-t pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        onClick={handlePrint}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600"
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Challan
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
