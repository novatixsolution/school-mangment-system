// Report Card PDF Generator
// Uses jsPDF to generate professional report cards

import jsPDF from 'jspdf'
import { StudentResult, ClassStatistics, getPositionSuffix, isInTop3 } from './results-calculator'

export interface ReportCardTemplate {
    id: string
    name: string
    showPosition: boolean
    showClassAverage: boolean
    showClassHighest: boolean
    showClassLowest: boolean
    showSubjectRank: boolean
    showAttendance: boolean
    showRemarks: boolean
    showSignatures: boolean
    showStamp: boolean
    headerColor: string
    accentColor: string
    fontFamily: string
}

export interface SchoolInfo {
    name: string
    address: string
    phone: string
    email: string
    logo?: string // Base64 image
}

export interface ReportCardData {
    student: {
        name: string
        rollNumber: string
        fatherName: string
        className: string
        sectionName: string
    }
    exam: {
        name: string
        year: string
    }
    result: StudentResult
    classStats: ClassStatistics
    attendance?: {
        present: number
        total: number
        percentage: number
    }
    remarks?: string
    signatures?: {
        principal?: string // Base64 image
        classTeacher?: string // Base64 image
    }
    stamp?: string // Base64 image
}

export const DEFAULT_TEMPLATE: ReportCardTemplate = {
    id: 'default',
    name: 'Classic Style',
    showPosition: true,
    showClassAverage: true,
    showClassHighest: true,
    showClassLowest: false,
    showSubjectRank: true,
    showAttendance: true,
    showRemarks: true,
    showSignatures: true,
    showStamp: true,
    headerColor: '#4f46e5',
    accentColor: '#6366f1',
    fontFamily: 'helvetica'
}

/**
 * Generate a single report card PDF
 */
