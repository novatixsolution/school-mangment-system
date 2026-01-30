'use client'

import { AttendanceRecord } from '@/lib/attendance-utils'
import { supabase } from '@/lib/supabase/client'

interface Student {
    id: string
    name: string
    roll_number?: string
}

export interface AttendanceReportData {
    title: string
    date: string
    className: string
    sectionName: string
    students: {
        name: string
        rollNumber: string
        status: string
        attendance: string
    }[]
    summary: {
        total: number
        present: number
        absent: number
        late: number
        leave: number
        percentage: number
    }
}

/**
 * Generate PDF Report for Attendance
 */
export async function generateAttendancePDF(data: AttendanceReportData): Promise<void> {
    // For now, we'll use browser print
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${data.title}</title>
            <style>
                @media print {
                    @page { size: A4; margin: 20mm; }
                }
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #4f46e5;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #4f46e5;
                    margin: 0;
                    font-size: 28px;
                }
                .header p {
                    color: #64748b;
                    margin: 5px 0;
                }
                .info-section {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f8fafc;
                    border-radius: 8px;
                }
                .info-item {
                    margin: 5px 0;
                }
                .info-label {
                    font-weight: bold;
                    color: #475569;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th {
                    background: #4f46e5;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                }
                td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #e2e8f0;
                }
                tr:nth-child(even) {
                    background: #f8fafc;
                }
                .status {
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    display: inline-block;
                }
                .status-present {
                    background: #d1fae5;
                    color: #065f46;
                }
                .status-absent {
                    background: #fee2e2;
                    color: #991b1b;
                }
                .status-late {
                    background: #fed7aa;
                    color: #9a3412;
                }
                .status-leave {
                    background: #dbeafe;
                    color: #1e3a8a;
                }
                .summary {
                    margin-top: 30px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border-left: 4px solid #4f46e5;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-top: 15px;
                }
                .summary-item {
                    text-align: center;
                }
                .summary-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #4f46e5;
                }
                .summary-label {
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 5px;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #e2e8f0;
                    text-align: center;
                    color: #64748b;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎓 School Attendance Report</h1>
                <p>${data.title}</p>
            </div>

            <div class="info-section">
                <div>
                    <div class="info-item">
                        <span class="info-label">Date:</span> ${data.date}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Class:</span> ${data.className}
                    </div>
                </div>
                <div>
                    <div class="info-item">
                        <span class="info-label">Section:</span> ${data.sectionName}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Generated:</span> ${new Date().toLocaleString()}
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Roll Number</th>
                        <th>Student Name</th>
                        <th>Status</th>
                        <th>Attendance %</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.students.map((student, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${student.rollNumber}</td>
                            <td>${student.name}</td>
                            <td>
                                <span class="status status-${student.status.toLowerCase()}">
                                    ${student.status}
                                </span>
                            </td>
                            <td>${student.attendance}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="summary">
                <h3 style="margin-top: 0; color: #1e293b;">Summary Statistics</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-value" style="color: #10b981;">${data.summary.present}</div>
                        <div class="summary-label">Present</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value" style="color: #ef4444;">${data.summary.absent}</div>
                        <div class="summary-label">Absent</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value" style="color: #f97316;">${data.summary.late}</div>
                        <div class="summary-label">Late</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value" style="color: #3b82f6;">${data.summary.leave}</div>
                        <div class="summary-label">Leave</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value">${data.summary.total}</div>
                        <div class="summary-label">Total Students</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-value" style="color: #8b5cf6;">${data.summary.percentage}%</div>
                        <div class="summary-label">Attendance Rate</div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>This is a computer-generated report from School Management System</p>
                <p>Printed on: ${new Date().toLocaleString()}</p>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
}

/**
 * Export attendance to Excel (CSV format)
 */
export function exportAttendanceToExcel(data: AttendanceReportData): void {
    const rows = [
        ['School Attendance Report'],
        [''],
        ['Date:', data.date],
        ['Class:', data.className],
        ['Section:', data.sectionName],
        [''],
        ['#', 'Roll Number', 'Student Name', 'Status', 'Attendance %'],
        ...data.students.map((student, index) => [
            index + 1,
            student.rollNumber,
            student.name,
            student.status,
            student.attendance
        ]),
        [''],
        ['Summary'],
        ['Total Students', data.summary.total],
        ['Present', data.summary.present],
        ['Absent', data.summary.absent],
        ['Late', data.summary.late],
        ['Leave', data.summary.leave],
        ['Attendance Rate', `${data.summary.percentage}%`]
    ]

    const csvContent = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `attendance_${data.className}_${data.date}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * Fetch student attendance records
 */
export async function fetchStudentAttendanceRecords(
    studentId: string,
    startDate?: string,
    endDate?: string
): Promise<AttendanceRecord[]> {
    let query = supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false })

    if (startDate) {
        query = query.gte('date', startDate)
    }
    if (endDate) {
        query = query.lte('date', endDate)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching attendance:', error)
        return []
    }

    return data || []
}
