import { DollarSign, Percent, Calculator } from 'lucide-react'
import { useState, useEffect } from 'react'

interface PaymentSettingsSectionProps {
    // Admission Fee
    admissionFee: number
    admissionFeeDiscountType: 'none' | 'percentage' | 'amount'
    admissionFeeDiscountValue: number
    onAdmissionFeeChange: (value: number) => void
    onAdmissionDiscountChange: (type: 'none' | 'percentage' | 'amount', value: number) => void

    // Monthly Fee
    feeStructures: any[]
    selectedFeeStructureId: string
    useCustomFees: boolean
    customTuitionFee: number
    customExamFee: number
    onFeeStructureSelect: (id: string) => void
    onToggleCustomFees: (enabled: boolean) => void
    onCustomFeesChange: (tuition: number, exam: number) => void

    // Additional Fees (sports, lab, etc.)
    selectedAdditionalFees: string[]  // Array of fee structure IDs
    onAdditionalFeesChange: (feeIds: string[]) => void

    // Preview
    studentName: string
    className: string
}

export function PaymentSettingsSection({
    admissionFee,
    admissionFeeDiscountType,
    admissionFeeDiscountValue,
    onAdmissionFeeChange,
    onAdmissionDiscountChange,
    feeStructures,
    selectedFeeStructureId,
    useCustomFees,
    customTuitionFee,
    customExamFee,
    onFeeStructureSelect,
    onToggleCustomFees,
    onCustomFeesChange,
    selectedAdditionalFees,
    onAdditionalFeesChange,
    studentName,
    className
}: PaymentSettingsSectionProps) {

    // State for custom inline fees
    const [customInlineFees, setCustomInlineFees] = useState<Array<{ id: string, name: string, amount: number }>>([])
    const [showAddFeeForm, setShowAddFeeForm] = useState(false)
    const [newFeeName, setNewFeeName] = useState('')
    const [newFeeAmount, setNewFeeAmount] = useState(0)

    // Calculate admission fee after discount
    const calculateFinalAdmissionFee = () => {
        if (admissionFeeDiscountType === 'none') return admissionFee

        if (admissionFeeDiscountType === 'percentage') {
            const discount = (admissionFee * admissionFeeDiscountValue) / 100
            return admissionFee - discount
        }

        if (admissionFeeDiscountType === 'amount') {
            return Math.max(0, admissionFee - admissionFeeDiscountValue)
        }

        return admissionFee
    }

    const calculateDiscount = () => {
        if (admissionFeeDiscountType === 'percentage') {
            return (admissionFee * admissionFeeDiscountValue) / 100
        }
        if (admissionFeeDiscountType === 'amount') {
            return admissionFeeDiscountValue
        }
        return 0
    }

    const finalAdmissionFee = calculateFinalAdmissionFee()
    const discount = calculateDiscount()

    // Get monthly fee amount
    const getMonthlyFeeAmount = () => {
        if (useCustomFees) {
            return customTuitionFee
        }
        const selected = feeStructures.find(f => f.id === selectedFeeStructureId)
        return selected?.amount || 0
    }

    const getExamFeeAmount = () => {
        if (useCustomFees) {
            return customExamFee
        }
        // If using class structure, exam fee is usually 0 in the first challan
        // unless specified in fee structure
        return 0
    }

    const monthlyFee = getMonthlyFeeAmount()
    const examFee = getExamFeeAmount()

    // Calculate additional fees total
    const additionalFeesTotal = selectedAdditionalFees.reduce((total, feeId) => {
        const fee = feeStructures.find(f => f.id === feeId)
        return total + (fee?.amount || 0)
    }, 0)

    // Calculate custom inline fees total
    const customInlineFeesTotal = customInlineFees.reduce((total, fee) => total + fee.amount, 0)

    const totalFirstChallan = finalAdmissionFee + monthlyFee + examFee + additionalFeesTotal + customInlineFeesTotal

    const monthlyFeeStructures = feeStructures.filter(f => f.frequency === 'monthly')
    // Additional fees are one-time fees that are not admission fees
    const additionalFeeStructures = feeStructures.filter(f =>
        f.frequency === 'one_time' && f.fee_type !== 'admission'
    )

    return (
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-blue-600" />
                Fee & Payment Settings
            </h3>

            <div className="grid grid-cols-2 gap-6">
                {/* LEFT COLUMN: All Inputs */}
                <div className="space-y-4">
                    {/* Admission Fee */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-sm font-bold text-green-800 mb-3">💰 Admission Fee (One-Time)</p>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Amount (Rs)</label>
                                    <input
                                        type="number"
                                        className="w-full h-9 px-3 text-sm rounded border border-green-300 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                                        value={admissionFee || ''}
                                        onChange={(e) => onAdmissionFeeChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                        placeholder="5000"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Discount Type</label>
                                    <select
                                        value={admissionFeeDiscountType}
                                        onChange={(e) => onAdmissionDiscountChange(e.target.value as any, admissionFeeDiscountValue)}
                                        className="w-full h-9 px-3 text-sm rounded border border-green-300 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                                    >
                                        <option value="none">None</option>
                                        <option value="percentage">% Off</option>
                                        <option value="amount">Rs Off</option>
                                    </select>
                                </div>
                            </div>
                            {admissionFeeDiscountType !== 'none' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        Discount {admissionFeeDiscountType === 'percentage' ? '(%)' : '(Rs)'}
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full h-9 px-3 text-sm rounded border border-green-300 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                                        value={admissionFeeDiscountValue || ''}
                                        onChange={(e) => onAdmissionDiscountChange(admissionFeeDiscountType, e.target.value ? parseFloat(e.target.value) : 0)}
                                        placeholder={admissionFeeDiscountType === 'percentage' ? '10' : '500'}
                                        min="0"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Fees (Sports, Lab, Exam, etc.) - Always Visible */}
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-bold text-orange-800">➕ Additional Fees (Optional)</p>
                            {additionalFeeStructures.length > 0 && (
                                <span className="text-xs text-orange-600">{additionalFeeStructures.length} available</span>
                            )}
                        </div>

                        {additionalFeeStructures.length > 0 ? (
                            <div className="space-y-2">
                                {additionalFeeStructures.map((fee) => {
                                    const isSelected = selectedAdditionalFees.includes(fee.id)
                                    return (
                                        <div
                                            key={fee.id}
                                            className={`p-2 rounded cursor-pointer transition text-sm ${isSelected
                                                ? 'bg-orange-100 border-2 border-orange-500'
                                                : 'bg-white border border-slate-200 hover:border-orange-300'
                                                }`}
                                            onClick={() => {
                                                if (isSelected) {
                                                    onAdditionalFeesChange(selectedAdditionalFees.filter(id => id !== fee.id))
                                                } else {
                                                    onAdditionalFeesChange([...selectedAdditionalFees, fee.id])
                                                }
                                            }}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => { }}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="font-medium">{fee.name}</span>
                                                </div>
                                                <span className="font-bold text-orange-600">Rs {fee.amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="bg-white rounded p-3 border border-orange-200 text-center">
                                <p className="text-xs text-slate-600 mb-1.5">📋 No additional fees configured</p>
                                <p className="text-xs text-slate-500">Add Exam/Sports/Lab fees from <strong>Fee Structures</strong> page</p>
                            </div>
                        )}
                    </div>

                    {/* Monthly Fee */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-bold text-blue-800 mb-3">📅 Monthly Recurring Fee</p>

                        {/* Toggle Buttons */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <button
                                type="button"
                                className={`py-2 px-3 text-xs font-medium rounded transition ${!useCustomFees
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-400'
                                    }`}
                                onClick={() => onToggleCustomFees(false)}
                            >
                                Class Structure
                            </button>
                            <button
                                type="button"
                                className={`py-2 px-3 text-xs font-medium rounded transition ${useCustomFees
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:border-purple-400'
                                    }`}
                                onClick={() => onToggleCustomFees(true)}
                            >
                                Custom Fees
                            </button>
                        </div>

                        {/* Class Structure Selection */}
                        {!useCustomFees && (
                            <div className="space-y-2">
                                {monthlyFeeStructures.length > 0 ? (
                                    monthlyFeeStructures.map((fee) => (
                                        <div
                                            key={fee.id}
                                            className={`p-2 rounded cursor-pointer transition text-sm ${selectedFeeStructureId === fee.id
                                                ? 'bg-blue-100 border-2 border-blue-500'
                                                : 'bg-white border border-slate-200 hover:border-blue-300'
                                                }`}
                                            onClick={() => onFeeStructureSelect(fee.id)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        checked={selectedFeeStructureId === fee.id}
                                                        onChange={() => { }}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="font-medium">{fee.name}</span>
                                                </div>
                                                <span className="font-bold text-blue-600">Rs {fee.amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-center text-slate-500 py-3">No fee structures available</p>
                                )}
                            </div>
                        )}

                        {/* Custom Fees Input */}
                        {useCustomFees && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Tuition (Rs)</label>
                                    <input
                                        type="number"
                                        className="w-full h-9 px-3 text-sm rounded border border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                                        value={customTuitionFee || ''}
                                        onChange={(e) => onCustomFeesChange(
                                            e.target.value ? parseFloat(e.target.value) : 0,
                                            customExamFee
                                        )}
                                        placeholder="2500"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Exam (Rs)</label>
                                    <input
                                        type="number"
                                        className="w-full h-9 px-3 text-sm rounded border border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                                        value={customExamFee || ''}
                                        onChange={(e) => onCustomFeesChange(
                                            customTuitionFee,
                                            e.target.value ? parseFloat(e.target.value) : 0
                                        )}
                                        placeholder="500"
                                        min="0"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Live Preview */}
                <div className="bg-white rounded-lg p-5 border-2 border-purple-300 shadow-lg">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-purple-200">
                        <Percent className="h-5 w-5 text-purple-600" />
                        <h4 className="font-bold text-base text-purple-900">First Challan Preview</h4>
                    </div>

                    {/* Student Info */}
                    <div className="space-y-2 text-sm mb-4 bg-purple-50 rounded p-3">
                        <div className="flex justify-between">
                            <span className="text-slate-600 text-xs">Student:</span>
                            <span className="font-semibold text-xs">{studentName || '(Not entered)'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 text-xs">Class:</span>
                            <span className="font-semibold text-xs">{className || '(Not selected)'}</span>
                        </div>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="space-y-2 text-sm">
                        <p className="text-xs font-bold text-purple-700 mb-2">Fee Breakdown:</p>

                        {finalAdmissionFee > 0 && (
                            <div className="flex justify-between items-center py-1">
                                <span className="text-slate-700 text-xs">Admission Fee:</span>
                                <span className="font-bold text-green-600">Rs {finalAdmissionFee.toLocaleString()}</span>
                            </div>
                        )}

                        {discount > 0 && (
                            <div className="flex justify-between items-center py-1">
                                <span className="text-slate-700 text-xs">Discount Applied:</span>
                                <span className="font-bold text-red-500">- Rs {discount.toLocaleString()}</span>
                            </div>
                        )}

                        {monthlyFee > 0 && (
                            <div className="flex justify-between items-center py-1">
                                <span className="text-slate-700 text-xs">Monthly Tuition:</span>
                                <span className="font-bold text-blue-600">Rs {monthlyFee.toLocaleString()}</span>
                            </div>
                        )}

                        {examFee > 0 && (
                            <div className="flex justify-between items-center py-1">
                                <span className="text-slate-700 text-xs">Exam Fee:</span>
                                <span className="font-bold text-blue-600">Rs {examFee.toLocaleString()}</span>
                            </div>
                        )}

                        {/* Show selected additional fees */}
                        {selectedAdditionalFees.map(feeId => {
                            const fee = additionalFeeStructures.find(f => f.id === feeId)
                            if (!fee) return null
                            return (
                                <div key={feeId} className="flex justify-between items-center py-1">
                                    <span className="text-slate-700 text-xs">{fee.name}:</span>
                                    <span className="font-bold text-orange-600">Rs {fee.amount.toLocaleString()}</span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-purple-300">
                        <span className="font-bold text-purple-900">Total Amount:</span>
                        <span className="text-2xl font-bold text-purple-600">
                            Rs {totalFirstChallan.toLocaleString()}
                        </span>
                    </div>

                    {/* Warning if no fees */}
                    {totalFirstChallan === 0 && (
                        <div className="text-center py-3 px-2 text-amber-700 bg-amber-50 rounded mt-4 border border-amber-300">
                            <p className="text-xs font-semibold">⚠️ No fees configured</p>
                            <p className="text-xs mt-1">Challan won't be auto-generated</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
