import { supabase } from './supabase/client'
import { generateChallanNumber } from './challan-generator'

/**
 * Auto-generate first challan for newly admitted student
 * Called when admission is approved and student record is created
 */
export async function generateFirstChallan(
    studentId: string,
    classId: string,
    admissionFee: number,
    feeDiscount: number = 0,
    userId: string,
    admissionMonth?: string
): Promise<{ success: boolean; challanId?: string; error?: string }> {
    try {
        // 1. Get student details with custom fees
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select(`
                id,
                name,
                use_custom_fees,
                custom_tuition_fee,
                custom_exam_fee,
                fee_discount,
                class_id
            `)
            .eq('id', studentId)
            .single()

        if (studentError || !student) {
            throw new Error('Student not found')
        }

        // 2. Determine which month to generate challan for
        const currentDate = new Date()
        const month = admissionMonth || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

        // 3. Determine fees to use
        let monthlyTuitionFee = 0
        let examFee = 0

        if (student.use_custom_fees) {
            // Use custom fees set in admission form
            monthlyTuitionFee = student.custom_tuition_fee || 0
            examFee = student.custom_exam_fee || 0
        } else {
            // Get fees from class fee structure
            const { data: feeStructures, error: feeError } = await supabase
                .from('fee_structures')
                .select('*')
                .eq('class_id', classId)
                .in('frequency', ['monthly', 'one_time'])

            if (feeError) throw feeError

            // Get monthly tuition fee
            const monthlyFee = feeStructures?.find(f =>
                f.frequency === 'monthly' &&
                (f.fee_type === 'tuition' || f.name.toLowerCase().includes('tuition'))
            )
            monthlyTuitionFee = monthlyFee?.amount || 0

            // Get exam fee if exists
            const examFeeStructure = feeStructures?.find(f =>
                f.fee_type === 'exam' || f.name.toLowerCase().includes('exam')
            )
            examFee = examFeeStructure?.amount || 0
        }

        // 4. Check if challan already exists for this month
        const { data: existingChallan } = await supabase
            .from('fee_challans')
            .select('id')
            .eq('student_id', studentId)
            .eq('month', month)
            .single()

        if (existingChallan) {
            return {
                success: false,
                error: 'Challan already exists for this month'
            }
        }

        // 5. Generate unique challan number
        const challanNumber = generateChallanNumber(month, 1) // Will be auto-incremented by function

        // 6. Calculate due date (15 days from now)
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 15)

        // 7. Calculate total amount
        const totalAmount = monthlyTuitionFee + admissionFee + examFee - feeDiscount

        console.log('📝 About to insert challan with data:', {
            student_id: studentId,
            challan_number: challanNumber,
            month: month,
            monthly_fee: monthlyTuitionFee,
            admission_fee: admissionFee,
            exam_fee: examFee,
            discount: feeDiscount,
            total_amount: Math.max(0, totalAmount),
            generated_by: userId
        })

        // 8. Create first challan
        const { data: challan, error: challanError } = await supabase
            .from('fee_challans')
            .insert({
                student_id: studentId,
                challan_number: challanNumber,
                month: month,
                monthly_fee: monthlyTuitionFee,
                admission_fee: admissionFee,
                exam_fee: examFee,
                other_fees: 0,
                discount: feeDiscount,
                total_amount: Math.max(0, totalAmount),
                status: 'pending',
                due_date: dueDate.toISOString().split('T')[0],
                is_first_challan: true,
                challan_type: 'first_admission',
                notes: `First challan - New admission for ${new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
                generated_by: userId
            })
            .select('id')
            .single()

        if (challanError) {
            console.error('❌ Database error creating challan:', challanError)
            console.error('❌ Error details:', JSON.stringify(challanError, null, 2))
            throw new Error(`Database error: ${challanError.message || challanError.code || 'Unknown error'}`)
        }

        return {
            success: true,
            challanId: challan.id
        }
    } catch (error: any) {
        console.error('Error generating first challan:', error)
        console.error('Error details:', {
            message: error?.message,
            code: error?.code,
            details: error?.details,
            hint: error?.hint,
            full: error
        })
        return {
            success: false,
            error: error.message || error?.details || 'Failed to generate first challan'
        }
    }
}

/**
 * Calculate due date for challan
 * Default: 15 days from current date
 */
function calculateDueDate(baseDate: Date = new Date(), daysToAdd: number = 15): string {
    const dueDate = new Date(baseDate)
    dueDate.setDate(dueDate.getDate() + daysToAdd)
    return dueDate.toISOString().split('T')[0]
}
