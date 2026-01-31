'use client';

import { useState, useRef } from 'react';
import { Download, Printer, Settings, Plus, Minus, Upload, Copy, Save, FileJson, Eye, Palette, Image, PenTool } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface FeeItem {
    description: string;
    amount: number;
}

interface ChallanTemplate {
    name: string;
    columns: 2 | 3;
    orientation: 'portrait' | 'landscape';
    schoolName: string;
    schoolAddress: string;
    schoolPhone: string;
    schoolLogo: string;
    signatureImage: string;
    primaryColor: string;
    secondaryColor: string;
    showQR: boolean;
    qrText: string;
    feeItems: FeeItem[];
}

const DEFAULT_TEMPLATE: ChallanTemplate = {
    name: 'Default Template',
    columns: 3,
    orientation: 'landscape',
    schoolName: 'Model Public School',
    schoolAddress: 'Street 5, G-10/4, Islamabad',
    schoolPhone: '051-1234567',
    schoolLogo: '',
    signatureImage: '',
    primaryColor: '#2563eb',
    secondaryColor: '#16a34a',
    showQR: false,
    qrText: 'https://school.com/payment',
    feeItems: [
        { description: 'Tuition Fee', amount: 2500 },
        { description: 'Admission Fee', amount: 1000 },
        { description: 'Exam Fee', amount: 500 },
    ],
};

