'use client'

import { Download, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportStudentsToExcel } from '@/lib/excel-utils'
import { toast } from 'sonner'

interface ExportStudentsProps {
    students: any[]
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'default' | 'sm' | 'lg'
}

export function ExportStudents({ students, variant = 'outline', size = 'default' }: ExportStudentsProps) {
    const handleExport = (format: 'basic' | 'detailed' | 'withFees') => {
        if (students.length === 0) {
            toast.error('No students to export')
            return
        }

        try {
            const options = {
                includeFees: format === 'withFees',
                includeParentInfo: format === 'detailed' || format === 'withFees'
            }

            const date = new Date().toISOString().split('T')[0]
            const filename = `students_${format}_${date}.xlsx`

            exportStudentsToExcel(students, filename, options)
            toast.success(`Exported ${students.length} students successfully!`)
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export students')
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size}>
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('basic')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Basic (Name, Class, Contact)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('detailed')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Detailed (With Parent Info)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('withFees')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Complete (With Fees & Parent Info)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
