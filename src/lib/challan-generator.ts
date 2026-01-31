import { supabase } from './supabase/client'
import { Challan, GenerateChallanParams, ChallanSummary } from '@/types/challan'
import { FeeStructure } from '@/types/fee'
import { Student } from '@/types/student'

/**
 * Generate unique challan number
 * Format: MMM-YYYY-XXXXXX (e.g., FEB-2024-000123)
 */
export function generateChallanNumber(month: string, sequenceNumber: number): string {
    const [year, monthNum] = month.split('-')
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const monthName = monthNames[parseInt(monthNum) - 1]
    const paddedSeq = sequenceNumber.toString().padStart(6, '0')
    return `${monthName}-${year}-${paddedSeq}`
}

/**
 * Check if challan already exists for student in given month
 */
export async function challanExists(studentId: string, month: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('fee_challans')
        .select('id')
        .eq('student_id', studentId)
        .eq('month', month)
        .limit(1)

    if (error) {
        console.error('Error checking challan existence:', error)
        return false
    }

    return (data?.length ?? 0) > 0
}

/**
 * Get unpaid amount from previous months
 */
export async function getPreviousUnpaidAmount(studentId: string, currentMonth: string): Promise<number> {
    const { data, error } = await supabase
        .from('fee_challans')
        .select('total_amount')
        .eq('student_id', studentId)
        .eq('status', 'pending')
        .lt('month', currentMonth)

    if (error) {
        console.error('Error fetching previous unpaid:', error)
        return 0
    }

    return data?.reduce((sum, challan) => sum + challan.total_amount, 0) ?? 0
}

/**
 * Get fee structures for a student based on their student record
 * NOW USES STUDENT-LEVEL FEES (original + custom override)
 */
export async function getStudentFeeStructures(
    studentId: string,
    selectedFeeTypes: string[]
): Promise<Record<string, number>> {
    // Get student's fees directly from student record
    const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
            id,
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

    if (studentError || !student) {
        console.error('Error fetching student fees:', studentError)
        return {}
    }

    // Resolve tuition fee: use custom if enabled, otherwise original
    const resolvedTuitionFee = student.use_custom_fees && student.custom_tuition_fee !== null
        ? student.custom_tuition_fee
        : (student.original_tuition_fee || 0)

    // Initialize fees object
    const fees: Record<string, number> = {
        tuition: 0,
        exam: 0,
        admission: 0,
        sports: 0,
        science_lab: 0,
        computer_lab: 0,
        other: 0
    }

    // Map fees based on selected types
    selectedFeeTypes.forEach(feeType => {
        if (feeType === 'tuition') {
            fees.tuition = resolvedTuitionFee
        } else if (feeType === 'admission') {
            fees.admission = student.original_admission_fee || 0
        } else if (feeType === 'exam') {
            // Mid exam - half of total exam fee
            fees.exam = Math.floor((student.original_exam_fee || 0) / 2)
        } else if (feeType === 'final_exam') {
            // Final exam - other half
            fees.exam += Math.ceil((student.original_exam_fee || 0) / 2)
        } else if (feeType === 'sports') {
            fees.sports = Math.floor((student.original_other_fee || 0) * 0.3)
        } else if (feeType === 'science_lab') {
            fees.science_lab = Math.floor((student.original_other_fee || 0) * 0.4)
        } else if (feeType === 'computer_lab') {
            fees.computer_lab = Math.ceil((student.original_other_fee || 0) * 0.3)
        } else {
            fees.other += student.original_other_fee || 0
        }
    })

    return fees
}

/**
 * Calculate total challan amount for a student
 */
export async function calculateStudentFees(
    studentId: string,
    selectedFeeTypes: string[],
    carryForward: boolean,
    currentMonth: string
): Promise<{
    monthly_fee: number
    exam_fee: number
    admission_fee: number
    other_fees: number
    discount: number
    previous_balance: number
    total_amount: number
}> {
    const fees = await getStudentFeeStructures(studentId, selectedFeeTypes)

    // Get student discount
    const { data: student } = await supabase
        .from('students')
        .select('fee_discount')
        .eq('id', studentId)
        .single()

    const discount = student?.fee_discount ?? 0

    // Get previous balance if carry forward enabled
    const previousBalance = carryForward
        ? await getPreviousUnpaidAmount(studentId, currentMonth)
        : 0

    const subtotal = fees.tuition + fees.exam + fees.admission + fees.sports + fees.science_lab + fees.computer_lab + fees.other
    const totalAmount = subtotal - discount + previousBalance

    return {
        monthly_fee: fees.tuition + fees.sports + fees.science_lab + fees.computer_lab,
        exam_fee: fees.exam,
        admission_fee: fees.admission,
        other_fees: fees.other,
        discount: discount,
        previous_balance: previousBalance,
        total_amount: Math.max(0, totalAmount)
    }
}

