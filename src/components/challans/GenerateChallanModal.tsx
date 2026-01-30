'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Users, DollarSign, AlertCircle, CheckCircle2, Sparkles, Info } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { Class } from '@/types/class'
import { GenerateChallanParams, ChallanSummary } from '@/types/challan'
import { generateChallans, getChallanPreview } from '@/lib/challan-generator'
import { formatCurrency } from '@/lib/utils'
import { getFeeStructuresByClasses, validateFeeStructureExists, FeeStructure } from '@/lib/fee-structure-sync'

interface GenerateChallanModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const feeTypeOptions = [
    { value: 'tuition', label: 'Tuition Fee', always: true },
    { value: 'admission', label: 'Admission Fee', always: false },
    { value: 'exam', label: 'Mid Exam Fee', always: false },
    { value: 'final_exam', label: 'Final Exam Fee', always: false },
    { value: 'sports', label: 'Sports Fee', always: false },
    { value: 'science_lab', label: 'Science Lab Fee', always: false },
    { value: 'computer_lab', label: 'Computer Lab Fee', always: false },
]

export function GenerateChallanModal({ isOpen, onClose, onSuccess }: GenerateChallanModalProps) {
    const [classes, setClasses] = useState<Class[]>([])
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [preview, setPreview] = useState<ChallanSummary | null>(null)
    const [feeStructures, setFeeStructures] = useState<Map<string, FeeStructure>>(new Map())
    const [feeStructureWarning, setFeeStructureWarning] = useState<string>('')

    const [formData, setFormData] = useState<GenerateChallanParams>({
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        year: new Date().getFullYear(),
        classIds: [],
        selectedFeeTypes: ['tuition'],
        carryForward: true,
        dueDate: new Date(new Date().setDate(10)).toISOString().split('T')[0],
        notes: ''
    })

    useEffect(() => {
        if (isOpen) {
            fetchClasses()
        }
    }, [isOpen])

    // Load fee structures when classes are selected
    useEffect(() => {
        if (formData.classIds && formData.classIds.length > 0) {
            loadFeeStructures()
        } else {
            setFeeStructures(new Map())
            setFeeStructureWarning('')
        }
    }, [formData.classIds])

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('status', 'active')
                .order('class_name')

            if (error) throw error
            setClasses(data || [])
        } catch (error) {
            console.error('Error fetching classes:', error)
            toast.error('Failed to load classes')
        }
    }

    const loadFeeStructures = async () => {
        try {
            const classIds = formData.classIds || []
            if (classIds.length === 0) return

            const structures = await getFeeStructuresByClasses(classIds)
            setFeeStructures(structures)

            // Check if any class is missing fee structure
            const missingClasses = classIds.filter(id => !structures.has(id))
            if (missingClasses.length > 0) {
                const missingClassNames = classes
                    .filter(cls => missingClasses.includes(cls.id))
                    .map(cls => cls.class_name)
                    .join(', ')

                setFeeStructureWarning(
                    `⚠️ Fee structure not found for: ${missingClassNames}. Please set up fee structures first.`
                )
            } else {
                setFeeStructureWarning('')
            }
        } catch (error) {
            console.error('Error loading fee structures:', error)
        }
    }

    const handleClassToggle = (classId: string) => {
        setFormData(prev => ({
            ...prev,
            classIds: prev.classIds?.includes(classId)
                ? prev.classIds.filter(id => id !== classId)
                : [...(prev.classIds || []), classId]
        }))
    }

    const handleFeeTypeToggle = (feeType: string) => {
        setFormData(prev => ({
            ...prev,
            selectedFeeTypes: prev.selectedFeeTypes.includes(feeType)
                ? prev.selectedFeeTypes.filter(t => t !== feeType)
                : [...prev.selectedFeeTypes, feeType]
        }))
    }

    const handlePreview = async () => {
        setLoading(true)
        try {
            const summary = await getChallanPreview(formData)
            setPreview(summary)
        } catch (error) {
            console.error('Error getting preview:', error)
            toast.error('Failed to generate preview')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerate = async () => {
        if (formData.selectedFeeTypes.length === 0) {
            toast.error('Please select at least one fee type')
            return
        }

        // Validate fee structures exist
        const classIds = formData.classIds || []
        if (classIds.length > 0) {
            const missingClasses = classIds.filter(id => !feeStructures.has(id))
            if (missingClasses.length > 0) {
                toast.error('Cannot generate challans. Fee structures are missing for some classes.')
                return
            }
        }

        setGenerating(true)
        try {
            const { data: profile } = await supabase.auth.getUser()
            if (!profile.user) {
                toast.error('User not authenticated')
                return
            }

            const result = await generateChallans(formData, profile.user.id)

            if (result.success > 0) {
                toast.success(`✅ Generated ${result.success} challan(s) successfully!`)
                if (result.failed > 0) {
                    toast.error(`⚠️ Failed to generate ${result.failed} challan(s)`)
                }
                onSuccess()
                onClose()
            } else {
                toast.error('Failed to generate challans')
                if (result.errors.length > 0) {
                    console.error('Errors:', result.errors)
                }
            }
        } catch (error: any) {
            console.error('Error generating challans:', error)
            toast.error('Failed to generate challans')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Generate Challans"
            size="lg"
        >
            <div className="space-y-6">
                {/* Month & Year Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Month & Year"
                        type="month"
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    />
                    <Input
                        label="Due Date"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                </div>

                {/* Class Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        <Users className="inline h-4 w-4 mr-2" />
                        Select Classes
                    </label>

                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, classIds: [] })}
                        className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-all mb-3 ${(formData.classIds?.length ?? 0) === 0
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-300'
                            }`}
                    >
                        {(formData.classIds?.length ?? 0) === 0 ? '✓ ' : ''}All Classes
                    </button>

                    <div className="flex flex-wrap gap-2">
                        {classes.map((cls) => (
                            <button
                                key={cls.id}
                                type="button"
                                onClick={() => handleClassToggle(cls.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.classIds?.includes(cls.id)
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                    }`}
                            >
                                {formData.classIds?.includes(cls.id) ? '✓ ' : ''}
                                {cls.class_name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fee Structure Info */}
                {(formData.classIds && formData.classIds.length > 0) && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold text-slate-900">Fee Structure Auto-Loaded</span>
                        </div>

                        {feeStructureWarning ? (
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-yellow-800">{feeStructureWarning}</p>
                            </div>
                        ) : feeStructures.size > 0 ? (
                            <div className="space-y-2">
                                {Array.from(feeStructures.entries()).map(([classId, structure]) => {
                                    const className = classes.find(c => c.id === classId)?.class_name || 'Unknown'
                                    return (
                                        <div key={classId} className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">{className}</p>
                                                <p className="text-xs text-slate-600">Version {structure.version} • From {new Date(structure.effective_from).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-blue-600">{formatCurrency(structure.tuition_fee + structure.admission_fee + structure.exam_fee + structure.other_fee)}</p>
                                                <p className="text-xs text-slate-500">Total fees</p>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 rounded">
                                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700">Fees will be auto-filled from these structures. You can customize individual student fees later.</p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Fee Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        <DollarSign className="inline h-4 w-4 mr-2" />
                        Select Fee Types to Include
                    </label>

                    <div className="space-y-2">
                        {feeTypeOptions.map((option) => (
                            <label
                                key={option.value}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${formData.selectedFeeTypes.includes(option.value)
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.selectedFeeTypes.includes(option.value)}
                                    onChange={() => !option.always && handleFeeTypeToggle(option.value)}
                                    disabled={option.always}
                                    className="h-4 w-4 text-indigo-600 rounded"
                                />
                                <span className="flex-1 text-sm font-medium text-slate-700">
                                    {option.label}
                                </span>
                                {option.always && (
                                    <Badge variant="default" className="text-xs">Required</Badge>
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Advanced Options */}
                <div className="border-t pt-4">
                    <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-indigo-300">
                        <input
                            type="checkbox"
                            checked={formData.carryForward}
                            onChange={(e) => setFormData({ ...formData, carryForward: e.target.checked })}
                            className="h-4 w-4 text-indigo-600 rounded"
                        />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700">Carry Forward Unpaid Balance</p>
                            <p className="text-xs text-slate-500 mt-1">Automatically add previous month's unpaid amounts</p>
                        </div>
                    </label>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Notes (Optional)
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                        placeholder="Add any notes or instructions..."
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
                    />
                </div>

                {/* Preview Button */}
                <Button
                    onClick={handlePreview}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                >
                    {loading ? 'Loading Preview...' : 'Preview Summary'}
                </Button>

                {/* Preview Summary */}
                {preview && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                        <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Generation Preview
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-xs text-slate-500 mb-1">Total Students</p>
                                <p className="text-2xl font-bold text-slate-900">{preview.totalStudents}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-xs text-slate-500 mb-1">Estimated Total</p>
                                <p className="text-2xl font-bold text-green-700">{formatCurrency(preview.totalAmount)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-xs text-slate-500 mb-1">Average Per Student</p>
                                <p className="text-lg font-bold text-slate-700">{formatCurrency(preview.averageAmount)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-xs text-slate-500 mb-1">With Previous Balance</p>
                                <p className="text-lg font-bold text-orange-600">{preview.studentsWithPreviousBalance}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={generating}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={generating || formData.selectedFeeTypes.length === 0}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600"
                    >
                        {generating ? 'Generating...' : 'Generate Challans'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
