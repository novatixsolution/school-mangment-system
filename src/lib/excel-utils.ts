import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export interface StudentImportRow {
    name: string
    roll_number?: string
    gender: 'male' | 'female'
    date_of_birth?: string
    class_name?: string
    section_name?: string
    father_name?: string
    father_cnic?: string
    father_phone?: string
    email?: string
    address?: string
    admission_date?: string
}

export interface ImportValidationError {
    row: number
    field: string
    message: string
}

export interface ImportResult {
    success: boolean
    imported: number
    failed: number
    errors: ImportValidationError[]
    data?: any[]
}

/**
 * Parse Excel file and extract student data
 */
export async function parseExcelFile(file: File): Promise<StudentImportRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'binary' })
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[]

                const students: StudentImportRow[] = jsonData.map((row) => ({
                    name: row['Name'] || row['Student Name'] || '',
                    roll_number: row['Roll Number'] || row['Roll No'] || '',
                    gender: (row['Gender']?.toLowerCase() === 'female' ? 'female' : 'male'),
                    date_of_birth: row['Date of Birth'] || row['DOB'] || '',
                    class_name: row['Class'] || '',
                    section_name: row['Section'] || '',
                    father_name: row['Father Name'] || row["Father's Name"] || '',
                    father_cnic: row['Father CNIC'] || row['CNIC'] || '',
                    father_phone: row['Phone'] || row['Father Phone'] || '',
                    email: row['Email'] || '',
                    address: row['Address'] || '',
                    admission_date: row['Admission Date'] || ''
                }))

                resolve(students)
            } catch (error) {
                reject(error)
            }
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsBinaryString(file)
    })
}

/**
 * Validate imported student data
 */
export function validateStudentData(
    students: StudentImportRow[],
    existingClasses: any[]
): ImportValidationError[] {
    const errors: ImportValidationError[] = []

    students.forEach((student, index) => {
        const rowNum = index + 2 // Excel rows start at 1, header is row 1

        // Required fields validation
        if (!student.name || student.name.trim() === '') {
            errors.push({
                row: rowNum,
                field: 'name',
                message: 'Name is required'
            })
        }

        if (!student.gender) {
            errors.push({
                row: rowNum,
                field: 'gender',
                message: 'Gender is required'
            })
        }

        // Validate class exists
        if (student.class_name) {
            const classExists = existingClasses.some(
                (c) => c.class_name.toLowerCase() === student.class_name?.toLowerCase()
            )
            if (!classExists) {
                errors.push({
                    row: rowNum,
                    field: 'class_name',
                    message: `Class "${student.class_name}" does not exist`
                })
            }
        }

        // Validate CNIC format (optional)
        if (student.father_cnic && !/^\d{5}-\d{7}-\d{1}$/.test(student.father_cnic)) {
            errors.push({
                row: rowNum,
                field: 'father_cnic',
                message: 'Invalid CNIC format (should be: 00000-0000000-0)'
            })
        }

        // Validate phone format (optional)
        if (student.father_phone && !/^\d{11}$/.test(student.father_phone.replace(/[- ]/g, ''))) {
            errors.push({
                row: rowNum,
                field: 'father_phone',
                message: 'Invalid phone number (should be 11 digits)'
            })
        }

        // Validate email format (optional)
        if (student.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
            errors.push({
                row: rowNum,
                field: 'email',
                message: 'Invalid email format'
            })
        }
    })

    return errors
}

/**
 * Export students to Excel file
 */
export function exportStudentsToExcel(
    students: any[],
    filename: string = 'students.xlsx',
    options: {
        includeFees?: boolean
        includeParentInfo?: boolean
    } = {}
) {
    const { includeFees = true, includeParentInfo = true } = options

    // Prepare data for export
    const exportData = students.map((student) => {
        const row: any = {
            'Name': student.name,
            'Roll Number': student.roll_number || '',
            'Admission Number': student.admission_number || '',
            'Gender': student.gender === 'male' ? 'Male' : 'Female',
            'Date of Birth': student.date_of_birth || '',
            'Class': student.class?.class_name || '',
            'Section': student.section?.section_name || '',
        }

        if (includeParentInfo) {
            row['Father Name'] = student.father_name || ''
            row['Father CNIC'] = student.father_cnic || ''
            row['Phone'] = student.father_phone || ''
            row['Email'] = student.email || ''
            row['Address'] = student.address || ''
        }

        if (includeFees) {
            row['Monthly Fee'] = student.custom_fee || ''
        }

        row['Admission Date'] = student.admission_date || ''
        row['Status'] = student.status === 'active' ? 'Active' : 'Inactive'

        return row
    })

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')

    // Set column widths
    const colWidths = [
        { wch: 25 }, // Name
        { wch: 12 }, // Roll Number
        { wch: 15 }, // Admission Number
        { wch: 10 }, // Gender
        { wch: 12 }, // DOB
        { wch: 15 }, // Class
        { wch: 10 }, // Section
    ]

    if (includeParentInfo) {
        colWidths.push(
            { wch: 25 }, // Father Name
            { wch: 15 }, // CNIC
            { wch: 12 }, // Phone
            { wch: 25 }, // Email
            { wch: 30 }  // Address
        )
    }

    if (includeFees) {
        colWidths.push({ wch: 12 }) // Monthly Fee
    }

    colWidths.push(
        { wch: 12 }, // Admission Date
        { wch: 10 }  // Status
    )

    worksheet['!cols'] = colWidths

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, filename)
}

/**
 * Generate Excel template for bulk import
 */
export function downloadImportTemplate() {
    const templateData = [
        {
            'Name': 'John Doe',
            'Roll Number': '001',
            'Gender': 'Male',
            'Date of Birth': '2010-01-15',
            'Class': 'Class 1',
            'Section': 'A',
            'Father Name': 'Mr. Doe',
            'Father CNIC': '12345-1234567-1',
            'Phone': '03001234567',
            'Email': 'parent@example.com',
            'Address': '123 Main Street, City',
            'Admission Date': '2024-01-01'
        }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')

    // Set column widths
    worksheet['!cols'] = [
        { wch: 25 }, // Name
        { wch: 12 }, // Roll Number
        { wch: 10 }, // Gender
        { wch: 12 }, // DOB
        { wch: 15 }, // Class
        { wch: 10 }, // Section
        { wch: 25 }, // Father Name
        { wch: 15 }, // CNIC
        { wch: 12 }, // Phone
        { wch: 25 }, // Email
        { wch: 30 }, // Address
        { wch: 12 }  // Admission Date
    ]

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, 'student_import_template.xlsx')
}
