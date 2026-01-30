'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddSubjectModalProps {
    open: boolean
    onClose: () => void
    onAdd: (subjectName: string) => void
}

export function AddSubjectModal({ open, onClose, onAdd }: AddSubjectModalProps) {
    const [subjectName, setSubjectName] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (subjectName.trim()) {
            onAdd(subjectName.trim())
            setSubjectName('')
            onClose()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">Add New Subject</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject-name" className="text-sm font-medium">
                                Subject Name
                            </Label>
                            <Input
                                id="subject-name"
                                placeholder="e.g., Mathematics, Physics..."
                                value={subjectName}
                                onChange={(e) => setSubjectName(e.target.value)}
                                className="w-full"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!subjectName.trim()}
                            className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
                        >
                            Add Subject
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
