'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function EditStudentPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [classes, setClasses] = useState<any[]>([])
    const [sections, setSections] = useState<any[]>([])
    const [formData, setFormData] = useState({
        name: '',
        roll_number: '',
        gender: 'male',
        date_of_birth: '',
        class_id: '',
        section_id: '',
        father_name: '',
        father_cnic: '',
        father_phone: '',
        email: '',
        address: '',
        custom_fee: '',
        admission_date: '',
        status: 'active',
        // New student-level fee fields
        original_tuition_fee: 0,
        original_admission_fee: 0,
        original_exam_fee: 0,
        original_other_fee: 0,
        custom_tuition_fee: '',
        use_custom_fees: false,
        fee_discount: ''
    })

    useEffect(() => {
        fetchClasses()
        if (params.id) {
            fetchStudent()
        }
    }, [params.id])

    useEffect(() => {
        if (formData.class_id) {
            fetchSections(formData.class_id)
        } else {
            setSections([])
            setFormData(prev => ({ ...prev, section_id: '' }))
        }
    }, [formData.class_id])

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .order('class_name')

            if (error) throw error
            setClasses(data || [])
        } catch (error) {
            console.error('Error fetching classes:', error)
            toast.error('Failed to load classes')
        }
    }

    const fetchSections = async (classId: string) => {
        try {
            const { data, error } = await supabase
                .from('sections')
                .select('*')
                .eq('class_id', classId)
                .order('section_name')

            if (error) throw error
            setSections(data || [])
        } catch (error) {
            console.error('Error fetching sections:', error)
        }
    }

    const fetchStudent = async () => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', params.id)
                .single()

            if (error) throw error

            setFormData({
                name: data.name || '',
                roll_number: data.roll_number || '',
                gender: data.gender || 'male',
                date_of_birth: data.date_of_birth || '',
                class_id: data.class_id || '',
                section_id: data.section_id || '',
                father_name: data.father_name || '',
                father_cnic: data.father_cnic || '',
                father_phone: data.father_phone || '',
                email: data.email || '',
                address: data.address || '',
                custom_fee: data.custom_fee?.toString() || '',
                admission_date: data.admission_date || '',
                status: data.status || 'active',
                // New student-level fee fields
                original_tuition_fee: data.original_tuition_fee || 0,
                original_admission_fee: data.original_admission_fee || 0,
                original_exam_fee: data.original_exam_fee || 0,
                original_other_fee: data.original_other_fee || 0,
                custom_tuition_fee: data.custom_tuition_fee?.toString() || '',
                use_custom_fees: data.use_custom_fees || false,
                fee_discount: data.fee_discount?.toString() || ''
            })
        } catch (error) {
            console.error('Error fetching student:', error)
            toast.error('Failed to load student data')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const updateData: any = {
                name: formData.name,
                roll_number: formData.roll_number || null,
                gender: formData.gender,
                date_of_birth: formData.date_of_birth || null,
                class_id: formData.class_id || null,
                section_id: formData.section_id || null,
                father_name: formData.father_name || null,
                father_cnic: formData.father_cnic || null,
                father_phone: formData.father_phone || null,
                email: formData.email || null,
                address: formData.address || null,
                custom_fee: formData.custom_fee ? parseFloat(formData.custom_fee) : null,
                admission_date: formData.admission_date || null,
                status: formData.status,
                // Update new student-level fee fields
                custom_tuition_fee: formData.custom_tuition_fee ? parseFloat(formData.custom_tuition_fee) : null,
                use_custom_fees: formData.use_custom_fees,
                fee_discount: formData.fee_discount ? parseFloat(formData.fee_discount) : null
            }

            const { error } = await supabase
                .from('students')
                .update(updateData)
                .eq('id', params.id)

            if (error) throw error

            toast.success('Student updated successfully')
            router.push(`/owner/students/${params.id}`)
        } catch (error) {
            console.error('Error updating student:', error)
            toast.error('Failed to update student')
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (field: string, value: string) => {
        if (field === 'use_custom_fees') {
            setFormData(prev => ({ ...prev, [field]: value === 'true' }))
        } else {
            setFormData(prev => ({ ...prev, [field]: value }))
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-slate-600">Loading...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Edit Student</h1>
                        <p className="text-sm text-slate-500">Update student information</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="roll_number">Roll Number</Label>
                                    <Input
                                        id="roll_number"
                                        value={formData.roll_number}
                                        onChange={(e) => handleChange('roll_number', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="gender">Gender *</Label>
                                    <select
                                        id="gender"
                                        value={formData.gender}
                                        onChange={(e) => handleChange('gender', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        required
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                                    <Input
                                        id="date_of_birth"
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => handleChange('date_of_birth', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="admission_date">Admission Date</Label>
                                    <Input
                                        id="admission_date"
                                        type="date"
                                        value={formData.admission_date}
                                        onChange={(e) => handleChange('admission_date', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="status">Status</Label>
                                    <select
                                        id="status"
                                        value={formData.status}
                                        onChange={(e) => handleChange('status', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Academic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="class_id">Class</Label>
                                    <select
                                        id="class_id"
                                        value={formData.class_id}
                                        onChange={(e) => handleChange('class_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.class_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="section_id">Section</Label>
                                    <select
                                        id="section_id"
                                        value={formData.section_id}
                                        onChange={(e) => handleChange('section_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        disabled={!formData.class_id}
                                    >
                                        <option value="">Select Section</option>
                                        {sections.map((section) => (
                                            <option key={section.id} value={section.id}>
                                                {section.section_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Fee Information Section */}
                            <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                                <h3 className="text-sm font-semibold text-green-800 mb-3">Fee Information</h3>

                                {/* Original Fees (Read-only) */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-white rounded-lg border border-green-100">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Tuition Fee</p>
                                        <p className="text-sm font-bold text-slate-900">Rs {formData.original_tuition_fee || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Admission Fee</p>
                                        <p className="text-sm font-bold text-slate-900">Rs {formData.original_admission_fee || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Exam Fee</p>
                                        <p className="text-sm font-bold text-slate-900">Rs {formData.original_exam_fee || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Other Fees</p>
                                        <p className="text-sm font-bold text-slate-900">Rs {formData.original_other_fee || 0}</p>
                                    </div>
                                </div>

                                {/* Custom Fee Toggle */}
                                <div className="flex items-center gap-3 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="use_custom_fees"
                                        checked={formData.use_custom_fees}
                                        onChange={(e) => handleChange('use_custom_fees', e.target.checked.toString())}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <label htmlFor="use_custom_fees" className="text-sm font-medium text-slate-700 cursor-pointer">
                                        Enable Custom Tuition Fee (Override Original Fee)
                                    </label>
                                </div>

                                {/* Custom Tuition Fee Input */}
                                {formData.use_custom_fees && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="custom_tuition_fee">Custom Tuition Fee *</Label>
                                            <Input
                                                id="custom_tuition_fee"
                                                type="number"
                                                step="0.01"
                                                value={formData.custom_tuition_fee}
                                                onChange={(e) => handleChange('custom_tuition_fee', e.target.value)}
                                                placeholder="Enter custom tuition fee"
                                                required={formData.use_custom_fees}
                                                className="border-blue-300 focus:border-blue-500"
                                            />
                                            <p className="text-xs text-blue-600 mt-1">This will override the original tuition fee</p>
                                        </div>
                                        <div>
                                            <Label htmlFor="fee_discount">Fee Discount (Optional)</Label>
                                            <Input
                                                id="fee_discount"
                                                type="number"
                                                step="0.01"
                                                value={formData.fee_discount}
                                                onChange={(e) => handleChange('fee_discount', e.target.value)}
                                                placeholder="Enter discount amount"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <Label htmlFor="custom_fee">Custom Monthly Fee (Legacy)</Label>
                                    <Input
                                        id="custom_fee"
                                        type="number"
                                        step="0.01"
                                        value={formData.custom_fee}
                                        onChange={(e) => handleChange('custom_fee', e.target.value)}
                                        placeholder="Leave blank for default"
                                        className="opacity-60"
                                    />
                                    <p className="text-xs text-orange-600 mt-1">⚠️ Legacy field - Use custom tuition fee above instead</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parent/Guardian Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Parent/Guardian Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="father_name">Father's Name</Label>
                                    <Input
                                        id="father_name"
                                        value={formData.father_name}
                                        onChange={(e) => handleChange('father_name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="father_cnic">Father's CNIC</Label>
                                    <Input
                                        id="father_cnic"
                                        value={formData.father_cnic}
                                        onChange={(e) => handleChange('father_cnic', e.target.value)}
                                        placeholder="00000-0000000-0"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="father_phone">Phone</Label>
                                    <Input
                                        id="father_phone"
                                        type="tel"
                                        value={formData.father_phone}
                                        onChange={(e) => handleChange('father_phone', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    )
}
