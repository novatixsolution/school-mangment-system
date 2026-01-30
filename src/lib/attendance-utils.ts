// Attendance Utility Functions
import { AttendanceStatus } from '@/types/attendance'

export interface AttendanceRecord {
    id: string
    student_id: string
    class_id: string
    section_id: string
    date: string
    status: AttendanceStatus
    marked_by: string
    created_at: string
}

export interface AttendanceStats {
    totalDays: number
    presentDays: number
    absentDays: number
    lateDays: number
    leaveDays: number
    attendancePercentage: number
}

export interface DailyStats {
    date: string
    present: number
    absent: number
    late: number
    leave: number
    total: number
    percentage: number
}

/**
 * Calculate attendance statistics for a student
 */
export function calculateAttendanceStats(records: AttendanceRecord[]): AttendanceStats {
    const totalDays = records.length
    const presentDays = records.filter(r => r.status === 'present').length
    const absentDays = records.filter(r => r.status === 'absent').length
    const lateDays = records.filter(r => r.status === 'late').length
    const leaveDays = records.filter(r => r.status === 'leave').length

    // Calculate percentage: (Present + Late) / Total * 100
    // Late is counted as present for percentage calculation
    const attendancePercentage = totalDays > 0
        ? Math.round(((presentDays + lateDays) / totalDays) * 100)
        : 0

    return {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        attendancePercentage
    }
}

/**
 * Calculate attendance percentage for a student
 */
export function calculateAttendancePercentage(records: AttendanceRecord[]): number {
    if (records.length === 0) return 0

    const presentCount = records.filter(r =>
        r.status === 'present' || r.status === 'late'
    ).length

    return Math.round((presentCount / records.length) * 100)
}

/**
 * Get attendance records for a date range
 */
export function getDateRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 1)
    }

    return dates
}

/**
 * Get last N days date range
 */
export function getLastNDays(days: number): { startDate: string; endDate: string; dates: string[] } {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dates: getDateRange(startDate, endDate)
    }
}

/**
 * Get current month date range
 */
export function getCurrentMonthRange(): { startDate: string; endDate: string; dates: string[] } {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dates: getDateRange(startDate, endDate)
    }
}

/**
 * Group attendance records by date
 */
export function groupByDate(records: AttendanceRecord[]): Record<string, AttendanceRecord[]> {
    return records.reduce((acc, record) => {
        if (!acc[record.date]) {
            acc[record.date] = []
        }
        acc[record.date].push(record)
        return acc
    }, {} as Record<string, AttendanceRecord[]>)
}

/**
 * Calculate daily statistics
 */
export function calculateDailyStats(records: AttendanceRecord[]): DailyStats[] {
    const grouped = groupByDate(records)

    return Object.entries(grouped).map(([date, dayRecords]) => {
        const present = dayRecords.filter(r => r.status === 'present').length
        const absent = dayRecords.filter(r => r.status === 'absent').length
        const late = dayRecords.filter(r => r.status === 'late').length
        const leave = dayRecords.filter(r => r.status === 'leave').length
        const total = dayRecords.length
        const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0

        return {
            date,
            present,
            absent,
            late,
            leave,
            total,
            percentage
        }
    }).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get attendance trend for sparkline/chart
 */
export function getAttendanceTrend(dailyStats: DailyStats[]): number[] {
    return dailyStats.map(stat => stat.percentage)
}

/**
 * Identify at-risk students (attendance < threshold)
 */
export function getAtRiskStudents(
    studentRecords: Map<string, AttendanceRecord[]>,
    threshold: number = 75
): string[] {
    const atRisk: string[] = []

    studentRecords.forEach((records, studentId) => {
        const percentage = calculateAttendancePercentage(records)
        if (percentage < threshold) {
            atRisk.push(studentId)
        }
    })

    return atRisk
}

/**
 * Get most common absent day of week
 */
export function getMostAbsentDay(records: AttendanceRecord[]): string {
    const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }

    records.filter(r => r.status === 'absent').forEach(record => {
        const day = new Date(record.date).getDay()
        dayCounts[day as keyof typeof dayCounts]++
    })

    const maxDay = Object.entries(dayCounts).reduce((a, b) =>
        dayCounts[a[0] as unknown as keyof typeof dayCounts] > dayCounts[b[0] as unknown as keyof typeof dayCounts] ? a : b
    )[0]

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[parseInt(maxDay)]
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

/**
 * Get attendance status color
 */
export function getStatusColor(status: AttendanceStatus): string {
    switch (status) {
        case 'present':
            return 'bg-emerald-500'
        case 'absent':
            return 'bg-red-500'
        case 'late':
            return 'bg-orange-500'
        case 'leave':
            return 'bg-blue-500'
        default:
            return 'bg-slate-500'
    }
}

/**
 * Get attendance status text color
 */
export function getStatusTextColor(status: AttendanceStatus): string {
    switch (status) {
        case 'present':
            return 'text-emerald-600'
        case 'absent':
            return 'text-red-600'
        case 'late':
            return 'text-orange-600'
        case 'leave':
            return 'text-blue-600'
        default:
            return 'text-slate-600'
    }
}

/**
 * Check if date is today
 */
export function isToday(dateString: string): boolean {
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
}

/**
 * Check if date is in the future
 */
export function isFutureDate(dateString: string): boolean {
    const today = new Date().toISOString().split('T')[0]
    return dateString > today
}

/**
 * Get quick date presets
 */
export function getQuickDatePresets() {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())

    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(thisWeekStart)
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)

    return {
        today: today.toISOString().split('T')[0],
        yesterday: yesterday.toISOString().split('T')[0],
        thisWeekStart: thisWeekStart.toISOString().split('T')[0],
        lastWeekStart: lastWeekStart.toISOString().split('T')[0],
        lastWeekEnd: lastWeekEnd.toISOString().split('T')[0]
    }
}
