'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface Student {
    id: string
    name: string
    roll_number?: string
    feeStatus?: 'paid' | 'pending' | 'partial'
    amountPaid?: number
    amountDue?: number
}

interface FeeStatusModalProps {
    open: boolean
    onClose: () => void
    students: Student[]
    monthlyFee: number
}

export function FeeStatusModal({ open, onClose, students, monthlyFee }: FeeStatusModalProps) {
    const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'partial'>('all')

    const filteredStudents = students.filter(student => {
        if (filter === 'all') return true
        return student.feeStatus === filter
    })

    const paidCount = students.filter(s => s.feeStatus === 'paid').length
    const pendingCount = students.filter(s => s.feeStatus === 'pending').length
    const partialCount = students.filter(s => s.feeStatus === 'partial').length

    const totalCollected = students.reduce((sum, s) => sum + (s.amountPaid || 0), 0)
    const totalDue = students.reduce((sum, s) => sum + (s.amountDue || 0), 0)
    const collectionRate = students.length > 0
        ? Math.round((totalCollected / (totalCollected + totalDue)) * 100)
        : 0

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        Fee Collection Status
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs text-green-600 font-medium">Paid</p>
                            <p className="text-2xl font-bold text-green-700">{paidCount}</p>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs text-yellow-600 font-medium">Partial</p>
                            <p className="text-2xl font-bold text-yellow-700">{partialCount}</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs text-red-600 font-medium">Pending</p>
                            <p className="text-2xl font-bold text-red-700">{pendingCount}</p>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                            <p className="text-xs text-indigo-600 font-medium">Collection</p>
                            <p className="text-2xl font-bold text-indigo-700">{collectionRate}%</p>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-4">
                        <Button
                            onClick={() => setFilter('all')}
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size="sm"
                        >
                            All ({students.length})
                        </Button>
                        <Button
                            onClick={() => setFilter('paid')}
                            variant={filter === 'paid' ? 'default' : 'outline'}
                            size="sm"
                            className={filter === 'paid' ? 'bg-green-600' : ''}
                        >
                            Paid ({paidCount})
                        </Button>
                        <Button
                            onClick={() => setFilter('partial')}
                            variant={filter === 'partial' ? 'default' : 'outline'}
                            size="sm"
                            className={filter === 'partial' ? 'bg-yellow-600' : ''}
                        >
                            Partial ({partialCount})
                        </Button>
                        <Button
                            onClick={() => setFilter('pending')}
                            variant={filter === 'pending' ? 'default' : 'outline'}
                            size="sm"
                            className={filter === 'pending' ? 'bg-red-600' : ''}
                        >
                            Pending ({pendingCount})
                        </Button>
                    </div>

                    {/* Student List */}
                    <div className="space-y-2">
                        {filteredStudents.map((student) => (
                            <div
                                key={student.id}
                                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                                            {student.roll_number || '?'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{student.name}</p>
                                            {student.roll_number && (
                                                <p className="text-xs text-slate-500">Roll #{student.roll_number}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Monthly Fee</p>
                                            <p className="font-bold text-slate-800">Rs. {monthlyFee.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Paid</p>
                                            <p className="font-bold text-green-600">Rs. {(student.amountPaid || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Due</p>
                                            <p className="font-bold text-red-600">Rs. {(student.amountDue || 0).toLocaleString()}</p>
                                        </div>

                                        {student.feeStatus === 'paid' && (
                                            <Badge className="bg-green-100 text-green-700 border-green-300">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Paid
                                            </Badge>
                                        )}
                                        {student.feeStatus === 'partial' && (
                                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Partial
                                            </Badge>
                                        )}
                                        {student.feeStatus === 'pending' && (
                                            <Badge className="bg-red-100 text-red-700 border-red-300">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                Pending
                                            </Badge>
                                        )}

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            Record Payment
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            // TODO: Export to Excel
                            alert('Export to Excel - Coming Soon!')
                        }}
                    >
                        📊 Export Excel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            // TODO: Send WhatsApp reminders
                            alert('WhatsApp Reminders - Coming Soon!')
                        }}
                    >
                        💬 Send Reminders
                    </Button>
                    <Button onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
