'use client'

import { useEffect, useState } from 'react'
import { X, TrendingUp, TrendingDown, Calendar as CalendarIcon } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import {
    calculateAttendanceStats,
    calculateDailyStats,
    formatDate,
    getStatusColor,
    getStatusTextColor,
    type AttendanceRecord
} from '@/lib/attendance-utils'
import { fetchStudentAttendanceRecords } from '@/lib/attendance-export'

interface StudentAttendanceHistoryProps {
    open: boolean
    onClose: () => void
    studentId: string
    studentName: string
}

export function StudentAttendanceHistory({
    open,
    onClose,
    studentId,
    studentName
}: StudentAttendanceHistoryProps) {
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30')

    useEffect(() => {
        if (open && studentId) {
            loadAttendanceHistory()
        }
    }, [open, studentId, dateRange])

    const loadAttendanceHistory = async () => {
        setLoading(true)

        const endDate = new Date().toISOString().split('T')[0]
        let startDate: string | undefined

        if (dateRange !== 'all') {
            const days = parseInt(dateRange)
            const start = new Date()
            start.setDate(start.getDate() - days)
            startDate = start.toISOString().split('T')[0]
        }

        const data = await fetchStudentAttendanceRecords(studentId, startDate, endDate)
        setRecords(data)
        setLoading(false)
    }

    const stats = calculateAttendanceStats(records)
    const dailyStats = calculateDailyStats(records).slice(0, 10) // Last 10 days

    return (
        <Modal isOpen={open} onClose={onClose} title={`Attendance History - ${studentName}`} size="xl">
            <div className="space-y-6">
                {/* Date Range Selector */}
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
                    {([
                        { value: '7', label: 'Last 7 Days' },
                        { value: '30', label: 'Last 30 Days' },
                        { value: '90', label: 'Last 90 Days' },
                        { value: 'all', label: 'All Time' }
                    ] as const).map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setDateRange(value)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${dateRange === value
                                    ? 'bg-white shadow-sm text-indigo-600'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                        <p className="text-slate-500 mt-4">Loading attendance history...</p>
                    </div>
                ) : (
                    <>
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-indigo-700">{stats.totalDays}</p>
                                <p className="text-xs text-indigo-600 mt-1">Total Days</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-emerald-700">{stats.presentDays}</p>
                                <p className="text-xs text-emerald-600 mt-1">Present</p>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-red-700">{stats.absentDays}</p>
                                <p className="text-xs text-red-600 mt-1">Absent</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-orange-700">{stats.lateDays}</p>
                                <p className="text-xs text-orange-600 mt-1">Late</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-blue-700">{stats.leaveDays}</p>
                                <p className="text-xs text-blue-600 mt-1">Leave</p>
                            </div>
                        </div>

                        {/* Attendance Percentage */}
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90">Overall Attendance Rate</p>
                                    <p className="text-4xl font-bold mt-2">{stats.attendancePercentage}%</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {stats.attendancePercentage >= 75 ? (
                                            <>
                                                <TrendingUp className="h-4 w-4" />
                                                <span className="text-sm">Good Attendance</span>
                                            </>
                                        ) : (
                                            <>
                                                <TrendingDown className="h-4 w-4" />
                                                <span className="text-sm">Needs Improvement</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="w-32 h-32 relative">
                                    <svg className="transform -rotate-90 w-32 h-32">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="rgba(255,255,255,0.2)"
                                            strokeWidth="12"
                                            fill="none"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="white"
                                            strokeWidth="12"
                                            fill="none"
                                            strokeDasharray={`${stats.attendancePercentage * 3.51} 351.86`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Recent Attendance */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-indigo-600" />
                                Recent Attendance ({dailyStats.length} days)
                            </h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {dailyStats.length === 0 ? (
                                    <p className="text-center text-slate-500 py-8">No attendance records found</p>
                                ) : (
                                    dailyStats.map((dayStat) => {
                                        const record = records.find(r => r.date === dayStat.date)
                                        if (!record) return null

                                        return (
                                            <div
                                                key={dayStat.date}
                                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(record.status)}`} />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {formatDate(dayStat.date)}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {new Date(dayStat.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant={
                                                        record.status === 'present' ? 'success' :
                                                            record.status === 'absent' ? 'destructive' :
                                                                record.status === 'late' ? 'warning' :
                                                                    'default'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {record.status}
                                                </Badge>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Warning if attendance is low */}
                        {stats.attendancePercentage < 75 && stats.totalDays > 0 && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        <TrendingDown className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-red-800">Low Attendance Alert</h4>
                                        <p className="text-sm text-red-700 mt-1">
                                            This student's attendance is below the 75% threshold. Please ensure regular attendance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    )
}
