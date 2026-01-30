'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, GraduationCap, Edit2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { SiblingManager } from '@/components/students/SiblingManager'

export default function StudentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [student, setStudent] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (params.id) {
            fetchStudent()
        }
    }, [params.id])

    const fetchStudent = async () => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select(`
                    *,
                    class:classes(id, class_name, medium),
                    section:sections(id, section_name)
                `)
                .eq('id', params.id)
                .single()

            if (error) throw error
            setStudent(data)
        } catch (error) {
            console.error('Error fetching student:', error)
        } finally {
            setLoading(false)
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

    if (!student) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-slate-600">Student not found</p>
                    <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                </div>
            </DashboardLayout>
        )
    }

    const isMale = student.gender === 'male'

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
                            <p className="text-sm text-slate-500">Student Details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <SiblingManager
                            studentId={student.id}
                            currentSiblingGroupId={student.sibling_group_id}
                            onUpdate={fetchStudent}
                        />
                        <Link href={`/owner/students/${student.id}/edit`}>
                            <Button>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit Student
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Student Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                                    <p className="text-slate-900">{student.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Roll Number</label>
                                    <p className="text-slate-900">{student.roll_number || 'Not Assigned'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Gender</label>
                                    <p className="text-slate-900 capitalize flex items-center gap-2">
                                        {isMale ? '👦 Male' : '👧 Female'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                                    <p className="text-slate-900">
                                        {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Class Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" />
                                Academic Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Class</label>
                                <p className="text-slate-900">{student.class?.class_name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Section</label>
                                <p className="text-slate-900">{student.section?.section_name || 'Not Assigned'}</p>
                            </div>
                            {student.custom_fee && (
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Monthly Fee</label>
                                    <p className="text-green-600 font-semibold">{formatCurrency(student.custom_fee)}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <Badge variant={student.status === 'active' ? 'success' : 'default'}>
                                    {student.status}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parent Info */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Parent/Guardian Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Father's Name</label>
                                    <p className="text-slate-900">{student.father_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Father's CNIC</label>
                                    <p className="text-slate-900">{student.father_cnic || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        Phone
                                    </label>
                                    <p className="text-slate-900">{student.father_phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </label>
                                    <p className="text-slate-900">{student.email || 'N/A'}</p>
                                </div>
                                {student.address && (
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            Address
                                        </label>
                                        <p className="text-slate-900">{student.address}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Additional Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Admission Date</label>
                                <p className="text-slate-900">
                                    {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Created At</label>
                                <p className="text-slate-900 text-sm">
                                    {new Date(student.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
