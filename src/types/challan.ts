import { Student } from './student'
import { FeePayment } from './fee'

export interface Challan {
    id: string
    student_id: string
    challan_number: string
    month: string // "2024-02"

    // Fee breakdown
    monthly_fee: number
    exam_fee: number
    admission_fee: number
    other_fees: number
    discount: number
    total_amount: number
    previous_balance?: number

    // Status
    status: 'pending' | 'paid' | 'overdue' | 'cancelled'
    due_date: string
    paid_date?: string
    payment_id?: string

    // Metadata
    notes?: string
    generated_by: string
    created_at: string
    updated_at: string
    is_first_challan?: boolean
    challan_type?: 'first_admission' | 'regular' | 'late_fee' | 'make_up'

    // Relations (from joins)
    student?: Student
    payment?: FeePayment
}

export interface GenerateChallanParams {
    month: string // "2024-02"
    year: number
    classIds?: string[] // null = all classes
    selectedFeeTypes: string[]
    carryForward: boolean
    dueDate: string
    notes?: string
}

export interface ChallanSummary {
    totalStudents: number
    totalAmount: number
    feeBreakdown: Record<string, number>
    studentsWithPreviousBalance: number
    averageAmount: number
}

export interface ChallanFilters {
    month?: string
    status?: string
    classId?: string
    searchQuery?: string
}

export type ChallanStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
