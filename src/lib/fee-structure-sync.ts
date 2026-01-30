import { supabase } from './supabase/client'

export interface FeeStructure {
    id: string
    class_id: string
    class_name?: string
    tuition_fee: number
    admission_fee: number
    exam_fee: number
    other_fee: number
    version: number
    is_active: boolean
    effective_from: string
    created_by?: string
    updated_at?: string
}

export interface ChallanFees {
    tuition_fee: number
    admission_fee: number
    exam_fee: number
    other_fee: number
    total: number
}

/**
 * Student-level fees (resolved from original or custom fees)
 */
export interface StudentFees {
    student_id: string
    student_name: string
    tuition_fee: number // Resolved: custom if use_custom_fees=true, otherwise original
    admission_fee: number
    exam_fee: number
    other_fee: number
    use_custom_fees: boolean
    custom_tuition_fee: number | null
    original_tuition_fee: number
    original_admission_fee: number
    original_exam_fee: number
    original_other_fee: number
}

/**
 * Get active fee structure for a class
 */
export async function getActiveFeeStructure(classId: string): Promise<FeeStructure | null> {
    try {
        const { data, error } = await supabase
            .from('fee_structures')
            .select(`
                *,
                class:classes(class_name)
            `)
            .eq('class_id', classId)
            .eq('is_active', true)
            .single()

        if (error) throw error

        if (!data) return null

        return {
            ...data,
            class_name: data.class?.class_name
        }

    } catch (error: any) {
        console.error('Error fetching fee structure:', error)
        return null
    }
}

/**
 * Get student fees (from student record, not fee_structures)
 * Returns resolved fees: custom tuition if enabled, otherwise original fees
 */
export async function getStudentFees(studentId: string): Promise<StudentFees | null> {
    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                id,
                name,
                original_tuition_fee,
                original_admission_fee,
                original_exam_fee,
                original_other_fee,
                custom_tuition_fee,
                use_custom_fees
            `)
            .eq('id', studentId)
            .single()

        if (error) {
            console.error('Error fetching student fees:', error)
            throw new Error(`Failed to fetch student fees: ${error.message}`)
        }

        if (!data) {
            throw new Error(`Student not found with ID: ${studentId}`)
        }

        // Resolve tuition fee: use custom if enabled, otherwise use original
        const resolvedTuitionFee = data.use_custom_fees && data.custom_tuition_fee !== null
            ? data.custom_tuition_fee
            : (data.original_tuition_fee || 0)

        return {
            student_id: data.id,
            student_name: data.name,
            tuition_fee: resolvedTuitionFee,
            admission_fee: data.original_admission_fee || 0,
            exam_fee: data.original_exam_fee || 0,
            other_fee: data.original_other_fee || 0,
            use_custom_fees: data.use_custom_fees || false,
            custom_tuition_fee: data.custom_tuition_fee,
            original_tuition_fee: data.original_tuition_fee || 0,
            original_admission_fee: data.original_admission_fee || 0,
            original_exam_fee: data.original_exam_fee || 0,
            original_other_fee: data.original_other_fee || 0
        }

    } catch (error: any) {
        console.error('Error in getStudentFees:', error)
        return null
    }
}

/**
 * Get fees for multiple students at once
 * Useful for bulk operations
 */
export async function getMultipleStudentFees(studentIds: string[]): Promise<Map<string, StudentFees>> {
    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                id,
                name,
                original_tuition_fee,
                original_admission_fee,
                original_exam_fee,
                original_other_fee,
                custom_tuition_fee,
                use_custom_fees
            `)
            .in('id', studentIds)

        if (error) throw error

        const feesMap = new Map<string, StudentFees>()

        if (data) {
            data.forEach(student => {
                const resolvedTuitionFee = student.use_custom_fees && student.custom_tuition_fee !== null
                    ? student.custom_tuition_fee
                    : (student.original_tuition_fee || 0)

                feesMap.set(student.id, {
                    student_id: student.id,
                    student_name: student.name,
                    tuition_fee: resolvedTuitionFee,
                    admission_fee: student.original_admission_fee || 0,
                    exam_fee: student.original_exam_fee || 0,
                    other_fee: student.original_other_fee || 0,
                    use_custom_fees: student.use_custom_fees || false,
                    custom_tuition_fee: student.custom_tuition_fee,
                    original_tuition_fee: student.original_tuition_fee || 0,
                    original_admission_fee: student.original_admission_fee || 0,
                    original_exam_fee: student.original_exam_fee || 0,
                    original_other_fee: student.original_other_fee || 0
                })
            })
        }

        return feesMap

    } catch (error: any) {
        console.error('Error fetching multiple student fees:', error)
        return new Map()
    }
}

/**
 * Get fee structure by ID (for historical lookups)
 */
export async function getFeeStructureById(feeStructureId: string): Promise<FeeStructure | null> {
    try {
        const { data, error } = await supabase
            .from('fee_structures')
            .select(`
                *,
                class:classes(class_name)
            `)
            .eq('id', feeStructureId)
            .single()

        if (error) throw error

        if (!data) return null

        return {
            ...data,
            class_name: data.class?.class_name
        }

    } catch (error: any) {
        console.error('Error fetching fee structure by ID:', error)
        return null
    }
}