export function generateReportCardPDF(
    school: SchoolInfo,
    data: ReportCardData,
    template: ReportCardTemplate = DEFAULT_TEMPLATE
): jsPDF {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let y = margin

    // Helper function to add text
    const addText = (text: string, x: number, yPos: number, options: any = {}) => {
        doc.setFontSize(options.size || 12)
        doc.setFont(template.fontFamily, options.style || 'normal')
        doc.setTextColor(options.color || '#000000')
        doc.text(text, x, yPos, { align: options.align || 'left' })
    }

    // Helper to draw a line
    const drawLine = (x1: number, y1: number, x2: number, y2: number, color: string = '#e2e8f0') => {
        doc.setDrawColor(color)
        doc.setLineWidth(0.5)
        doc.line(x1, y1, x2, y2)
    }

    // ========== HEADER ==========
    // Header background
    doc.setFillColor(template.headerColor)
    doc.rect(0, 0, pageWidth, 40, 'F')

    // School name
    addText(school.name.toUpperCase(), pageWidth / 2, 15, {
        size: 18,
        style: 'bold',
        color: '#ffffff',
        align: 'center'
    })

    // School address
    addText(school.address, pageWidth / 2, 23, {
        size: 10,
        color: '#ffffff',
        align: 'center'
    })

    // Contact info
    addText(`Phone: ${school.phone} | Email: ${school.email}`, pageWidth / 2, 30, {
        size: 8,
        color: '#ffffff',
        align: 'center'
    })

    y = 50

    // ========== REPORT CARD TITLE ==========
    addText('REPORT CARD', pageWidth / 2, y, {
        size: 16,
        style: 'bold',
        align: 'center'
    })
    y += 5
    addText(`${data.exam.name} - ${data.exam.year}`, pageWidth / 2, y, {
        size: 12,
        align: 'center'
    })
    y += 10

    // ========== STUDENT INFO ==========
    drawLine(margin, y, pageWidth - margin, y, template.accentColor)
    y += 8

    // Student details - left column
    addText('Student Name:', margin, y, { size: 10, style: 'bold' })
    addText(data.student.name, margin + 35, y, { size: 10 })

    addText('Roll No:', pageWidth / 2, y, { size: 10, style: 'bold' })
    addText(data.student.rollNumber, pageWidth / 2 + 20, y, { size: 10 })
    y += 6

    addText("Father's Name:", margin, y, { size: 10, style: 'bold' })
    addText(data.student.fatherName, margin + 35, y, { size: 10 })

    addText('Class:', pageWidth / 2, y, { size: 10, style: 'bold' })
    addText(`${data.student.className} - ${data.student.sectionName}`, pageWidth / 2 + 20, y, { size: 10 })
    y += 8

    drawLine(margin, y, pageWidth - margin, y, template.accentColor)
    y += 10

    // ========== MARKS TABLE ==========
    const tableStartY = y
    const colWidths = template.showSubjectRank
        ? [60, 30, 30, 30, 30]
        : [80, 35, 35, 30]
    const headers = template.showSubjectRank
        ? ['Subject', 'Max Marks', 'Obtained', 'Percentage', 'Rank']
        : ['Subject', 'Max Marks', 'Obtained', 'Percentage']

    // Table header
    doc.setFillColor(template.accentColor)
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')

    let xPos = margin + 3
    headers.forEach((header, i) => {
        addText(header, xPos, y + 5.5, { size: 9, style: 'bold', color: '#ffffff' })
        xPos += colWidths[i]
    })
    y += 8

    // Table rows
    data.result.subjects.forEach((subject, index) => {
        const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff'
        doc.setFillColor(bgColor)
        doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F')

        xPos = margin + 3
        const percentage = subject.maxMarks > 0
            ? ((subject.obtainedMarks / subject.maxMarks) * 100).toFixed(1)
            : '0'

        addText(subject.subjectName, xPos, y + 5, { size: 9 })
        xPos += colWidths[0]

        addText(subject.maxMarks.toString(), xPos, y + 5, { size: 9 })
        xPos += colWidths[1]

        addText(subject.obtainedMarks.toString(), xPos, y + 5, { size: 9 })
        xPos += colWidths[2]

        addText(`${percentage}%`, xPos, y + 5, { size: 9 })

        if (template.showSubjectRank && data.result.subjectRanks[subject.subjectId]) {
            xPos += colWidths[3]
            const rank = data.result.subjectRanks[subject.subjectId]
            addText(`${rank.rank}/${rank.total}`, xPos, y + 5, { size: 9 })
        }

        y += 7
    })

    // Table border
    doc.setDrawColor('#e2e8f0')
    doc.rect(margin, tableStartY, pageWidth - 2 * margin, y - tableStartY)
    y += 5

    // ========== TOTALS & RESULT ==========
    doc.setFillColor(template.headerColor)
    doc.rect(margin, y, pageWidth - 2 * margin, 25, 'F')

    addText('Total Marks:', margin + 5, y + 8, { size: 11, style: 'bold', color: '#ffffff' })
    addText(`${data.result.totalObtained} / ${data.result.totalMax}`, margin + 45, y + 8, { size: 11, color: '#ffffff' })

    addText('Percentage:', margin + 80, y + 8, { size: 11, style: 'bold', color: '#ffffff' })
    addText(`${data.result.percentage.toFixed(2)}%`, margin + 110, y + 8, { size: 11, color: '#ffffff' })

    addText('Grade:', margin + 5, y + 18, { size: 11, style: 'bold', color: '#ffffff' })
    addText(data.result.grade, margin + 25, y + 18, { size: 14, style: 'bold', color: '#ffffff' })

    if (template.showPosition && isInTop3(data.result.position)) {
        addText('Position:', margin + 80, y + 18, { size: 11, style: 'bold', color: '#ffffff' })
        addText(getPositionSuffix(data.result.position!), margin + 110, y + 18, { size: 14, style: 'bold', color: '#ffffff' })
    }

    y += 30

    // ========== CLASS STATISTICS ==========
    if (template.showClassAverage || template.showClassHighest) {
        addText('Class Statistics:', margin, y, { size: 10, style: 'bold' })
        y += 6

        const stats: string[] = []
        if (template.showClassAverage) {
            stats.push(`Average: ${data.classStats.averagePercentage.toFixed(1)}%`)
        }
        if (template.showClassHighest) {
            stats.push(`Highest: ${data.classStats.highestPercentage.toFixed(1)}%`)
        }
        if (template.showClassLowest) {
            stats.push(`Lowest: ${data.classStats.lowestPercentage.toFixed(1)}%`)
        }
        stats.push(`Total Students: ${data.classStats.totalStudents}`)

        addText(stats.join('  |  '), margin, y, { size: 9 })
        y += 10
    }

    // ========== ATTENDANCE ==========
    if (template.showAttendance && data.attendance) {
        drawLine(margin, y, pageWidth - margin, y)
        y += 6
        addText('Attendance:', margin, y, { size: 10, style: 'bold' })
        addText(`${data.attendance.present}/${data.attendance.total} days (${data.attendance.percentage.toFixed(1)}%)`, margin + 30, y, { size: 10 })
        y += 8
    }

    // ========== REMARKS ==========
    if (template.showRemarks && data.remarks) {
        addText('Remarks:', margin, y, { size: 10, style: 'bold' })
        y += 5
        addText(data.remarks, margin, y, { size: 9 })
        y += 10
    }

    // ========== SIGNATURES ==========
    if (template.showSignatures) {
        y = pageHeight - 45

        drawLine(margin, y, margin + 40, y)
        addText('Class Teacher', margin + 5, y + 5, { size: 8 })

        drawLine(pageWidth / 2 - 20, y, pageWidth / 2 + 20, y)
        addText('Principal', pageWidth / 2 - 10, y + 5, { size: 8 })

        drawLine(pageWidth - margin - 40, y, pageWidth - margin, y)
        addText('Parent/Guardian', pageWidth - margin - 35, y + 5, { size: 8 })
    }

    // ========== FOOTER ==========
    addText(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, {
        size: 8,
        color: '#94a3b8',
        align: 'center'
    })

    return doc
}

/**
 * Download single report card as PDF
 */
export function downloadReportCard(
    school: SchoolInfo,
    data: ReportCardData,
    template?: ReportCardTemplate
): void {
    const doc = generateReportCardPDF(school, data, template)
    doc.save(`Report_Card_${data.student.name.replace(/\s+/g, '_')}_${data.exam.name}.pdf`)
}

/**
 * Generate multiple report cards and download as ZIP
 */
export async function downloadBulkReportCards(
    school: SchoolInfo,
    dataList: ReportCardData[],
    template?: ReportCardTemplate
): Promise<void> {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    dataList.forEach((data, index) => {
        const doc = generateReportCardPDF(school, data, template)
        const pdfBlob = doc.output('blob')
        const filename = `Report_Card_${data.student.rollNumber}_${data.student.name.replace(/\s+/g, '_')}.pdf`
        zip.file(filename, pdfBlob)
    })

    const content = await zip.generateAsync({ type: 'blob' })

    // Download ZIP
    const link = document.createElement('a')
    link.href = URL.createObjectURL(content)
    link.download = `Report_Cards_${dataList[0]?.exam.name || 'Exam'}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * Get PDF as base64 for preview
 */
export function getReportCardBase64(
    school: SchoolInfo,
    data: ReportCardData,
    template?: ReportCardTemplate
): string {
    const doc = generateReportCardPDF(school, data, template)
    return doc.output('datauristring')
}
