'use client'

import { useState, useEffect } from 'react'
import { Download, Upload, AlertTriangle, RefreshCw, Database, Shield, School, Trash2, Palette, FileText } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { DeleteAllDataModal } from '@/components/settings/DeleteAllDataModal'
import { useAuth } from '@/contexts/AuthContext'

export default function SettingsPage() {
    const { profile } = useAuth()
    const [exporting, setExporting] = useState(false)
    const [importing, setImporting] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [exportProgress, setExportProgress] = useState(0)

    const handleExport = async () => {
        setExporting(true)
        setExportProgress(0)
        try {
            // Fetch all data from all tables
            const tables = [
                'profiles',
                'classes',
                'sections',
                'admissions',
                'students',
                'fee_structures',
                'fee_invoices',
                'fee_payments',
                'attendance',
                'subjects',
                'exams',
                'exam_subjects',
                'marks',
                'report_cards',
                'announcements',
                'documents',
            ]

            const backup: Record<string, unknown[]> = {}
            const totalTables = tables.length

            for (let i = 0; i < tables.length; i++) {
                const table = tables[i]
                const { data, error } = await supabase.from(table).select('*')
                if (!error && data) {
                    backup[table] = data
                }

                // Update progress
                const progress = Math.round(((i + 1) / totalTables) * 100)
                setExportProgress(progress)
            }

            // Create and download JSON file
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `school-backup-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success('Backup exported successfully')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export backup')
        } finally {
            setExporting(false)
            setExportProgress(0)
        }
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!confirm('This will overwrite existing data. Are you sure you want to continue?')) {
            return
        }

        setImporting(true)
        try {
            const text = await file.text()
            const backup = JSON.parse(text)

            // Import data to each table
            for (const [table, data] of Object.entries(backup)) {
                if (Array.isArray(data) && data.length > 0) {
                    // Delete existing data
                    await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')

                    // Insert backup data
                    const { error } = await supabase.from(table).insert(data)
                    if (error) {
                        console.error(`Error importing ${table}:`, error)
                    }
                }
            }

            toast.success('Backup restored successfully')
        } catch (error) {
            console.error('Import error:', error)
            toast.error('Failed to import backup. Please check the file format.')
        } finally {
            setImporting(false)
            e.target.value = ''
        }
    }



    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                    <p className="text-slate-500 mt-1">System configuration and backup</p>
                </div>

                {/* School Info */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600">
                                <School className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>School Information</CardTitle>
                                <CardDescription>Basic school details</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="School Name" defaultValue="EduManager School" />
                            <Input label="School Code" defaultValue="EDU-001" />
                            <Input label="Phone" defaultValue="+92 300 1234567" />
                            <Input label="Email" defaultValue="info@edumanager.com" />
                            <div className="md:col-span-2">
                                <Input label="Address" defaultValue="123 Education Street, City" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <Button>Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Challan Generator */}
                <Card className="border-green-200 border-2 hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 text-green-600">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-green-900">💰 Bank Challan Generator</CardTitle>
                                <CardDescription>Create Pakistani-style 2/3 column bank challans</CardDescription>
                            </div>
                            <Button
                                onClick={() => window.location.href = '/owner/settings/bank-challan'}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Create Challan →
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="p-3 bg-green-50 rounded-lg text-center">
                                <div className="font-semibold text-green-900">2/3 Columns</div>
                                <div className="text-xs text-green-600">Flexible</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg text-center">
                                <div className="font-semibold text-green-900">Both Modes</div>
                                <div className="text-xs text-green-600">Portrait/Landscape</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg text-center">
                                <div className="font-semibold text-green-900">3 Templates</div>
                                <div className="text-xs text-green-600">Pre-built</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg text-center">
                                <div className="font-semibold text-green-900">Print Ready</div>
                                <div className="text-xs text-green-600">One-click</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Template Builder Link */}
                <Card className="border-purple-200 border-2 hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 text-purple-600">
                                <Palette className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-purple-900">🎨 Challan Template Builder</CardTitle>
                                <CardDescription>Design custom fee challan templates with drag-and-drop</CardDescription>
                            </div>
                            <Button
                                onClick={() => window.location.href = '/owner/settings/template-builder'}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                Open Builder →
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="p-3 bg-purple-50 rounded-lg text-center">
                                <div className="font-semibold text-purple-900">5+ Themes</div>
                                <div className="text-xs text-purple-600">Pre-built</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg text-center">
                                <div className="font-semibold text-purple-900">12 Templates</div>
                                <div className="text-xs text-purple-600">Section library</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg text-center">
                                <div className="font-semibold text-purple-900">QR & Barcode</div>
                                <div className="text-xs text-purple-600">Built-in</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg text-center">
                                <div className="font-semibold text-purple-900">PDF Export</div>
                                <div className="text-xs text-purple-600">One-click</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Backup & Restore */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-600">
                                <Database className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Backup & Restore</CardTitle>
                                <CardDescription>Export or import system data</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Export */}
                            <div className="p-6 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <Download className="h-6 w-6 text-green-600" />
                                    <div>
                                        <h4 className="font-semibold text-slate-900">Export Backup</h4>
                                        <p className="text-sm text-slate-500">Download all system data</p>
                                    </div>
                                </div>

                                {exporting ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">Exporting data...</span>
                                            <span className="font-bold text-green-600">{exportProgress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300 ease-out flex items-center justify-end pr-1"
                                                style={{ width: `${exportProgress}%` }}
                                            >
                                                {exportProgress > 10 && (
                                                    <span className="text-[10px] text-white font-bold">{exportProgress}%</span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 text-center">Please wait while we backup your data</p>
                                    </div>
                                ) : (
                                    <Button onClick={handleExport} disabled={exporting} className="w-full">
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Data
                                    </Button>
                                )}
                            </div>

                            {/* Import */}
                            <div className="p-6 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <Upload className="h-6 w-6 text-blue-600" />
                                    <div>
                                        <h4 className="font-semibold text-slate-900">Import Backup</h4>
                                        <p className="text-sm text-slate-500">Restore from backup file</p>
                                    </div>
                                </div>
                                <label className="block cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        disabled={importing}
                                        className="hidden"
                                    />
                                    <div className={`inline-flex items-center justify-center w-full h-11 px-6 rounded-xl border-2 border-slate-200 font-medium transition-all ${importing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
                                        {importing ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4 mr-2" />
                                                Select File
                                            </>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-300 border-2">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-100 text-red-600">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-red-600 text-xl">⚠️ Danger Zone</CardTitle>
                                <CardDescription className="text-red-500">Irreversible and destructive actions</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border-2 border-red-200">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <Trash2 className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-red-900 mb-2 text-lg">Delete All School Data</h4>
                                    <p className="text-sm text-red-700 mb-4">
                                        Permanently delete ALL school data including students, classes, admissions,
                                        attendance records, fee challans, payments, and more. This action is
                                        <span className="font-bold"> IRREVERSIBLE</span> and cannot be undone.
                                    </p>
                                    <div className="bg-white rounded-lg p-3 mb-4 border border-red-200">
                                        <p className="text-xs text-slate-600 mb-2">⚠️ <strong>What will be deleted:</strong></p>
                                        <ul className="text-xs text-slate-700 space-y-1">
                                            <li>• All students and their records</li>
                                            <li>• All classes, sections, and subjects</li>
                                            <li>• All attendance records</li>
                                            <li>• All fee challans and payments</li>
                                            <li>• All admission applications</li>
                                            <li>• All fee structures</li>
                                            <li>• Optionally: Staff members (you choose)</li>
                                        </ul>
                                    </div>
                                    <div className="bg-green-100 rounded-lg p-3 mb-4 border border-green-300">
                                        <p className="text-xs text-green-800">
                                            ✓ <strong>What will be kept:</strong> School information, your owner account
                                        </p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete All Data
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Delete All Data Modal */}
                {profile && (
                    <DeleteAllDataModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        currentUserId={profile.id}
                    />
                )}
            </div>
        </DashboardLayout>
    )
}
