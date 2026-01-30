'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Database, Users, GraduationCap, DollarSign, CheckCircle } from 'lucide-react'

export default function DemoDataPage() {
    const [loading, setLoading] = useState<string | null>(null)
    const [stats, setStats] = useState({ classes: 0, students: 0, fees: 0 })

    const fetchStats = async () => {
        const { data: classes } = await supabase.from('classes').select('*')
        const { data: students } = await supabase.from('students').select('*')
        const { data: fees } = await supabase.from('fee_structures').select('*')

        setStats({
            classes: classes?.length || 0,
            students: students?.length || 0,
            fees: fees?.length || 0
        })
    }

    const createClasses = async () => {
        setLoading('classes')
        try {
            const classes = [
                { name: 'KG' },
                { name: 'Class 1' },
                { name: 'Class 2' },
                { name: 'Class 3' },
                { name: 'Class 4' },
                { name: 'Class 5' },
                { name: 'Class 6' },
                { name: 'Class 7' },
                { name: 'Class 8' },
                { name: 'Class 9' },
                { name: 'Class 10' }
            ]

            for (const cls of classes) {
                const { data: classData, error } = await supabase
                    .from('classes')
                    .insert(cls)
                    .select()
                    .single()

                if (error && !error.message.includes('duplicate')) {
                    throw error
                }

                if (classData) {
                    // Add sections A and B
                    await supabase.from('sections').insert([
                        { class_id: classData.id, name: 'A' },
                        { class_id: classData.id, name: 'B' }
                    ])

                    // Add section C for larger classes
                    if (['Class 5', 'Class 6', 'Class 8'].includes(cls.name)) {
                        await supabase.from('sections').insert([
                            { class_id: classData.id, name: 'C' }
                        ])
                    }
                }
            }

            toast.success('Classes and sections created!')
            fetchStats()
        } catch (error: any) {
            console.error('Error:', error)
            toast.error('Failed to create classes')
        } finally {
            setLoading(null)
        }
    }

    const createFeeStructures = async () => {
        setLoading('fees')
        try {
            const { data: classes } = await supabase.from('classes').select('*')

            if (!classes || classes.length === 0) {
                toast.error('Please create classes first!')
                setLoading(null)
                return
            }

            for (const cls of classes) {
                const baseFee = cls.name === 'KG' ? 2000 :
                    cls.name.includes('1') || cls.name.includes('2') ? 2500 :
                        cls.name.includes('3') || cls.name.includes('4') ? 3000 :
                            cls.name.includes('5') ? 3500 :
                                cls.name.includes('6') ? 4000 :
                                    cls.name.includes('7') ? 4000 :
                                        cls.name.includes('8') ? 4500 :
                                            cls.name.includes('9') ? 5000 : 5500

                await supabase.from('fee_structures').insert({
                    class_id: cls.id,
                    title: 'Monthly Tuition',
                    amount: baseFee,
                    frequency: 'monthly'
                })
            }

            toast.success('Fee structures created!')
            fetchStats()
        } catch (error: any) {
            console.error('Error:', error)
            toast.error('Failed to create fee structures')
        } finally {
            setLoading(null)
        }
    }

    const createStudents = async () => {
        setLoading('students')
        try {
            const { data: classes } = await supabase.from('classes').select('*, sections(*)')

            if (!classes || classes.length === 0) {
                toast.error('Please create classes first!')
                setLoading(null)
                return
            }

            // Create sibling groups
            const { data: khanFamily } = await supabase
                .from('sibling_groups')
                .insert({
                    family_name: 'Khan Family',
                    primary_parent_name: 'Ahmed Khan',
                    primary_parent_cnic: '12345-1234567-1',
                    primary_parent_phone: '03001234567'
                })
                .select()
                .single()

            const { data: aliFamily } = await supabase
                .from('sibling_groups')
                .insert({
                    family_name: 'Ali Family',
                    primary_parent_name: 'Hassan Ali',
                    primary_parent_cnic: '23456-2345678-2',
                    primary_parent_phone: '03112345678'
                })
                .select()
                .single()

            // Get class IDs
            const kgClass = classes.find(c => c.name === 'KG')
            const class1 = classes.find(c => c.name === 'Class 1')
            const class3 = classes.find(c => c.name === 'Class 3')
            const class5 = classes.find(c => c.name === 'Class 5')
            const class6 = classes.find(c => c.name === 'Class 6')

            const students = [
                // Khan Family
                {
                    name: 'Ali Khan',
                    gender: 'male',
                    date_of_birth: '2015-03-15',
                    class_id: class5?.id,
                    section_id: class5?.sections[0]?.id,
                    father_name: 'Ahmed Khan',
                    father_cnic: '12345-1234567-1',
                    father_phone: '03001234567',
                    email: 'ahmed.khan@email.com',
                    address: 'House 123, Model Town, Lahore',
                    admission_date: '2020-01-15',
                    admission_number: '2025-0001',
                    status: 'active',
                    sibling_group_id: khanFamily?.id
                },
                {
                    name: 'Fatima Khan',
                    gender: 'female',
                    date_of_birth: '2017-07-22',
                    class_id: class3?.id,
                    section_id: class3?.sections[0]?.id,
                    father_name: 'Ahmed Khan',
                    father_cnic: '12345-1234567-1',
                    father_phone: '03001234567',
                    email: 'ahmed.khan@email.com',
                    address: 'House 123, Model Town, Lahore',
                    admission_date: '2022-01-15',
                    admission_number: '2025-0002',
                    status: 'active',
                    sibling_group_id: khanFamily?.id
                },
                // Ali Family
                {
                    name: 'Sara Ali',
                    gender: 'female',
                    date_of_birth: '2014-08-20',
                    class_id: class6?.id,
                    section_id: class6?.sections[0]?.id,
                    father_name: 'Hassan Ali',
                    father_cnic: '23456-2345678-2',
                    father_phone: '03112345678',
                    email: 'hassan.ali@email.com',
                    address: 'Johar Town, Lahore',
                    admission_date: '2019-02-01',
                    admission_number: '2025-0003',
                    status: 'active',
                    sibling_group_id: aliFamily?.id
                },
                {
                    name: 'Usman Ali',
                    gender: 'male',
                    date_of_birth: '2016-09-12',
                    class_id: class5?.id,
                    section_id: class5?.sections[1]?.id,
                    father_name: 'Hassan Ali',
                    father_cnic: '23456-2345678-2',
                    father_phone: '03112345678',
                    email: 'hassan.ali@email.com',
                    address: 'Johar Town, Lahore',
                    admission_date: '2021-02-01',
                    admission_number: '2025-0004',
                    status: 'active',
                    sibling_group_id: aliFamily?.id
                },
                // Individual students
                {
                    name: 'Zainab Ahmed',
                    gender: 'female',
                    date_of_birth: '2015-08-25',
                    class_id: class5?.id,
                    section_id: class5?.sections[0]?.id,
                    father_name: 'Ahmed Raza',
                    father_cnic: '12121-1212121-1',
                    father_phone: '03009876543',
                    email: 'ahmed.raza@email.com',
                    address: 'DHA Phase 5, Lahore',
                    admission_date: '2020-04-20',
                    admission_number: '2025-0005',
                    status: 'active'
                },
                {
                    name: 'Omar Farooq',
                    gender: 'male',
                    date_of_birth: '2016-02-14',
                    class_id: class5?.id,
                    section_id: class5?.sections[1]?.id,
                    father_name: 'Farooq Khan',
                    father_cnic: '23232-2323232-2',
                    father_phone: '03118765432',
                    email: 'farooq.khan@email.com',
                    address: 'Gulberg III, Lahore',
                    admission_date: '2021-05-15',
                    admission_number: '2025-0006',
                    status: 'active'
                },
                {
                    name: 'Mariam Siddique',
                    gender: 'female',
                    date_of_birth: '2016-10-30',
                    class_id: class5?.id,
                    section_id: class5?.sections[0]?.id,
                    father_name: 'Siddique Ali',
                    father_cnic: '34343-3434343-3',
                    father_phone: '03227654321',
                    email: 'siddique.ali@email.com',
                    address: 'Cavalry Ground, Lahore',
                    admission_date: '2022-06-01',
                    admission_number: '2025-0007',
                    status: 'active'
                },
                {
                    name: 'Hassan Raza',
                    gender: 'male',
                    date_of_birth: '2017-04-08',
                    class_id: class3?.id,
                    section_id: class3?.sections[1]?.id,
                    father_name: 'Raza Ahmed',
                    father_cnic: '45454-4545454-4',
                    father_phone: '03336543210',
                    email: 'raza.ahmed@email.com',
                    address: 'Faisal Town, Lahore',
                    admission_date: '2023-07-10',
                    admission_number: '2025-0008',
                    status: 'active'
                },
                {
                    name: 'Abdullah Tariq',
                    gender: 'male',
                    date_of_birth: '2019-01-16',
                    class_id: class1?.id,
                    section_id: class1?.sections[0]?.id,
                    father_name: 'Tariq Mahmood',
                    father_cnic: '67676-6767676-6',
                    father_phone: '03009998887',
                    email: 'tariq.mahmood@email.com',
                    address: 'Wapda Town, Lahore',
                    admission_date: '2024-09-01',
                    admission_number: '2025-0009',
                    status: 'active'
                },
                {
                    name: 'Hira Nawaz',
                    gender: 'female',
                    date_of_birth: '2020-05-05',
                    class_id: kgClass?.id,
                    section_id: kgClass?.sections[0]?.id,
                    father_name: 'Nawaz Sharif',
                    father_cnic: '78787-7878787-7',
                    father_phone: '03118887776',
                    email: 'nawaz.sharif@email.com',
                    address: 'EME Society, Lahore',
                    admission_date: '2024-01-10',
                    admission_number: '2025-0010',
                    status: 'active'
                }
            ]

            for (const student of students) {
                await supabase.from('students').insert(student)
            }

            toast.success(`Created ${students.length} students!`)
            fetchStats()
        } catch (error: any) {
            console.error('Error:', error)
            toast.error('Failed to create students')
        } finally {
            setLoading(null)
        }
    }

    const clearAllData = async () => {
        if (!confirm('Are you sure you want to delete ALL demo data? This cannot be undone!')) {
            return
        }

        setLoading('clear')
        try {
            await supabase.from('students').delete().neq('id', 0)
            await supabase.from('sibling_groups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('fee_structures').delete().neq('id', 0)
            await supabase.from('sections').delete().neq('id', 0)
            await supabase.from('classes').delete().neq('id', 0)

            toast.success('All demo data cleared!')
            fetchStats()
        } catch (error: any) {
            console.error('Error:', error)
            toast.error('Failed to clear data')
        } finally {
            setLoading(null)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Demo Data Generator</h1>
                    <p className="text-slate-500 mt-1">Quickly populate your database with sample data for testing</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">Classes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.classes}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">Students</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.students}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600">Fee Structures</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.fees}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" />
                                Create Classes & Sections
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-slate-600">
                                Creates 11 classes (KG to Class 10) with sections A, B, and C
                            </p>
                            <Button
                                onClick={createClasses}
                                disabled={loading === 'classes'}
                                className="w-full"
                            >
                                {loading === 'classes' ? 'Creating...' : 'Create Classes'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Create Fee Structures
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-slate-600">
                                Creates monthly tuition fees for all classes (PKR 2,000 - 5,500)
                            </p>
                            <Button
                                onClick={createFeeStructures}
                                disabled={loading === 'fees'}
                                className="w-full"
                            >
                                {loading === 'fees' ? 'Creating...' : 'Create Fee Structures'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Create Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-slate-600">
                                Creates 10 students including 2 sibling families with complete profiles
                            </p>
                            <Button
                                onClick={createStudents}
                                disabled={loading === 'students'}
                                className="w-full"
                            >
                                {loading === 'students' ? 'Creating...' : 'Create Students'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Clear All Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-slate-600">
                                Removes all demo data from the database (cannot be undone)
                            </p>
                            <Button
                                onClick={clearAllData}
                                disabled={loading === 'clear'}
                                variant="destructive"
                                className="w-full"
                            >
                                {loading === 'clear' ? 'Clearing...' : 'Clear All Data'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Instructions */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-blue-900 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Quick Start Guide
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                            <li>Click <strong>"Create Classes"</strong> first to set up all classes and sections</li>
                            <li>Then click <strong>"Create Fee Structures"</strong> to add fees for each class</li>
                            <li>Finally click <strong>"Create Students"</strong> to add sample students</li>
                            <li>Use <strong>"Clear All Data"</strong> if you want to start fresh</li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
