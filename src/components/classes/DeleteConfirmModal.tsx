'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmModalProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    affectedItems?: string[]
}

export function DeleteConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    message,
    affectedItems
}: DeleteConfirmModalProps) {

    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-800">
                                {title}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <DialogDescription className="text-slate-600 mb-3">
                        {message}
                    </DialogDescription>

                    {affectedItems && affectedItems.length > 0 && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-semibold text-red-800 mb-2">
                                This will also remove {affectedItems.length} teacher(s):
                            </p>
                            <ul className="space-y-1">
                                {affectedItems.map((item, idx) => (
                                    <li key={idx} className="text-sm text-red-700">
                                        • {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
