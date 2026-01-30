'use client'

import { useState, useRef } from 'react'
import { CreditCard, Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StudentIDCard } from './StudentIDCard'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

interface IDCardGeneratorProps {
    students: any[]
    open: boolean
    onClose: () => void
}

export function IDCardGenerator({ students, open, onClose }: IDCardGeneratorProps) {
    const [selectedTheme, setSelectedTheme] = useState<'blue' | 'green' | 'purple' | 'red'>('blue')
    const [generating, setGenerating] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    const handlePrint = () => {
        if (!cardRef.current) return
        const printWindow = window.open('', '', 'height=600,width=800')
        if (printWindow) {
            printWindow.document.write('<html><head><title>ID Cards</title></head><body>')
            printWindow.document.write(cardRef.current.innerHTML)
            printWindow.document.write('</body></html>')
            printWindow.document.close()
            printWindow.print()
        }
    }

    const handleDownloadPDF = async () => {
        if (!cardRef.current) return

        setGenerating(true)
        toast.info('Generating PDF...')

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                logging: false
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [85.6, 53.98] // CR80 card size
            })

            const imgWidth = 85.6
            const imgHeight = 53.98

            students.forEach((student, index) => {
                if (index > 0) {
                    pdf.addPage()
                }
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
            })

            pdf.save(`ID_Cards_${new Date().toISOString().split('T')[0]}.pdf`)
            toast.success('PDF downloaded successfully!')
        } catch (error) {
            console.error('Error generating PDF:', error)
            toast.error('Failed to generate PDF')
        } finally {
            setGenerating(false)
        }
    }

    const schoolInfo = {
        name: 'School Name', // TODO: Get from settings
        address: 'School Address',
        phone: '0300-1234567'
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Generate ID Cards ({students.length} {students.length === 1 ? 'Student' : 'Students'})
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Theme Selection */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Select Theme</label>
                        <div className="flex gap-2">
                            {(['blue', 'green', 'purple', 'red'] as const).map((theme) => (
                                <button
                                    key={theme}
                                    onClick={() => setSelectedTheme(theme)}
                                    className={`w-12 h-12 rounded-lg border-2 ${selectedTheme === theme ? 'border-slate-900 ring-2 ring-offset-2 ring-slate-400' : 'border-slate-300'
                                        } ${theme === 'blue' ? 'bg-blue-600' :
                                            theme === 'green' ? 'bg-green-600' :
                                                theme === 'purple' ? 'bg-purple-600' :
                                                    'bg-red-600'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} disabled={generating}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                        <Button onClick={handleDownloadPDF} disabled={generating} variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            {generating ? 'Generating...' : 'Download PDF'}
                        </Button>
                    </div>

                    {/* Preview */}
                    <div
                        ref={cardRef}
                        className="bg-slate-100 p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6"
                        style={{ minHeight: '400px' }}
                    >
                        {students.map((student) => (
                            <div key={student.id} className="flex justify-center">
                                <StudentIDCard
                                    student={{
                                        id: student.id,
                                        name: student.name,
                                        rollNumber: student.roll_number,
                                        admissionNumber: student.admission_number,
                                        className: student.class?.class_name,
                                        section: student.section?.section_name,
                                        gender: student.gender,
                                        photoUrl: student.photo_url,
                                        fatherName: student.father_name,
                                        fatherPhone: student.father_phone,
                                        bloodGroup: student.blood_group
                                    }}
                                    schoolInfo={schoolInfo}
                                    theme={selectedTheme}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
