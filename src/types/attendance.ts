// Attendance status
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave'

// Attendance interface
export interface Attendance {
    id: string
    student_id: string
    class_id: string
    section_id: string
    date: string
    status: AttendanceStatus
    marked_by: string
    created_at: string
    // Joined data
    student?: {
        id: string
        name: string
        roll_number?: string
    }
    marker?: {
        id: string
        name: string
    }
}

// Attendance summary for a student
export interface AttendanceSummary {
    student_id: string
    total_days: number
    present: number
    absent: number
    late: number
    leave: number
    percentage: number
}
