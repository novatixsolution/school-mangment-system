'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Save, Check, Palette, Image as ImageIcon, PenTool, Eye } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { saveTemplate, setDefaultTemplate, ChallanTemplate } from '@/lib/challan-template-service';

const DEFAULT_TEMPLATE: ChallanTemplate = {
    name: 'custom_template',
    display_name: 'Custom Template',
    description: 'Customized bank challan template',
    columns: 3,
    orientation: 'landscape',
    school_logo: '',
    signature_image: '',
    primary_color: '#2563eb',
    secondary_color: '#16a34a',
    show_qr: false,
    qr_text: 'https://school.com/payment',
};

export default function TemplateBuilderPage() {
    const [template, setTemplate] = useState<ChallanTemplate>(DEFAULT_TEMPLATE);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);

    const updateTemplate = (updates: Partial<ChallanTemplate>) => {
        setTemplate({ ...template, ...updates });
        setSaved(false);
    };

    const handleImageUpload = (file: File, type: 'logo' | 'signature') => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            if (type === 'logo') {
                updateTemplate({ school_logo: base64 });
            } else {
                updateTemplate({ signature_image: base64 });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveTemplate = async () => {
        setSaving(true);
        const success = await saveTemplate(template);
        if (success) {
            setSaved(true);
            alert('✅ Template saved successfully!');
            // Set as default
            await setDefaultTemplate(template.id || '');
        } else {
            alert('❌ Failed to save template');
        }
        setSaving(false);
    };

    const columnLabels =
        template.columns === 3 ? ['STUDENT COPY', 'SCHOOL COPY', 'BANK COPY'] : ['STUDENT COPY', 'SCHOOL COPY'];

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <style jsx>{`
        @media print {
          @page {
            size: A4 ${template.orientation};
            margin: 5mm;
          }
        }
      `}</style>

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-4 bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Challan Template Builder</h1>
                        <p className="text-sm text-gray-600">Design your template once - student data will auto-populate</p>
                    </div>
                    <button
                        onClick={handleSaveTemplate}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save as Default Template'}
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            <div className="max-w-7xl mx-auto mb-4 bg-white p-6 rounded-lg shadow space-y-6">
                {/* Layout Settings */}
                <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Layout
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Number of Columns</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateTemplate({ columns: 2 })}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium ${template.columns === 2 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
                                        }`}
                                >
                                    2 Columns
                                </button>
                                <button
                                    onClick={() => updateTemplate({ columns: 3 })}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium ${template.columns === 3 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
                                        }`}
                                >
                                    3 Columns
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Orientation</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateTemplate({ orientation: 'portrait' })}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium ${template.orientation === 'portrait' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
                                        }`}
                                >
                                    Portrait
                                </button>
                                <button
                                    onClick={() => updateTemplate({ orientation: 'landscape' })}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium ${template.orientation === 'landscape' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
                                        }`}
                                >
                                    Landscape
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* School Assets */}
                <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        School Assets
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">School Logo</label>
                            <div className="flex gap-4 items-center">
                                {template.school_logo && <img src={template.school_logo} alt="Logo" className="h-16 w-16 object-contain border rounded" />}
                                <button
                                    onClick={() => logoInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload Logo
                                </button>
                                {template.school_logo && (
                                    <button onClick={() => updateTemplate({ school_logo: '' })} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                                        Remove
                                    </button>
                                )}
                            </div>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
                                className="hidden"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Signature Image</label>
                            <div className="flex gap-4 items-center">
                                {template.signature_image && <img src={template.signature_image} alt="Signature" className="h-12 w-24 object-contain border rounded" />}
                                <button
                                    onClick={() => signatureInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                    <PenTool className="w-4 h-4" />
                                    Upload Signature
                                </button>
                                {template.signature_image && (
                                    <button onClick={() => updateTemplate({ signature_image: '' })} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                                        Remove
                                    </button>
                                )}
                            </div>
                            <input
                                ref={signatureInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'signature')}
                                className="hidden"
                            />
                        </div>
                    </div>
                </div>

                {/* Design */}
                <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Colors & Design
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Primary Color (Header)</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={template.primary_color}
                                    onChange={(e) => updateTemplate({ primary_color: e.target.value })}
                                    className="w-16 h-10 border rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={template.primary_color}
                                    onChange={(e) => updateTemplate({ primary_color: e.target.value })}
                                    className="flex-1 px-4 py-2 border rounded-lg font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Secondary Color (Total)</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={template.secondary_color}
                                    onChange={(e) => updateTemplate({ secondary_color: e.target.value })}
                                    className="w-16 h-10 border rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={template.secondary_color}
                                    onChange={(e) => updateTemplate({ secondary_color: e.target.value })}
                                    className="flex-1 px-4 py-2 border rounded-lg font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={template.show_qr} onChange={(e) => updateTemplate({ show_qr: e.target.checked })} className="w-4 h-4" />
                            <span className="font-medium">Show QR Code for Online Payment</span>
                        </label>
                        {template.show_qr && (
                            <input
                                type="text"
                                value={template.qr_text}
                                onChange={(e) => updateTemplate({ qr_text: e.target.value })}
                                className="mt-2 w-full px-4 py-2 border rounded-lg"
                                placeholder="Payment URL"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="max-w-7xl mx-auto mb-4">
                <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg">
                    <h3 className="font-semibold">Preview (Sample Data - Actual data will auto-populate when printing)</h3>
                </div>
                <div
                    className={`mx-auto bg-white shadow-lg ${template.orientation === 'landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]'}`}
                >
                    <div
                        className={`grid gap-0 p-4 ${template.columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
                        style={{
                            minHeight: template.orientation === 'landscape' ? '210mm' : '297mm',
                        }}
                    >
                        {columnLabels.map((label, index) => (
                            <TemplateColumn key={index} title={label} template={template} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface TemplateColumnProps {
    title: string;
    template: ChallanTemplate;
}

function TemplateColumn({ title, template }: TemplateColumnProps) {
    return (
        <div className="border-2 border-dashed p-3 flex flex-col h-full" style={{ borderColor: template.primary_color }}>
            {/* Header */}
            <div className="p-2 text-center border-b-2" style={{ backgroundColor: template.primary_color, borderColor: template.primary_color }}>
                <h2 className="font-bold text-sm text-white">{title}</h2>
            </div>

            {/* School Info */}
            <div className="text-center py-2 border-b">
                {template.school_logo && <img src={template.school_logo} alt="Logo" className="h-12 w-12 mx-auto mb-2 object-contain" />}
                <h3 className="font-bold text-base">[School Name]</h3>
                <p className="text-xs text-gray-600">[School Address]</p>
                <p className="text-xs text-gray-600">Ph: [Phone]</p>
            </div>

            {/* Challan Details */}
            <div className="py-2 border-b text-xs space-y-1">
                <div className="flex justify-between">
                    <span className="font-medium">Challan No:</span>
                    <span>[Auto]</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Month:</span>
                    <span>[Auto]</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Due Date:</span>
                    <span className="text-red-600 font-semibold">[Auto]</span>
                </div>
            </div>

            {/* Student Info */}
            <div className="py-2 border-b text-xs space-y-1">
                <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>[Student Name - Auto]</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Father:</span>
                    <span>[Father Name - Auto]</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Roll No:</span>
                    <span>[Auto]</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Class:</span>
                    <span>[Auto]</span>
                </div>
            </div>

            {/* Fee Details */}
            <div className="py-2 border-b flex-1">
                <h4 className="font-semibold text-xs mb-2">Fee Details:</h4>
                <table className="w-full text-xs">
                    <tbody>
                        <tr>
                            <td className="py-0.5">[Fee Item - Auto]</td>
                            <td className="text-right">Rs [Auto]</td>
                        </tr>
                        <tr>
                            <td className="py-0.5">[Fee Item - Auto]</td>
                            <td className="text-right">Rs [Auto]</td>
                        </tr>
                        <tr>
                            <td className="py-0.5">[Fee Item - Auto]</td>
                            <td className="text-right">Rs [Auto]</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Total */}
            <div className="p-2 border-2 mt-2" style={{ backgroundColor: `${template.secondary_color}20`, borderColor: template.secondary_color }}>
                <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">TOTAL:</span>
                    <span className="font-bold text-lg" style={{ color: template.secondary_color }}>
                        Rs [Auto]
                    </span>
                </div>
            </div>

            {/* QR Code */}
            {template.show_qr && (
                <div className="mt-2 flex justify-center">
                    <QRCodeCanvas value={template.qr_text || 'payment'} size={60} />
                </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-2 border-t text-xs">
                <div className="flex justify-between mb-6">
                    <div>
                        <p className="mb-1">Date: __________</p>
                    </div>
                    <div className="text-center">
                        {template.signature_image ? (
                            <div>
                                <img src={template.signature_image} alt="Signature" className="h-8 w-20 object-contain mx-auto mb-1" />
                                <p className="text-[10px]">Signature</p>
                            </div>
                        ) : (
                            <>
                                <p className="mb-1">_______________</p>
                                <p className="text-[10px]">Signature/Stamp</p>
                            </>
                        )}
                    </div>
                </div>
                <p className="text-center text-[9px] text-gray-600">Pay before due date to avoid late fee</p>
            </div>
        </div>
    );
}
