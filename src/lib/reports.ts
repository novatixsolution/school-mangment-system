import { supabase } from './supabase/client'
import { formatCurrency } from './utils'

export interface MonthlyCollectionReport {
    month: string
    total_collected: number
    total_pending: number
    total_challans: number
    paid_challans: number
    pending_challans: number
    collection_rate: number
    class_breakdown: Array<{
        class_name: string
        collected: number
        pending: number
    }>
}

export interface ClassWiseFeeReport {
    class_name: string
    total_students: number
    total_challans: number
    total_amount: number
    collected_amount: number
    pending_amount: number
    collection_rate: number
}

export interface DefaulterReport {
    student_id: string
    student_name: string
    student_id_number: string
    class_name: string
    roll_number: string
    total_pending: number
    pending_challans: number
    oldest_due_date: string
    days_overdue: number
    challans: Array<{
        challan_number: string
        month: string
        amount: number
        due_date: string
        days_overdue: number
    }>
}

export interface CustomDateRangeReport {
    start_date: string
    end_date: string
    total_collected: number
    total_transactions: number
    average_transaction: number
    daily_breakdown: Array<{
        date: string
        collected: number
        transactions: number
    }>
}

/**
 * Generate Monthly Collection Report
 */
export async function getMonthlyCollectionReport(month: string): Promise<MonthlyCollectionReport | null> {
    try {
        // Get all challans for the month
        const { data: challans, error } = await supabase
            .from('fee_challans')
            .select(`
                id,
                total_amount,
                amount_paid,
                status,
                student:students(
                    class:classes(class_name)
                )
            `)
            .eq('month', month)

        if (error) throw error

        if (!challans || challans.length === 0) {
            return null
        }

        // Calculate totals
        const totalChallans = challans.length
        const paidChallans = challans.filter(c => c.status === 'paid').length
        const pendingChallans = challans.filter(c => c.status === 'pending').length

        const totalCollected = challans
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + (c.amount_paid || 0), 0)

        const totalPending = challans
            .filter(c => c.status === 'pending')
            .reduce((sum, c) => sum + c.total_amount, 0)

        const collectionRate = totalChallans > 0
            ? (paidChallans / totalChallans) * 100
            : 0

        // Class-wise breakdown
        const classMap = new Map<string, { collected: number; pending: number }>()

        challans.forEach(challan => {
            const className = challan.student?.class?.class_name || 'Unknown'

            if (!classMap.has(className)) {
                classMap.set(className, { collected: 0, pending: 0 })
            }

            const classData = classMap.get(className)!

            if (challan.status === 'paid') {
                classData.collected += challan.amount_paid || 0
            } else if (challan.status === 'pending') {
                classData.pending += challan.total_amount
            }
        })

        const classBreakdown = Array.from(classMap.entries()).map(([class_name, data]) => ({
            class_name,
            collected: data.collected,
            pending: data.pending
        }))

        return {
            month,
            total_collected: totalCollected,
            total_pending: totalPending,
            total_challans: totalChallans,
            paid_challans: paidChallans,
            pending_challans: pendingChallans,
            collection_rate: collectionRate,
            class_breakdown: classBreakdown
        }

    } catch (error) {
        console.error('Error generating monthly collection report:', error)
        return null
    }
}

/**
 * Generate Class-wise Fee Report
 */
export async function getClassWiseFeeReport(): Promise<ClassWiseFeeReport[]> {
    try {
        const { data: classes, error: classesError } = await supabase
            .from('classes')
            .select('id, class_name')
            .eq('status', 'active')

        if (classesError) throw classesError

        const reports: ClassWiseFeeReport[] = []

        for (const cls of classes || []) {
            // Get student count
            const { count: studentCount } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', cls.id)

            // Get challans for this class
            const { data: students } = await supabase
                .from('students')
                .select('id')
                .eq('class_id', cls.id)

            if (!students || students.length === 0) continue

            const studentIds = students.map(s => s.id)

            const { data: challans } = await supabase
                .from('fee_challans')
                .select('total_amount, amount_paid, status')
                .in('student_id', studentIds)

            const totalChallans = challans?.length || 0
            const totalAmount = challans?.reduce((sum, c) => sum + c.total_amount, 0) || 0
            const collectedAmount = challans
                ?.filter(c => c.status === 'paid')
                .reduce((sum, c) => sum + (c.amount_paid || 0), 0) || 0
            const pendingAmount = challans
                ?.filter(c => c.status === 'pending')
                .reduce((sum, c) => sum + c.total_amount, 0) || 0

            const collectionRate = totalAmount > 0
                ? (collectedAmount / totalAmount) * 100
                : 0

            reports.push({
                class_name: cls.class_name,
                total_students: studentCount || 0,
                total_challans: totalChallans,
                total_amount: totalAmount,
                collected_amount: collectedAmount,
                pending_amount: pendingAmount,
                collection_rate: collectionRate
            })
        }

        return reports.sort((a, b) => a.class_name.localeCompare(b.class_name))

    } catch (error) {
        console.error('Error generating class-wise report:', error)
        return []
    }
}

