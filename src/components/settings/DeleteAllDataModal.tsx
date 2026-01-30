'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteAllSchoolData, getDeletePreviewCounts } from '@/lib/delete-all-data'
import { toast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'

interface DeleteAllDataModalProps {
    isOpen: boolean
    onClose: () => void
    currentUserId: string
}

export function DeleteAllDataModal({ isOpen, onClose, currentUserId }: DeleteAllDataModalProps) {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2>(1)
    const [includeStaff, setIncludeStaff] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [counts, setCounts] = useState<any>(null)
    const [loadingCounts, setLoadingCounts] = useState(false)
    const [deleteProgress, setDeleteProgress] = useState(0)
    const [deleteMessage, setDeleteMessage] = useState('')

    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setIncludeStaff(false)
            setConfirmText('')
            loadCounts()
        }
    }, [isOpen])

    const loadCounts = async () => {
        setLoadingCounts(true)
        try {
            const previewCounts = await getDeletePreviewCounts()
            setCounts(previewCounts)
        } catch (error) {
            console.error('Error loading counts:', error)
        } finally {
            setLoadingCounts(false)
        }
    }

    const handleContinue = () => {
        setStep(2)
        setConfirmText('')
    }

    const handleDelete = async () => {
        if (confirmText !== 'DELETE ALL DATA') {
            toast.error('Please type "DELETE ALL DATA" to confirm')
            return
        }

        setDeleting(true)
        setDeleteProgress(0)
        setDeleteMessage('Starting deletion...')

        try {
            const result = await deleteAllSchoolData({
                includeStaff,
                currentUserId,
                onProgress: (progress, message) => {
                    setDeleteProgress(progress)
                    setDeleteMessage(message)
                }
            })

            if (result.success) {
                toast.success('All data deleted successfully!')
                onClose()

                // Refresh the page after a short delay
                setTimeout(() => {
                    router.push('/owner/dashboard')
                    window.location.reload()
                }, 1000)
            } else {
                toast.error(result.error || 'Failed to delete data')
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred')
        } finally {
            setDeleting(false)
            setDeleteProgress(0)
            setDeleteMessage('')
        }
    }

    const isConfirmValid = confirmText === 'DELETE ALL DATA'

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
            <div className="space-y-4">
                {/* Step 1: Warning */}
                {step === 1 && (
                    <>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-5 rounded-t-xl -mt-4 -mx-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 rounded-full">
                                    <AlertTriangle className="h-7 w-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Delete All School Data</h2>
                                    <p className="text-red-100 text-xs mt-0.5">This action cannot be undone!</p>
                                </div>
                            </div>
                        </div>

                        {/* Warning Message */}
                        <div className="px-6">
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-3">
                                <p className="text-red-800 font-semibold text-sm mb-1">
                                    ⚠️ WARNING: Permanently delete ALL school data!
                                </p>
                                <p className="text-red-700 text-xs">
                                    This action is IRREVERSIBLE and cannot be undone.
                                </p>
                            </div>

                            {/* Data to be deleted */}
                            <div className="space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm">Data to be permanently deleted:</h3>

                                {loadingCounts ? (
                                    <div className="text-center py-3">
                                        <p className="text-slate-500 text-sm">
                                            Loading data counts<span className="loading-dots"></span>
                                        </p>
                                        <style jsx>{`
                                            .loading-dots::after {
                                                content: '.';
                                                animation: dots 1.5s steps(4, end) infinite;
                                            }
                                            @keyframes dots {
                                                0%, 20% { content: '.'; }
                                                40% { content: '..'; }
                                                60% { content: '...'; }
                                                80%, 100% { content: '....'; }
                                            }
                                        `}</style>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        <DataItem icon="👨‍🎓" label="Students" count={counts?.students} />
                                        <DataItem icon="📝" label="Admissions" count={counts?.admissions} />
                                        <DataItem icon="📚" label="Classes" count={counts?.classes} />
                                        <DataItem icon="🏫" label="Sections" count={counts?.sections} />
                                        <DataItem icon="📖" label="Subjects" count={counts?.subjects} />
                                        <DataItem icon="📅" label="Attendance" count={counts?.attendance} />
                                        <DataItem icon="💰" label="Challans" count={counts?.challans} />
                                        <DataItem icon="💳" label="Payments" count={counts?.payments} />
                                        <DataItem icon="💵" label="Fee Structures" count={counts?.feeStructures} />
                                        <DataItem icon="👨‍👩‍👧‍👦" label="Sibling Groups" count={counts?.siblingGroups} />
                                    </div>
                                )}

                                {/* Staff option */}
                                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 mt-3">
                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeStaff}
                                            onChange={(e) => setIncludeStaff(e.target.checked)}
                                            className="w-4 h-4 mt-0.5 text-red-600"
                                        />
                                        <div>
                                            <p className="font-semibold text-orange-900 text-sm">Also delete all staff members</p>
                                            <p className="text-xs text-orange-700 mt-0.5">
                                                {includeStaff
                                                    ? `⚠️ Will delete ${counts?.staff || 0} staff (your account kept)`
                                                    : 'Staff accounts will be preserved'
                                                }
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* What will be kept */}
                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 mt-3">
                                <p className="text-green-800 font-semibold text-sm mb-1">✓ What will be kept:</p>
                                <ul className="text-green-700 text-xs space-y-0.5">
                                    <li>• School information and settings</li>
                                    <li>• Your owner/admin account</li>
                                    {!includeStaff && <li>• All staff accounts</li>}
                                </ul>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 px-6 pb-4 pt-3 border-t">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleContinue}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Continue to Confirmation
                            </Button>
                        </div>
                    </>
                )}

                {/* Step 2: Final Confirmation */}
                {step === 2 && (
                    <>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-700 to-rose-700 text-white p-6 rounded-t-xl -mt-6 -mx-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/20 rounded-full">
                                    <Trash2 className="h-8 w-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Final Confirmation Required</h2>
                                    <p className="text-red-100 text-sm mt-1">Type to confirm deletion</p>
                                </div>
                            </div>
                        </div>

                        {/* Confirmation Input */}
                        <div className="px-6 space-y-4">
                            <div className="bg-red-100 border-2 border-red-300 rounded-lg p-6 text-center">
                                <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                                <p className="text-red-900 font-bold text-lg mb-2">
                                    This action is PERMANENT and IRREVERSIBLE!
                                </p>
                                <p className="text-red-800 text-sm">
                                    All data will be lost forever. Please be absolutely certain.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Type <span className="font-mono bg-slate-200 px-2 py-1 rounded">DELETE ALL DATA</span> to confirm:
                                </label>
                                <Input
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="Type here..."
                                    className="text-center font-mono text-lg"
                                    autoFocus
                                />
                                {confirmText && !isConfirmValid && (
                                    <p className="text-red-600 text-sm mt-2">
                                        ✗ Text doesn't match. Please type exactly: DELETE ALL DATA
                                    </p>
                                )}
                                {isConfirmValid && (
                                    <p className="text-green-600 text-sm mt-2">
                                        ✓ Confirmation text matches
                                    </p>
                                )}
                            </div>

                            <div className="bg-slate-100 rounded-lg p-4">
                                <p className="text-slate-700 text-sm">
                                    <strong>Summary:</strong> You are about to delete all school data
                                    {includeStaff ? ' including staff members' : ' (keeping staff)'}.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons / Progress */}
                        <div className="px-6 pb-4 border-t pt-4">
                            {deleting ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-700 font-medium">{deleteMessage}</span>
                                        <span className="font-bold text-red-600">{deleteProgress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-300 ease-out flex items-center justify-end pr-2"
                                            style={{ width: `${deleteProgress}%` }}
                                        >
                                            {deleteProgress > 15 && (
                                                <span className="text-xs text-white font-bold">{deleteProgress}%</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 text-center">⚠️ Please wait - deleting all data permanently...</p>
                                </div>
                            ) : (
                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => setStep(1)} disabled={deleting}>
                                        Go Back
                                    </Button>
                                    <Button
                                        onClick={handleDelete}
                                        disabled={!isConfirmValid || deleting}
                                        className="bg-red-600 hover:bg-red-700 text-white disabled:bg-slate-300"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Permanently Delete All Data
                                    </Button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    )
}

// Helper component for data items
function DataItem({ icon, label, count }: { icon: string; label: string; count?: number }) {
    return (
        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-2 border border-slate-200">
            <span className="text-lg">{icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-600 truncate">{label}</p>
                <p className="font-bold text-sm text-slate-900">{count !== undefined ? count.toLocaleString() : '...'}</p>
            </div>
        </div>
    )
}
