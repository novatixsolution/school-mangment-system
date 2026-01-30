'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Challan } from '@/types/challan'
import { Student } from '@/types/student'
import { ChallanPDFTemplate } from '@/components/challans/ChallanPDFTemplate'
import { Loader2 } from 'lucide-react'

export default function PrintChallanPage() {
    const params = useParams()
    const challanId = params?.id as string
    const [challan, setChallan] = useState<Challan | null>(null)
    const [student, setStudent] = useState<Student | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (challanId) {
            fetchChallan()
        }
    }, [challanId])

    const fetchChallan = async () => {
        try {
            const { data: challanData, error: challanError } = await supabase
                .from('fee_challans')
                .select(`
                    *,
                    student:students(
                        *,
                        class:classes(*)
                    )
                `)
                .eq('id', challanId)
                .single()

            if (challanError) throw challanError

            setChallan(challanData)
            setStudent((challanData as any).student)

            // Auto-print after loading
            setTimeout(() => {
                window.print()
            }, 500)
        } catch (error) {
            console.error('Error fetching challan:', error)
            alert('Failed to load challan')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!challan || !student) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600">Challan not found</p>
            </div>
        )
    }

    return (
        <ChallanPDFTemplate
            challan={challan}
            student={student}
            schoolInfo={{
                name: 'School Management System',
                address: 'Your School Address',
                phone: '+92-XXX-XXXXXXX'
            }}
        />
    )
}
