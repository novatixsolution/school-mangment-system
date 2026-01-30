'use client'

import { Challan } from '@/types/challan'
import { Student } from '@/types/student'
import { formatCurrency } from '@/lib/utils'

interface ChallanPDFTemplateProps {
    challan: Challan
    student: Student
    schoolInfo?: {
        name: string
        address?: string
        phone?: string
        logo?: string
    }
}

/**
 * Challan PDF Template Component
 * Designed for printing/PDF generation
 * Pakistani bank challan style with tear-off sections
 */
export function ChallanPDFTemplate({ challan, student, schoolInfo }: ChallanPDFTemplateProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB')
    }

    const monthYear = challan.month ? new Date(challan.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''

    // Create a single challan copy
    const ChallanCopy = ({ title, forWhom }: { title: string; forWhom: string }) => (
        <div className="border-2 border-slate-800 p-6 mb-4 break-inside-avoid">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">{schoolInfo?.name || 'School Name'}</h1>
                    {schoolInfo?.address && <p className="text-sm text-slate-600 mt-1">{schoolInfo.address}</p>}
                    {schoolInfo?.phone && <p className="text-sm text-slate-600">Phone: {schoolInfo.phone}</p>}
                </div>
                <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500 uppercase">{title}</p>
                    <p className="text-xs text-slate-500 mt-1">{forWhom}</p>
                </div>
            </div>

            {/* Challan Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-xs text-slate-500 uppercase">Challan Number</p>
                    <p className="text-lg font-bold text-slate-900 font-mono">{challan.challan_number}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase">Month</p>
                    <p className="text-lg font-semibold text-slate-900">{monthYear}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase">Student Name</p>
                    <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase">Class / Roll No</p>
                    <p className="text-sm font-semibold text-slate-900">
                        {(student as any).class?.class_name || '—'} / {student.roll_number || '—'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase">Due Date</p>
                    <p className="text-sm font-semibold text-red-600">{formatDate(challan.due_date)}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase">Issue Date</p>
                    <p className="text-sm font-semibold text-slate-900">{formatDate(challan.created_at)}</p>
                </div>
            </div>

            {/* Fee Breakdown */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
                <table className="w-full">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Description</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700 uppercase">Amount (PKR)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {challan.monthly_fee > 0 && (
                            <tr>
                                <td className="px-4 py-2 text-sm text-slate-700">Monthly Fee</td>
                                <td className="px-4 py-2 text-sm text-right font-medium text-slate-900">
                                    {formatCurrency(challan.monthly_fee)}
                                </td>
                            </tr>
                        )}
                        {challan.exam_fee > 0 && (
                            <tr>
                                <td className="px-4 py-2 text-sm text-slate-700">Exam Fee</td>
                                <td className="px-4 py-2 text-sm text-right font-medium text-slate-900">
                                    {formatCurrency(challan.exam_fee)}
                                </td>
                            </tr>
                        )}
                        {challan.admission_fee > 0 && (
                            <tr>
                                <td className="px-4 py-2 text-sm text-slate-700">Admission Fee</td>
                                <td className="px-4 py-2 text-sm text-right font-medium text-slate-900">
                                    {formatCurrency(challan.admission_fee)}
                                </td>
                            </tr>
                        )}
                        {challan.other_fees > 0 && (
                            <tr>
                                <td className="px-4 py-2 text-sm text-slate-700">Other Fees</td>
                                <td className="px-4 py-2 text-sm text-right font-medium text-slate-900">
                                    {formatCurrency(challan.other_fees)}
                                </td>
                            </tr>
                        )}
                        {(challan.previous_balance ?? 0) > 0 && (
                            <tr className="bg-orange-50">
                                <td className="px-4 py-2 text-sm font-medium text-orange-700">Previous Balance</td>
                                <td className="px-4 py-2 text-sm text-right font-semibold text-orange-700">
                                    {formatCurrency(challan.previous_balance!)}
                                </td>
                            </tr>
                        )}
                        {challan.discount > 0 && (
                            <tr className="bg-green-50">
                                <td className="px-4 py-2 text-sm font-medium text-green-700">Discount</td>
                                <td className="px-4 py-2 text-sm text-right font-semibold text-green-700">
                                    -{formatCurrency(challan.discount)}
                                </td>
                            </tr>
                        )}
                        <tr className="bg-slate-800">
                            <td className="px-4 py-3 text-sm font-bold text-white uppercase">Total Amount</td>
                            <td className="px-4 py-3 text-right">
                                <span className="text-2xl font-bold text-white">
                                    {formatCurrency(challan.total_amount)}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Payment Instructions */}
            <div className="text-xs text-slate-600 space-y-1">
                <p>• Payment can be made at school office during working hours</p>
                <p>• Please bring this challan when making payment</p>
                <p>• Late payment may result in additional charges</p>
                {challan.notes && <p className="mt-2 font-medium">Note: {challan.notes}</p>}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-300 text-xs text-slate-500">
                <div className="flex justify-between">
                    <div>
                        <p>Generated: {new Date(challan.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">Authorized Signature</p>
                        <div className="h-8 mt-2"></div>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="bg-white p-8 print:p-0">
            <style jsx>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>

            {/* Bank Copy */}
            <ChallanCopy title="Bank Copy" forWhom="For Bank" />

            {/* School Copy */}
            <ChallanCopy title="School Copy" forWhom="For School Record" />

            {/* Student Copy */}
            <ChallanCopy title="Student Copy" forWhom="For Student/Parent" />
        </div>
    )
}

/**
 * Utility function to print challan
 */
export function printChallan(challanId: string) {
    const printWindow = window.open(`/owner/challans/print/${challanId}`, '_blank')
    if (printWindow) {
        printWindow.onload = () => {
            printWindow.print()
        }
    }
}

/**
 * Utility function to download challan as PDF
 * Requires html2pdf library
 */
export async function downloadChallanPDF(challanElement: HTMLElement, challanNumber: string) {
    // @ts-ignore
    if (typeof html2pdf !== 'undefined') {
        // @ts-ignore
        const opt = {
            margin: 10,
            filename: `challan_${challanNumber}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }
        // @ts-ignore
        await html2pdf().set(opt).from(challanElement).save()
    } else {
        console.error('html2pdf library not loaded')
        alert('PDF generation library not available. Please use Print instead.')
    }
}
