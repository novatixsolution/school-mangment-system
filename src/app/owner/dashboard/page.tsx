'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Users, GraduationCap, DollarSign, Calendar, TrendingUp, UserPlus, Clock,
    CheckCircle, AlertCircle, FileText, AlertTriangle, ArrowUpRight,
    Eye, CreditCard, UserCheck
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout'
import { formatCurrency } from '@/lib/utils'
import {
    getDashboardStats,
    getRecentPayments,
    getRecentChallans,
    getRecentStudents,
    getOverdueAlerts,
    DashboardStats,
    RecentPayment,
    RecentChallan,
    RecentStudent,
    OverdueAlert
} from '@/lib/dashboard-analytics'

export default function OwnerDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
    const [recentChallans, setRecentChallans] = useState<RecentChallan[]>([])
    const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([])
    const [overdueAlerts, setOverdueAlerts] = useState<OverdueAlert[]>([])

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const [dashStats, payments, challans, students, overdue] = await Promise.all([
                getDashboardStats(),
                getRecentPayments(),
                getRecentChallans(),
                getRecentStudents(),
                getOverdueAlerts()
            ])

            setStats(dashStats)
            setRecentPayments(payments)
            setRecentChallans(challans)
            setRecentStudents(students)
            setOverdueAlerts(overdue)
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading || !stats) {
        return (
            <DashboardLayout module="dashboard">
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout module="dashboard">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                        <p className="text-sm text-slate-600 mt-1">Overview of your school management system</p>
                    </div>
                    <Button
                        onClick={() => router.push('/owner/challans')}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Go to Challans
                    </Button>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
                    <h2 className="text-lg font-bold text-slate-900 mb-3">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <Button
                            onClick={() => router.push('/owner/challans')}
                            variant="outline"
                            className="h-auto py-3 px-4 justify-start"
                        >
                            <FileText className="h-5 w-5 mr-2 text-purple-600" />
                            <div className="text-left">
                                <p className="font-semibold">Generate Challans</p>
                                <p className="text-xs text-slate-600">Create new fee challans</p>
                            </div>
                        </Button>

                        <Button
                            onClick={() => router.push('/owner/challans')}
                            variant="outline"
                            className="h-auto py-3 px-4 justify-start"
                        >
                            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                            <div className="text-left">
                                <p className="font-semibold">Unpaid Students</p>
                                <p className="text-xs text-slate-600">{stats.unpaidStudentsCount} students</p>
                            </div>
                        </Button>

                        <Button
                            onClick={() => router.push('/owner/challans')}
                            variant="outline"
                            className="h-auto py-3 px-4 justify-start"
                        >
                            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                            <div className="text-left">
                                <p className="font-semibold">Collection Calendar</p>
                                <p className="text-xs text-slate-600">View collections by date</p>
                            </div>
                        </Button>

                        <Button
                            onClick={() => router.push('/owner/students')}
                            variant="outline"
                            className="h-auto py-3 px-4 justify-start"
                        >
                            <Users className="h-5 w-5 mr-2 text-green-600" />
                            <div className="text-left">
                                <p className="font-semibold">View All Students</p>
                                <p className="text-xs text-slate-600">{stats.totalStudents} active</p>
                            </div>
                        </Button>
                    </div>
                </div>

                {/* Overview Stats */}
                <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-3">Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Total Students */}
                        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-600 mb-1">Total Students</p>
                                        <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
                                        <p className="text-xs text-slate-600 mt-1">{stats.studentsWithIds} with IDs</p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <Users className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Challans */}
                        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-600 mb-1">Total Challans</p>
                                        <p className="text-3xl font-bold text-purple-600">{stats.totalChallans}</p>
                                        <p className="text-xs text-green-600 font-medium mt-1">{stats.paidChallans} paid</p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <FileText className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Collection */}
                        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-600 mb-1">Total Collection</p>
                                        <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalCollection)}</p>
                                        <p className="text-xs text-green-600 font-medium mt-1">{stats.collectionRate.toFixed(1)}% rate</p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <TrendingUp className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending Amount */}
                        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-600 mb-1">Pending Amount</p>
                                        <p className="text-3xl font-bold text-orange-600">{formatCurrency(stats.pendingAmount)}</p>
                                        <p className="text-xs text-slate-600 mt-1">{stats.pendingChallans} challans</p>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <DollarSign className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Collection Stats */}
                <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-3">Collection Insights</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Today's Collection */}
                        <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-slate-600 mb-1">Today&apos;s Collection</p>
                                <p className="text-2xl font-bold text-teal-600">{formatCurrency(stats.todayCollection)}</p>
                            </CardContent>
                        </Card>

                        {/* This Month */}
                        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-slate-600 mb-1">This Month</p>
                                <p className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.monthCollection)}</p>
                            </CardContent>
                        </Card>

                        {/* Students Without Challans */}
                        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-slate-600 mb-1">Without Challans</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.studentsWithoutChallans}</p>
                                <p className="text-xs text-slate-600 mt-1">students</p>
                            </CardContent>
                        </Card>

                        {/* Overdue Challans */}
                        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-slate-600 mb-1">Overdue Challans</p>
                                <p className="text-2xl font-bold text-red-600">{stats.overdueChallans}</p>
                                {stats.criticalUnpaidCount > 0 && (
                                    <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {stats.criticalUnpaidCount} Critical
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Recent Activity & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Payments */}
                    <Card className="border-2 border-slate-200">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    Recent Payments
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push('/owner/challans')}
                                    className="text-purple-600"
                                >
                                    View All <ArrowUpRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {recentPayments.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-4">No recent payments</p>
                                ) : (
                                    recentPayments.map(payment => (
                                        <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">{payment.student_name}</p>
                                                <p className="text-xs text-slate-600">{payment.class_name} • {payment.challan_number}</p>
                                            </div>
                                            <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Overdue Alerts */}
                    <Card className="border-2 border-red-200 bg-red-50">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    Overdue Alerts
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push('/owner/challans')}
                                    className="text-red-600"
                                >
                                    View All <ArrowUpRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {overdueAlerts.length === 0 ? (
                                    <div className="text-center py-4">
                                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                                        <p className="text-sm text-slate-600">No overdue challans!</p>
                                    </div>
                                ) : (
                                    overdueAlerts.map(alert => (
                                        <div key={alert.id} className="flex items-center justify-between p-3 bg-white border border-red-300 rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">{alert.student_name}</p>
                                                <p className="text-xs text-slate-600">{alert.class_name}</p>
                                                <p className="text-xs text-red-600 font-bold mt-1">{alert.days_overdue} days overdue</p>
                                            </div>
                                            <p className="font-bold text-red-600">{formatCurrency(alert.amount)}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Challans */}
                    <Card className="border-2 border-slate-200">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                    Recently Generated
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push('/owner/challans')}
                                    className="text-purple-600"
                                >
                                    View All <ArrowUpRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {recentChallans.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-4">No recent challans</p>
                                ) : (
                                    recentChallans.map(challan => (
                                        <div key={challan.id} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">{challan.student_name}</p>
                                                <p className="text-xs text-slate-600">{challan.class_name} • {challan.month}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-purple-600">{formatCurrency(challan.total_amount)}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${challan.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {challan.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Admissions */}
                    <Card className="border-2 border-slate-200">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <UserPlus className="h-5 w-5 text-blue-600" />
                                    Recent Admissions
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push('/owner/students')}
                                    className="text-blue-600"
                                >
                                    View All <ArrowUpRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {recentStudents.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-4">No recent admissions</p>
                                ) : (
                                    recentStudents.map(student => (
                                        <div key={student.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">{student.name}</p>
                                                <p className="text-xs text-slate-600">{student.class_name} • Roll: {student.roll_number}</p>
                                            </div>
                                            <p className="text-xs text-slate-600">
                                                {new Date(student.admission_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
