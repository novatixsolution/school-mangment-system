'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, DollarSign, ChevronDown, ChevronUp, UserPlus, GraduationCap, Trophy, FlaskConical, Monitor, ClipboardCheck } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { FeeStructure, FeeFrequency } from '@/types/fee'
import { Class } from '@/types/class'
import { formatCurrency } from '@/lib/utils'

// Fee Type Configuration
const feeTypeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string; description: string }> = {
    admission: {
        label: 'Admission Fee',
        icon: UserPlus,
        color: 'text-blue-600',
        bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
        description: 'One-time admission charges'
    },
    tuition: {
        label: 'Tuition Fee',
        icon: GraduationCap,
        color: 'text-purple-600',
        bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
        description: 'Monthly tuition fees'
    },
    sports: {
        label: 'Sports Fee',
        icon: Trophy,
        color: 'text-green-600',
        bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
        description: 'Sports activities fee'
    },
    science_lab: {
        label: 'Science Lab',
        icon: FlaskConical,
        color: 'text-orange-600',
        bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
        description: 'Laboratory charges'
    },
    computer_lab: {
        label: 'Computer Lab',
        icon: Monitor,
        color: 'text-cyan-600',
        bgColor: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
        description: 'Computer lab charges'
    },
    exam: {
        label: 'Mid Exam Fee',
        icon: ClipboardCheck,
        color: 'text-red-600',
        bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
        description: 'Mid-term exam fee'
    },
    final_exam: {
        label: 'Final Exam Fee',
        icon: ClipboardCheck,
        color: 'text-rose-600',
        bgColor: 'bg-gradient-to-br from-rose-500 to-rose-600',
        description: 'Final exam fee'
    }
}