/**
 * Generate Defaulter Report (Overdue)
 */
export async function getDefaulterReport(daysOverdue: number = 0): Promise<DefaulterReport[]> {
    try {
        const today = new Date()

        // Get all pending challans
        const { data: challans, error } = await supabase
            .from('fee_challans')
            .select(`
                id,
                challan_number,
                month,
                total_amount,
                due_date,
                student_id,
                student:students(
                    id,
                    name,
                    student_id,
                    roll_number,
                    class:classes(class_name)
                )
            `)
            .eq('status', 'pending')
            .order('due_date', { ascending: true })

        if (error) throw error

        // Group by student
        const studentMap = new Map<string, DefaulterReport>()

        challans?.forEach(challan => {
            if (!challan.student) return

            const dueDate = new Date(challan.due_date)
            const daysOverdueCalc = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

            // Only include if overdue by specified days
            if (daysOverdueCalc < daysOverdue) return

            const studentId = challan.student.id

            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                    student_id: studentId,
                    student_name: challan.student.name,
                    student_id_number: challan.student.student_id || 'N/A',
                    class_name: challan.student.class?.class_name || 'Unknown',
                    roll_number: challan.student.roll_number,
                    total_pending: 0,
                    pending_challans: 0,
                    oldest_due_date: challan.due_date,
                    days_overdue: 0,
                    challans: []
                })
            }

            const defaulter = studentMap.get(studentId)!
            defaulter.total_pending += challan.total_amount
            defaulter.pending_challans += 1
            defaulter.days_overdue = Math.max(defaulter.days_overdue, daysOverdueCalc)

            defaulter.challans.push({
                challan_number: challan.challan_number,
                month: challan.month,
                amount: challan.total_amount,
                due_date: challan.due_date,
                days_overdue: daysOverdueCalc
            })

            // Update oldest due date
            if (new Date(challan.due_date) < new Date(defaulter.oldest_due_date)) {
                defaulter.oldest_due_date = challan.due_date
            }
        })

        // Convert to array and sort by days overdue (descending)
        return Array.from(studentMap.values())
            .sort((a, b) => b.days_overdue - a.days_overdue)

    } catch (error) {
        console.error('Error generating defaulter report:', error)
        return []
    }
}

/**
 * Generate Custom Date Range Report
 */
export async function getCustomDateRangeReport(
    startDate: string,
    endDate: string
): Promise<CustomDateRangeReport | null> {
    try {
        // Get all payments in the date range
        const { data: payments, error } = await supabase
            .from('fee_challans')
            .select('payment_date, amount_paid')
            .eq('status', 'paid')
            .gte('payment_date', startDate)
            .lte('payment_date', endDate)
            .order('payment_date', { ascending: true })

        if (error) throw error

        if (!payments || payments.length === 0) {
            return null
        }

        const totalCollected = payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0)
        const totalTransactions = payments.length
        const averageTransaction = totalCollected / totalTransactions

        // Daily breakdown
        const dailyMap = new Map<string, { collected: number; transactions: number }>()

        payments.forEach(payment => {
            const date = payment.payment_date.split('T')[0] // YYYY-MM-DD

            if (!dailyMap.has(date)) {
                dailyMap.set(date, { collected: 0, transactions: 0 })
            }

            const dayData = dailyMap.get(date)!
            dayData.collected += payment.amount_paid || 0
            dayData.transactions += 1
        })

        const dailyBreakdown = Array.from(dailyMap.entries())
            .map(([date, data]) => ({
                date,
                collected: data.collected,
                transactions: data.transactions
            }))
            .sort((a, b) => a.date.localeCompare(b.date))

        return {
            start_date: startDate,
            end_date: endDate,
            total_collected: totalCollected,
            total_transactions: totalTransactions,
            average_transaction: averageTransaction,
            daily_breakdown: dailyBreakdown
        }

    } catch (error) {
        console.error('Error generating custom date range report:', error)
        return null
    }
}

/**
 * Export report to CSV format
 */
export function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvRows = []

    // Add headers
    csvRows.push(headers.join(','))

    // Add data
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header]
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value).replace(/"/g, '""')
            return escaped.includes(',') ? `"${escaped}"` : escaped
        })
        csvRows.push(values.join(','))
    })

    // Create blob and download
    const csvString = csvRows.join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
}

/**
 * Format report data for display
 */
export function formatReportData(report: any): string {
    return JSON.stringify(report, null, 2)
}
