'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Calendar, CreditCard, FileText } from 'lucide-react'

interface Payment {
    id: string
    amount: number
    payment_date: string
    payment_method: string
    notes?: string
    created_at: string
}

interface PaymentHistoryProps {
    studentId: string
    studentName: string
}

export function PaymentHistory({ studentId, studentName }: PaymentHistoryProps) {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalPaid: 0,
        paymentCount: 0,
        lastPayment: null as string | null
    })

    useEffect(() => {
        fetchPayments()
    }, [studentId])

    const fetchPayments = async () => {
        try {
            const { data, error } = await supabase
                .from('fee_payments')
                .select('*')
                .eq('student_id', studentId)
                .order('payment_date', { ascending: false })

            if (error) throw error

            setPayments(data || [])

            // Calculate stats
            const total = data?.reduce((sum, p) => sum + p.amount, 0) || 0
            const lastPmt = data?.[0]?.payment_date || null

            setStats({
                totalPaid: total,
                paymentCount: data?.length || 0,
                lastPayment: lastPmt
            })
        } catch (error) {
            console.error('Error fetching payments:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Payment History</h3>
                <p className="text-sm text-slate-500">{studentName}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
                                <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total Paid</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {formatCurrency(stats.totalPaid)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100">
                                <FileText className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Payments</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {stats.paymentCount}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Last Payment</p>
                                <p className="text-sm font-medium text-slate-900">
                                    {stats.lastPayment ? formatDate(stats.lastPayment) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment List */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    {payments.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p>No payments found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {payments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
                                            <CreditCard className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {formatCurrency(payment.amount)}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {formatDate(payment.payment_date)} • {payment.payment_method}
                                            </p>
                                            {payment.notes && (
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {payment.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                            Paid
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
