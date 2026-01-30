'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

interface Teacher {
    id: string
    name: string
    email?: string
    phone?: string
}

interface AssignTeacherModalProps {
    open: boolean
    onClose: () => void
    subjects: string[]
    availableTeachers: Teacher[] // From Staff Management
    currentAssignments: { teacherId: string; teacherName: string; subject: string }[]
    onAssign: (teacherId: string, teacherName: string, subject: string) => void
}

export function AssignTeacherModal({
    open,
    onClose,
    subjects,
    availableTeachers,
    currentAssignments,
    onAssign
}: AssignTeacherModalProps) {
    const [selectedSubject, setSelectedSubject] = useState('')
    const [selectedTeacherId, setSelectedTeacherId] = useState('')

    useEffect(() => {
        if (open) {
            setSelectedSubject('')
            setSelectedTeacherId('')
        }
    }, [open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedSubject || !selectedTeacherId) {
            alert('Please select both subject and teacher!')
            return
        }

        // Check if this subject already has a teacher
        const existingAssignment = currentAssignments.find(a => a.subject === selectedSubject)
        if (existingAssignment) {
            if (!confirm(`${selectedSubject} is already assigned to ${existingAssignment.teacherName}. Replace with new teacher?`)) {
                return
            }
        }

        const teacher = availableTeachers.find(t => t.id === selectedTeacherId)
        if (teacher) {
            onAssign(selectedTeacherId, teacher.name, selectedSubject)
            setSelectedSubject('')
            setSelectedTeacherId('')
            onClose()
        }
    }

    const selectedTeacher = availableTeachers.find(t => t.id === selectedTeacherId)
    const currentAssignment = currentAssignments.find(a => a.subject === selectedSubject)

    const subjectOptions = [
        { value: '', label: '-- Select Subject --' },
        ...subjects.map(s => ({ value: s, label: s }))
    ]

    const teacherOptions = [
        { value: '', label: '-- Select Teacher --' },
        ...availableTeachers.map(t => ({ value: t.id, label: t.name }))
    ]

    if (availableTeachers.length === 0) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800">
                            Assign Teacher to Subject
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 mb-2">
                            No Teachers Available
                        </p>
                        <p className="text-sm text-slate-600 mb-4">
                            Please add teachers from Staff Management first.
                        </p>
                        <Button onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (subjects.length === 0) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800">
                            Assign Teacher to Subject
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-8 w-8 text-yellow-600" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 mb-2">
                            No Subjects Available
                        </p>
                        <p className="text-sm text-slate-600 mb-4">
                            Please add subjects first before assigning teachers.
                        </p>
                        <Button onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        Assign Teacher to Subject
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 py-4">
                        {/* Step 1: Select Subject */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                                    1
                                </div>
                                <h3 className="font-semibold text-slate-800">Select Subject</h3>
                            </div>
                            <Select
                                options={subjectOptions}
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                placeholder="Choose subject to assign teacher"
                            />
                            {currentAssignment && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-xs text-yellow-800">
                                        ⚠️ Currently assigned to: <strong>{currentAssignment.teacherName}</strong>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Select Teacher */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                                    2
                                </div>
                                <h3 className="font-semibold text-slate-800">Select Teacher (from Staff)</h3>
                            </div>
                            <Select
                                options={teacherOptions}
                                value={selectedTeacherId}
                                onChange={(e) => setSelectedTeacherId(e.target.value)}
                                placeholder="Choose teacher from staff"
                            />
                            {selectedTeacher && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm font-semibold text-blue-900">{selectedTeacher.name}</p>
                                    {selectedTeacher.email && (
                                        <p className="text-xs text-blue-700">📧 {selectedTeacher.email}</p>
                                    )}
                                    {selectedTeacher.phone && (
                                        <p className="text-xs text-blue-700">📱 {selectedTeacher.phone}</p>
                                    )}

                                    {/* Show other subjects this teacher teaches */}
                                    {(() => {
                                        const teacherSubjects = currentAssignments
                                            .filter(a => a.teacherId === selectedTeacherId && a.subject !== selectedSubject)
                                            .map(a => a.subject)

                                        if (teacherSubjects.length > 0) {
                                            return (
                                                <div className="mt-2">
                                                    <p className="text-xs text-blue-600 mb-1">Also teaches:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {teacherSubjects.map(subj => (
                                                            <Badge key={subj} className="bg-blue-200 text-blue-800 text-xs">
                                                                {subj}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <p className="text-xs text-indigo-800">
                                💡 <strong>Note:</strong> Only teachers from Staff Management are shown.
                                One teacher can teach multiple subjects.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!selectedSubject || !selectedTeacherId}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                        >
                            Assign Teacher
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
