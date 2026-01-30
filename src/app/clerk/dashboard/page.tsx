'use client'

import { useEffect, useState } from 'react'
import {
    UserPlus,
    DollarSign,
    FileText,
    Clock,
    TrendingUp,
    ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

export default function ClerkDashboard() {
    const [stats, setStats] = useState({
        pendingAdmissions: 0,
        todayCollection: 0,
        totalStudents: 0,
        pendingFees: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const [admissionsRes, studentsRes] = await Promise.all([
                supabase.from('admissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            ])

            setStats({
                pendingAdmissions: admissionsRes.count || 0,
                todayCollection: 0,
                totalStudents: studentsRes.count || 0,
                pendingFees: 0,
            })
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const quickActions = [
        { label: 'New Admission', href: '/clerk/admissions/new', icon: UserPlus, color: 'bg-blue-500' },
        { label: 'Collect Fee', href: '/clerk/fees', icon: DollarSign, color: 'bg-green-500' },
        { label: 'Generate Challan', href: '/clerk/challans', icon: FileText, color: 'bg-purple-500' },
    ]

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Clerk Dashboard</h1>
                    <p className="mt-1 text-slate-500">Manage admissions and fee collection</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="card-hover">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Pending Admissions</p>
                                    <p className="mt-2 text-3xl font-bold text-slate-900">
                                        {loading ? '...' : stats.pendingAdmissions}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
                                    <UserPlus className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="card-hover">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Today&apos;s Collection</p>
                                    <p className="mt-2 text-3xl font-bold text-slate-900">
                                        {loading ? '...' : formatCurrency(stats.todayCollection)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                                    <DollarSign className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="card-hover">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Total Students</p>
                                    <p className="mt-2 text-3xl font-bold text-slate-900">
                                        {loading ? '...' : stats.totalStudents}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                                    <TrendingUp className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="card-hover">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Pending Fees</p>
                                    <p className="mt-2 text-3xl font-bold text-slate-900">
                                        {loading ? '...' : formatCurrency(stats.pendingFees)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {quickActions.map((action) => {
                                const Icon = action.icon
                                return (
                                    <Link
                                        key={action.label}
                                        href={action.href}
                                        className="flex items-center gap-4 p-6 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                                    >
                                        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${action.color} text-white`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-semibold text-slate-900 group-hover:text-indigo-600">
                                                {action.label}
                                            </span>
                                        </div>
                                        <ArrowUpRight className="h-5 w-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
