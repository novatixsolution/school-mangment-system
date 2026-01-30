'use client'

import { useRef } from 'react'
import { X, Printer } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { format } from 'date-fns'

interface ChallanData {
    challan_number: string
    student: {
        name: string
        father_name: string
        roll_number: string
        class_name: string
    }
    month: string
    monthly_fee: number
    exam_fee: number
    admission_fee: number
    other_fees: number
    discount: number
    total_amount: number
    due_date: string
    generated_date: string
    status: 'pending' | 'paid'
}

interface ChallanPrintProps {
    challan: ChallanData | null
    onClose: () => void
    onPrint?: () => void
    schoolName?: string
}

export function ChallanPrint({ challan, onClose, onPrint, schoolName = 'EduManager School' }: ChallanPrintProps) {
    const printRef = useRef<HTMLDivElement>(null)

    if (!challan) return null

    const handlePrint = () => {
        window.print()
        onPrint?.()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header Actions (Don't Print) */}
                <div className="flex items-center justify-between p-4 border-b print:hidden">
                    <h3 className="text-lg font-semibold text-slate-900">Fee Challan</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Challan */}
                <div ref={printRef} className="p-8 print:p-12">
                    {/* Header */}
                    <div className="text-center mb-8 print:mb-12">
                        <h1 className="text-3xl font-bold text-slate-900 mb-1">{schoolName}</h1>
                        <p className="text-sm text-slate-600 mb-4">School Management System</p>
                        <div className="inline-block px-6 py-2 bg-indigo-100 rounded-full">
                            <p className="text-lg font-bold text-indigo-900">FEE CHALLAN</p>
                        </div>
                    </div>

                    {/* Challan Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b-2 border-slate-200">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Challan Number</p>
                            <p className="text-lg font-bold text-slate-900">{challan.challan_number}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 mb-1">Issue Date</p>
                            <p className="text-sm font-medium text-slate-900">
                                {formatDate(challan.generated_date)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Fee Month</p>
                            <p className="text-sm font-medium text-slate-900">
                                {format(new Date(challan.month + '-01'), 'MMMM yyyy')}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 mb-1">Due Date</p>
                            <p className="text-sm font-medium text-red-600">
                                {formatDate(challan.due_date)}
                            </p>
                        </div>
                    </div>

                    {/* Student Info */}
                    <div className="mb-8 p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-3">STUDENT INFORMATION</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Student Name</p>
                                <p className="text-base font-semibold text-slate-900">{challan.student.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Father Name</p>
                                <p className="text-base font-medium text-slate-700">{challan.student.father_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Class</p>
                                <p className="text-base font-medium text-slate-700">{challan.student.class_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Roll Number</p>
                                <p className="text-base font-medium text-slate-700">{challan.student.roll_number}</p>
                            </div>
                        </div>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="mb-8">
                        <p className="text-xs text-slate-500 mb-4">FEE BREAKDOWN</p>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-slate-300">
                                    <th className="text-left py-2 text-sm font-semibold text-slate-700">Description</th>
                                    <th className="text-right py-2 text-sm font-semibold text-slate-700">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {challan.monthly_fee > 0 && (
                                    <tr className="border-b border-slate-200">
                                        <td className="py-3 text-slate-700">Monthly Tuition Fee</td>
                                        <td className="py-3 text-right font-medium text-slate-900">
                                            {formatCurrency(challan.monthly_fee)}
                                        </td>
                                    </tr>
                                )}
                                {challan.exam_fee > 0 && (
                                    <tr className="border-b border-slate-200">
                                        <td className="py-3 text-slate-700">Examination Fee</td>
                                        <td className="py-3 text-right font-medium text-slate-900">
                                            {formatCurrency(challan.exam_fee)}
                                        </td>
                                    </tr>
                                )}
                                {challan.admission_fee > 0 && (
                                    <tr className="border-b border-slate-200">
                                        <td className="py-3 text-slate-700">Admission Fee (One Time)</td>
                                        <td className="py-3 text-right font-medium text-slate-900">
                                            {formatCurrency(challan.admission_fee)}
                                        </td>
                                    </tr>
                                )}
                                {challan.other_fees > 0 && (
                                    <tr className="border-b border-slate-200">
                                        <td className="py-3 text-slate-700">Other Fees</td>
                                        <td className="py-3 text-right font-medium text-slate-900">
                                            {formatCurrency(challan.other_fees)}
                                        </td>
                                    </tr>
                                )}
                                {challan.discount > 0 && (
                                    <tr className="border-b border-slate-200">
                                        <td className="py-3 text-red-600">Discount / Scholarship</td>
                                        <td className="py-3 text-right font-medium text-red-600">
                                            - {formatCurrency(challan.discount)}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-300">
                                    <td className="py-4 text-base font-bold text-slate-900">TOTAL AMOUNT PAYABLE</td>
                                    <td className="py-4 text-right text-2xl font-bold text-indigo-600">
                                        {formatCurrency(challan.total_amount)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-6 text-center">
                        <span className={`inline-block px-6 py-2 rounded-full text-sm font-semibold ${challan.status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {challan.status === 'paid' ? '✓ PAID' : 'PENDING PAYMENT'}
                        </span>
                    </div>

                    {/* Payment Instructions */}
                    <div className="p-4 bg-slate-50 rounded-lg mb-6">
                        <p className="text-xs text-slate-500 mb-2">PAYMENT INSTRUCTIONS</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                            <li>• Please pay the fee on or before the due date to avoid late fee charges</li>
                            <li>• Payment can be made in cash, bank transfer, or online</li>
                            <li>• Keep this challan for your records</li>
                            <li>• For queries, contact the school office</li>
                        </ul>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                        <p>This is a computer-generated challan and does not require a signature</p>
                        <p className="mt-1">Generated on {formatDate(challan.generated_date)}</p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:p-12, .print\\:p-12 * {
                        visibility: visible;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    @page {
                        margin: 1cm;
                    }
                }
            `}</style>
        </div>
    )
}
