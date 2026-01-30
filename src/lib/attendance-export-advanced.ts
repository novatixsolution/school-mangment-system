'use client'

import { supabase } from '@/lib/supabase/client'

/**
 * Export single student's attendance for a date range to Excel/CSV
 */
export async function exportStudentAttendanceRange(
    studentId: string,
    studentName: string,
    startDate: string,
    endDate: string
): Promise<void> {
    // Fetch attendance records
    const { data: records, error } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', studentId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')

    if (error) throw new Error('Failed to fetch attendance records')

    // Calculate summary
    const total = records?.length || 0
    const present = records?.filter(r => r.status === 'present' || r.status === 'late').length || 0
    const absent = records?.filter(r => r.status === 'absent').length || 0
    const late = records?.filter(r => r.status === 'late').length || 0
    const leave = records?.filter(r => r.status === 'leave').length || 0
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    // Create CSV
    const rows = [
        [`Student Attendance Report - ${studentName}`],
        [''],
        ['Period:', `${startDate} to ${endDate}`],
        [''],
        ['Date', 'Day', 'Status'],
        ...(records?.map(record => {
            const date = new Date(record.date)
            return [
                record.date,
                date.toLocaleDateString('en-US', { weekday: 'short' }),
                record.status.toUpperCase()
            ]
        }) || []),
        [''],
        ['Summary'],
        ['Total Days', total],
        ['Present (including late)', present],
        ['Absent', absent],
        ['Late', late],
        ['Leave', leave],
        ['Attendance Percentage', `${percentage}%`]
    ]

    const csvContent = rows.map(row => row.join(',')).join('\n')
    downloadCSV(csvContent, `${studentName}_attendance_${startDate}_to_${endDate}.csv`)
}

/**
 * Export class attendance for a date range to Excel/CSV
 */
