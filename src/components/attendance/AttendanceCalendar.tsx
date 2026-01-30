'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { AttendanceStatus } from '@/types/attendance'
import { formatDate, getStatusColor, getStatusTextColor } from '@/lib/attendance-utils'

interface AttendanceCalendarProps {
    open: boolean
    onClose: () => void
    onDateSelect: (date: string) => void
    attendanceData: Record<string, { present: number; total: number; percentage: number }>
    className?: string
    sectionName?: string
}

export function AttendanceCalendar({
    open,
    onClose,
    onDateSelect,
    attendanceData,
    className,
    sectionName
}: AttendanceCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const getMonthDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const days: (Date | null)[] = []

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null)
        }

        // Add actual days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i))
        }

        return days
    }

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }

    const getDateColor = (date: Date | null): string => {
        if (!date) return 'bg-transparent'

        const dateString = date.toISOString().split('T')[0]
        const data = attendanceData[dateString]

        if (!data || data.total === 0) return 'bg-slate-100 text-slate-400'

        const percentage = data.percentage
        if (percentage >= 90) return 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
        if (percentage >= 75) return 'bg-blue-500 text-white shadow-md shadow-blue-200'
        if (percentage >= 60) return 'bg-amber-500 text-white shadow-md shadow-amber-200'
        return 'bg-rose-500 text-white shadow-md shadow-rose-200'
    }

    const isToday = (date: Date | null): boolean => {
        if (!date) return false
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }

    const monthDays = getMonthDays()
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <Modal isOpen={open} onClose={onClose} title="Attendance Calendar" size="lg">
            <div className="space-y-4">
                {/* Class/Section Label */}
                {className && sectionName && (
                    <div className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-200">
                        <div className="text-sm text-indigo-900">
                            <span className="font-semibold">Viewing attendance for:</span>{' '}
                            <span className="text-indigo-700">{className} - {sectionName}</span>
                        </div>
                    </div>
                )}

                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                        ← Previous
                    </Button>
                    <h3 className="text-lg font-bold text-slate-900">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                        Next →
                    </Button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Weekday Headers */}
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center font-bold text-[11px] text-slate-600 pb-1"
                        >
                            {day}
                        </div>
                    ))}

                    {/* Date Cells */}
                    {monthDays.map((date, index) => {
                        const dateString = date?.toISOString().split('T')[0]
                        const data = dateString ? attendanceData[dateString] : null
                        const color = getDateColor(date)

                        return (
                            <button
                                key={index}
                                onClick={() => date && onDateSelect(dateString!)}
                                disabled={!date || !data}
                                className={`
                                    relative h-14 rounded-md transition-all
                                    ${color}
                                    ${isToday(date) ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}
                                    ${date && data ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}
                                    ${!date ? 'invisible' : ''}
                                    flex flex-col items-center justify-center
                                `}
                            >
                                {date && (
                                    <>
                                        <span className="text-base font-bold leading-none">
                                            {date.getDate()}
                                        </span>
                                        {data && (
                                            <span className="text-[11px] font-extrabold mt-0.5 leading-none">
                                                {data.percentage}%
                                            </span>
                                        )}
                                    </>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-emerald-500 shadow-sm" />
                        <span className="text-[11px] font-semibold text-slate-700">90%+ Excellent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-blue-500 shadow-sm" />
                        <span className="text-[11px] font-semibold text-slate-700">75-89% Good</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-amber-500 shadow-sm" />
                        <span className="text-[11px] font-semibold text-slate-700">60-74% Fair</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-rose-500 shadow-sm" />
                        <span className="text-[11px] font-semibold text-slate-700">&lt;60% Poor</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300" />
                        <span className="text-[11px] font-semibold text-slate-700">No data</span>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
