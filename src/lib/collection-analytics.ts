import { supabase } from './supabase/client'

export interface DailyCollection {
    date: string
    total_amount: number
    payment_count: number
    payments: Array<{
        id: string
        challan_number: string
        student_name: string
        class_name: string
        amount: number
        payment_date: string
    }>
}

export interface CollectionStats {
    totalCollected: number
    monthlyCollection: number
    todayCollection: number
    weekCollection: number
    collectionRate: number
    avgDailyCollection: number
    totalChallans: number
    paidChallans: number
}

export interface MonthlyTrend {
    month: string
    total: number
    count: number
}

export interface ClassWiseCollection {
    class_name: string
    total_collected: number
    payment_count: number
}

/**
 * Get daily collections for a date range
 */
export async function getCollectionsByDate(startDate: Date, endDate: Date): Promise<DailyCollection[]> {
    try {
        const { data: payments, error } = await supabase
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
            .gte('payment_date', startDate.toISOString())
            .lte('payment_date', endDate.toISOString())
            .order('payment_date', { ascending: true })

        if (error) throw error

        if (!payments || payments.length === 0) {
            return []
        }

        // Group by date
        const dailyMap = new Map<string, DailyCollection>()

        payments.forEach((payment: any) => {
            const date = payment.payment_date.split('T')[0] // YYYY-MM-DD

            if (!dailyMap.has(date)) {
                dailyMap.set(date, {
                    date,
                    total_amount: 0,
                    payment_count: 0,
                    payments: []
                })
            }

            const daily = dailyMap.get(date)!
            daily.total_amount += payment.amount_paid || 0
            daily.payment_count += 1
            daily.payments.push({
                id: payment.id,
                challan_number: payment.challan_number,
                student_name: payment.student?.name || 'Unknown',
                class_name: payment.student?.class?.class_name || 'Unknown',
                amount: payment.amount_paid || 0,
                payment_date: payment.payment_date
            })
        })

        return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    } catch (error: any) {
        console.error('Error fetching collections by date:', error)
        return []
    }
}

/**
 * Get comprehensive collection statistics
 */
export async function getCollectionStats(): Promise<CollectionStats> {
    try {
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday

        // Get all challans
        const { data: allChallans } = await supabase
            .from('fee_challans')
            .select('total_amount, status, amount_paid, payment_date')

        if (!allChallans) {
            return {
                totalCollected: 0,
                monthlyCollection: 0,
                todayCollection: 0,
                weekCollection: 0,
                collectionRate: 0,
                avgDailyCollection: 0,
                totalChallans: 0,
                paidChallans: 0
            }
        }

        const totalChallans = allChallans.length
        const paidChallans = allChallans.filter(c => c.status === 'paid').length

        // Calculate totals
        const totalCollected = allChallans
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + (c.amount_paid || 0), 0)

        const monthlyCollection = allChallans
            .filter(c => c.status === 'paid' && new Date(c.payment_date) >= startOfMonth)
            .reduce((sum, c) => sum + (c.amount_paid || 0), 0)

        const todayStr = today.toISOString().split('T')[0]
        const todayCollection = allChallans
            .filter(c => c.status === 'paid' && c.payment_date?.startsWith(todayStr))
            .reduce((sum, c) => sum + (c.amount_paid || 0), 0)

        const weekCollection = allChallans
            .filter(c => c.status === 'paid' && new Date(c.payment_date) >= startOfWeek)
            .reduce((sum, c) => sum + (c.amount_paid || 0), 0)

        const totalAmount = allChallans.reduce((sum, c) => sum + (c.total_amount || 0), 0)
        const collectionRate = totalAmount > 0 ? (totalCollected / totalAmount) * 100 : 0

        // Calculate average daily collection (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(today.getDate() - 30)

        const last30DaysCollection = allChallans
            .filter(c => c.status === 'paid' && new Date(c.payment_date) >= thirtyDaysAgo)
            .reduce((sum, c) => sum + (c.amount_paid || 0), 0)

        const avgDailyCollection = last30DaysCollection / 30

        return {
            totalCollected,
            monthlyCollection,
            todayCollection,
            weekCollection,
            collectionRate,
            avgDailyCollection,
            totalChallans,
            paidChallans
        }

    } catch (error: any) {
        console.error('Error fetching collection stats:', error)
        return {
            totalCollected: 0,
            monthlyCollection: 0,
            todayCollection: 0,
            weekCollection: 0,
            collectionRate: 0,
            avgDailyCollection: 0,
            totalChallans: 0,
            paidChallans: 0
        }
    }
}

/**
 * Get monthly collection trends (last 6 months)
 */
export async function getMonthlyTrends(): Promise<MonthlyTrend[]> {
    try {
        const { data: payments } = await supabase
            .from('fee_challans')
            .select('amount_paid, payment_date')
            .eq('status', 'paid')
            .not('payment_date', 'is', null)
            .order('payment_date', { ascending: false })

        if (!payments || payments.length === 0) {
            return []
        }

        // Group by month
        const monthlyMap = new Map<string, MonthlyTrend>()

        payments.forEach((payment: any) => {
            const date = new Date(payment.payment_date)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, {
                    month: monthKey,
                    total: 0,
                    count: 0
                })
            }

            const monthly = monthlyMap.get(monthKey)!
            monthly.total += payment.amount_paid || 0
            monthly.count += 1
        })

        // Get last 6 months
        const trends = Array.from(monthlyMap.values())
            .sort((a, b) => b.month.localeCompare(a.month))
            .slice(0, 6)
            .reverse()

        return trends

    } catch (error: any) {
        console.error('Error fetching monthly trends:', error)
        return []
    }
}

/**
 * Get class-wise collection breakdown
 */
export async function getClassWiseCollections(): Promise<ClassWiseCollection[]> {
    try {
        const { data: payments } = await supabase
            .from('fee_challans')
            .select(`
                amount_paid,
                student:students(
                    student_id,
                    class:classes(class_name)
                )
            `)
            .eq('status', 'paid')

        if (!payments || payments.length === 0) {
            return []
        }

        // Group by class
        const classMap = new Map<string, ClassWiseCollection>()

        payments.forEach((payment: any) => {
            const className = payment.student?.class?.class_name || 'Unknown'

            if (!classMap.has(className)) {
                classMap.set(className, {
                    class_name: className,
                    total_collected: 0,
                    payment_count: 0
                })
            }

            const classData = classMap.get(className)!
            classData.total_collected += payment.amount_paid || 0
            classData.payment_count += 1
        })

        return Array.from(classMap.values())
            .sort((a, b) => b.total_collected - a.total_collected)

    } catch (error: any) {
        console.error('Error fetching class-wise collections:', error)
        return []
    }
}