/**
 * Generate challans for multiple students
 */
export async function generateChallans(
    params: GenerateChallanParams,
    userId: string
): Promise<{ success: number; failed: number; errors: string[] }> {
    const { month, classIds, selectedFeeTypes, carryForward, dueDate, notes } = params

    // Get students based on class selection
    let studentsQuery = supabase
        .from('students')
        .select('id, name, class_id')
        .eq('status', 'active')

    if (classIds && classIds.length > 0) {
        studentsQuery = studentsQuery.in('class_id', classIds)
    }

    const { data: students, error: studentsError } = await studentsQuery

    if (studentsError || !students) {
        console.error('Error fetching students:', studentsError)
        return { success: 0, failed: 0, errors: ['Failed to fetch students'] }
    }

    let success = 0
    let failed = 0
    const errors: string[] = []

    // Get current sequence number
    const { data: lastChallan } = await supabase
        .from('fee_challans')
        .select('challan_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    let sequenceNumber = 1
    if (lastChallan?.challan_number) {
        const parts = lastChallan.challan_number.split('-')
        if (parts.length === 3) {
            sequenceNumber = parseInt(parts[2]) + 1
        }
    }

    // Generate challan for each student
    for (const student of students) {
        try {
            // Check if challan already exists
            const exists = await challanExists(student.id, month)
            if (exists) {
                errors.push(`Challan already exists for ${student.name}`)
                failed++
                continue
            }

            // Calculate fees
            const feeCalculation = await calculateStudentFees(
                student.id,
                selectedFeeTypes,
                carryForward,
                month
            )

            // Generate challan number
            const challanNumber = generateChallanNumber(month, sequenceNumber++)

            // Insert challan
            const { error: insertError } = await supabase
                .from('fee_challans')
                .insert({
                    student_id: student.id,
                    challan_number: challanNumber,
                    month: month,
                    monthly_fee: feeCalculation.monthly_fee,
                    exam_fee: feeCalculation.exam_fee,
                    admission_fee: feeCalculation.admission_fee,
                    other_fees: feeCalculation.other_fees,
                    discount: feeCalculation.discount,
                    total_amount: feeCalculation.total_amount,
                    status: 'pending',
                    due_date: dueDate,
                    notes: notes,
                    generated_by: userId
                })

            if (insertError) {
                console.error('Error inserting challan:', insertError)
                errors.push(`Failed to create challan for ${student.name}`)
                failed++
            } else {
                success++
            }
        } catch (error: any) {
            console.error('Error generating challan:', error)
            errors.push(`Error for ${student.name}: ${error.message}`)
            failed++
        }
    }

    return { success, failed, errors }
}

/**
 * Get challan summary for preview
 */
export async function getChallanPreview(
    params: GenerateChallanParams
): Promise<ChallanSummary> {
    const { month, classIds, selectedFeeTypes, carryForward } = params

    // Get students
    let studentsQuery = supabase
        .from('students')
        .select('id, class_id')
        .eq('status', 'active')

    if (classIds && classIds.length > 0) {
        studentsQuery = studentsQuery.in('class_id', classIds)
    }

    const { data: students } = await studentsQuery

    if (!students || students.length === 0) {
        return {
            totalStudents: 0,
            totalAmount: 0,
            feeBreakdown: {},
            studentsWithPreviousBalance: 0,
            averageAmount: 0
        }
    }

    let totalAmount = 0
    let studentsWithPreviousBalance = 0
    const feeBreakdown: Record<string, number> = {}

    // Sample calculation for first few students
    const sampleSize = Math.min(5, students.length)
    let sampleTotal = 0

    for (let i = 0; i < sampleSize; i++) {
        const fees = await calculateStudentFees(
            students[i].id,
            selectedFeeTypes,
            carryForward,
            month
        )
        sampleTotal += fees.total_amount

        if (fees.previous_balance > 0) {
            studentsWithPreviousBalance++
        }
    }

    // Estimate for all students
    const averageAmount = sampleTotal / sampleSize
    totalAmount = averageAmount * students.length

    return {
        totalStudents: students.length,
        totalAmount: totalAmount,
        feeBreakdown: feeBreakdown,
        studentsWithPreviousBalance: Math.round((studentsWithPreviousBalance / sampleSize) * students.length),
        averageAmount: averageAmount
    }
}
