'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

interface Student {
    id: string
    name: string
    roll_number?: string
    photo_url?: string
}

interface AttendanceModalProps {
    open: boolean
    onClose: () => void
    students: Student[]
    onSubmit: (attendance: Record<string, 'present' | 'absent' | 'late'>) => void
    date: Date
}

export function AttendanceModal({ open, onClose, students, onSubmit, date }: AttendanceModalProps) {
    const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({})

    const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
        setAttendance(prev => ({ ...prev, [studentId]: status }))
    }

    const handleMarkAllPresent = () => {
        const allPresent: Record<string, 'present' | 'absent' | 'late'> = {}
        students.forEach(student => {
            allPresent[student.id] = 'present'
        })
        setAttendance(allPresent)
    }

    const handleSubmit = () => {
        onSubmit(attendance)
        setAttendance({})
        onClose()
    }

    const presentCount = Object.values(attendance).filter(s => s === 'present').length
    const absentCount = Object.values(attendance).filter(s => s === 'absent').length
    const lateCount = Object.values(attendance).filter(s => s === 'late').length
    const unmarkedCount = students.length - presentCount - absentCount - lateCount

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        Take Attendance - {date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* Summary */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs text-green-600 font-medium">Present</p>
                            <p className="text-2xl font-bold text-green-700">{presentCount}</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs text-red-600 font-medium">Absent</p>
                            <p className="text-2xl font-bold text-red-700">{absentCount}</p>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs text-yellow-600 font-medium">Late</p>
                            <p className="text-2xl font-bold text-yellow-700">{lateCount}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-xs text-slate-600 font-medium">Unmarked</p>
                            <p className="text-2xl font-bold text-slate-700">{unmarkedCount}</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-4">
                        <Button
                            onClick={handleMarkAllPresent}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                        >
                            ✓ Mark All Present
                        </Button>
                    </div>

                    {/* Student List */}
                    <div className="space-y-2">
                        {students.map((student) => {
                            const status = attendance[student.id]
                            return (
                                <div
                                    key={student.id}
                                    className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                {student.roll_number || '?'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{student.name}</p>
                                                {student.roll_number && (
                                                    <p className="text-xs text-slate-500">Roll #{student.roll_number}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleStatusChange(student.id, 'present')}
                                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${status === 'present'
                                                        ? 'bg-green-600 text-white shadow-md'
                                                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                                    }`}
                                            >
                                                <CheckCircle2 className="h-4 w-4 inline mr-1" />
                                                Present
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(student.id, 'late')}
                                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${status === 'late'
                                                        ? 'bg-yellow-600 text-white shadow-md'
                                                        : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
                                                    }`}
                                            >
                                                <Clock className="h-4 w-4 inline mr-1" />
                                                Late
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(student.id, 'absent')}
                                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${status === 'absent'
                                                        ? 'bg-red-600 text-white shadow-md'
                                                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                                    }`}
                                            >
                                                <XCircle className="h-4 w-4 inline mr-1" />
                                                Absent
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={unmarkedCount > 0}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                        {unmarkedCount > 0 ? `Mark ${unmarkedCount} Remaining` : 'Submit Attendance'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
