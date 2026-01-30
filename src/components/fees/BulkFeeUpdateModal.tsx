'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { DollarSign, Loader2 } from 'lucide-react'

interface Student {
    id: string
    name: string
    custom_fee?: number
}

interface BulkFeeUpdateModalProps {
    isOpen: boolean
    onClose: () => void
    students: Student[]
    onComplete: () => void
}

export function BulkFeeUpdateModal({ isOpen, onClose, students, onComplete }: BulkFeeUpdateModalProps) {
    const [newFee, setNewFee] = useState('')
    const [updateType, setUpdateType] = useState<'set' | 'increase' | 'decrease'>('set')
    const [amount, setAmount] = useState('')
    const [updating, setUpdating] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0 })

    const handleUpdate = async () => {
        const feeValue = parseFloat(updateType === 'set' ? newFee : amount)

        if (isNaN(feeValue) || feeValue <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        setUpdating(true)
        setProgress({ current: 0, total: students.length })

        let successCount = 0
        let failCount = 0

        try {
            for (let i = 0; i < students.length; i++) {
                const student = students[i]
                let updatedFee: number

                if (updateType === 'set') {
                    updatedFee = feeValue
                } else if (updateType === 'increase') {
                    const currentFee = student.custom_fee || 0
                    updatedFee = currentFee + feeValue
                } else {
                    const currentFee = student.custom_fee || 0
                    updatedFee = Math.max(0, currentFee - feeValue)
                }

                try {
                    const { error } = await supabase
                        .from('students')
                        .update({ custom_fee: updatedFee })
                        .eq('id', student.id)

                    if (error) throw error
                    successCount++
                } catch (error) {
                    console.error(`Error updating fee for ${student.name}:`, error)
                    failCount++
                }

                setProgress({ current: i + 1, total: students.length })
            }

            if (successCount > 0) {
                toast.success(`Updated fees for ${successCount} students!`)
            }
            if (failCount > 0) {
                toast.error(`Failed to update ${failCount} students`)
            }

            onComplete()
            onClose()
        } catch (error: any) {
            console.error('Bulk update error:', error)
            toast.error('Failed to update fees', error.message)
        } finally {
            setUpdating(false)
            setProgress({ current: 0, total: 0 })
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Bulk Fee Update"
            size="md"
        >
            <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm text-amber-600 font-medium mb-2">
                        💰 Bulk Fee Update
                    </p>
                    <p className="text-sm text-slate-600">
                        This will update fees for <span className="font-bold text-slate-900">{students.length} students</span>
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Update Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => setUpdateType('set')}
                            disabled={updating}
                            className={`p-3 rounded-lg border-2 transition-all ${updateType === 'set'
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <p className="text-sm font-medium">Set Fee</p>
                        </button>
                        <button
                            onClick={() => setUpdateType('increase')}
                            disabled={updating}
                            className={`p-3 rounded-lg border-2 transition-all ${updateType === 'increase'
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <p className="text-sm font-medium">Increase</p>
                        </button>
                        <button
                            onClick={() => setUpdateType('decrease')}
                            disabled={updating}
                            className={`p-3 rounded-lg border-2 transition-all ${updateType === 'decrease'
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <p className="text-sm font-medium">Decrease</p>
                        </button>
                    </div>
                </div>

                {updateType === 'set' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            New Monthly Fee (PKR)
                        </label>
                        <Input
                            type="number"
                            placeholder="e.g. 2500"
                            value={newFee}
                            onChange={(e) => setNewFee(e.target.value)}
                            disabled={updating}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            This will override current fees for all selected students
                        </p>
                    </div>
                )}

                {(updateType === 'increase' || updateType === 'decrease') && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            {updateType === 'increase' ? 'Increase' : 'Decrease'} Amount (PKR)
                        </label>
                        <Input
                            type="number"
                            placeholder="e.g. 200"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={updating}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            {updateType === 'increase'
                                ? 'Will add this amount to current fees'
                                : 'Will subtract this amount from current fees'}
                        </p>
                    </div>
                )}

                {updating && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Updating...</span>
                            <span className="text-sm font-medium text-slate-900">
                                {progress.current} / {progress.total}
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={updating}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        disabled={updating}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        {updating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Update {students.length} Students
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
