'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, Users, GraduationCap } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'

export default function AdmissionDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [admission, setAdmission] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (params.id) {
            fetchAdmission()
        }
    }, [params.id])

    const fetchAdmission = async () => {
        try {
            const { data, error } = await supabase
                .from('admissions')
                .select(`
                    *,
                    class:classes(id, class_name, medium),
                    section:sections(id, section_name)
                `)
                .eq('id', params.id)
                .single()

            if (error) throw error
            setAdmission(data)
        } catch (error) {
            console.error('Error fetching admission:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            pending: { variant: 'warning', label: 'Pending' },
            approved: { variant: 'success', label: 'Approved' },
            rejected: { variant: 'destructive', label: 'Rejected' },
        }
        const config = variants[status] || variants.pending
        return <Badge variant={config.variant}>{config.label}</Badge>
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

    if (!admission) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-slate-600">Admission not found</p>
                    <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                </div>
            </DashboardLayout>
        )
    }

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
                            <h1 className="text-2xl font-bold text-slate-900">Admission Details</h1>
                            <p className="text-sm text-slate-500">View admission information</p>
                        </div>
                    </div>
                    {getStatusBadge(admission.status)}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Student Information */}
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
                                    <p className="text-slate-900">{admission.student_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Gender</label>
                                    <p className="text-slate-900 capitalize">{admission.gender}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                                    <p className="text-slate-900">{new Date(admission.date_of_birth).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Previous School</label>
                                    <p className="text-slate-900">{admission.previous_school || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Class Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" />
                                Class Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Class</label>
                                <p className="text-slate-900">{admission.class?.class_name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Medium</label>
                                <p className="text-slate-900">{admission.class?.medium || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Section</label>
                                <p className="text-slate-900">{admission.section?.section_name || 'Not Assigned'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parent Information */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Parent/Guardian Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Father's Name</label>
                                    <p className="text-slate-900">{admission.father_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Father's CNIC</label>
                                    <p className="text-slate-900">{admission.father_cnic}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        Phone
                                    </label>
                                    <p className="text-slate-900">{admission.phone}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </label>
                                    <p className="text-slate-900">{admission.email || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        Address
                                    </label>
                                    <p className="text-slate-900">{admission.address}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Additional Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Application Date</label>
                                <p className="text-slate-900">{new Date(admission.created_at).toLocaleDateString()}</p>
                            </div>
                            {admission.notes && (
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Notes</label>
                                    <p className="text-slate-900 text-sm">{admission.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
