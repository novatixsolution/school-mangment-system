import { supabase } from './supabase/client'

export interface BulkEditParams {
    challanIds: string[]
    updates: {
        discount?: number
        due_date?: string
        notes?: string
    }
}

export interface BulkActionResult {
    success: number
    failed: number
    errors: string[]
}

/**
 * Bulk edit challans (discount, due date, notes)
 * Only works on pending challans
 */
export async function bulkEditChallans(params: BulkEditParams): Promise<BulkActionResult> {
    const result: BulkActionResult = {
        success: 0,
        failed: 0,
        errors: []
    }

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            result.errors.push('User not authenticated')
            return result
        }

        // Verify all challans are pending
        const { data: challans } = await supabase
            .from('fee_challans')
            .select('id, status')
            .in('id', params.challanIds)

        if (!challans) {
            result.errors.push('No challans found')
            return result
        }

        const nonPendingChallans = challans.filter(c => c.status !== 'pending')
        if (nonPendingChallans.length > 0) {
            result.errors.push(`${nonPendingChallans.length} challan(s) are not pending and cannot be edited`)
        }

        const pendingIds = challans
            .filter(c => c.status === 'pending')
            .map(c => c.id)

        if (pendingIds.length === 0) {
            return result
        }

        // Prepare update object
        const updateData: any = {
            updated_at: new Date().toISOString()
        }

        if (params.updates.discount !== undefined) {
            updateData.discount = params.updates.discount
        }
        if (params.updates.due_date) {
            updateData.due_date = params.updates.due_date
        }
        if (params.updates.notes !== undefined) {
            updateData.notes = params.updates.notes
        }

        // Recalculate total_amount if discount changed
        if (params.updates.discount !== undefined) {
            // Need to update each challan individually to recalculate
            for (const challanId of pendingIds) {
                const { data: challan } = await supabase
                    .from('fee_challans')
                    .select('tuition_fee, admission_fee, exam_fee, other_fee')
                    .eq('id', challanId)
                    .single()

                if (challan) {
                    const subtotal = challan.tuition_fee + challan.admission_fee + challan.exam_fee + challan.other_fee
                    const newTotal = Math.max(0, subtotal - (params.updates.discount || 0))

                    const { error } = await supabase
                        .from('fee_challans')
                        .update({
                            ...updateData,
                            total_amount: newTotal
                        })
                        .eq('id', challanId)

                    if (error) {
                        result.failed++
                        result.errors.push(`Failed to update challan ${challanId}: ${error.message}`)
                    } else {
                        result.success++
                    }
                }
            }
        } else {
            // Bulk update without recalculation
            const { error } = await supabase
                .from('fee_challans')
                .update(updateData)
                .in('id', pendingIds)

            if (error) {
                result.failed = pendingIds.length
                result.errors.push(error.message)
            } else {
                result.success = pendingIds.length
            }
        }

    } catch (error: any) {
        result.errors.push(error.message || 'Unknown error occurred')
    }

    return result
}

/**
 * Bulk delete pending challans
 */
export async function bulkDeleteChallans(challanIds: string[]): Promise<BulkActionResult> {
    const result: BulkActionResult = {
        success: 0,
        failed: 0,
        errors: []
    }

    try {
        // Verify all challans are pending
        const { data: challans } = await supabase
            .from('fee_challans')
            .select('id, status')
            .in('id', challanIds)

        if (!challans) {
            result.errors.push('No challans found')
            return result
        }

        const nonPendingChallans = challans.filter(c => c.status !== 'pending')
        if (nonPendingChallans.length > 0) {
            result.failed = nonPendingChallans.length
            result.errors.push(`${nonPendingChallans.length} challan(s) cannot be deleted (not pending)`)
        }

        const pendingIds = challans
            .filter(c => c.status === 'pending')
            .map(c => c.id)

        if (pendingIds.length === 0) {
            return result
        }

        // Delete pending challans
        const { error } = await supabase
            .from('fee_challans')
            .delete()
            .in('id', pendingIds)

        if (error) {
            result.failed = pendingIds.length
            result.errors.push(error.message)
        } else {
            result.success = pendingIds.length
        }

    } catch (error: any) {
        result.errors.push(error.message || 'Unknown error occurred')
    }

    return result
}

