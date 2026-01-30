import * as XLSX from 'xlsx'

interface ExportColumn {
    header: string
    key: string
    width?: number
}

export function exportToExcel<T>(
    data: T[],
    columns: ExportColumn[],
    filename: string
) {
    try {
        // Create worksheet data
        const wsData = [
            // Headers
            columns.map(col => col.header),
            // Data rows
            ...data.map(item =>
                columns.map(col => {
                    const value = (item as any)[col.key]
                    return value ?? ''
                })
            )
        ]

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData)

        // Set column widths
        ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }))

        // Create workbook
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

        // Generate file
        XLSX.writeFile(wb, `${filename}.xlsx`)

        return { success: true }
    } catch (error) {
        console.error('Excel export error:', error)
        return { success: false, error }
    }
}

// Specific export functions
export function exportStudents(students: any[]) {
    const columns: ExportColumn[] = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Father Name', key: 'father_name', width: 20 },
        { header: 'Roll Number', key: 'roll_number', width: 15 },
        { header: 'Class', key: 'class_name', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Monthly Fee', key: 'custom_fee', width: 15 },
    ]

    return exportToExcel(
        students.map(s => ({
            name: s.name,
            father_name: s.father_name,
            roll_number: s.roll_number,
            class_name: s.class?.class_name || '',
            status: s.status,
            custom_fee: s.custom_fee || ''
        })),
        columns,
        `students_${new Date().toISOString().split('T')[0]}`
    )
}

export function exportPayments(payments: any[]) {
    const columns: ExportColumn[] = [
        { header: 'Date', key: 'payment_date', width: 15 },
        { header: 'Student', key: 'student_name', width: 20 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Method', key: 'payment_method', width: 12 },
        { header: 'Received By', key: 'received_by', width: 15 },
        { header: 'Notes', key: 'notes', width: 25 },
    ]

    return exportToExcel(
        payments.map(p => ({
            payment_date: p.payment_date,
            student_name: p.student?.name || '',
            amount: p.amount,
            payment_method: p.payment_method,
            received_by: p.received_by,
            notes: p.notes || ''
        })),
        columns,
        `payments_${new Date().toISOString().split('T')[0]}`
    )
}

export function exportChallans(challans: any[]) {
    const columns: ExportColumn[] = [
        { header: 'Challan #', key: 'challan_number', width: 18 },
        { header: 'Student', key: 'student_name', width: 20 },
        { header: 'Month', key: 'month', width: 12 },
        { header: 'Amount', key: 'total_amount', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Due Date', key: 'due_date', width: 15 },
    ]

    return exportToExcel(
        challans.map(c => ({
            challan_number: c.challan_number,
            student_name: c.student?.name || '',
            month: c.month,
            total_amount: c.total_amount,
            status: c.status,
            due_date: c.due_date
        })),
        columns,
        `challans_${new Date().toISOString().split('T')[0]}`
    )
}

export function exportAdmissions(admissions: any[]) {
    const columns: ExportColumn[] = [
        { header: 'Student Name', key: 'student_name', width: 20 },
        { header: 'Father Name', key: 'father_name', width: 20 },
        { header: 'Phone', key: 'father_phone', width: 15 },
        { header: 'Class', key: 'class_name', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Date', key: 'created_at', width: 15 },
    ]

    return exportToExcel(
        admissions.map(a => ({
            student_name: a.student_name,
            father_name: a.father_name,
            father_phone: a.father_phone,
            class_name: a.class?.class_name || '',
            status: a.status,
            created_at: a.created_at
        })),
        columns,
        `admissions_${new Date().toISOString().split('T')[0]}`
    )
}
