'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Upload, User, Users, MapPin, GraduationCap, Heart, Bus, FileText, AlertCircle, Copy, DollarSign } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { Class, Section } from '@/types/class'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { CustomFeesSection } from '@/components/admissions/CustomFeesSection'
import { PaymentSettingsSection } from '@/components/admissions/PaymentSettingsSection'
import { generateFirstChallan } from '@/lib/first-challan-generator'

const STEPS = [
    { id: 1, title: 'Student Info', icon: User },
    { id: 2, title: 'Parent Info', icon: Users },
    { id: 3, title: 'Address', icon: MapPin },
    { id: 4, title: 'Academic History', icon: GraduationCap },
    { id: 5, title: 'Medical', icon: Heart },
    { id: 6, title: 'Transport', icon: Bus },
    { id: 7, title: 'Documents', icon: FileText },
    { id: 8, title: 'Fee Assignment', icon: DollarSign },
]

export default function NewAdmission() {
    const router = useRouter()
    const { profile, hasPermission } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState<Class[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [loadingClasses, setLoadingClasses] = useState(true)

    // CNIC Lookup States
    const [cnicError, setCnicError] = useState('')
    const [existingParent, setExistingParent] = useState<any>(null)
    const [showCopyDialog, setShowCopyDialog] = useState(false)
    const [existingSiblings, setExistingSiblings] = useState<any[]>([])

    // Fee States
    const [feeStructures, setFeeStructures] = useState<any[]>([])
    const [admissionFee, setAdmissionFee] = useState(0)
    const [monthlyFee, setMonthlyFee] = useState<any>(null)
    const [formData, setFormData] = useState({
        // Student Info
        student_name: '',
        dob: '',
        gender: 'Male',
        b_form: '',
        photo_url: '',

        // Parent Info
        father_name: '',
        father_cnic: '',
        father_phone: '',
        mother_name: '',
        guardian_name: '',
        guardian_phone: '',

        // Address
        address: '',
        emergency_contact: '',

        // Academic History
        previous_school: '',
        last_class: '',
        last_percentage: '',

        // Medical
        blood_group: '',
        disease: '',
        allergy: '',

        // Transport
        transport_required: false,

        // Class Assignment
        class_id: '',
        section_id: '',

        // Fee Assignment
        admission_fee: 0,
        admission_fee_discount_type: 'none',
        admission_fee_discount_value: 0,
        monthly_fee_structure_id: '',

        // Custom Fees
        use_custom_fees: false,
        custom_tuition_fee: 0,
        custom_exam_fee: 0,

        // Additional Fees (sports, lab, etc.)
        additional_fee_ids: [] as string[],
    })

    useEffect(() => {
        fetchClassesAndSections()
    }, [])

    // Animated dots state for submit button
    const [loadingDots, setLoadingDots] = useState(1)

    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setLoadingDots(prev => (prev % 4) + 1)
            }, 400)
            return () => clearInterval(interval)
        } else {
            setLoadingDots(1)
        }
    }, [loading])

    const fetchClassesAndSections = async () => {
        setLoadingClasses(true)
        try {
            const [classesRes, sectionsRes] = await Promise.all([
                supabase.from('classes').select('*').order('class_name'),
                supabase.from('sections').select('*').order('section_name'),
            ])

            if (classesRes.data) setClasses(classesRes.data)
            if (sectionsRes.data) setSections(sectionsRes.data)
        } catch (error) {
            console.error('Error fetching classes:', error)
        } finally {
            setLoadingClasses(false)
        }
    }

    const fetchFeeStructuresByClass = async (classId: string) => {
        if (!classId) return

        try {
            const { data, error } = await supabase
                .from('fee_structures')
                .select('*')
                .eq('class_id', classId)

            if (error) throw error

            setFeeStructures(data || [])

            // Auto-fill admission fee (one_time)
            const admissionFeeStructure = data?.find(f => f.frequency === 'one_time')
            if (admissionFeeStructure) {
                setAdmissionFee(admissionFeeStructure.amount)
                setFormData(prev => ({
                    ...prev,
                    admission_fee: admissionFeeStructure.amount
                }))
            }

            // Auto-fill monthly fee - DISABLED to allow manual selection
            // User must manually select fees to control challan generation
            // const monthlyFeeStructure = data?.find(f => f.frequency === 'monthly')
            // if (monthlyFeeStructure) {
            //     setMonthlyFee(monthlyFeeStructure)
            //     setFormData(prev => ({
            //         ...prev,
            //         monthly_fee_structure_id: monthlyFeeStructure.id
            //     }))
            // }
        } catch (error) {
            console.error('Error fetching fee structures:', error)
        }
    }

    const calculateFinalFee = () => {
        const originalFee = formData.admission_fee
        const discountType = formData.admission_fee_discount_type
        const discountValue = formData.admission_fee_discount_value

        if (discountType === 'percentage') {
            return originalFee - (originalFee * discountValue / 100)
        } else if (discountType === 'amount') {
            return Math.max(0, originalFee - discountValue)
        }
        return originalFee
    }

    // CNIC Validation and Lookup
    const validateCNIC = (cnic: string): boolean => {
        // Remove any dashes or spaces
        const cleanCNIC = cnic.replace(/[-\s]/g, '')

        if (cleanCNIC.length === 0) {
            setCnicError('')
            return true
        }

        if (cleanCNIC.length !== 13) {
            setCnicError('CNIC must be exactly 13 digits')
            return false
        }

        if (!/^\d{13}$/.test(cleanCNIC)) {
            setCnicError('CNIC must contain only digits')
            return false
        }

        setCnicError('')
        return true
    }

    const lookupParentByCNIC = async (cnic: string) => {
        if (!cnic || cnic.replace(/[-\s]/g, '').length !== 13) return

        const cleanCNIC = cnic.replace(/[-\s]/g, '')

        try {
            // Check in admissions table first
            const { data: admissions, error } = await supabase
                .from('admissions')
                .select('*')
                .eq('father_cnic', cleanCNIC)
                .limit(1)

            if (error) throw error

            if (admissions && admissions.length > 0) {
                setExistingParent(admissions[0])

                // Get all siblings with same CNIC
                const { data: siblings } = await supabase
                    .from('admissions')
                    .select('student_name, status')
                    .eq('father_cnic', cleanCNIC)

                setExistingSiblings(siblings || [])
                setShowCopyDialog(true)
            }
        } catch (error) {
            console.error('Error looking up parent:', error)
        }
    }

    const handleCNICChange = (value: string) => {
        setFormData({ ...formData, father_cnic: value })
        validateCNIC(value)
    }

    const handleCNICBlur = () => {
        if (formData.father_cnic && validateCNIC(formData.father_cnic)) {
            lookupParentByCNIC(formData.father_cnic)
        }
    }

    const copyParentDetails = () => {
        if (!existingParent) return

        setFormData({
            ...formData,
            father_name: existingParent.father_name || formData.father_name,
            father_phone: existingParent.father_phone || formData.father_phone,
            mother_name: existingParent.mother_name || formData.mother_name,
            guardian_name: existingParent.guardian_name || formData.guardian_name,
            guardian_phone: existingParent.guardian_phone || formData.guardian_phone,
            address: existingParent.address || formData.address,
            emergency_contact: existingParent.emergency_contact || formData.emergency_contact,
        })

        setShowCopyDialog(false)
        toast.success('Parent details copied successfully!')
    }

    const handleNext = () => {
        if (currentStep < 8) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSubmit = async () => {
        if (!formData.student_name || !formData.dob || !formData.father_name) {
            toast.error('Please fill in all required fields')
            return
        }

        setLoading(true)
        console.log('🚀 [SUBMIT] Starting admission submission...')
        const startTime = performance.now()

        try {
            // Convert DD/MM/YYYY to YYYY-MM-DD for database
            let dbDob = formData.dob
            if (formData.dob.includes('/')) {
                const [day, month, year] = formData.dob.split('/')
                if (day && month && year && year.length === 4) {
                    dbDob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                }
            }

            // Check for auto-approve permission
            const shouldAutoApprove = hasPermission('admissions.autoApprove')
            const status = shouldAutoApprove ? 'approved' : 'pending'

            console.log('📝 [SUBMIT] Creating admission record...', { shouldAutoApprove, status })
            const admissionStart = performance.now()

            const { data: admissionData, error: admissionError } = await supabase
                .from('admissions')
                .insert({
                    student_name: formData.student_name,
                    dob: dbDob,
                    gender: formData.gender,
                    b_form: formData.b_form || null,
                    photo_url: formData.photo_url || null,
                    father_name: formData.father_name,
                    father_cnic: formData.father_cnic || null,
                    father_phone: formData.father_phone || null,
                    mother_name: formData.mother_name || null,
                    guardian_name: formData.guardian_name || null,
                    guardian_phone: formData.guardian_phone || null,
                    address: formData.address || null,
                    emergency_contact: formData.emergency_contact || null,
                    previous_school: formData.previous_school || null,
                    last_class: formData.last_class || null,
                    last_percentage: formData.last_percentage ? parseFloat(formData.last_percentage) : null,
                    blood_group: formData.blood_group || null,
                    disease: formData.disease || null,
                    allergy: formData.allergy || null,
                    transport_required: formData.transport_required,
                    class_id: formData.class_id || null,
                    section_id: formData.section_id || null,
                    admission_fee: formData.admission_fee || 0,
                    admission_fee_discount_type: formData.admission_fee_discount_type || 'none',
                    admission_fee_discount_value: formData.admission_fee_discount_value || 0,
                    final_admission_fee: calculateFinalFee(),
                    monthly_fee_structure_id: formData.monthly_fee_structure_id || null,
                    status,
                    created_by: profile?.id,
                    approved_by: shouldAutoApprove ? profile?.id : null,
                    approved_at: shouldAutoApprove ? new Date().toISOString() : null,
                })
                .select()
                .single()

            console.log(`✅ [SUBMIT] Admission created in ${(performance.now() - admissionStart).toFixed(0)}ms`)

            if (admissionError) throw admissionError

            // If auto-approved, create student record
            if (shouldAutoApprove && admissionData && formData.class_id) {
                console.log('👤 [SUBMIT] Creating student record...')
                const studentStart = performance.now()

                const { data: studentData, error: studentError } = await supabase
                    .from('students')
                    .insert({
                        admission_id: admissionData.id,
                        class_id: formData.class_id,
                        section_id: formData.section_id || null,
                        name: formData.student_name,
                        dob: dbDob,
                        gender: formData.gender,
                        photo_url: formData.photo_url || null,
                        father_name: formData.father_name,
                        father_cnic: formData.father_cnic || null,
                        father_phone: formData.father_phone || null,
                        admission_fee: formData.admission_fee || 0,
                        admission_fee_discount_type: formData.admission_fee_discount_type || 'none',
                        admission_fee_discount_value: formData.admission_fee_discount_value || 0,
                        monthly_fee_structure_id: formData.monthly_fee_structure_id || null,
                        use_custom_fees: formData.use_custom_fees || false,
                        custom_tuition_fee: formData.use_custom_fees ? formData.custom_tuition_fee : null,
                        custom_exam_fee: formData.use_custom_fees ? formData.custom_exam_fee : null,
                        status: 'active',
                    })
                    .select()
                    .single()

                console.log(`✅ [SUBMIT] Student created in ${(performance.now() - studentStart).toFixed(0)}ms`)

                if (studentError) throw studentError

                // Auto-generate first challan for the student
                if (studentData) {
                    console.log('💰 [SUBMIT] Generating first challan...')
                    const challanStart = performance.now()

                    const challanResult = await generateFirstChallan(
                        studentData.id,
                        formData.class_id,
                        formData.admission_fee,
                        formData.admission_fee_discount_value || 0,
                        profile?.id || ''
                    )

                    console.log(`✅ [SUBMIT] Challan generated in ${(performance.now() - challanStart).toFixed(0)}ms`, challanResult)

                    if (!challanResult.success) {
                        console.warn('⚠️ [SUBMIT] Challan generation failed:', challanResult.error)
                    }
                }
            }

            const totalTime = (performance.now() - startTime).toFixed(0)
            console.log(`🎉 [SUBMIT] Admission complete! Total time: ${totalTime}ms`)

            // Show warning if took too long
            if (parseInt(totalTime) > 5000) {
                toast.warning(`Submission completed but took ${(parseInt(totalTime) / 1000).toFixed(1)}s - Check your network connection`)
            }

            toast.success(
                shouldAutoApprove
                    ? 'Admission approved and student created!'
                    : 'Admission submitted for approval'
            )
            router.push('/owner/admissions')
        } catch (error: any) {
            const totalTime = (performance.now() - startTime).toFixed(0)
            console.error(`❌ [SUBMIT] Error after ${totalTime}ms:`, error)

            // Check if it's a network timeout
            if (error.message?.includes('timeout') || error.message?.includes('network') || parseInt(totalTime) > 10000) {
                toast.error('Network connection is slow. Please check your internet and try again.')
            } else {
                toast.error('Failed to create admission: ' + (error.message || 'Unknown error'))
            }
        } finally {
            setLoading(false)
        }
    }

    const filteredSections = sections.filter((s) => s.class_id === formData.class_id)

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <Input
                            label="Student Name *"
                            placeholder="Enter full name"
                            value={formData.student_name}
                            onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth * (DD/MM/YYYY)</label>
                                <input
                                    type="text"
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                                    value={formData.dob}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/[^0-9/]/g, '')
                                        if (value.length === 2 || value.length === 5) {
                                            if (!value.endsWith('/')) value += '/'
                                        }
                                        if (value.length <= 10) {
                                            setFormData({ ...formData, dob: value })
                                        }
                                    }}
                                    placeholder="DD/MM/YYYY"
                                    maxLength={10}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender *</label>
                                <select
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <Input
                            label="B-Form Number"
                            placeholder="Enter B-Form number"
                            value={formData.b_form}
                            onChange={(e) => setFormData({ ...formData, b_form: e.target.value })}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Class *</label>
                                <select
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white"
                                    value={formData.class_id}
                                    onChange={(e) => {
                                        const selectedClassId = e.target.value
                                        // Find sections for selected class
                                        const classSections = sections.filter((s) => s.class_id === selectedClassId)
                                        // Auto-select if only one section exists
                                        const autoSelectedSectionId = classSections.length === 1 ? classSections[0].id : ''

                                        setFormData({
                                            ...formData,
                                            class_id: selectedClassId,
                                            section_id: autoSelectedSectionId
                                        })
                                        fetchFeeStructuresByClass(selectedClassId)
                                    }}
                                >
                                    <option value="">Select Class</option>
                                    {loadingClasses ? (
                                        <option disabled>Loading classes...</option>
                                    ) : classes.length === 0 ? (
                                        <option disabled>No classes available</option>
                                    ) : (
                                        classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Section</label>
                                <select
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white"
                                    value={formData.section_id}
                                    onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                                    disabled={!formData.class_id}
                                >
                                    <option value="">Select Section</option>
                                    {!formData.class_id ? (
                                        <option disabled>Select a class first</option>
                                    ) : loadingClasses ? (
                                        <option disabled>Loading sections...</option>
                                    ) : filteredSections.length === 0 ? (
                                        <option disabled>No sections available</option>
                                    ) : (
                                        filteredSections.map((section) => (
                                            <option key={section.id} value={section.id}>{section.section_name}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div className="space-y-4">
                        <Input
                            label="Father's Name *"
                            placeholder="Enter father's full name"
                            value={formData.father_name}
                            onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Input
                                    label="Father's CNIC *"
                                    placeholder="1234567890123 (13 digits)"
                                    value={formData.father_cnic}
                                    onChange={(e) => handleCNICChange(e.target.value)}
                                    onBlur={handleCNICBlur}
                                    maxLength={13}
                                />
                                {cnicError && (
                                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {cnicError}
                                    </p>
                                )}
                            </div>
                            <Input
                                label="Father's Phone"
                                placeholder="Enter phone number"
                                value={formData.father_phone}
                                onChange={(e) => setFormData({ ...formData, father_phone: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Mother's Name"
                            placeholder="Enter mother's full name"
                            value={formData.mother_name}
                            onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Guardian Name (if any)"
                                placeholder="Enter guardian's name"
                                value={formData.guardian_name}
                                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                            />
                            <Input
                                label="Guardian Phone"
                                placeholder="Enter phone number"
                                value={formData.guardian_phone}
                                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                            />
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-4">
                        <Textarea
                            label="Full Address"
                            placeholder="Enter complete address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                        <Input
                            label="Emergency Contact"
                            placeholder="Enter emergency contact number"
                            value={formData.emergency_contact}
                            onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                        />
                    </div>
                )

            case 4:
                return (
                    <div className="space-y-4">
                        <Input
                            label="Previous School Name"
                            placeholder="Enter school name"
                            value={formData.previous_school}
                            onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Last Class Attended"
                                placeholder="e.g., Class 5, Grade 8"
                                value={formData.last_class}
                                onChange={(e) => setFormData({ ...formData, last_class: e.target.value })}
                            />
                            <Input
                                label="Last Percentage/Grade"
                                placeholder="e.g., 85% or A+"
                                value={formData.last_percentage}
                                onChange={(e) => setFormData({ ...formData, last_percentage: e.target.value })}
                            />
                        </div>
                    </div>
                )

            case 5:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Blood Group</label>
                            <select
                                className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white"
                                value={formData.blood_group}
                                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                            >
                                <option value="">Select Blood Group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                        <Textarea
                            label="Any Disease/Medical Condition"
                            placeholder="Enter any medical conditions"
                            value={formData.disease}
                            onChange={(e) => setFormData({ ...formData, disease: e.target.value })}
                        />
                        <Textarea
                            label="Any Allergies"
                            placeholder="Enter any allergies"
                            value={formData.allergy}
                            onChange={(e) => setFormData({ ...formData, allergy: e.target.value })}
                        />
                    </div>
                )

            case 6:
                return (
                    <div className="space-y-4">
                        <div className="p-6 bg-slate-50 rounded-xl">
                            <h4 className="font-medium text-slate-900 mb-4">Transport Required?</h4>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="transport"
                                        checked={formData.transport_required === true}
                                        onChange={() => setFormData({ ...formData, transport_required: true })}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    <span>Yes, I need school transport</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="transport"
                                        checked={formData.transport_required === false}
                                        onChange={() => setFormData({ ...formData, transport_required: false })}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    <span>No, I will arrange my own</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )

            case 7:
                return (
                    <div className="space-y-4">
                        <div className="p-8 border-2 border-dashed border-slate-300 rounded-xl text-center">
                            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600 mb-2">Drop files here or click to upload</p>
                            <p className="text-sm text-slate-400 mb-4">
                                Upload birth certificate, previous school documents, etc.
                            </p>
                            <Button variant="outline">
                                <Upload className="h-4 w-4 mr-2" />
                                Select Files
                            </Button>
                        </div>
                        <p className="text-sm text-slate-500">
                            Note: You can upload documents after admission approval as well.
                        </p>
                    </div>
                )

            case 8:
                const finalFee = calculateFinalFee()
                return (
                    <PaymentSettingsSection
                        // Admission Fee Props
                        admissionFee={formData.admission_fee}
                        admissionFeeDiscountType={formData.admission_fee_discount_type}
                        admissionFeeDiscountValue={formData.admission_fee_discount_value}
                        onAdmissionFeeChange={(value) => setFormData({ ...formData, admission_fee: value })}
                        onAdmissionDiscountChange={(type, value) => setFormData({
                            ...formData,
                            admission_fee_discount_type: type,
                            admission_fee_discount_value: value
                        })}

                        // Monthly Fee Props
                        feeStructures={feeStructures}
                        selectedFeeStructureId={formData.monthly_fee_structure_id}
                        useCustomFees={formData.use_custom_fees}
                        customTuitionFee={formData.custom_tuition_fee}
                        customExamFee={formData.custom_exam_fee}
                        onFeeStructureSelect={(id) => {
                            setFormData({ ...formData, monthly_fee_structure_id: id })
                            const fee = feeStructures.find(f => f.id === id)
                            setMonthlyFee(fee || null)
                        }}
                        onToggleCustomFees={(enabled) => setFormData({ ...formData, use_custom_fees: enabled })}
                        onCustomFeesChange={(tuition, exam) => setFormData({
                            ...formData,
                            custom_tuition_fee: tuition,
                            custom_exam_fee: exam
                        })}

                        // Additional Fees Props
                        selectedAdditionalFees={formData.additional_fee_ids}
                        onAdditionalFeesChange={(feeIds) => setFormData({ ...formData, additional_fee_ids: feeIds })}

                        // Preview Props
                        studentName={formData.student_name}
                        className={classes.find(c => c.id === formData.class_id)?.class_name || ''}
                    />
                )

            default:
                return null
        }
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">New Admission</h1>
                        <p className="text-slate-500 mt-1">Fill in the admission form</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between overflow-x-auto pb-4">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon
                        const isActive = currentStep === step.id
                        const isCompleted = currentStep > step.id

                        return (
                            <div key={step.id} className="flex items-center">
                                <button
                                    onClick={() => setCurrentStep(step.id)}
                                    className={cn(
                                        'flex flex-col items-center gap-2 px-4 py-2 rounded-xl transition-colors',
                                        isActive && 'bg-indigo-50',
                                        !isActive && !isCompleted && 'opacity-50'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex items-center justify-center w-10 h-10 rounded-full transition-colors',
                                            isActive && 'bg-indigo-600 text-white',
                                            isCompleted && 'bg-green-500 text-white',
                                            !isActive && !isCompleted && 'bg-slate-200 text-slate-500'
                                        )}
                                    >
                                        {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                    </div>
                                    <span
                                        className={cn(
                                            'text-xs font-medium whitespace-nowrap',
                                            isActive && 'text-indigo-600',
                                            isCompleted && 'text-green-600',
                                            !isActive && !isCompleted && 'text-slate-400'
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={cn(
                                            'w-12 h-0.5 mx-2',
                                            isCompleted ? 'bg-green-500' : 'bg-slate-200'
                                        )}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Form Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                    </CardHeader>
                    <CardContent>{renderStepContent()}</CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>

                    {currentStep < 8 ? (
                        <Button onClick={handleNext}>
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? (
                                <span className="flex items-center">
                                    Submitting{'.'.repeat(loadingDots)}
                                </span>
                            ) : (
                                <>
                                    Submit Admission
                                    <Check className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Parent Copy Dialog */}
                {showCopyDialog && existingParent && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-900">Parent Already Registered!</h3>
                                    <p className="text-sm text-slate-600 mt-1">
                                        This CNIC is already registered with <strong>{existingSiblings.length} student{existingSiblings.length !== 1 ? 's' : ''}</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Existing Children */}
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Registered Children:</h4>
                                <ul className="space-y-1">
                                    {existingSiblings.map((sibling, idx) => (
                                        <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            {sibling.student_name}
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200">
                                                {sibling.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Action */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900 mb-3">
                                    Would you like to copy parent details from the existing record?
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={copyParentDetails}
                                        className="flex-1"
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Yes, Copy Details
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCopyDialog(false)}
                                        className="flex-1"
                                    >
                                        No, Enter Manually
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