export default function BankChallanPage() {
    const [template, setTemplate] = useState<ChallanTemplate>(DEFAULT_TEMPLATE);
    const [studentName, setStudentName] = useState('Ahmed Ali Khan');
    const [rollNumber, setRollNumber] = useState('2024-001');
    const [className, setClassName] = useState('Class 5-A');
    const [fatherName, setFatherName] = useState('Ali Khan');
    const [month, setMonth] = useState('February 2026');
    const [dueDate, setDueDate] = useState('15 Feb 2026');
    const [challanNo, setChallanNo] = useState('CH-2026-001');

    const [showSettings, setShowSettings] = useState(true);
    const [activeTab, setActiveTab] = useState<'layout' | 'school' | 'student' | 'fees' | 'design'>('layout');

    const logoInputRef = useRef<HTMLInputElement>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);
    const jsonInputRef = useRef<HTMLInputElement>(null);

    const updateTemplate = (updates: Partial<ChallanTemplate>) => {
        setTemplate({ ...template, ...updates });
    };

    const totalAmount = template.feeItems.reduce((sum, item) => sum + item.amount, 0);

    const addFeeItem = () => {
        updateTemplate({ feeItems: [...template.feeItems, { description: 'New Fee', amount: 0 }] });
    };

    const removeFeeItem = (index: number) => {
        updateTemplate({ feeItems: template.feeItems.filter((_, i) => i !== index) });
    };

    const updateFeeItem = (index: number, updates: Partial<FeeItem>) => {
        const newItems = template.feeItems.map((item, i) =>
            i === index ? { ...item, ...updates } : item
        );
        updateTemplate({ feeItems: newItems });
    };

    const handleImageUpload = (file: File, type: 'logo' | 'signature') => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            if (type === 'logo') {
                updateTemplate({ schoolLogo: base64 });
            } else {
                updateTemplate({ signatureImage: base64 });
            }
        };
        reader.readAsDataURL(file);
    };

    const exportTemplate = () => {
        const dataStr = JSON.stringify(template, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${template.name.replace(/\s+/g, '_')}.json`;
        link.click();
    };

    const importTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target?.result as string);
                setTemplate(imported);
                alert('Template imported successfully!');
            } catch (error) {
                alert('Invalid template file!');
            }
        };
        reader.readAsText(file);
    };

    const duplicateTemplate = () => {
        const newTemplate = { ...template, name: `${template.name} (Copy)` };
        setTemplate(newTemplate);
    };

    const handlePrint = () => {
        window.print();
    };

    const columnLabels = template.columns === 3
        ? ['STUDENT COPY', 'SCHOOL COPY', 'BANK COPY']
        : ['STUDENT COPY', 'SCHOOL COPY'];

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <style jsx>{`
        @media print {
          @page {
            size: A4 ${template.orientation};
            margin: 5mm;
          }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>

            {/* Top Controls */}
            <div className="max-w-7xl mx-auto mb-4 bg-white p-4 rounded-lg shadow print:hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Bank Challan Generator</h1>
                        <p className="text-sm text-gray-600">Complete customizable challan with all features</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            <Settings className="w-4 h-4" />
                            {showSettings ? 'Hide' : 'Show'} Settings
                        </button>
                        <button
                            onClick={duplicateTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                            <Copy className="w-4 h-4" />
                            Duplicate
                        </button>
                        <button
                            onClick={exportTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                        >
                            <Download className="w-4 h-4" />
                            Export JSON
                        </button>
                        <button
                            onClick={() => jsonInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            <Upload className="w-4 h-4" />
                            Import JSON
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            <Printer className="w-4 h-4" />
                            Print
                        </button>
                    </div>
                </div>
            </div>

            <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                onChange={importTemplate}
                className="hidden"
            />

            {/* Settings Panel */}
            {showSettings && (
                <div className="max-w-7xl mx-auto mb-4 bg-white rounded-lg shadow print:hidden">
                    {/* Tabs */}
                    <div className="flex border-b">
                        {[
                            { key: 'layout', label: 'Layout', icon: Eye },
                            { key: 'school', label: 'School Info', icon: Settings },
                            { key: 'student', label: 'Student Data', icon: PenTool },
                            { key: 'fees', label: 'Fee Items', icon: Plus },
                            { key: 'design', label: 'Design', icon: Palette },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`flex items-center gap-2 px-6 py-3 border-b-2 ${activeTab === tab.key
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Layout Tab */}
                        {activeTab === 'layout' && (
                            <div className="space-y-4">
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
                                                Portrait (Khara)
                                            </button>
                                            <button
                                                onClick={() => updateTemplate({ orientation: 'landscape' })}
                                                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium ${template.orientation === 'landscape' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
                                                    }`}
                                            >
                                                Landscape (Lamba)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Template Name</label>
                                    <input
                                        type="text"
                                        value={template.name}
                                        onChange={(e) => updateTemplate({ name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                        )}

                        {/* School Info Tab */}
                        {activeTab === 'school' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">School Name</label>
                                        <input
                                            type="text"
                                            value={template.schoolName}
                                            onChange={(e) => updateTemplate({ schoolName: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Phone</label>
                                        <input
                                            type="text"
                                            value={template.schoolPhone}
                                            onChange={(e) => updateTemplate({ schoolPhone: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Address</label>
                                    <input
                                        type="text"
                                        value={template.schoolAddress}
                                        onChange={(e) => updateTemplate({ schoolAddress: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">School Logo</label>
                                    <div className="flex gap-4 items-center">
                                        {template.schoolLogo && (
                                            <img src={template.schoolLogo} alt="Logo" className="h-16 w-16 object-contain border rounded" />
                                        )}
                                        <button
                                            onClick={() => logoInputRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Upload Logo
                                        </button>
                                        {template.schoolLogo && (
                                            <button
                                                onClick={() => updateTemplate({ schoolLogo: '' })}
                                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                            >
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
                                        {template.signatureImage && (
                                            <img src={template.signatureImage} alt="Signature" className="h-12 w-24 object-contain border rounded" />
                                        )}
                                        <button
                                            onClick={() => signatureInputRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                        >
                                            <PenTool className="w-4 h-4" />
                                            Upload Signature
                                        </button>
                                        {template.signatureImage && (
                                            <button
                                                onClick={() => updateTemplate({ signatureImage: '' })}
                                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                            >
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
                        )}

                        {/* Student Data Tab */}
                        {activeTab === 'student' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Student Name</label>
                                    <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Father Name</label>
                                    <input type="text" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Roll Number</label>
                                    <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Class</label>
                                    <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Month</label>
                                    <input type="text" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Due Date</label>
                                    <input type="text" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-2">Challan Number</label>
                                    <input type="text" value={challanNo} onChange={(e) => setChallanNo(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                            </div>
                        )}

                        {/* Fee Items Tab */}
                        {activeTab === 'fees' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">Fee Items</h3>
                                    <button
                                        onClick={addFeeItem}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Item
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {template.feeItems.map((item, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateFeeItem(index, { description: e.target.value })}
                                                className="flex-1 px-4 py-2 border rounded-lg"
                                                placeholder="Fee Description"
                                            />
                                            <input
                                                type="number"
                                                value={item.amount}
                                                onChange={(e) => updateFeeItem(index, { amount: Number(e.target.value) })}
                                                className="w-32 px-4 py-2 border rounded-lg"
                                                placeholder="Amount"
                                            />
                                            <button
                                                onClick={() => removeFeeItem(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Minus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg">Total Amount:</span>
                                        <span className="font-bold text-2xl text-green-600">Rs {totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Design Tab */}
                        {activeTab === 'design' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Primary Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={template.primaryColor}
                                                onChange={(e) => updateTemplate({ primaryColor: e.target.value })}
                                                className="w-16 h-10 border rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={template.primaryColor}
                                                onChange={(e) => updateTemplate({ primaryColor: e.target.value })}
                                                className="flex-1 px-4 py-2 border rounded-lg font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Secondary Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={template.secondaryColor}
                                                onChange={(e) => updateTemplate({ secondaryColor: e.target.value })}
                                                className="w-16 h-10 border rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={template.secondaryColor}
                                                onChange={(e) => updateTemplate({ secondaryColor: e.target.value })}
                                                className="flex-1 px-4 py-2 border rounded-lg font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={template.showQR}
                                            onChange={(e) => updateTemplate({ showQR: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="font-medium">Show QR Code</span>
                                    </label>
                                    {template.showQR && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">QR Code Text/URL</label>
                                            <input
                                                type="text"
                                                value={template.qrText}
                                                onChange={(e) => updateTemplate({ qrText: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                placeholder="https://school.com/payment"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Challan Preview */}
            <div
                className={`mx-auto bg-white shadow-lg print:shadow-none ${template.orientation === 'landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]'
                    }`}
            >
                <div
                    className={`grid gap-0 p-4 print:p-2 ${template.columns === 3 ? 'grid-cols-3' : 'grid-cols-2'
                        }`}
                    style={{
                        minHeight: template.orientation === 'landscape' ? '210mm' : '297mm',
                    }}
                >
                    {columnLabels.map((label, index) => (
                        <ChallanColumn
                            key={index}
                            title={label}
                            template={template}
                            studentName={studentName}
                            rollNumber={rollNumber}
                            className={className}
                            fatherName={fatherName}
                            month={month}
                            dueDate={dueDate}
                            challanNo={challanNo}
                            totalAmount={totalAmount}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface ChallanColumnProps {
    title: string;
    template: ChallanTemplate;
    studentName: string;
    rollNumber: string;
    className: string;
    fatherName: string;
    month: string;
    dueDate: string;
    challanNo: string;
    totalAmount: number;
}

function ChallanColumn({
    title,
    template,
    studentName,
    rollNumber,
    className,
    fatherName,
    month,
    dueDate,
    challanNo,
    totalAmount,
}: ChallanColumnProps) {
    return (
        <div className="border-2 border-dashed p-3 flex flex-col h-full" style={{ borderColor: template.primaryColor }}>
            {/* Header */}
            <div className="p-2 text-center border-b-2" style={{ backgroundColor: template.primaryColor, borderColor: template.primaryColor }}>
                <h2 className="font-bold text-sm text-white">{title}</h2>
            </div>

            {/* School Info */}
            <div className="text-center py-2 border-b">
                {template.schoolLogo && (
                    <img src={template.schoolLogo} alt="Logo" className="h-12 w-12 mx-auto mb-2 object-contain" />
                )}
                <h3 className="font-bold text-base">{template.schoolName}</h3>
                <p className="text-xs text-gray-600">{template.schoolAddress}</p>
                <p className="text-xs text-gray-600">Ph: {template.schoolPhone}</p>
            </div>

            {/* Challan Details */}
            <div className="py-2 border-b text-xs space-y-1">
                <div className="flex justify-between">
                    <span className="font-medium">Challan No:</span>
                    <span>{challanNo}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Month:</span>
                    <span>{month}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Due Date:</span>
                    <span className="text-red-600 font-semibold">{dueDate}</span>
                </div>
            </div>

            {/* Student Info */}
            <div className="py-2 border-b text-xs space-y-1">
                <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span className="text-right text-[11px]">{studentName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Father:</span>
                    <span className="text-right text-[11px]">{fatherName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Roll No:</span>
                    <span>{rollNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Class:</span>
                    <span>{className}</span>
                </div>
            </div>

            {/* Fee Details */}
            <div className="py-2 border-b flex-1">
                <h4 className="font-semibold text-xs mb-2">Fee Details:</h4>
                <table className="w-full text-xs">
                    <tbody>
                        {template.feeItems.map((item, index) => (
                            <tr key={index}>
                                <td className="py-0.5">{item.description}</td>
                                <td className="text-right">Rs {item.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Total */}
            <div className="p-2 border-2 mt-2" style={{ backgroundColor: `${template.secondaryColor}20`, borderColor: template.secondaryColor }}>
                <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">TOTAL:</span>
                    <span className="font-bold text-lg" style={{ color: template.secondaryColor }}>
                        Rs {totalAmount.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* QR Code */}
            {template.showQR && (
                <div className="mt-2 flex justify-center">
                    <QRCodeCanvas value={template.qrText} size={60} />
                </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-2 border-t text-xs">
                <div className="flex justify-between mb-6">
                    <div>
                        <p className="mb-1">Date: __________</p>
                    </div>
                    <div className="text-center">
                        {template.signatureImage ? (
                            <div>
                                <img src={template.signatureImage} alt="Signature" className="h-8 w-20 object-contain mx-auto mb-1" />
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
                <p className="text-center text-[9px] text-gray-600">
                    Pay before due date to avoid late fee
                </p>
            </div>
        </div>
    );
}
