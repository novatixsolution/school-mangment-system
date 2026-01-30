import { supabase } from './supabase/client'

export interface UnpaidStudent {
    id: string
    name: string
    roll_number: string
    student_id?: string
    class_id: string
    class_name: string
    total_unpaid: number
    pending_challans_count: number
    oldest_due_date: string
    days_overdue: number
    challans: Array<{
        id: string
        challan_number: string
        month: string
        total_amount: number
        due_date: string
        status: string
    }>
}

export interface UnpaidStudentsResult {
    students: UnpaidStudent[]
    totalUnpaid: number
    criticalCount: number // >30 days overdue
    error?: string
}

/**
 * Get all students with unpaid (pending/overdue) challans
 * Groups by class and calculates totals
 */
export async function getUnpaidStudents(): Promise<UnpaidStudentsResult> {
    try {
        // Fetch all pending challans with student info
        const { data: pendingChallans, error: challansError } = await supabase
            .from('fee_challans')
            .select(`
                id,
                challan_number,
                month,
                total_amount,
                due_date,
                status,
                student_id,
                student:students(
                    id,
                    name,
                    roll_number,
                    student_id,
                    class_id,
                    class:classes(class_name)
                )
            `)
            .eq('status', 'pending')
            .order('due_date', { ascending: true })

        if (challansError) throw challansError

        if (!pendingChallans || pendingChallans.length === 0) {
            return {
                students: [],
                totalUnpaid: 0,
                criticalCount: 0
            }
        }

        // Group challans by student
        const studentMap = new Map<string, UnpaidStudent>()
        const today = new Date()

        pendingChallans.forEach((challan: any) => {
            if (!challan.student) return

            const studentId = challan.student.id
            const dueDate = new Date(challan.due_date)
            const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))

            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                    id: studentId,
                    name: challan.student.name,
                    roll_number: challan.student.roll_number,
                    student_id: challan.student.student_id,
                    class_id: challan.student.class_id,
                    class_name: challan.student.class?.class_name || 'Unknown',
                    total_unpaid: 0,
                    pending_challans_count: 0,
                    oldest_due_date: challan.due_date,
                    days_overdue: 0,
                    challans: []
                })
            }

            const student = studentMap.get(studentId)!
            student.total_unpaid += challan.total_amount
            student.pending_challans_count += 1
            student.challans.push({
                id: challan.id,
                challan_number: challan.challan_number,
                month: challan.month,
                total_amount: challan.total_amount,
                due_date: challan.due_date,
                status: challan.status
            })

            // Update oldest due date and days overdue
            if (new Date(challan.due_date) < new Date(student.oldest_due_date)) {
                student.oldest_due_date = challan.due_date
            }
            student.days_overdue = Math.max(student.days_overdue, daysOverdue)
        })

        // Convert map to array and sort by days overdue (descending)
        const students = Array.from(studentMap.values())
            .sort((a, b) => b.days_overdue - a.days_overdue)

        // Calculate totals
        const totalUnpaid = students.reduce((sum, s) => sum + s.total_unpaid, 0)
        const criticalCount = students.filter(s => s.days_overdue > 30).length

        console.log('Unpaid students loaded:', {
            count: students.length,
            totalUnpaid,
            criticalCount
        })

        return {
            students,
            totalUnpaid,
            criticalCount
        }

    } catch (error: any) {
        console.error('Error fetching unpaid students:', error)
        return {
            students: [],
            totalUnpaid: 0,
            criticalCount: 0,
            error: error.message || 'Failed to fetch unpaid students'
        }
    }
}

/**
 * Mark all pending challans for a student as paid
 */
export async function markStudentPaid(studentId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'User not authenticated' }
        }

        // Get all pending challans for this student
        const { data: pendingChallans } = await supabase
            .from('fee_challans')
            .select('id, total_amount')
            .eq('student_id', studentId)
            .eq('status', 'pending')

        if (!pendingChallans || pendingChallans.length === 0) {
            return { success: false, error: 'No pending challans found' }
        }

        // Update each challan
        const updates = pendingChallans.map(challan =>
            supabase
                .from('fee_challans')
                .update({
                    status: 'paid',
                    payment_date: new Date().toISOString(),
                    amount_paid: challan.total_amount // Pay full amount
                })
                .eq('id', challan.id)
        )

        const results = await Promise.all(updates)

        // Check if any failed
        const failed = results.some(r => r.error)
        if (failed) {
            throw new Error('Some challans failed to update')
        }

        console.log('✅ Marked all challans as paid for student:', studentId)
        return { success: true }

    } catch (error: any) {
        console.error('Error marking student paid:', error)
        return { success: false, error: error.message || 'Failed to mark paid' }
    }
}

