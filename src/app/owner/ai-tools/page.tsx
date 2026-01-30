'use client'

import { useState } from 'react'
import {
    Sparkles,
    Database,
    RefreshCw,
    Check,
    CheckCircle,
    AlertCircle,
    Trash2,
    Users,
    BookOpen,
    GraduationCap,
    ClipboardList,
    DollarSign
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { clearAllCache } from '@/lib/cache'
import {
    generateClasses,
    generateSections,
    generateStudents,
    generateSubjects,
    generateFeeStructures,
    generateExams,
    generateAdmissions,
    generateAttendance,
    generateFeePayments,
    SEED_CONFIGS
} from '@/lib/demo-data-seeder'

type DataSize = 'small' | 'medium' | 'large'

interface GenerationResult {
    classes: number
    sections: number
    students: number
    subjects: number
    fees: number
    exams: number
    admissions: number
    attendance: number
    payments: number
}

export default function DemoDataPage() {
    const [generating, setGenerating] = useState(false)
    const [clearing, setClearing] = useState(false)
    const [selectedSize, setSelectedSize] = useState<DataSize>('medium')
    const [result, setResult] = useState<GenerationResult | null>(null)

    const handleGenerateData = async () => {
        setGenerating(true)
        setResult(null)

        try {
            const config = SEED_CONFIGS[selectedSize]
            const results: GenerationResult = {
                classes: 0,
                sections: 0,
                students: 0,
                subjects: 0,
                fees: 0,
                exams: 0,
                admissions: 0,
                attendance: 0,
                payments: 0
            }

            // Step 1: Generate and insert classes
            toast.info('Creating classes...')
            const classesData = generateClasses(config.classCount)
            const { data: insertedClasses, error: classError } = await supabase
                .from('classes')
                .insert(classesData)
                .select()

            if (classError) throw new Error(`Classes: ${classError.message}`)
            results.classes = insertedClasses?.length || 0

            // Step 2: Generate and insert sections
            toast.info('Creating sections...')
            const sectionsData = generateSections(insertedClasses!, config.sectionsPerClass)
            const { data: insertedSections, error: sectionError } = await supabase
                .from('sections')
                .insert(sectionsData)
                .select()

            if (sectionError) throw new Error(`Sections: ${sectionError.message}`)
            results.sections = insertedSections?.length || 0

            // Step 3: Generate and insert students
            toast.info('Creating students...')
            const studentsData = generateStudents(insertedSections!, insertedClasses!, config.studentsPerSection)
            const { data: insertedStudents, error: studentError } = await supabase
                .from('students')
                .insert(studentsData)
                .select()

            if (studentError) throw new Error(`Students: ${studentError.message}`)
            results.students = insertedStudents?.length || 0

            // Step 4: Generate and insert subjects
            toast.info('Creating subjects...')
            const subjectsData = generateSubjects(insertedClasses!)
            const { data: insertedSubjects, error: subjectError } = await supabase
                .from('subjects')
                .insert(subjectsData)
                .select()

            if (subjectError) throw new Error(`Subjects: ${subjectError.message}`)
            results.subjects = insertedSubjects?.length || 0

            // Step 5: Generate and insert fee structures
            toast.info('Creating fee structures...')
            const feesData = generateFeeStructures(insertedClasses!)
            const { data: insertedFees, error: feeError } = await supabase
                .from('fee_structures')
                .insert(feesData)
                .select()

            if (feeError) throw new Error(`Fees: ${feeError.message}`)
            results.fees = insertedFees?.length || 0

            // Step 6: Generate and insert exams
            toast.info('Creating exams...')
            const examsData = generateExams(insertedClasses!)
            const { data: insertedExams, error: examError } = await supabase
                .from('exams')
                .insert(examsData)
                .select()

            if (examError) throw new Error(`Exams: ${examError.message}`)
            results.exams = insertedExams?.length || 0

            // Step 7: Generate and insert admissions
            toast.info('Creating admissions...')
            const admissionsCount = selectedSize === 'small' ? 5 : selectedSize === 'medium' ? 15 : 30
            const admissionsData = generateAdmissions(insertedClasses!, insertedSections!, admissionsCount)
            const { data: insertedAdmissions, error: admissionError } = await supabase
                .from('admissions')
                .insert(admissionsData)
                .select()

            if (admissionError) throw new Error(`Admissions: ${admissionError.message}`)
            results.admissions = insertedAdmissions?.length || 0

            // Step 8: Generate and insert attendance (last 30 days)
            toast.info('Creating attendance records...')

            // Get current user for marked_by field
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            const attendanceData = generateAttendance(insertedStudents!, 30, user.id)
            const { data: insertedAttendance, error: attendanceError } = await supabase
                .from('attendance')
                .insert(attendanceData)
                .select()

            if (attendanceError) throw new Error(`Attendance: ${attendanceError.message}`)
            results.attendance = insertedAttendance?.length || 0

            // Step 9: Fee payments - skipped for now (table not created yet)
            // TODO: Create fee_payments table and uncomment this
            /*
            toast.info('Creating fee payments...')
            const paymentsData = generateFeePayments(insertedStudents!, insertedFees!)
            const { data: insertedPayments, error: paymentError } = await supabase
                .from('fee_payments')
                .insert(paymentsData)
                .select()

            if (paymentError) throw new Error(`Payments: ${paymentError.message}`)
            results.payments = insertedPayments?.length || 0
            */
            results.payments = 0 // Skipped for now

            // Clear cache so new data is fetched
            clearAllCache()

            setResult(results)
            toast.success('Demo data generated successfully!')

        } catch (error: any) {
            console.error('Generation error:', error)
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                fullError: error
            })
            toast.error('Failed to generate data', error.message)
        } finally {
            setGenerating(false)
        }
    }

    const handleClearData = async () => {
        if (!confirm('Are you sure? This will delete ALL data from the database!')) {
            return
        }

        setClearing(true)

        try {
            // Delete in reverse order of dependencies
            const tables = [
                'attendance',
                'marks',
                'admissions',
                'students',
                'exams',
                'subjects',
                'fee_structures',
                'sections',
                'classes'
            ]

            for (const table of tables) {
                try {
                    console.log(`Deleting from ${table}...`)
                    const { error } = await supabase
                        .from(table)
                        .delete()
                        .neq('id', 0) // Delete all rows

                    if (error) {
                        console.error(`Error deleting ${table}:`, error)
                    } else {
                        console.log(`✓ Cleared ${table}`)
                    }
                } catch (e) {
                    console.log(`Skipped ${table}:`, e)
                }
            }

            // Clear cache
            clearAllCache()

            setResult(null)
            toast.success('All data cleared successfully!')

        } catch (error: any) {
            console.error('Clear error:', error)
            toast.error('Failed to clear data', error.message)
        } finally {
            setClearing(false)
        }
    }

    const sizeDescriptions = {
        small: { classes: 5, sections: 5, students: 25, label: 'Quick Test' },
        medium: { classes: 8, sections: 16, students: 240, label: 'Standard Demo' },
        large: { classes: 12, sections: 36, students: 1080, label: 'Full School' }
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                        <Database className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Demo Data Generator</h1>
                        <p className="text-slate-500">Generate sample Pakistani school data for testing</p>
                    </div>
                </div>

                {/* Size Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Select Data Size</CardTitle>
                        <CardDescription>Choose how much sample data to generate</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(['small', 'medium', 'large'] as DataSize[]).map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`p-6 rounded-xl border-2 text-left transition-all ${selectedSize === size
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-slate-200 hover:border-purple-300'
                                        }`}
                                >
                                    <h3 className="font-bold text-lg capitalize mb-2">{size}</h3>
                                    <p className="text-sm text-slate-500 mb-3">{sizeDescriptions[size].label}</p>
                                    <div className="space-y-1 text-sm">
                                        <p><BookOpen className="inline h-4 w-4 mr-1" /> {sizeDescriptions[size].classes} Classes</p>
                                        <p><Users className="inline h-4 w-4 mr-1" /> {sizeDescriptions[size].sections} Sections</p>
                                        <p><GraduationCap className="inline h-4 w-4 mr-1" /> ~{sizeDescriptions[size].students} Students</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <Button
                        onClick={handleGenerateData}
                        disabled={generating || clearing}
                        className="flex-1 h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        {generating ? (
                            <>
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5 mr-2" />
                                Generate Demo Data
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handleClearData}
                        disabled={generating || clearing}
                        variant="outline"
                        className="h-14 px-8 border-red-300 text-red-600 hover:bg-red-50"
                    >
                        {clearing ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <Trash2 className="h-5 w-5 mr-2" />
                                Clear All Data
                            </>
                        )}
                    </Button>
                </div>

                {/* Results */}
                {result && (
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-700">
                                <Check className="h-6 w-6" />
                                Data Generated Successfully!
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="text-center p-4 bg-white rounded-lg">
                                    <BookOpen className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                                    <p className="text-2xl font-bold">{result.classes}</p>
                                    <p className="text-sm text-slate-500">Classes</p>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg">
                                    <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                                    <p className="text-2xl font-bold">{result.sections}</p>
                                    <p className="text-sm text-slate-500">Sections</p>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg">
                                    <GraduationCap className="h-8 w-8 mx-auto text-green-500 mb-2" />
                                    <p className="text-2xl font-bold">{result.students}</p>
                                    <p className="text-sm text-slate-500">Students</p>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg">
                                    <ClipboardList className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                                    <p className="text-2xl font-bold">{result.subjects}</p>
                                    <p className="text-sm text-slate-500">Subjects</p>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg">
                                    <DollarSign className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                                    <p className="text-2xl font-bold">{result.fees}</p>
                                    <p className="text-sm text-slate-500">Fee Structures</p>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg">
                                    <ClipboardList className="h-8 w-8 mx-auto text-red-500 mb-2" />
                                    <p className="text-2xl font-bold">{result.exams}</p>
                                    <p className="text-sm text-slate-500">Exams</p>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg">
                                    <Users className="h-8 w-8 mx-auto text-indigo-500 mb-2" />
                                    <p className="text-2xl font-bold">{result.admissions}</p>
                                    <p className="text-sm text-slate-500">Admissions</p>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg">
                                    <CheckCircle className="h-8 w-8 mx-auto text-teal-500 mb-2" />
                                    <p className="text-2xl font-bold">{result.attendance}</p>
                                    <p className="text-sm text-slate-500">Attendance</p>
                                </div>
                                <div className="text-center p-4 bg-white rounded-lg">
                                    <DollarSign className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                                    <p className="text-2xl font-bold">{result.payments}</p>
                                    <p className="text-sm text-slate-500">Fee Payments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Info Card */}
                <Card className="bg-slate-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-slate-700">What gets generated?</p>
                                <ul className="mt-2 text-sm text-slate-600 space-y-1 list-disc list-inside">
                                    <li>Classes (Nursery to Class 10)</li>
                                    <li>Sections (A, B, C per class)</li>
                                    <li>Students with Pakistani names</li>
                                    <li>Subjects based on class level</li>
                                    <li>Fee structures (Tuition + Admission)</li>
                                    <li>Exams (First Term, Mid Term, Final)</li>
                                    <li>Admissions (pending applications)</li>
                                    <li>Attendance records (last 30 days - 85% present)</li>
                                    <li>Fee payments (3-6 months history per student)</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