/**
 * Get all fee structure versions for a class (history)
 */
export async function getFeeStructureHistory(classId: string): Promise<FeeStructure[]> {
    try {
        const { data, error } = await supabase
            .from('fee_structures')
            .select(`
                *,
                class:classes(class_name)
            `)
            .eq('class_id', classId)
            .order('version', { ascending: false })

        if (error) throw error

        return (data || []).map(item => ({
            ...item,
            class_name: item.class?.class_name
        }))

    } catch (error: any) {
        console.error('Error fetching fee structure history:', error)
        return []
    }
}

/**
 * Calculate total fees from fee structure
 */
export function calculateFeesFromStructure(feeStructure: FeeStructure, discount: number = 0): ChallanFees {
    const tuition_fee = feeStructure.tuition_fee
    const admission_fee = feeStructure.admission_fee
    const exam_fee = feeStructure.exam_fee
    const other_fee = feeStructure.other_fee

    const subtotal = tuition_fee + admission_fee + exam_fee + other_fee
    const total = Math.max(0, subtotal - discount)

    return {
        tuition_fee,
        admission_fee,
        exam_fee,
        other_fee,
        total
    }
}

/**
 * Validate that a fee structure exists for a class
 */
export async function validateFeeStructureExists(classId: string): Promise<{ valid: boolean; message?: string; feeStructure?: FeeStructure }> {
    const feeStructure = await getActiveFeeStructure(classId)

    if (!feeStructure) {
        return {
            valid: false,
            message: 'No active fee structure found for this class. Please set up the fee structure first.'
        }
    }

    return {
        valid: true,
        feeStructure
    }
}

/**
 * Get fee structure for multiple classes at once
 */
export async function getFeeStructuresByClasses(classIds: string[]): Promise<Map<string, FeeStructure>> {
    try {
        const { data, error } = await supabase
            .from('fee_structures')
            .select(`
                *,
                class:classes(class_name)
            `)
            .in('class_id', classIds)
            .eq('is_active', true)

        if (error) throw error

        const feeStructureMap = new Map<string, FeeStructure>()

        if (data) {
            data.forEach(item => {
                feeStructureMap.set(item.class_id, {
                    ...item,
                    class_name: item.class?.class_name
                })
            })
        }

        return feeStructureMap

    } catch (error: any) {
        console.error('Error fetching fee structures by classes:', error)
        return new Map()
    }
}

/**
 * Create a new version of fee structure
 */
export async function createFeeStructureVersion(
    classId: string,
    fees: {
        tuition_fee: number
        admission_fee: number
        exam_fee: number
        other_fee: number
    }
): Promise<{ success: boolean; feeStructureId?: string; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'User not authenticated' }
        }

        const { data, error } = await supabase.rpc('create_fee_structure_version', {
            p_class_id: classId,
            p_tuition_fee: fees.tuition_fee,
            p_admission_fee: fees.admission_fee,
            p_exam_fee: fees.exam_fee,
            p_other_fee: fees.other_fee,
            p_user_id: user.id
        })

        if (error) throw error

        return {
            success: true,
            feeStructureId: data
        }

    } catch (error: any) {
        console.error('Error creating fee structure version:', error)
        return {
            success: false,
            error: error.message || 'Failed to create fee structure version'
        }
    }
}

/**
 * Check if fee structure has changed since a specific date
 */
export async function hasFeeStructureChanged(classId: string, sinceDate: Date): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('fee_structures')
            .select('id, updated_at')
            .eq('class_id', classId)
            .gte('updated_at', sinceDate.toISOString())
            .limit(1)

        if (error) throw error

        return (data && data.length > 0)

    } catch (error: any) {
        console.error('Error checking fee structure changes:', error)
        return false
    }
}

/**
 * Regenerate challans for students with new fee structure
 */
export async function regenerateChallansWithNewFees(
    studentIds: string[],
    month: string,
    dueDate: string,
    feeStructureId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'User not authenticated' }
        }

        // Get fee structure
        const feeStructure = await getFeeStructureById(feeStructureId)
        if (!feeStructure) {
            return { success: false, error: 'Fee structure not found' }
        }

        // Delete existing pending challans for these students in this month
        await supabase
            .from('fee_challans')
            .delete()
            .in('student_id', studentIds)
            .eq('month', month)
            .eq('status', 'pending')

        // Get students details
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('id, name, class_id')
            .in('id', studentIds)

        if (studentsError) throw studentsError

        // Generate new challans
        const challansToCreate = students?.map(student => {
            const fees = calculateFeesFromStructure(feeStructure)

            return {
                student_id: student.id,
                month,
                due_date: dueDate,
                tuition_fee: fees.tuition_fee,
                admission_fee: fees.admission_fee,
                exam_fee: fees.exam_fee,
                other_fee: fees.other_fee,
                discount: 0,
                total_amount: fees.total,
                status: 'pending',
                fee_structure_id: feeStructureId
            }
        }) || []

        const { error: insertError } = await supabase
            .from('fee_challans')
            .insert(challansToCreate)

        if (insertError) throw insertError

        return {
            success: true,
            count: challansToCreate.length
        }

    } catch (error: any) {
        console.error('Error regenerating challans:', error)
        return {
            success: false,
            error: error.message || 'Failed to regenerate challans'
        }
    }
}
