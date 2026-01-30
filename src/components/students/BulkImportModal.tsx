'use client'

import { useState } from 'react'
import { Upload, X, AlertCircle, CheckCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { parseExcelFile, validateStudentData, downloadImportTemplate, type StudentImportRow, type ImportValidationError } from '@/lib/excel-utils'
import { generateAdmissionNumber } from '@/lib/number-generator'
import { toast } from 'sonner'

interface BulkImportModalProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

export function BulkImportModal({ open, onClose, onSuccess }: BulkImportModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [students, setStudents] = useState<StudentImportRow[]>([])
    const [errors, setErrors] = useState<ImportValidationError[]>([])
    const [importing, setImporting] = useState(false)
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
    const [importStats, setImportStats] = useState({ success: 0, failed: 0 })

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
            toast.error('Please select an Excel file (.xlsx or .xls)')
            return
        }

        setFile(selectedFile)

        try {
            toast.info('Parsing Excel file...')
            const parsedData = await parseExcelFile(selectedFile)
            setStudents(parsedData)

            // Fetch classes for validation
            const { data: classes } = await supabase
                .from('classes')
                .select('*')

            // Validate data
            const validationErrors = validateStudentData(parsedData, classes || [])
            setErrors(validationErrors)

            if (validationErrors.length > 0) {
                toast.warning(`Found ${validationErrors.length} validation errors`)
            } else {
                toast.success('File validated successfully!')
            }

            setStep('preview')
        } catch (error) {
            console.error('Error parsing file:', error)
            toast.error('Failed to parse Excel file')
        }
    }

    const handleImport = async () => {
        setImporting(true)
        setStep('importing')
        let successCount = 0
        let failedCount = 0

        try {
            // Filter out rows with errors
            const rowsWithErrors = new Set(errors.map(e => e.row))
            const validStudents = students.filter((_, index) => !rowsWithErrors.has(index + 2))

            for (const student of validStudents) {
                try {
                    // Find class and section IDs
                    let classId = null
                    let sectionId = null

                    if (student.class_name) {
                        const { data: classData } = await supabase
                            .from('classes')
                            .select('id')
                            .ilike('class_name', student.class_name)
                            .single()

                        classId = classData?.id || null

                        if (classId && student.section_name) {
                            const { data: sectionData } = await supabase
                                .from('sections')
                                .select('id')
                                .eq('class_id', classId)
                                .ilike('section_name', student.section_name)
                                .single()

                            sectionId = sectionData?.id || null
                        }
                    }

                    // Generate admission number
                    const admissionNumber = await generateAdmissionNumber(classId || undefined)

                    // Insert student
                    const { error } = await supabase
                        .from('students')
                        .insert({
                            name: student.name,
                            roll_number: student.roll_number || null,
                            admission_number: admissionNumber,
                            gender: student.gender,
                            date_of_birth: student.date_of_birth || null,
                            class_id: classId,
                            section_id: sectionId,
                            father_name: student.father_name || null,
                            father_cnic: student.father_cnic || null,
                            father_phone: student.father_phone || null,
                            email: student.email || null,
                            address: student.address || null,
                            admission_date: student.admission_date || new Date().toISOString().split('T')[0],
                            status: 'active'
                        })

                    if (error) {
                        console.error('Import error for student:', student.name, error)
                        failedCount++
                    } else {
                        successCount++
                    }
                } catch (error) {
                    console.error('Error importing student:', error)
                    failedCount++
                }
            }

            setImportStats({ success: successCount, failed: failedCount })
            setStep('complete')

            if (successCount > 0) {
                toast.success(`Successfully imported ${successCount} students!`)
                onSuccess()
            }

            if (failedCount > 0) {
                toast.error(`Failed to import ${failedCount} students`)
            }
        } catch (error) {
            console.error('Import error:', error)
            toast.error('Failed to import students')
        } finally {
            setImporting(false)
        }
    }

    const resetModal = () => {
        setFile(null)
        setStudents([])
        setErrors([])
        setStep('upload')
        setImportStats({ success: 0, failed: 0 })
    }

    const handleClose = () => {
        resetModal()
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Bulk Student Import
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Step 1: Upload Excel File</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => downloadImportTemplate()}
                                            className="flex items-center gap-2"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download Template
                                        </Button>
                                        <p className="text-sm text-slate-600">
                                            Download the template to see the required format
                                        </p>
                                    </div>

                                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                            <p className="text-sm text-slate-600 mb-2">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Excel files only (.xlsx, .xls)
                                            </p>
                                        </label>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
                                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                            <li>Name and Gender are required fields</li>
                                            <li>Class name must match exactly with existing classes</li>
                                            <li>CNIC format: 00000-0000000-0</li>
                                            <li>Phone should be 11 digits</li>
                                            <li>Admission numbers will be auto-generated</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 2: Preview */}
                    {step === 'preview' && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Step 2: Review Import Data</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-slate-600">
                                                Total rows: <span className="font-semibold">{students.length}</span>
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                Valid rows: <span className="font-semibold text-green-600">{students.length - new Set(errors.map(e => e.row)).size}</span>
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                Rows with errors: <span className="font-semibold text-red-600">{new Set(errors.map(e => e.row)).size}</span>
                                            </p>
                                        </div>
                                        <Button variant="outline" onClick={() => setStep('upload')}>
                                            <X className="h-4 w-4 mr-2" />
                                            Choose Different File
                                        </Button>
                                    </div>

                                    {errors.length > 0 && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                                            <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4" />
                                                Validation Errors
                                            </h4>
                                            <div className="space-y-1">
                                                {errors.map((error, index) => (
                                                    <p key={index} className="text-sm text-red-800">
                                                        Row {error.row}: {error.field} - {error.message}
                                                    </p>
                                                ))}
                                            </div>
                                            <p className="text-sm text-red-700 mt-3">
                                                ⚠️ Rows with errors will be skipped during import
                                            </p>
                                        </div>
                                    )}

                                    <div className="bg-slate-50 border rounded-lg p-4 max-h-96 overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-200 sticky top-0">
                                                <tr>
                                                    <th className="px-2 py-1 text-left">#</th>
                                                    <th className="px-2 py-1 text-left">Name</th>
                                                    <th className="px-2 py-1 text-left">Gender</th>
                                                    <th className="px-2 py-1 text-left">Class</th>
                                                    <th className="px-2 py-1 text-left">Father Name</th>
                                                    <th className="px-2 py-1 text-left">Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map((student, index) => {
                                                    const hasError = errors.some(e => e.row === index + 2)
                                                    return (
                                                        <tr key={index} className={hasError ? 'bg-red-100' : ''}>
                                                            <td className="px-2 py-1">{index + 1}</td>
                                                            <td className="px-2 py-1">{student.name}</td>
                                                            <td className="px-2 py-1 capitalize">{student.gender}</td>
                                                            <td className="px-2 py-1">{student.class_name || '-'}</td>
                                                            <td className="px-2 py-1">{student.father_name || '-'}</td>
                                                            <td className="px-2 py-1">{student.father_phone || '-'}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <Button variant="outline" onClick={handleClose}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleImport}
                                            disabled={students.length === 0 || students.length === new Set(errors.map(e => e.row)).size}
                                        >
                                            Import {students.length - new Set(errors.map(e => e.row)).size} Students
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 3: Importing */}
                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
                            <h3 className="text-lg font-semibold text-slate-900">Importing Students...</h3>
                            <p className="text-sm text-slate-600">Please wait, this may take a moment</p>
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {step === 'complete' && (
                        <div className="space-y-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center space-y-4">
                                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                                        <h3 className="text-xl font-bold text-slate-900">Import Complete!</h3>

                                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <p className="text-3xl font-bold text-green-600">{importStats.success}</p>
                                                <p className="text-sm text-green-800">Successfully Imported</p>
                                            </div>
                                            {importStats.failed > 0 && (
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                    <p className="text-3xl font-bold text-red-600">{importStats.failed}</p>
                                                    <p className="text-sm text-red-800">Failed</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-center gap-3 pt-4">
                                            <Button variant="outline" onClick={resetModal}>
                                                Import More
                                            </Button>
                                            <Button onClick={handleClose}>
                                                Done
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