/**
 * Bulk mark challans as paid
 */
export async function bulkMarkAsPaid(challanIds: string[]): Promise<BulkActionResult> {
    const result: BulkActionResult = {
        success: 0,
        failed: 0,
        errors: []
    }

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            result.errors.push('User not authenticated')
            return result
        }

        // Get challans to mark as paid
        const { data: challans } = await supabase
            .from('fee_challans')
            .select('id, status, total_amount')
            .in('id', challanIds)
            .eq('status', 'pending')

        if (!challans || challans.length === 0) {
            result.errors.push('No pending challans found')
            return result
        }

        // Mark each as paid
        for (const challan of challans) {
            const { error } = await supabase
                .from('fee_challans')
                .update({
                    status: 'paid',
                    payment_date: new Date().toISOString(),
                    amount_paid: challan.total_amount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', challan.id)

            if (error) {
                result.failed++
                result.errors.push(`Failed to mark challan ${challan.id} as paid: ${error.message}`)
            } else {
                result.success++
            }
        }

    } catch (error: any) {
        result.errors.push(error.message || 'Unknown error occurred')
    }

    return result
}

/**
 * Bulk send payment reminders
 */
export async function bulkSendReminders(
    challanIds: string[],
    reminderType: 'sms' | 'email' | 'both' = 'sms'
): Promise<BulkActionResult> {
    const result: BulkActionResult = {
        success: 0,
        failed: 0,
        errors: []
    }

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            result.errors.push('User not authenticated')
            return result
        }

        // Get pending challans with student info
        const { data: challans } = await supabase
            .from('fee_challans')
            .select(`
                id,
                challan_number,
                student_id,
                total_amount,
                due_date,
                month,
                student:students(
                    id,
                    name,
                    father_phone,
                    class:classes(class_name)
                )
            `)
            .in('id', challanIds)
            .eq('status', 'pending')

        if (!challans || challans.length === 0) {
            result.errors.push('No pending challans found')
            return result
        }

        // Get reminder template
        const { data: template } = await supabase
            .from('reminder_templates')
            .select('*')
            .eq('template_type', reminderType === 'both' ? 'sms' : reminderType)
            .eq('is_active', true)
            .limit(1)
            .single()

        const templateMessage = template?.message_template || 'Payment reminder for challan {challan_number}'

        // Send reminders and log
        for (const challan of challans) {
            if (!challan.student) continue

            // In a real implementation, you would call SMS/Email API here
            // For now, we'll just log the reminder

            const { error } = await supabase
                .from('reminder_history')
                .insert({
                    challan_id: challan.id,
                    student_id: challan.student_id,
                    reminder_type: reminderType,
                    template_used: templateMessage,
                    sent_by: user.id,
                    status: 'sent'
                })

            if (error) {
                result.failed++
                result.errors.push(`Failed to log reminder for challan ${challan.id}: ${error.message}`)
            } else {
                result.success++
            }
        }

        console.log(`✅ Sent ${result.success} reminder(s)`)

    } catch (error: any) {
        result.errors.push(error.message || 'Unknown error occurred')
    }

    return result
}

/**
 * Get reminder history for a challan
 */
export async function getReminderHistory(challanId: string) {
    try {
        const { data, error } = await supabase
            .from('reminder_history')
            .select(`
                *,
                sent_by_user:auth.users(email)
            `)
            .eq('challan_id', challanId)
            .order('sent_at', { ascending: false })

        if (error) throw error
        return data || []

    } catch (error) {
        console.error('Error fetching reminder history:', error)
        return []
    }
}

/**
 * Get reminder count for a student
 */
export async function getStudentReminderCount(studentId: string): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('reminder_history')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', studentId)

        if (error) throw error
        return count || 0

    } catch (error) {
        console.error('Error getting reminder count:', error)
        return 0
    }
}
