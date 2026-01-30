import { supabase } from './supabase/client'

export interface UpdateChallanParams {
    challanId: string
    monthlyFee?: number
    admissionFee?: number
    examFee?: number
    otherFees?: number
    discount?: number
    month?: string
    dueDate?: string
    userId: string
}

export interface UpdateChallanResult {
    success: boolean
    error?: string
    data?: any
}

/**
 * Update an existing challan
 * Only pending challans can be edited
 */
export async function updateChallan(params: UpdateChallanParams): Promise<UpdateChallanResult> {
    try {
        const { challanId, userId, ...updateFields } = params

        // 1. Fetch existing challan to validate status
        const { data: existingChallan, error: fetchError } = await supabase
            .from('fee_challans')
            .select('*')
            .eq('id', challanId)
            .single()

        if (fetchError) {
            return { success: false, error: `Failed to fetch challan: ${fetchError.message}` }
        }

        if (!existingChallan) {
            return { success: false, error: 'Challan not found' }
        }

        // 2. Validate only pending challans can be edited
        if (existingChallan.status !== 'pending') {
            return {
                success: false,
                error: `Cannot edit ${existingChallan.status} challan. Only pending challans can be edited.`
            }
        }

        // 3. Build update object with new values (use existing if not provided)
        const monthlyFee = updateFields.monthlyFee ?? existingChallan.monthly_fee
        const admissionFee = updateFields.admissionFee ?? existingChallan.admission_fee
        const examFee = updateFields.examFee ?? existingChallan.exam_fee
        const otherFees = updateFields.otherFees ?? existingChallan.other_fees
        const discount = updateFields.discount ?? existingChallan.discount

        // 4. Recalculate total
        const totalAmount = monthlyFee + admissionFee + examFee + otherFees - discount

        // 5. Prepare update data
        const updateData: any = {
            monthly_fee: monthlyFee,
            admission_fee: admissionFee,
            exam_fee: examFee,
            other_fees: otherFees,
            discount: discount,
            total_amount: Math.max(0, totalAmount),
            last_edited_by: userId,
            last_edited_at: new Date().toISOString(),
            edit_count: (existingChallan.edit_count || 0) + 1
        }

        // Add optional fields if provided
        if (updateFields.month) {
            updateData.month = updateFields.month
        }
        if (updateFields.dueDate) {
            updateData.due_date = updateFields.dueDate
        }

        // 6. Update challan
        const { data, error: updateError } = await supabase
            .from('fee_challans')
            .update(updateData)
            .eq('id', challanId)
            .select()
            .single()

        if (updateError) {
            return { success: false, error: `Failed to update challan: ${updateError.message}` }
        }

        console.log('✅ Challan updated successfully:', data)

        return { success: true, data }

    } catch (error: any) {
        console.error('Error in updateChallan:', error)
        return { success: false, error: error.message || 'Unknown error occurred' }
    }
}
