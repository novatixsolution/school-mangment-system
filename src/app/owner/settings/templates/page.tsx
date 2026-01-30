'use client'

import { useEffect, useState } from 'react'
import {
    FileText, Plus, Edit, Trash2, Check, Eye, Upload,
    Image, Stamp, PenLine, Settings2, Palette
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'
import { ReportCardTemplate, DEFAULT_TEMPLATE } from '@/lib/pdf-generator'

interface Template extends ReportCardTemplate {
    isDefault?: boolean
}

export default function TemplatesSettings() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const [signatures, setSignatures] = useState({
        principal: '',
        classTeacher: '',
        stamp: ''
    })

    // Form data
    const [formData, setFormData] = useState<Template>({
        id: '',
        name: '',
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
    })

    useEffect(() => {
        fetchTemplates()
        loadSignatures()
    }, [])

    const fetchTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('report_templates')
                .select('*')
                .order('created_at')

            if (error) throw error

            // Parse config from JSON
            const parsedTemplates = (data || []).map((t: any) => ({
                ...t.config,
                id: t.id,
                name: t.name,
                isDefault: t.is_default
            }))

            // Add default template if no templates exist
            if (parsedTemplates.length === 0) {
                parsedTemplates.push({ ...DEFAULT_TEMPLATE, isDefault: true })
            }

            setTemplates(parsedTemplates)
        } catch (error) {
            console.error('Error fetching templates:', error)
            // Use default template on error
            setTemplates([{ ...DEFAULT_TEMPLATE, isDefault: true }])
        } finally {
            setLoading(false)
        }
    }

    const loadSignatures = () => {
        // Load from localStorage
        const saved = localStorage.getItem('reportCardSignatures')
        if (saved) {
            setSignatures(JSON.parse(saved))
        }
    }

    const handleSaveTemplate = async () => {
        if (!formData.name) {
            toast.error('Please enter template name')
            return
        }

        try {
            const config = { ...formData }
            delete (config as any).id
            delete (config as any).isDefault

            if (selectedTemplate?.id && selectedTemplate.id !== 'default') {
                // Update existing
                const { error } = await supabase
                    .from('report_templates')
                    .update({ name: formData.name, config })
                    .eq('id', selectedTemplate.id)

                if (error) throw error
                toast.success('Template updated successfully')
            } else {
                // Create new
                const { error } = await supabase
                    .from('report_templates')
                    .insert({ name: formData.name, config })

                if (error) throw error
                toast.success('Template created successfully')
            }

            setIsModalOpen(false)
            resetForm()
            fetchTemplates()
        } catch (error: any) {
            console.error('Error saving template:', error)
            toast.error('Failed to save template', error.message)
        }
    }

    const handleDeleteTemplate = async (id: string) => {
        if (id === 'default') {
            toast.error('Cannot delete default template')
            return
        }

        if (!confirm('Are you sure you want to delete this template?')) return

        try {
            const { error } = await supabase.from('report_templates').delete().eq('id', id)
            if (error) throw error

            toast.success('Template deleted')
            fetchTemplates()
        } catch (error: any) {
            console.error('Error deleting template:', error)
            toast.error('Failed to delete template', error.message)
        }
    }

    const handleSetDefault = async (id: string) => {
        try {
            // Remove default from all
            await supabase.from('report_templates').update({ is_default: false }).neq('id', '')

            // Set new default
            const { error } = await supabase
                .from('report_templates')
                .update({ is_default: true })
                .eq('id', id)

            if (error) throw error

            toast.success('Default template updated')
            fetchTemplates()
        } catch (error: any) {
            console.error('Error setting default:', error)
            toast.error('Failed to update default template', error.message)
        }
    }

    const handleImageUpload = (type: 'principal' | 'classTeacher' | 'stamp') => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = () => {
                    const base64 = reader.result as string
                    const newSignatures = { ...signatures, [type]: base64 }
                    setSignatures(newSignatures)
                    localStorage.setItem('reportCardSignatures', JSON.stringify(newSignatures))
                    toast.success(`${type === 'stamp' ? 'Stamp' : 'Signature'} uploaded!`)
                }
                reader.readAsDataURL(file)
            }
        }
        input.click()
    }

    const openEditModal = (template: Template) => {
        setSelectedTemplate(template)
        setFormData(template)
        setIsModalOpen(true)
    }

    const resetForm = () => {
        setSelectedTemplate(null)
        setFormData({
            id: '',
            name: '',
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
        })
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Report Card Templates</h1>
                        <p className="text-slate-500 mt-1">Customize report card designs and upload signatures</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <Plus className="h-5 w-5 mr-2" />
                        Create Template
                    </Button>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-6">
                                    <div className="h-6 bg-slate-200 rounded w-2/3 mb-4" />
                                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        templates.map((template) => (
                            <Card key={template.id} className={`card-hover ${template.isDefault ? 'ring-2 ring-indigo-500' : ''}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex items-center justify-center w-12 h-12 rounded-xl text-white"
                                                style={{ backgroundColor: template.headerColor }}
                                            >
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg text-slate-900">{template.name}</h3>
                                                {template.isDefault && (
                                                    <Badge variant="success">Default</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4 text-sm text-slate-600">
                                        <div className="flex flex-wrap gap-1">
                                            {template.showPosition && <Badge variant="default">Position</Badge>}
                                            {template.showClassAverage && <Badge variant="default">Avg</Badge>}
                                            {template.showSubjectRank && <Badge variant="default">Ranks</Badge>}
                                            {template.showAttendance && <Badge variant="default">Attendance</Badge>}
                                            {template.showRemarks && <Badge variant="default">Remarks</Badge>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                        {!template.isDefault && template.id !== 'default' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleSetDefault(template.id)}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Set Default
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => openEditModal(template)}>
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        {template.id !== 'default' && !template.isDefault && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Signatures & Stamp Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PenLine className="h-5 w-5 text-indigo-500" />
                            Signatures & Stamp
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {/* Principal Signature */}
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700 mb-3">Principal Signature</p>
                                <div
                                    className="border-2 border-dashed border-slate-300 rounded-lg p-4 min-h-[120px] flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors"
                                    onClick={() => handleImageUpload('principal')}
                                >
                                    {signatures.principal ? (
                                        <img
                                            src={signatures.principal}
                                            alt="Principal Signature"
                                            className="max-h-20 max-w-full"
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                            <p className="text-xs text-slate-500">Click to upload</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Class Teacher Signature */}
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700 mb-3">Class Teacher Signature</p>
                                <div
                                    className="border-2 border-dashed border-slate-300 rounded-lg p-4 min-h-[120px] flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors"
                                    onClick={() => handleImageUpload('classTeacher')}
                                >
                                    {signatures.classTeacher ? (
                                        <img
                                            src={signatures.classTeacher}
                                            alt="Class Teacher Signature"
                                            className="max-h-20 max-w-full"
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                            <p className="text-xs text-slate-500">Click to upload</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* School Stamp */}
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700 mb-3">School Stamp</p>
                                <div
                                    className="border-2 border-dashed border-slate-300 rounded-lg p-4 min-h-[120px] flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors"
                                    onClick={() => handleImageUpload('stamp')}
                                >
                                    {signatures.stamp ? (
                                        <img
                                            src={signatures.stamp}
                                            alt="School Stamp"
                                            className="max-h-20 max-w-full"
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <Stamp className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                            <p className="text-xs text-slate-500">Click to upload</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-4 text-center">
                            Upload PNG images with transparent backgrounds for best results
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Template Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={selectedTemplate ? 'Edit Template' : 'Create New Template'}
                size="lg"
            >
                <div className="space-y-6">
                    <Input
                        label="Template Name"
                        placeholder="e.g., Modern Style, Board Style"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Header Color
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    className="w-12 h-10 rounded border cursor-pointer"
                                    value={formData.headerColor}
                                    onChange={(e) => setFormData({ ...formData, headerColor: e.target.value })}
                                />
                                <Input
                                    value={formData.headerColor}
                                    onChange={(e) => setFormData({ ...formData, headerColor: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Accent Color
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    className="w-12 h-10 rounded border cursor-pointer"
                                    value={formData.accentColor}
                                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                                />
                                <Input
                                    value={formData.accentColor}
                                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Toggle Options */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Fields to Display
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                { key: 'showPosition', label: 'Class Position' },
                                { key: 'showClassAverage', label: 'Class Average' },
                                { key: 'showClassHighest', label: 'Highest Score' },
                                { key: 'showClassLowest', label: 'Lowest Score' },
                                { key: 'showSubjectRank', label: 'Subject Ranks' },
                                { key: 'showAttendance', label: 'Attendance' },
                                { key: 'showRemarks', label: 'Remarks' },
                                { key: 'showSignatures', label: 'Signatures' },
                                { key: 'showStamp', label: 'School Stamp' },
                            ].map(({ key, label }) => (
                                <label
                                    key={key}
                                    className="flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer hover:bg-slate-50 transition-colors"
                                    style={{
                                        borderColor: (formData as any)[key] ? '#4f46e5' : '#e2e8f0',
                                        backgroundColor: (formData as any)[key] ? '#eef2ff' : 'white'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={(formData as any)[key]}
                                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                                    />
                                    <div className={`w-5 h-5 rounded flex items-center justify-center ${(formData as any)[key] ? 'bg-indigo-500 text-white' : 'border-2 border-slate-300'
                                        }`}>
                                        {(formData as any)[key] && <Check className="h-3 w-3" />}
                                    </div>
                                    <span className="text-sm">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveTemplate}>
                            {selectedTemplate ? 'Update' : 'Create'} Template
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    )
}
