import { DollarSign } from 'lucide-react'

interface CustomFeesSectionProps {
    useCustomFees: boolean
    customTuitionFee: number
    customExamFee: number
    onToggleCustomFees: (enabled: boolean) => void
    onTuitionFeeChange: (value: number) => void
    onExamFeeChange: (value: number) => void
}

export function CustomFeesSection({
    useCustomFees,
    customTuitionFee,
    customExamFee,
    onToggleCustomFees,
    onTuitionFeeChange,
    onExamFeeChange
}: CustomFeesSectionProps) {
    return (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                Custom Fee Override (Optional)
            </h3>

            <p className="text-sm text-slate-600 mb-4">
                Enable this if you want to set different fees for this specific student instead of using the class fee structure.
            </p>

            {/* Toggle */}
            <div className="bg-white rounded-lg p-4 border-2 border-purple-200 mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={useCustomFees}
                        onChange={(e) => onToggleCustomFees(e.target.checked)}
                        className="w-5 h-5 text-purple-600"
                    />
                    <div>
                        <p className="font-semibold text-slate-900">Use Custom Fees for this Student</p>
                        <p className="text-xs text-slate-500">If enabled, custom fees will override class structure</p>
                    </div>
                </label>
            </div>

            {/* Custom Fee Fields */}
            {useCustomFees && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Custom Monthly Tuition Fee (Rs)
                            </label>
                            <input
                                type="number"
                                className="w-full h-11 px-4 rounded-lg border-2 border-purple-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                                value={customTuitionFee || ''}
                                onChange={(e) => onTuitionFeeChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                placeholder="2500"
                                min="0"
                            />
                            <p className="text-xs text-slate-500 mt-1">Will be charged every month</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Custom Exam Fee (Rs) - Optional
                            </label>
                            <input
                                type="number"
                                className="w-full h-11 px-4 rounded-lg border-2 border-purple-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                                value={customExamFee || ''}
                                onChange={(e) => onExamFeeChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                placeholder="500"
                                min="0"
                            />
                            <p className="text-xs text-slate-500 mt-1">Leave 0 if not needed</p>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border-2 border-purple-300">
                        <p className="text-xs text-purple-700 font-medium mb-2">✓ Custom Fees Summary</p>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-purple-900">Monthly Tuition:</span>
                                <span className="font-bold text-purple-900">Rs {(customTuitionFee || 0).toLocaleString()}</span>
                            </div>
                            {customExamFee > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-purple-900">Exam Fee:</span>
                                    <span className="font-bold text-purple-900">Rs {customExamFee.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-purple-700 mt-2">
                            ℹ️ These custom amounts will apply to this student's first challan and all future challans
                        </p>
                    </div>
                </div>
            )}

            {!useCustomFees && (
                <div className="text-center py-4 bg-white rounded-lg border-2 border-dashed border-purple-300">
                    <p className="text-sm text-slate-600">
                        💡 Using class fee structure (default)
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        Enable custom fees above if needed
                    </p>
                </div>
            )}
        </div>
    )
}
