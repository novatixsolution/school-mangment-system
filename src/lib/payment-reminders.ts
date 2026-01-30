import { supabase } from './supabase/client'
import { format, parseISO, isBefore, addDays } from 'date-fns'

export async function markOverdueChallans() {
    try {
        const today = new Date().toISOString().split('T')[0]

        const { error } = await supabase
            .from('fee_challans')
            .update({ status: 'overdue' })
            .eq('status', 'pending')
            .lt('due_date', today)

        return { success: !error, error }
    } catch (error) {
        return { success: false, error }
    }
}

export async function getOverdueStudents() {
    try {
        const { data, error } = await supabase
            .from('fee_challans')
            .select(`
                *,
                student:students(
                    id,
                    name,
                    father_name,
                    father_phone,
                    class:classes(class_name)
                )
            `)
            .eq('status', 'overdue')
            .order('due_date', { ascending: true })

        if (error) throw error

        return { success: true, data: data || [] }
    } catch (error) {
        return { success: false, error, data: [] }
    }
}

export async function getPendingChallans(daysUntilDue: number = 7) {
    try {
        const futureDate = addDays(new Date(), daysUntilDue).toISOString().split('T')[0]
        const today = new Date().toISOString().split('T')[0]

        const { data, error } = await supabase
            .from('fee_challans')
            .select(`
                *,
                student:students(
                    id,
                    name,
                    father_name,
                    father_phone,
                    class:classes(class_name)
                )
            `)
            .eq('status', 'pending')
            .gte('due_date', today)
            .lte('due_date', futureDate)
            .order('due_date', { ascending: true })

        if (error) throw error

        return { success: true, data: data || [] }
    } catch (error) {
        return { success: false, error, data: [] }
    }
}

export interface PaymentReminderData {
    overdue: any[]
    dueSoon: any[]
    stats: {
        overdueCount: number
        overdueAmount: number
        dueSoonCount: number
        dueSoonAmount: number
    }
}

export async function getPaymentReminders(): Promise<PaymentReminderData> {
    // Mark overdue first
    await markOverdueChallans()

    // Get overdue
    const overdueResult = await getOverdueStudents()
    const overdue = overdueResult.data || []

    // Get due soon (next 7 days)
    const dueSoonResult = await getPendingChallans(7)
    const dueSoon = dueSoonResult.data || []

    const stats = {
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((sum, c) => sum + c.total_amount, 0),
        dueSoonCount: dueSoon.length,
        dueSoonAmount: dueSoon.reduce((sum, c) => sum + c.total_amount, 0)
    }

    return {
        overdue,
        dueSoon,
        stats
    }
}
