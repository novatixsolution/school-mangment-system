import { useState, useEffect } from 'react'
import { X, Calendar, ChevronLeft, ChevronRight, DollarSign, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { getCollectionsByDate, DailyCollection } from '@/lib/collection-analytics'

interface Props {
    isOpen: boolean
    onClose: () => void
}

export function CollectionCalendarModal({ isOpen, onClose }: Props) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [collections, setCollections] = useState<DailyCollection[]>([])
    const [selectedDate, setSelectedDate] = useState<DailyCollection | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchCollections()
        }
    }, [isOpen, currentDate])

    const fetchCollections = async () => {
        setLoading(true)
        try {
            // Get collections for the current month
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

            const data = await getCollectionsByDate(startOfMonth, endOfMonth)
            setCollections(data)
        } catch (error) {
            console.error('Error fetching collections:', error)
        } finally {
            setLoading(false)
        }
    }

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
        setSelectedDate(null)
    }

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
        setSelectedDate(null)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
        setSelectedDate(null)
    }

    if (!isOpen) return null

    // Calendar calculations
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay() // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Create collection map for quick lookup
    const collectionMap = new Map<string, DailyCollection>()
    collections.forEach(c => collectionMap.set(c.date, c))

    // Calculate max collection for color coding
    const maxCollection = Math.max(...collections.map(c => c.total_amount), 1)

    // Get color based on collection amount
    const getColorClass = (amount: number) => {
        const percentage = (amount / maxCollection) * 100
        if (percentage >= 80) return 'bg-green-500 text-white'
        if (percentage >= 50) return 'bg-green-400 text-white'
        if (percentage >= 25) return 'bg-yellow-400 text-slate-900'
        return 'bg-slate-200 text-slate-700'
    }

    // Generate calendar days
    const calendarDays = []

    // Empty cells for days before first of month
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>)
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const collection = collectionMap.get(dateStr)
        const isToday = dateStr === new Date().toISOString().split('T')[0]
        const isSelected = selectedDate?.date === dateStr

        calendarDays.push(
            <div
                key={day}
                onClick={() => collection && setSelectedDate(collection)}
                className={`
                    p-2 border rounded-lg cursor-pointer transition-all
                    ${collection ? 'hover:shadow-lg ' + getColorClass(collection.total_amount) : 'bg-slate-50 hover:bg-slate-100'}
                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                    ${isSelected ? 'ring-2 ring-purple-500' : ''}
                `}
            >
                <div className="text-right text-xs font-medium mb-1">{day}</div>
                {collection && (
                    <div className="text-center">
                        <div className="text-xs font-bold">{formatCurrency(collection.total_amount)}</div>
                        <div className="text-xs opacity-80">{collection.payment_count} payments</div>
                    </div>
                )}
            </div>
        )
    }

    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const monthTotal = collections.reduce((sum, c) => sum + c.total_amount, 0)
    const monthCount = collections.reduce((sum, c) => sum + c.payment_count, 0)

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-7 w-7" />
                            <div>
                                <h2 className="text-2xl font-bold">Collection Calendar</h2>
                                <p className="text-sm text-blue-100 mt-1">
                                    View daily collection history
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Month Navigation */}
                <div className="border-b p-4 bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button onClick={goToPreviousMonth} variant="outline" size="sm">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <h3 className="text-xl font-bold text-slate-900">{monthName}</h3>
                            <Button onClick={goToNextMonth} variant="outline" size="sm">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button onClick={goToToday} variant="outline" size="sm">
                                Today
                            </Button>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-xs text-slate-600">Month Total</p>
                                <p className="text-lg font-bold text-green-600">{formatCurrency(monthTotal)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-600">Payments</p>
                                <p className="text-lg font-bold text-blue-600">{monthCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Calendar */}
                        <div>
                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-center text-xs font-bold text-slate-600 pb-2">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                    <p className="mt-4 text-slate-600">Loading calendar...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-7 gap-2">
                                    {calendarDays}
                                </div>
                            )}
                        </div>

                        {/* Details Panel */}
                        <div className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
                            {selectedDate ? (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-bold text-slate-900">
                                            {new Date(selectedDate.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                                            <p className="text-xs text-slate-600 mb-1">Total Collection</p>
                                            <p className="text-xl font-bold text-green-600">
                                                {formatCurrency(selectedDate.total_amount)}
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                                            <p className="text-xs text-slate-600 mb-1">Payments</p>
                                            <p className="text-xl font-bold text-blue-600">
                                                {selectedDate.payment_count}
                                            </p>
                                        </div>
                                    </div>

                                    <h5 className="font-bold text-slate-900 mb-2">Payment Details:</h5>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {selectedDate.payments.map(payment => (
                                            <div key={payment.id} className="bg-white border rounded-lg p-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-slate-900">{payment.student_name}</p>
                                                        <p className="text-xs text-slate-600">{payment.class_name} • {payment.challan_number}</p>
                                                    </div>
                                                    <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                    <h4 className="text-lg font-bold text-slate-700 mb-2">Select a Date</h4>
                                    <p className="text-sm text-slate-600">
                                        Click on any highlighted date to view payment details
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t p-4 bg-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span>High</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                            <span>Medium</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-slate-200 rounded"></div>
                            <span>Low</span>
                        </div>
                    </div>
                    <Button onClick={onClose} variant="outline">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    )
}
