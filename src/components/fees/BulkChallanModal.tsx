'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { generateChallan } from '@/lib/fee-utils'
import { FileText, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Student {
    id: string
    name: string
    class_id: string
}

interface BulkChallanModalProps {
    isOpen: boolean
    onClose: () => void
    students: Student[]
    onComplete: () => void
}

export function BulkChallanModal({ isOpen, onClose, students, onComplete }: BulkChallanModalProps) {
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [includeExamFee, setIncludeExamFee] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0 })

    const handleGenerate = async () => {
        if (!month) {
            toast.error('Please select a month')
            return
        }

        setGenerating(true)
        setProgress({ current: 0, total: students.length })

        let successCount = 0
        let failCount = 0

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            for (let i = 0; i < students.length; i++) {
                const student = students[i]

                try {
                    const result = await generateChallan(
                        student.id,
                        month,
                        user.id,
                        includeExamFee
                    )

                    if (result.success) {
                        successCount++
                    } else {
                        failCount++
                    }
                } catch (error) {
                    console.error(`Error generating challan for ${student.name}:`, error)
                    failCount++
                }

                setProgress({ current: i + 1, total: students.length })
            }

            if (successCount > 0) {
                toast.success(`Generated ${successCount} challans successfully!`)
            }
            if (failCount > 0) {
                toast.error(`Failed to generate ${failCount} challans`)
            }

            onComplete()
            onClose()
        } catch (error: any) {
            console.error('Bulk generation error:', error)
            toast.error('Failed to generate challans', error.message)
        } finally {
            setGenerating(false)
            setProgress({ current: 0, total: 0 })
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Generate Bulk Challans"
            size="md"
        >
            <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                    <p className="text-sm text-indigo-600 font-medium mb-2">
                        📋 Bulk Generation
                    </p>
                    <p className="text-sm text-slate-600">
                        This will generate challans for <span className="font-bold text-slate-900">{students.length} students</span>
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Fee Month
                    </label>
                    <Input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        disabled={generating}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="bulkExamFee"
                        checked={includeExamFee}
                        onChange={(e) => setIncludeExamFee(e.target.checked)}
                        disabled={generating}
                        className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label htmlFor="bulkExamFee" className="text-sm text-slate-700">
                        Include Exam Fee
                    </label>
                </div>

                {generating && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Generating...</span>
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
                    <Button variant="outline" onClick={onClose} disabled={generating}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FileText className="h-4 w-4 mr-2" />
                                Generate {students.length} Challans
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