export default function FeesManagement() {
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [formData, setFormData] = useState({
        name: '',
        class_ids: [] as string[],
        amount: '',
        frequency: 'monthly' as FeeFrequency,
        due_day: 10,
        fee_type: 'tuition' as 'tuition' | 'admission' | 'exam' | 'final_exam' | 'science_lab' | 'computer_lab' | 'sports',
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [structuresRes, classesRes] = await Promise.all([
                supabase.from('fee_structures').select('*, class:classes(id, class_name)').order('name'),
                supabase.from('classes').select('*').eq('status', 'active').order('class_name'),
            ])

            if (structuresRes.error) throw structuresRes.error
            if (classesRes.error) throw classesRes.error

            setFeeStructures(structuresRes.data || [])
            setClasses(classesRes.data || [])
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load fee structures')
        } finally {
            setLoading(false)
        }
    }

    // Group fee structures by type
    const groupedFees = feeStructures.reduce((acc, fee) => {
        const type = (fee as any).fee_type || 'tuition'
        if (!acc[type]) acc[type] = []
        acc[type].push(fee)
        return acc
    }, {} as Record<string, FeeStructure[]>)

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(category)) {
            newExpanded.delete(category)
        } else {
            newExpanded.add(category)
        }
        setExpandedCategories(newExpanded)
    }

    const handleCreate = async () => {
        if (!formData.amount) {
            toast.error('Please enter fee amount')
            return
        }

        try {
            // Auto-generate fee name if empty
            const feeName = formData.name.trim() || feeTypeConfig[formData.fee_type]?.label || 'Fee'

            const baseData = {
                name: feeName,
                amount: parseFloat(formData.amount),
                frequency: formData.frequency,
                due_day: formData.due_day,
                fee_type: formData.fee_type,
            }

            if (formData.class_ids.length === 0) {
                const { error } = await supabase.from('fee_structures').insert({
                    ...baseData,
                    class_id: null,
                })
                if (error) throw error
            } else {
                const insertData = formData.class_ids.map(classId => ({
                    ...baseData,
                    class_id: classId,
                }))

                const { error } = await supabase.from('fee_structures').insert(insertData)
                if (error) throw error
            }

            const classCount = formData.class_ids.length || 1
            toast.success(`Fee structure${classCount > 1 ? 's' : ''} created for ${classCount} class${classCount > 1 ? 'es' : ''}!`)
            setIsModalOpen(false)
            resetForm()
            fetchData()
        } catch (error: any) {
            console.error('Error creating fee structure:', error)
            toast.error('Failed to create fee structure')
        }
    }

    const handleUpdate = async () => {
        if (!selectedStructure) return

        try {
            const { error } = await supabase
                .from('fee_structures')
                .update({
                    name: formData.name,
                    class_id: formData.class_ids[0] || null,
                    amount: parseFloat(formData.amount),
                    frequency: formData.frequency,
                    due_day: formData.due_day,
                    fee_type: formData.fee_type,
                })
                .eq('id', selectedStructure.id)

            if (error) throw error

            toast.success('Fee structure updated!')
            setIsModalOpen(false)
            resetForm()
            fetchData()
        } catch (error: any) {
            console.error('Error updating fee structure:', error)
            toast.error('Failed to update fee structure')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this fee structure?')) return

        try {
            const { error } = await supabase.from('fee_structures').delete().eq('id', id)
            if (error) throw error

            toast.success('Fee structure deleted')
            fetchData()
        } catch (error: any) {
            toast.error('Failed to delete')
        }
    }

    const openEditModal = (structure: FeeStructure) => {
        setSelectedStructure(structure)
        setFormData({
            name: structure.name,
            class_ids: structure.class_id ? [structure.class_id] : [],
            amount: structure.amount.toString(),
            frequency: structure.frequency,
            due_day: structure.due_day,
            fee_type: (structure as any).fee_type || 'tuition',
        })
        setIsModalOpen(true)
    }

    const resetForm = () => {
        setSelectedStructure(null)
        setFormData({
            name: '',
            class_ids: [],
            amount: '',
            frequency: 'monthly',
            due_day: 10,
            fee_type: 'tuition',
        })
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Fee Structures</h1>
                        <p className="text-sm text-slate-500">Manage class & school fees by category</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Fee
                    </Button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-6">
                                    <div className="h-8 bg-slate-200 rounded w-1/2 mb-4" />
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : feeStructures.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                                <DollarSign className="h-10 w-10 text-slate-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900 text-lg">No fee structures yet</p>
                                <p className="text-sm text-slate-500 mt-1">Create your first fee structure to get started</p>
                            </div>
                            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Fee Structure
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Category Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(groupedFees).map(([feeType, structures]) => {
                                const config = feeTypeConfig[feeType] || feeTypeConfig.tuition
                                const Icon = config.icon
                                const isExpanded = expandedCategories.has(feeType)

                                return (
                                    <Card
                                        key={feeType}
                                        className="overflow-hidden border-2 hover:shadow-lg transition-all cursor-pointer group"
                                        onClick={() => toggleCategory(feeType)}
                                    >
                                        <div className={`${config.bgColor} p-6 text-white`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                        <Icon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg">{config.label}</h3>
                                                        <p className="text-xs text-white/80 mt-1">{config.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                                    <p className="text-2xl font-bold">{structures.length}</p>
                                                    <p className="text-xs text-white/80">Class{structures.length !== 1 ? 'es' : ''}</p>
                                                </div>
                                                <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all">
                                                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>

                        {/* Expanded Category Details */}
                        {Array.from(expandedCategories).map(feeType => {
                            const structures = groupedFees[feeType] || []
                            const config = feeTypeConfig[feeType] || feeTypeConfig.tuition
                            const Icon = config.icon

                            return (
                                <Card key={`expanded-${feeType}`} className="border-2">
                                    <div className={`${config.bgColor} p-4 text-white flex items-center justify-between`}>
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-6 w-6" />
                                            <div>
                                                <h3 className="font-bold text-lg">{config.label}</h3>
                                                <p className="text-sm text-white/90">{structures.length} fee structure{structures.length !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleCategory(feeType)}
                                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all"
                                        >
                                            <ChevronUp className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <CardContent className="p-0">
                                        {/* Table Format */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-slate-50 border-b-2 border-slate-200">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Class</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Frequency</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Fee Amount</th>
                                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Due Day</th>
                                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 bg-white">
                                                    {structures.map((structure, idx) => (
                                                        <tr key={structure.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <p className="font-semibold text-slate-900">{structure.class?.class_name || 'All Classes'}</p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <Badge variant="default" className="text-xs capitalize">
                                                                    {structure.frequency}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="text-lg font-bold text-green-700">
                                                                    {formatCurrency(structure.amount)}
                                                                </p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="text-sm text-slate-600">
                                                                    {structure.due_day}th of month
                                                                </p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            openEditModal(structure)
                                                                        }}
                                                                        className="h-8 text-xs"
                                                                    >
                                                                        <Edit className="h-3 w-3 mr-1" />
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleDelete(structure.id)
                                                                        }}
                                                                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-3 w-3 mr-1" />
                                                                        Delete
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={selectedStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}
                size="md"
            >
                <div className="space-y-3">
                    <Input
                        label="Fee Name (Optional)"
                        placeholder="Auto-generated from fee type if empty"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Select Classes
                        </label>

                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, class_ids: [] })}
                            className={`w-full px-3 py-2 rounded-lg font-medium text-sm transition-all mb-2 ${formData.class_ids.length === 0
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200'
                                : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-300'
                                }`}
                        >
                            {formData.class_ids.length === 0 ? '✓ ' : ''}All Classes
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-2 bg-white text-xs text-slate-500">Or select specific</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                            {classes.map((cls) => (
                                <button
                                    key={cls.id}
                                    type="button"
                                    onClick={() => {
                                        if (formData.class_ids.includes(cls.id)) {
                                            setFormData({
                                                ...formData,
                                                class_ids: formData.class_ids.filter(id => id !== cls.id)
                                            })
                                        } else {
                                            setFormData({
                                                ...formData,
                                                class_ids: [...formData.class_ids, cls.id]
                                            })
                                        }
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${formData.class_ids.includes(cls.id)
                                        ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                        }`}
                                >
                                    {formData.class_ids.includes(cls.id) ? '✓ ' : ''}
                                    {cls.class_name}
                                </button>
                            ))}
                        </div>

                        {formData.class_ids.length > 0 && (
                            <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                                <p className="text-xs text-indigo-700 font-medium">
                                    ✓ {formData.class_ids.length} class{formData.class_ids.length > 1 ? 'es' : ''} selected
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Fee Type</label>
                        <select
                            className="w-full h-10 px-3 rounded-lg border-2 border-slate-200 bg-white text-sm"
                            value={formData.fee_type}
                            onChange={(e) => {
                                const newType = e.target.value as any
                                setFormData({
                                    ...formData,
                                    fee_type: newType,
                                    frequency: newType === 'admission' ? 'one_time' : 'monthly'
                                })
                            }}
                        >
                            <option value="tuition">Tuition Fee</option>
                            <option value="admission">Admission Fee</option>
                            <option value="exam">Mid Exam Fee</option>
                            <option value="final_exam">Final Exam Fee</option>
                            <option value="science_lab">Science Lab Fee</option>
                            <option value="computer_lab">Computer Lab Fee</option>
                            <option value="sports">Sports Fee</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Amount (PKR)"
                            type="number"
                            placeholder="2000"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Frequency</label>
                            <select
                                className="w-full h-10 px-3 rounded-lg border-2 border-slate-200 bg-white text-sm"
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as FeeFrequency })}
                            >
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="annual">Annual</option>
                                <option value="one_time">One Time</option>
                            </select>
                        </div>
                    </div>

                    <Input
                        label="Due Day (1-28)"
                        type="number"
                        min="1"
                        max="28"
                        value={formData.due_day.toString()}
                        onChange={(e) => setFormData({ ...formData, due_day: parseInt(e.target.value) || 10 })}
                    />

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" size="sm" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={selectedStructure ? handleUpdate : handleCreate}>
                            {selectedStructure ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    )
}
