'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
    Users,
    DollarSign,
    FileText,
    TrendingUp,
    AlertCircle,
    CheckCircle
} from 'lucide-react'
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

interface DashboardStats {
    totalStudents: number
    activeStudents: number
    totalCollection: number
    pendingChallans: number
    thisMonthCollection: number
    collectionByMonth: any[]
    feeDistribution: any[]
    recentPayments: any[]
}

export function DashboardAnalytics() {
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        activeStudents: 0,
        totalCollection: 0,
        pendingChallans: 0,
        thisMonthCollection: 0,
        collectionByMonth: [],
        feeDistribution: [],
        recentPayments: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            // Fetch students count
            const { count: totalCount } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })

            const { count: activeCount } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active')

            // Fetch total collection
            const { data: payments } = await supabase
                .from('fee_payments')
                .select('amount, payment_date')

            const totalCollection = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

            // This month collection
            const currentMonth = new Date().toISOString().slice(0, 7)
            const thisMonthPayments = payments?.filter(p =>
                p.payment_date.startsWith(currentMonth)
            ) || []
            const thisMonthCollection = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0)

            // Collection by month (last 6 months)
            const monthlyData = getMonthlyCollectionData(payments || [])

            // Pending challans
            const { count: pendingCount } = await supabase
                .from('fee_challans')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')

            // Fee distribution by class
            const { data: feeData } = await supabase
                .from('students')
                .select('custom_fee, class:classes(class_name)')

            const feeDistribution = calculateFeeDistribution(feeData || [])

            setStats({
                totalStudents: totalCount || 0,
                activeStudents: activeCount || 0,
                totalCollection,
                pendingChallans: pendingCount || 0,
                thisMonthCollection,
                collectionByMonth: monthlyData,
                feeDistribution,
                recentPayments: []
            })
        } catch (error) {
            console.error('Dashboard data error:', error)
        } finally {
            setLoading(false)
        }
    }

    const getMonthlyCollectionData = (payments: any[]) => {
        const months: any = {}
        const now = new Date()

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now)
            date.setMonth(date.getMonth() - i)
            const monthKey = date.toISOString().slice(0, 7)
            const monthName = date.toLocaleString('default', { month: 'short' })
            months[monthKey] = { month: monthName, amount: 0 }
        }

        payments.forEach(p => {
            const monthKey = p.payment_date.slice(0, 7)
            if (months[monthKey]) {
                months[monthKey].amount += p.amount
            }
        })

        return Object.values(months)
    }

    const calculateFeeDistribution = (students: any[]) => {
        const distribution: any = {}

        students.forEach(s => {
            const className = s.class?.class_name || 'Unknown'
            if (!distribution[className]) {
                distribution[className] = { name: className, count: 0 }
            }
            distribution[className].count++
        })

        return Object.values(distribution)
    }

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-100">
                                <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Students</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
                                <p className="text-xs text-green-600">{stats.activeStudents} active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Collection</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {formatCurrency(stats.totalCollection)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">This Month</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {formatCurrency(stats.thisMonthCollection)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-100">
                                <FileText className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Pending Challans</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.pendingChallans}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Collection Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Collection Trend (Last 6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.collectionByMonth}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    name="Collection"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Student Distribution by Class */}
                <Card>
                    <CardHeader>
                        <CardTitle>Students by Class</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.feeDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, count }) => `${name}: ${count}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {stats.feeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
