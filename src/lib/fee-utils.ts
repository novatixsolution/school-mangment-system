/**
 * Fee Management Utilities
 * Centralized fee calculation and management functions
 */

import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

export interface Student {
    id: string
    name: string
    class_id: string
    custom_fee?: number
    fee_discount?: number
    admission_fee?: number
    fee_notes?: string
    class?: {
        id: string
        class_name: string
        monthly_fee?: number
        exam_fee?: number
    }
}

export interface FeeStructure {
    id: string
    class_id: string
    fee_type: string
    amount: number
    is_active: boolean
}

export interface FeeBreakdown {
    baseFee: number
    discount: number
    finalAmount: number
    source: 'custom' | 'class' | 'structure'
}

/**
 * Calculate student's monthly fee
 * Priority: custom_fee > class monthly_fee > fee_structures
 */
export function calculateStudentMonthlyFee(student: Student): FeeBreakdown {
    let baseFee = 0
    let source: 'custom' | 'class' | 'structure' = 'structure'

    // Priority 1: Student's custom_fee (highest priority)
    if (student.custom_fee && student.custom_fee > 0) {
        baseFee = student.custom_fee
        source = 'custom'
    }
    // Priority 2: Class monthly fee
    else if (student.class?.monthly_fee && student.class.monthly_fee > 0) {
        baseFee = student.class.monthly_fee
        source = 'class'
    }
    // Priority 3: Will be fetched from fee_structures if needed
    else {
        baseFee = 0
        source = 'structure'
    }

    const discount = student.fee_discount || 0
    const finalAmount = Math.max(0, baseFee - discount)

    return {
        baseFee,
        discount,
        finalAmount,
        source
    }
}

/**
 * Get fee structure for a class
 */
export async function getFeeStructure(classId: string, feeType: string = 'Monthly Fee'): Promise<number> {
    try {
        const { data, error } = await supabase
            .from('fee_structures')
            .select('amount')
            .eq('class_id', classId)
            .eq('fee_type', feeType)
            .eq('is_active', true)
            .single()

        if (error || !data) return 0
        return data.amount
    } catch (error) {
        console.error('Error fetching fee structure:', error)
        return 0
    }
}

/**
 * Get complete fee breakdown for a student
 * NOW USES STUDENT-LEVEL FEES (original + custom override)
 */
export async function getStudentFeeBreakdown(studentId: string) {
    try {
        const { data: student, error } = await supabase
            .from('students')
            .select(`
                *,
                class:classes(id, class_name),
                original_tuition_fee,
                original_admission_fee,
                original_exam_fee,
                original_other_fee,
                custom_tuition_fee,
                use_custom_fees,
                fee_discount
            `)
            .eq('id', studentId)
            .single()

        if (error || !student) throw error

        // Resolve tuition fee: use custom if enabled, otherwise original
        const resolvedTuitionFee = student.use_custom_fees && student.custom_tuition_fee !== null
            ? student.custom_tuition_fee
            : (student.original_tuition_fee || 0)

        const discount = student.fee_discount || 0
        const admissionFee = student.original_admission_fee || 0
        const examFee = student.original_exam_fee || 0
        const otherFee = student.original_other_fee || 0

        const baseFee = resolvedTuitionFee
        const monthlyFee = Math.max(0, baseFee - discount)

        return {
            monthlyFee: monthlyFee,
            examFee: examFee,
            admissionFee: admissionFee,
            discount: discount,
            baseFee: baseFee,
            total: monthlyFee,
            otherFee: otherFee,
            resolvedTuitionFee: resolvedTuitionFee,
            useCustomFee: student.use_custom_fees || false
        }
    } catch (error) {
        console.error('Error getting fee breakdown:', error)
        return {
            monthlyFee: 0,
            examFee: 0,
            admissionFee: 0,
            discount: 0,
            baseFee: 0,
            total: 0,
            otherFee: 0,
            resolvedTuitionFee: 0,
            useCustomFee: false
        }
    }
}

/**
 * Generate unique challan number
 */
export function generateChallanNumber(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `CH-${format(new Date(), 'yyyyMM')}-${random}`
}

/**
 * Get month-year string
 */
export function getMonthYear(date: Date = new Date()): string {
    return format(date, 'yyyy-MM')
}

/**
 * Get month end date
 */
export function getMonthEndDate(monthYear: string): Date {
    const [year, month] = monthYear.split('-').map(Number)
    return new Date(year, month, 0) // Last day of month
}

/**
 * Save or update fee structure for a class
 */
export async function saveFeeStructure(
    classId: string,
    feeType: string,
    amount: number,
    academicYear?: string
) {
    try {
        // Check if exists
        const { data: existing } = await supabase
            .from('fee_structures')
            .select('id')
            .eq('class_id', classId)
            .eq('fee_type', feeType)
            .maybeSingle()

        if (existing) {
            // Update
            const { error } = await supabase
                .from('fee_structures')
                .update({
                    amount,
                    academic_year: academicYear,
                    is_active: true
                })
                .eq('id', existing.id)

            if (error) throw error
        } else {
            // Insert
            const { error } = await supabase
                .from('fee_structures')
                .insert({
                    class_id: classId,
                    fee_type: feeType,
                    amount,
                    academic_year: academicYear,
                    is_active: true
                })

            if (error) throw error
        }

        return { success: true }
    } catch (error) {
        console.error('Error saving fee structure:', error)
        return { success: false, error }
    }
}

/**
 * Update student fee settings
 */
export async function updateStudentFees(
    studentId: string,
    data: {
        custom_fee?: number
        fee_discount?: number
        admission_fee?: number
        fee_notes?: string
    }
) {
    try {
        const { error } = await supabase
            .from('students')
            .update(data)
            .eq('id', studentId)

        if (error) throw error
        return { success: true }
    } catch (error) {
        console.error('Error updating student fees:', error)
        return { success: false, error }
    }
}

/**
 * Generate fee challan for a student
 */
export async function generateChallan(
    studentId: string,
    month: string,
    generatedBy: string,
    includeExamFee: boolean = false
) {
    try {
        const feeBreakdown = await getStudentFeeBreakdown(studentId)
        const challanNumber = generateChallanNumber()
        const dueDate = getMonthEndDate(month)

        const challan = {
            student_id: studentId,
            challan_number: challanNumber,
            month,
            monthly_fee: feeBreakdown.monthlyFee,
            exam_fee: includeExamFee ? feeBreakdown.examFee : 0,
            admission_fee: 0, // Admission fee is one-time, handle separately
            discount: feeBreakdown.discount,
            total_amount: feeBreakdown.monthlyFee + (includeExamFee ? feeBreakdown.examFee : 0),
            status: 'pending',
            due_date: dueDate,
            generated_by: generatedBy
        }

        const { data, error } = await supabase
            .from('fee_challans')
            .insert(challan)
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error generating challan:', error)
        return { success: false, error }
    }
}

/**
 * Get pending challans for a student
 */
export async function getPendingChallans(studentId: string) {
    try {
        const { data, error } = await supabase
            .from('fee_challans')
            .select('*')
            .eq('student_id', studentId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching pending challans:', error)
        return []
    }
}

/**
 * Mark challan as paid
 */
export async function markChallanPaid(challanId: string, paymentId: string) {
    try {
        const { error } = await supabase
            .from('fee_challans')
            .update({
                status: 'paid',
                paid_date: new Date().toISOString(),
                payment_id: paymentId
            })
            .eq('id', challanId)

        if (error) throw error
        return { success: true }
    } catch (error) {
        console.error('Error marking challan as paid:', error)
        return { success: false, error }
    }
}
