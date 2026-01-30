import { useState, useEffect } from 'react'
import { X, Users, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Student {
    id: string
    name: string
    roll_number: string
    class: {
        id: string
        class_name: string
    }
}

interface Props {
    isOpen: boolean
    onClose: () => void
    onGenerated: () => void
    onOpenIndividualModal: (studentId: string) => void
}

export function StudentsWithoutChallansModal({ isOpen, onClose, onGenerated, onOpenIndividualModal }: Props) {
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedClass, setSelectedClass] = useState<string>('all')
    const [classes, setClasses] = useState<any[]>([])

    useEffect(() => {
        if (isOpen) {
            fetchStudentsWithoutChallans()
            fetchClasses()
        }
    }, [isOpen])

    const fetchClasses = async () => {
        const { data } = await supabase
            .from('classes')
            .select('id, class_name')
            .order('class_name')
        setClasses(data || [])
    }

    const fetchStudentsWithoutChallans = async () => {
        try {
            setLoading(true)
            const currentDate = new Date()
            const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

            // Get all students
            let studentQuery = supabase
                .from('students')
                .select(`
                    id,
                    name,
                    roll_number,
                    class:classes(id, class_name)
                `)
                .eq('status', 'active')
                .order('name')

            const { data: allStudents, error: studentsError } = await studentQuery

            if (studentsError) throw studentsError

            // Get all challans for current month
            const { data: challans, error: challansError } = await supabase
                .from('fee_challans')
                .select('student_id')
                .eq('month', currentMonth)

            if (challansError) throw challansError

            // Filter students without challans
            const challanStudentIds = new Set(challans?.map(c => c.student_id) || [])
            const studentsWithoutChallans = allStudents?.filter(s => !challanStudentIds.has(s.id)) || []

            setStudents(studentsWithoutChallans)
        } catch (error) {
            console.error('Error fetching students:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const filteredStudents = selectedClass === 'all'
        ? students
        : students.filter(s => s.class.id === selectedClass)

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-8 w-8" />
                            <div>
                                <h2 className="text-2xl font-bold">Students Without Challans</h2>
                                <p className="text-orange-100 text-sm">Current month - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
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

                {/* Stats & Filters */}
                <div className="p-6 border-b bg-slate-50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <Users className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{filteredStudents.length}</p>
                                <p className="text-sm text-slate-600">Students without challans</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="all">All Classes</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Students List */}
                <div className="p-6 overflow-y-auto max-h-[500px]">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="mt-4 text-slate-600">Loading students...</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <p className="text-xl font-semibold text-slate-900">All caught up!</p>
                            <p className="text-slate-600 mt-2">All students have challans for this month</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredStudents.map(student => (
                                <div
                                    key={student.id}
                                    className="flex items-center justify-between p-4 bg-white border-2 border-slate-200 rounded-lg hover:border-orange-300 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{student.name}</p>
                                            <p className="text-sm text-slate-600">
                                                {student.class.class_name} • Roll: {student.roll_number}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => {
                                            onOpenIndividualModal(student.id)
                                            onClose()
                                        }}
                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                        size="sm"
                                    >
                                        Customize & Generate
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
