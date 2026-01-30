import { supabase } from './supabase/client'
import { getCollectionStats } from './collection-analytics'
import { getUnpaidStudents } from './unpaid-students'

export interface DashboardStats {
    // Student Stats
    totalStudents: number
    studentsWithIds: number
    studentsWithoutChallans: number

    // Challan Stats
    totalChallans: number
    paidChallans: number
    pendingChallans: number
    overdueChallans: number

    // Collection Stats
    totalCollection: number
    pendingAmount: number
    todayCollection: number
    monthCollection: number
    collectionRate: number

    // Unpaid Stats
    unpaidStudentsCount: number
    criticalUnpaidCount: number
}

export interface RecentPayment {
    id: string
    challan_number: string
    student_name: string
    class_name: string
    amount: number
    payment_date: string
}

export interface RecentChallan {
    id: string
    challan_number: string
    student_name: string
    class_name: string
    month: string
    total_amount: number
    status: string
    created_at: string
}

export interface RecentStudent {
    id: string
    name: string
    class_name: string
    roll_number: string
    admission_date: string
}

export interface OverdueAlert {
    id: string
    challan_number: string
    student_name: string
    class_name: string
    due_date: string
    days_overdue: number
    amount: number
}

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        // Parallel queries for better performance
        const [
            studentsResult,
            challansResult,
            collectionStatsResult,
            unpaidResult
        ] = await Promise.all([
            // Students
            supabase
                .from('students')
                .select('id, student_id')
                .eq('status', 'active'),

            // Challans
            supabase
                .from('fee_challans')
                .select('id, status, total_amount, amount_paid, due_date'),

            // Collection stats
            getCollectionStats(),

            // Unpaid students
            getUnpaidStudents()
        ])

        const students = studentsResult.data || []
        const challans = challansResult.data || []

        // Calculate stats
        const totalStudents = students.length
        const studentsWithIds = students.filter(s => s.student_id).length

        const totalChallans = challans.length
        const paidChallans = challans.filter(c => c.status === 'paid').length
        const pendingChallans = challans.filter(c => c.status === 'pending').length

        // Calculate overdue
        const today = new Date()
        const overdueChallans = challans.filter(c => {
            if (c.status !== 'pending') return false
            const dueDate = new Date(c.due_date)
            return dueDate < today
        }).length

        const totalCollection = collectionStatsResult.totalCollected
        const pendingAmount = challans
            .filter(c => c.status === 'pending')
            .reduce((sum, c) => sum + (c.total_amount || 0), 0)

        // Students without challans (current month)
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
        const { data: monthChallans } = await supabase
            .from('fee_challans')
            .select('student_id')
            .eq('month', currentMonth)

        const challanStudentIds = new Set(monthChallans?.map(c => c.student_id) || [])
        const studentsWithoutChallans = students.filter(s => !challanStudentIds.has(s.id)).length

        return {
            totalStudents,
            studentsWithIds,
            studentsWithoutChallans,
            totalChallans,
            paidChallans,
            pendingChallans,
            overdueChallans,
            totalCollection,
            pendingAmount,
            todayCollection: collectionStatsResult.todayCollection,
            monthCollection: collectionStatsResult.monthlyCollection,
            collectionRate: collectionStatsResult.collectionRate,
            unpaidStudentsCount: unpaidResult.students.length,
            criticalUnpaidCount: unpaidResult.criticalCount
        }

    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error)
        return {
            totalStudents: 0,
            studentsWithIds: 0,
            studentsWithoutChallans: 0,
            totalChallans: 0,
            paidChallans: 0,
            pendingChallans: 0,
            overdueChallans: 0,
            totalCollection: 0,
            pendingAmount: 0,
            todayCollection: 0,
            monthCollection: 0,
            collectionRate: 0,
            unpaidStudentsCount: 0,
            criticalUnpaidCount: 0
        }
    }
}

/**
 * Get recent payments (last 10)
 */
export async function getRecentPayments(): Promise<RecentPayment[]> {
    try {
        const { data } = await supabase
            .from('fee_challans')
            .select(`
                id,
                challan_number,
                amount_paid,
                payment_date,
                student:students(
                    name,
                    student_id,
                    class:classes(class_name)
                )
            `)
            .eq('status', 'paid')
            .not('payment_date', 'is', null)
            .order('payment_date', { ascending: false })
            .limit(10)

        if (!data) return []

        return data.map((p: any) => ({
            id: p.id,
            challan_number: p.challan_number,
            student_name: p.student?.name || 'Unknown',
            class_name: p.student?.class?.class_name || 'Unknown',
            amount: p.amount_paid || 0,
            payment_date: p.payment_date
        }))

    } catch (error) {
        console.error('Error fetching recent payments:', error)
        return []
    }
}

/**
 * Get recently generated challans (last 10)
 */
export async function getRecentChallans(): Promise<RecentChallan[]> {
    try {
        const { data } = await supabase
            .from('fee_challans')
            .select(`
                id,
                challan_number,
                month,
                total_amount,
                status,
                created_at,
                student:students(
                    name,
                    student_id,
                    class:classes(class_name)
                )
            `)
            .order('created_at', { ascending: false })
            .limit(10)

        if (!data) return []

        return data.map((c: any) => ({
            id: c.id,
            challan_number: c.challan_number,
            student_name: c.student?.name || 'Unknown',
            class_name: c.student?.class?.class_name || 'Unknown',
            month: c.month,
            total_amount: c.total_amount || 0,
            status: c.status,
            created_at: c.created_at
        }))

    } catch (error) {
        console.error('Error fetching recent challans:', error)
        return []
    }
}

/**
 * Get recent student admissions (last 10)
 */
export async function getRecentStudents(): Promise<RecentStudent[]> {
    try {
        const { data } = await supabase
            .from('students')
            .select(`
                id,
                name,
                student_id,
                roll_number,
                admission_date,
                class:classes(class_name)
            `)
            .eq('status', 'active')
            .order('admission_date', { ascending: false })
            .limit(10)

        if (!data) return []

        return data.map((s: any) => ({
            id: s.id,
            name: s.name,
            class_name: s.class?.class_name || 'Unknown',
            roll_number: s.roll_number,
            admission_date: s.admission_date
        }))

    } catch (error) {
        console.error('Error fetching recent students:', error)
        return []
    }
}

/**
 * Get overdue alerts (top 10 most overdue)
 */
export async function getOverdueAlerts(): Promise<OverdueAlert[]> {
    try {
        const { data } = await supabase
            .from('fee_challans')
            .select(`
                id,
                challan_number,
                due_date,
                total_amount,
                student:students(
                    name,
                    student_id,
                    class:classes(class_name)
                )
            `)
            .eq('status', 'pending')
            .order('due_date', { ascending: true })
            .limit(10)

        if (!data) return []

        const today = new Date()

        return data
            .map((c: any) => {
                const dueDate = new Date(c.due_date)
                const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))

                return {
                    id: c.id,
                    challan_number: c.challan_number,
                    student_name: c.student?.name || 'Unknown',
                    class_name: c.student?.class?.class_name || 'Unknown',
                    due_date: c.due_date,
                    days_overdue: daysOverdue,
                    amount: c.total_amount || 0
                }
            })
            .filter(a => a.days_overdue > 0)
            .sort((a, b) => b.days_overdue - a.days_overdue)

    } catch (error) {
        console.error('Error fetching overdue alerts:', error)
        return []
    }
}
