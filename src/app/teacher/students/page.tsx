'use client'

import { useEffect, useState } from 'react'
import { Search, Users, ShieldAlert, BookOpen, Info } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/AuthContext'
import { getTeacherStudents, getAssignedSections, hasAssignedClasses } from '@/lib/teacher-data-filter'

interface Student {
    id: string
    name: string
    roll_number: string
    class_id: string
    section_id: string
    gender: string
    father_name: string
    father_phone: string
    photo_url?: string
    class?: {
        id: string
        class_name: string
    }
    section?: {
        id: string
        section_name: string
    }
}

interface Section {
    id: string
    section_name: string
    class_id: string
    class: {
        id: string
        class_name: string
    }
}

export default function TeacherStudentsPage() {
    const { profile } = useAuth()
    const [students, setStudents] = useState<Student[]>([])
    const [assignedSections, setAssignedSections] = useState<Section[]>([])
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSection, setSelectedSection] = useState<string>('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile?.id) {
            fetchData()
        }
    }, [profile?.id])

    useEffect(() => {
        filterStudents()
    }, [students, searchQuery, selectedSection])

    const fetchData = async () => {
        if (!profile?.id) return

        setLoading(true)

        try {
            // Fetch assigned sections
            const { data: sections } = await getAssignedSections(profile.id)
            setAssignedSections(sections)

            // Fetch students from assigned classes only
            const { data: studentData } = await getTeacherStudents(profile.id)
            setStudents(studentData)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterStudents = () => {
        let filtered = [...students]

        // Filter by section
        if (selectedSection !== 'all') {
            filtered = filtered.filter(s => s.section_id === selectedSection)
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                student =>
                    student.name.toLowerCase().includes(query) ||
                    student.roll_number?.toLowerCase().includes(query) ||
                    student.father_name?.toLowerCase().includes(query)
            )
        }

        setFilteredStudents(filtered)
    }

    // Show message if no classes assigned
    if (!loading && !hasAssignedClasses(profile)) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
                        <ShieldAlert className="h-10 w-10 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">No Classes Assigned</h1>
                    <p className="text-slate-500 text-center max-w-md">
                        You are not assigned to any classes yet. Please contact the school administrator to get assigned to classes.
                    </p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Students</h1>
                    <p className="text-slate-500 mt-1">
                        Students from your assigned classes only
                    </p>
                </div>

                {/* Info Banner */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-blue-900 font-medium">Class-Level Access</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    You are viewing students from your assigned classes only. You cannot see students from other classes.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assigned Classes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Your Assigned Classes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {assignedSections.map((section) => (
                                <Badge key={section.id} className="px-3 py-1.5 border border-slate-300">
                                    {section.class.class_name} - Section {section.section_name}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-100">
                                    <Users className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{students.length}</p>
                                    <p className="text-sm text-slate-500">Total Students</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100">
                                    <BookOpen className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{assignedSections.length}</p>
                                    <p className="text-sm text-slate-500">Sections</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100">
                                    <Search className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{filteredStudents.length}</p>
                                    <p className="text-sm text-slate-500">Filtered Results</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search by name, roll number, or father name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Section Filter */}
                            <div className="sm:w-64">
                                <select
                                    className="w-full h-11 px-4 rounded-lg border-2 border-slate-200 bg-white text-slate-900"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                >
                                    <option value="all">All Sections</option>
                                    {assignedSections.map((section) => (
                                        <option key={section.id} value={section.id}>
                                            {section.class.class_name} - {section.section_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Students List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Students ({filteredStudents.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Spinner />
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">
                                    {searchQuery || selectedSection !== 'all'
                                        ? 'No students found matching your filters'
                                        : 'No students in your assigned classes yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Roll No.</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Class</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Section</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Gender</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Father Name</th>
                                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Contact</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((student) => (
                                            <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="py-3 px-4">
                                                    <span className="font-mono text-sm">
                                                        {student.roll_number || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {student.photo_url ? (
                                                            <img
                                                                src={student.photo_url}
                                                                alt={student.name}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                <span className="text-sm font-semibold text-indigo-600">
                                                                    {student.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <span className="font-medium text-slate-900">{student.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge>
                                                        {student.class?.class_name || '-'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className="border border-slate-300">
                                                        {student.section?.section_name || '-'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-slate-600">{student.gender}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-slate-600">{student.father_name || '-'}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-slate-600">{student.father_phone || '-'}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
