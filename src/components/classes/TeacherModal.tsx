'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface TeacherModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (name: string, subject: string) => void
    subjects: string[]
    mode: 'add' | 'edit'
    initialName?: string
    initialSubject?: string
}

export function TeacherModal({
    open,
    onClose,
    onSubmit,
    subjects,
    mode,
    initialName = '',
    initialSubject = ''
}: TeacherModalProps) {
    const [teacherName, setTeacherName] = useState(initialName)
    const [selectedSubject, setSelectedSubject] = useState(initialSubject)

    useEffect(() => {
        if (open) {
            setTeacherName(initialName)
            setSelectedSubject(initialSubject)
        }
    }, [open, initialName, initialSubject])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (teacherName.trim() && selectedSubject) {
            onSubmit(teacherName.trim(), selectedSubject)
            setTeacherName('')
            setSelectedSubject('')
            onClose()
        }
    }

    const isValid = teacherName.trim() && selectedSubject
    const subjectOptions = subjects.map(s => ({ value: s, label: s }))

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {mode === 'add' ? 'Assign New Teacher' : 'Edit Teacher'}
                    </DialogTitle>
                </DialogHeader>

                {subjects.length === 0 ? (
                    <div className="py-6 text-center">
                        <p className="text-sm text-slate-600 mb-4">
                            No subjects available. Please add subjects first.
                        </p>
                        <Button onClick={onClose} variant="outline">
                            Close
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="teacher-name" className="text-sm font-medium">
                                    Teacher Name
                                </Label>
                                <Input
                                    id="teacher-name"
                                    placeholder="e.g., Mr. Ahmed Ali"
                                    value={teacherName}
                                    onChange={(e) => setTeacherName(e.target.value)}
                                    className="w-full"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Select
                                    label="Subject"
                                    options={subjectOptions}
                                    placeholder="Select a subject"
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!isValid}
                                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                            >
                                {mode === 'add' ? 'Assign Teacher' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
