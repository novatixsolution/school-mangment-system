import { useState, useEffect } from 'react'
import { X, DollarSign, Calendar, AlertCircle, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { getStudentFees } from '@/lib/fee-structure-sync'

interface FeeOption {
    value: string
    label: string
    amount: number
    checked: boolean
    required: boolean
}

interface Props {
    isOpen: boolean
    onClose: () => void
    studentId?: string
    onGenerated: () => void
}

export function IndividualChallanModal({ isOpen, onClose, studentId, onGenerated }: Props) {
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [student, setStudent] = useState<any>(null)
    const [selectedMonth, setSelectedMonth] = useState('')
    const [feeOptions, setFeeOptions] = useState<FeeOption[]>([])
    const [discount, setDiscount] = useState(0)
    const [feeSource, setFeeSource] = useState<'original' | 'custom'>('original')

    useEffect(() => {
        if (isOpen && studentId) {
            fetchStudentData()
            setDefaultMonth()
        }
    }, [isOpen, studentId])

    const setDefaultMonth = () => {
        const currentDate = new Date()
        const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        setSelectedMonth(month)
    }

    const fetchStudentData = async () => {
        try {
            setLoading(true)

            // Fetch student basic info
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select(`
                    *,
                    class:classes(id, class_name),
                    section:sections(section_name)
                `)
                .eq('id', studentId)
                .single()

            if (studentError) throw studentError
            setStudent(studentData)

            // Fetch student fees using new getStudentFees function
            const studentFees = await getStudentFees(studentId!)

            if (!studentFees) {
                console.error('No fees found for student')
                return
            }

            console.log('Student fees loaded:', studentFees)

            // Set fee source indicator
            setFeeSource(studentFees.use_custom_fees ? 'custom' : 'original')

            // Build fee options from student fees
            const options: FeeOption[] = [
                {
                    value: 'tuition',
                    label: 'Monthly Tuition Fee',
                    amount: studentFees.tuition_fee, // Already resolved (custom or original)
                    checked: true, // Always required
                    required: true
                },
                {
                    value: 'admission',
                    label: 'Admission Fee',
                    amount: studentFees.admission_fee,
                    checked: studentFees.admission_fee > 0,
                    required: false
                },
                {
                    value: 'mid_exam',
                    label: 'Mid Exam Fee',
                    amount: studentFees.exam_fee ? Math.floor(studentFees.exam_fee / 2) : 0,
                    checked: studentFees.exam_fee > 0,
                    required: false
                },
                {
                    value: 'final_exam',
                    label: 'Final Exam Fee',
                    amount: studentFees.exam_fee ? Math.ceil(studentFees.exam_fee / 2) : 0,
                    checked: studentFees.exam_fee > 0,
                    required: false
                },
                {
                    value: 'sports',
                    label: 'Sports Fee',
                    amount: studentFees.other_fee ? Math.floor(studentFees.other_fee * 0.3) : 0,
                    checked: false,
                    required: false
                },
                {
                    value: 'science_lab',
                    label: 'Science Lab Fee',
                    amount: studentFees.other_fee ? Math.floor(studentFees.other_fee * 0.4) : 0,
                    checked: false,
                    required: false
                },
                {
                    value: 'computer_lab',
                    label: 'Computer Lab Fee',
                    amount: studentFees.other_fee ? Math.ceil(studentFees.other_fee * 0.3) : 0,
                    checked: false,
                    required: false
                }
            ]

            console.log('Built fee options:', options)
            setFeeOptions(options)

        } catch (error) {
            console.error('Error fetching student data:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleFee = (value: string) => {
        setFeeOptions(options =>
            options.map(opt =>
                opt.value === value && !opt.required
                    ? { ...opt, checked: !opt.checked }
                    : opt
            )
        )
    }

    const updateAmount = (value: string, amount: number) => {
        setFeeOptions(options =>
            options.map(opt =>
                opt.value === value ? { ...opt, amount } : opt
            )
        )
    }

    const handleGenerate = async () => {
        if (!student || !selectedMonth) return

        try {
            setGenerating(true)

            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError || !user) {
                throw new Error('Unable to get user information')
            }

            // Generate unique challan number
            const timestamp = Date.now()
            const challanNumber = `${selectedMonth.replace('-', '')}-${timestamp.toString().slice(-6)}`

            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 15)

            // Calculate fees by type from checked options
            let monthlyFee = 0
            let admissionFee = 0
            let examFee = 0
            let otherFees = 0

            feeOptions.forEach(opt => {
                if (opt.checked) {
                    if (opt.value === 'tuition') {
                        monthlyFee = opt.amount
                    } else if (opt.value === 'admission') {
                        admissionFee = opt.amount
                    } else if (opt.value.includes('exam')) {
                        examFee += opt.amount
                    } else {
                        otherFees += opt.amount
                    }
                }
            })

            const total = monthlyFee + admissionFee + examFee + otherFees - discount

            console.log('Generating challan:', {
                monthly: monthlyFee,
                admission: admissionFee,
                exam: examFee,
                other: otherFees,
                discount,
                total
            })

            const { data, error: insertError } = await supabase
                .from('fee_challans')
                .insert({
                    student_id: student.id,
                    challan_number: challanNumber,
                    month: selectedMonth,
                    monthly_fee: monthlyFee,
                    admission_fee: admissionFee,
                    exam_fee: examFee,
                    other_fees: otherFees,
                    discount: discount,
                    total_amount: Math.max(0, total),
                    status: 'pending',
                    due_date: dueDate.toISOString().split('T')[0],
                    is_first_challan: false,
                    generated_by: user.id
                })
                .select()

            if (insertError) {
                console.error('Insert error:', insertError)
                throw new Error(`Failed to create challan: ${insertError.message || 'Unknown error'}`)
            }

            console.log('✅ Challan generated successfully')

            onGenerated()
            onClose()
        } catch (error: any) {
            console.error('Error generating challan:', error)
            alert(`Failed to generate challan: ${error.message || 'Unknown error'}`)
        } finally {
            setGenerating(false)
        }
    }

    if (!isOpen) return null

    const totalAmount = feeOptions
        .filter(opt => opt.checked)
        .reduce((sum, opt) => sum + opt.amount, 0) - discount

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Compact Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-6 w-6" />
                            <h2 className="text-lg font-bold">Generate Challan</h2>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-1.5 transition">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-3 text-slate-600">Loading...</p>
                    </div>
                ) : student ? (
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4 space-y-4">
                            {/* Student Info - Compact */}
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 truncate">{student.name}</p>
                                        <p className="text-xs text-slate-600">
                                            {student.class.class_name} • Roll: {student.roll_number}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Fee Source Indicator */}
                            <div className={`rounded-lg p-2 flex items-center gap-2 text-sm ${feeSource === 'custom'
                                    ? 'bg-blue-50 border border-blue-300 text-blue-700'
                                    : 'bg-green-50 border border-green-300 text-green-700'
                                }`}>
                                <Info className="h-4 w-4 flex-shrink-0" />
                                <span className="font-medium">
                                    {feeSource === 'custom'
                                        ? '💰 Using Custom Tuition Fee'
                                        : '✅ Using Original Fee Structure'
                                    }
                                </span>
                            </div>

                            {/* Month Selection */}
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                    <Calendar className="inline h-3.5 w-3.5 mr-1" />
                                    Month
                                </label>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Fee Selection */}
                            <div className="border-2 border-blue-200 rounded-lg p-3 bg-gradient-to-br from-blue-50 to-indigo-50">
                                <h4 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Select Fees to Include
                                </h4>

                                <div className="space-y-2">
                                    {feeOptions.map(option => (
                                        <div
                                            key={option.value}
                                            className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all ${option.checked
                                                ? 'border-blue-500 bg-white shadow-sm'
                                                : 'border-slate-200 bg-white/50'
                                                } ${option.required ? 'bg-blue-50' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={option.checked}
                                                onChange={() => toggleFee(option.value)}
                                                disabled={option.required}
                                                className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <label className="text-xs font-medium text-slate-700 block">
                                                    {option.label}
                                                    {option.required && (
                                                        <span className="text-blue-600 ml-1.5 text-[10px]">(Required)</span>
                                                    )}
                                                </label>
                                            </div>
                                            <input
                                                type="number"
                                                value={option.amount}
                                                onChange={(e) => updateAmount(option.value, parseFloat(e.target.value) || 0)}
                                                disabled={!option.checked}
                                                className="w-20 px-2 py-1 text-xs border rounded text-right disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Discount */}
                                <div className="pt-3 mt-3 border-t-2 border-blue-300">
                                    <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                        <label className="text-xs font-medium text-slate-700">Discount (if any)</label>
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                            className="w-20 px-2 py-1 text-xs border rounded text-right focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="pt-3 mt-3 border-t-2 border-blue-400 bg-gradient-to-r from-blue-100 to-indigo-100 -m-3 p-3 rounded-b-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-900 text-sm">Total Amount</span>
                                        <span className="text-xl font-bold text-blue-600">
                                            {formatCurrency(Math.max(0, totalAmount))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Footer */}
                {!loading && student && (
                    <div className="border-t p-4 bg-slate-50">
                        <div className="flex gap-2">
                            <Button
                                onClick={onClose}
                                variant="outline"
                                className="flex-1"
                                disabled={generating}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGenerate}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={generating || !selectedMonth}
                            >
                                {generating ? 'Generating...' : 'Generate Challan'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