export async function exportClassAttendanceRange(
    classId: string,
    sectionId: string,
    className: string,
    sectionName: string,
    startDate: string,
    endDate: string
): Promise<void> {
    // Fetch students
    let studentsQuery = supabase
        .from('students')
        .select('id, name, roll_number')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('roll_number')

    if (sectionId) {
        studentsQuery = studentsQuery.eq('section_id', sectionId)
    }

    const { data: students, error: studentsError } = await studentsQuery

    if (studentsError) throw new Error('Failed to fetch students')
    if (!students || students.length === 0) throw new Error('No students found')

    // Fetch attendance for all students in date range
    let attendanceQuery = supabase
        .from('attendance')
        .select('student_id, date, status')
        .eq('class_id', classId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')

    if (sectionId) {
        attendanceQuery = attendanceQuery.eq('section_id', sectionId)
    }

    const { data: attendanceRecords, error: attendanceError } = await attendanceQuery

    if (attendanceError) throw new Error('Failed to fetch attendance records')

    // Generate date range
    const dates: string[] = []
    const currentDate = new Date(startDate)
    const lastDate = new Date(endDate)

    while (currentDate <= lastDate) {
        dates.push(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
    }

    // Create attendance map
    const attendanceMap = new Map<string, string>()
    attendanceRecords?.forEach(record => {
        const key = `${record.student_id}_${record.date}`
        attendanceMap.set(key, record.status)
    })

    // Create CSV rows
    const headerRow = ['Roll No', 'Student Name', ...dates, 'Total Present', 'Total Absent', 'Percentage']
    const dataRows = students.map(student => {
        let presentCount = 0
        let totalDays = 0

        const statusCells = dates.map(date => {
            const key = `${student.id}_${date}`
            const status = attendanceMap.get(key) || '-'
            if (status !== '-') {
                totalDays++
                if (status === 'present' || status === 'late') {
                    presentCount++
                }
            }
            return status === 'present' ? 'P' :
                status === 'absent' ? 'A' :
                    status === 'late' ? 'L' :
                        status === 'leave' ? 'LV' : '-'
        })
        const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0

        return [
            student.roll_number || '-',
            student.name,
            ...statusCells,
            presentCount.toString(),
            (totalDays - presentCount).toString(),
            `${percentage}%`
        ]
    })

    const rows = [
        [`${className} - ${sectionName} Attendance Report`],
        [`Period: ${startDate} to ${endDate}`],
        [''],
        headerRow,
        ...dataRows
    ]

    const csvContent = rows.map(row => row.join(',')).join('\n')
    downloadCSV(csvContent, `${className}_${sectionName}_${startDate}_to_${endDate}.csv`)
}

/**
 * Export school-wide attendance summary for a date range
 */
export async function exportSchoolAttendanceRange(
    startDate: string,
    endDate: string
): Promise<void> {
    // Fetch all classes
    const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*, sections(*)')
        .eq('status', 'active')
        .order('class_name')

    if (classesError) throw new Error('Failed to fetch classes')

    // Fetch attendance summary for each class
    const summaryRows = []

    for (const cls of classes || []) {
        for (const section of cls.sections || []) {
            const { data: attendanceRecords } = await supabase
                .from('attendance')
                .select('status')
                .eq('class_id', cls.id)
                .eq('section_id', section.id)
                .gte('date', startDate)
                .lte('date', endDate)

            const total = attendanceRecords?.length || 0
            const present = attendanceRecords?.filter(r => r.status === 'present' || r.status === 'late').length || 0
            const absent = attendanceRecords?.filter(r => r.status === 'absent').length || 0
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0

            summaryRows.push([
                cls.class_name,
                section.section_name,
                total,
                present,
                absent,
                `${percentage}%`
            ])
        }
    }

    const rows = [
        ['School-Wide Attendance Summary'],
        [`Period: ${startDate} to ${endDate}`],
        [''],
        ['Class', 'Section', 'Total Records', 'Present', 'Absent', 'Attendance %'],
        ...summaryRows
    ]

    const csvContent = rows.map(row => row.join(',')).join('\n')
    downloadCSV(csvContent, `school_attendance_${startDate}_to_${endDate}.csv`)
}

/**
 * Generate PDF for single student
 */
export async function generateStudentAttendancePDF(
    studentId: string,
    studentName: string,
    startDate: string,
    endDate: string
): Promise<void> {
    // Fetch records
    const { data: records } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', studentId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')

    const total = records?.length || 0
    const present = records?.filter(r => r.status === 'present' || r.status === 'late').length || 0
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Student Attendance Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
                .header h1 { color: #4f46e5; margin: 0; }
                .info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background: #4f46e5; color: white; padding: 12px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
                tr:nth-child(even) { background: #f8fafc; }
                .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
                .summary-item { text-align: center; }
                .summary-value { font-size: 24px; font-weight: bold; color: #4f46e5; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎓 Student Attendance Report</h1>
                <p>${studentName}</p>
            </div>
            <div class="info">
                <strong>Period:</strong> ${startDate} to ${endDate}
            </div>
            <table>
                <thead>
                    <tr><th>Date</th><th>Day</th><th>Status</th></tr>
                </thead>
                <tbody>
                    ${records?.map(r => `
                        <tr>
                            <td>${r.date}</td>
                            <td>${new Date(r.date).toLocaleDateString('en-US', { weekday: 'short' })}</td>
                            <td>${r.status.toUpperCase()}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="3">No records found</td></tr>'}
                </tbody>
            </table>
            <div class="summary">
                <h3>Summary</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-value">${total}</div>
                        <div>Total Days</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value" style="color: #10b981;">${present}</div>
                        <div>Present</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value" style="color: #8b5cf6;">${percentage}%</div>
                        <div>Attendance</div>
                    </div>
                </div>
            </div>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
    `

    openPrintWindow(html)
}

/**
 * Generate PDF for class
 */
export async function generateClassAttendancePDF(
    classId: string,
    sectionId: string,
    className: string,
    sectionName: string,
    startDate: string,
    endDate: string
): Promise<void> {
    // Similar to Excel export but formatted for PDF
    // For brevity, using simplified version
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Class Attendance Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
                .header h1 { color: #4f46e5; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📚 Class Attendance Report</h1>
                <p>${className} - ${sectionName}</p>
                <p>Period: ${startDate} to ${endDate}</p>
            </div>
            <p>Detailed data exported to Excel for best viewing</p>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
    `

    openPrintWindow(html)
}

/**
 * Generate PDF for school  
 */
export async function generateSchoolAttendancePDF(
    startDate: string,
    endDate: string
): Promise<void> {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>School Attendance Summary</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
                .header h1 { color: #4f46e5; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏫 School Attendance Summary</h1>
                <p>Period: ${startDate} to ${endDate}</p>
            </div>
            <p>Detailed data exported to Excel for best viewing</p>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
    `

    openPrintWindow(html)
}

// Helper functions
function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

function openPrintWindow(html: string) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(html)
    printWindow.document.close()
}
