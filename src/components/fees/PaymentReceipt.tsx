'use client'

import { useRef } from 'react'
import { X, Printer, CheckCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PaymentReceiptData {
    receipt_number: string
    student_name: string
    father_name: string
    class_name: string
    roll_number: string
    amount: number
    payment_method: string
    payment_date: string
    received_by_name: string
    notes?: string
}

interface PaymentReceiptProps {
    receipt: PaymentReceiptData | null
    onClose: () => void
    schoolName?: string
}

export function PaymentReceipt({ receipt, onClose, schoolName = 'EduManager School' }: PaymentReceiptProps) {
    if (!receipt) return null

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header Actions (Don't Print) */}
                <div className="flex items-center justify-between p-4 border-b print:hidden">
                    <h3 className="text-lg font-semibold text-slate-900">Payment Receipt</h3>
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

                {/* Printable Receipt */}
                <div className="p-8 print:p-12">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">{schoolName}</h1>
                        <p className="text-sm text-slate-600 mb-4">School Fee Payment Receipt</p>
                        <div className="inline-block px-6 py-2 bg-green-100 rounded-full">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <p className="text-sm font-bold text-green-900">PAYMENT RECEIVED</p>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b-2 border-slate-200">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Receipt Number</p>
                            <p className="text-base font-bold text-slate-900">{receipt.receipt_number}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 mb-1">Payment Date</p>
                            <p className="text-sm font-medium text-slate-900">
                                {formatDate(receipt.payment_date)}
                            </p>
                        </div>
                    </div>

                    {/* Student Info */}
                    <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-3">STUDENT INFORMATION</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-slate-500">Student Name</p>
                                <p className="text-sm font-semibold text-slate-900">{receipt.student_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Father Name</p>
                                <p className="text-sm font-medium text-slate-700">{receipt.father_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Class</p>
                                <p className="text-sm font-medium text-slate-700">{receipt.class_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Roll Number</p>
                                <p className="text-sm font-medium text-slate-700">{receipt.roll_number}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="mb-6">
                        <p className="text-xs text-slate-500 mb-4">PAYMENT DETAILS</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm font-medium text-slate-700">Payment Method</span>
                                <span className="text-sm font-semibold text-slate-900 capitalize">
                                    {receipt.payment_method}
                                </span>
                            </div>

                            {receipt.notes && (
                                <div className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm font-medium text-slate-700">Notes</span>
                                    <span className="text-sm text-slate-600 text-right max-w-xs">
                                        {receipt.notes}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 mt-4">
                                <span className="text-base font-bold text-slate-900">Amount Paid</span>
                                <span className="text-2xl font-bold text-green-700">
                                    {formatCurrency(receipt.amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Received By */}
                    <div className="mb-6 p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Received By</span>
                            <span className="text-sm font-medium text-slate-900">{receipt.received_by_name}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                        <p className="font-medium text-slate-700 mb-2">✓ This is an official receipt</p>
                        <p>Please keep this receipt for your records</p>
                        <p className="mt-3">Generated on {formatDate(receipt.payment_date)}</p>
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
