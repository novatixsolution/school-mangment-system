'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface TimetableSlot {
    period: number
    subject?: string
    teacher?: string
    startTime?: string
    endTime?: string
}

interface TimetableModalProps {
    open: boolean
    onClose: () => void
    subjects: string[]
    teachers: { name: string; subject: string }[]
    onSave: (timetable: Record<string, TimetableSlot[]>) => void
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]
const TIME_SLOTS = [
    { period: 1, start: '08:00', end: '08:45' },
    { period: 2, start: '08:45', end: '09:30' },
    { period: 3, start: '09:30', end: '10:15' },
    { period: 4, start: '10:15', end: '11:00' },
    { period: 5, start: '11:15', end: '12:00' }, // After break
    { period: 6, start: '12:00', end: '12:45' },
    { period: 7, start: '12:45', end: '01:30' },
    { period: 8, start: '01:30', end: '02:15' },
]

export function TimetableModal({ open, onClose, subjects, teachers, onSave }: TimetableModalProps) {
    const [timetable, setTimetable] = useState<Record<string, TimetableSlot[]>>(() => {
        const initial: Record<string, TimetableSlot[]> = {}
        DAYS.forEach(day => {
            initial[day] = PERIODS.map(period => ({
                period,
                startTime: TIME_SLOTS.find(t => t.period === period)?.start,
                endTime: TIME_SLOTS.find(t => t.period === period)?.end,
            }))
        })
        return initial
    })

    const handleSubjectChange = (day: string, period: number, subject: string) => {
        setTimetable(prev => ({
            ...prev,
            [day]: prev[day].map(slot =>
                slot.period === period
                    ? { ...slot, subject, teacher: teachers.find(t => t.subject === subject)?.name }
                    : slot
            )
        }))
    }

    const handleSave = () => {
        onSave(timetable)
        onClose()
    }

    const subjectOptions = [
        { value: '', label: '-- Select Subject --' },
        ...subjects.map(s => ({ value: s, label: s })),
        { value: 'BREAK', label: '🍽️ Break' },
        { value: 'FREE', label: '✨ Free Period' },
    ]

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        Weekly Timetable Builder
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-indigo-500 to-purple-500">
                                <th className="border border-slate-300 p-3 text-white font-bold text-sm">
                                    Period / Day
                                </th>
                                {DAYS.map(day => (
                                    <th key={day} className="border border-slate-300 p-3 text-white font-bold text-sm">
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {PERIODS.map(period => {
                                const timeSlot = TIME_SLOTS.find(t => t.period === period)
                                const isBreak = period === 4 // After period 4

                                return (
                                    <tr key={period} className={period % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                        <td className="border border-slate-300 p-3 font-semibold text-sm bg-indigo-50">
                                            <div>Period {period}</div>
                                            <div className="text-xs text-slate-500">
                                                {timeSlot?.start} - {timeSlot?.end}
                                            </div>
                                        </td>
                                        {DAYS.map(day => {
                                            const slot = timetable[day]?.find(s => s.period === period)

                                            return (
                                                <td key={`${day}-${period}`} className="border border-slate-300 p-2">
                                                    <Select
                                                        options={subjectOptions}
                                                        value={slot?.subject || ''}
                                                        onChange={(e) => handleSubjectChange(day, period, e.target.value)}
                                                        className="text-xs"
                                                    />
                                                    {slot?.subject && slot.subject !== 'BREAK' && slot.subject !== 'FREE' && (
                                                        <div className="mt-1 text-xs text-slate-600">
                                                            👤 {slot.teacher || 'No teacher'}
                                                        </div>
                                                    )}
                                                    {slot?.subject === 'BREAK' && (
                                                        <Badge className="mt-1 bg-orange-100 text-orange-700 text-xs">
                                                            🍽️ Break Time
                                                        </Badge>
                                                    )}
                                                    {slot?.subject === 'FREE' && (
                                                        <Badge className="mt-1 bg-blue-100 text-blue-700 text-xs">
                                                            ✨ Free Period
                                                        </Badge>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {/* Break Time Note */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            💡 <strong>Tip:</strong> Set Period 4 or 5 as "Break" across all days for lunch/recess time.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    >
                        💾 Save Timetable
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            // TODO: Print functionality
                            alert('Print Timetable - Coming Soon!')
                        }}
                    >
                        🖨️ Print
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
