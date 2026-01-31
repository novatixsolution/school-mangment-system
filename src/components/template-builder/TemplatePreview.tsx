import React from 'react';
import { TemplateBase } from './TemplateBase';
import { HeaderSection } from './sections/HeaderSection';
import { StudentInfoSection } from './sections/StudentInfoSection';
import { FeeTableSection } from './sections/FeeTableSection';
import { FooterSection } from './sections/FooterSection';

interface Section {
    id: string;
    type: 'header' | 'student_info' | 'fee_table' | 'footer';
    order: number;
    visible: boolean;
    config: Record<string, any>;
}

interface GlobalStyles {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    font_size_base: number;
}

interface TemplatePreviewProps {
    sections: Section[];
    globalStyles?: GlobalStyles;
    schoolSettings?: any;
    studentData?: any;
    feeData?: any;
}

export function TemplatePreview({
    sections,
    globalStyles,
    schoolSettings,
    studentData,
    feeData,
}: TemplatePreviewProps) {
    // Sort sections by order and filter visible ones
    const visibleSections = sections
        .filter((s) => s.visible)
        .sort((a, b) => a.order - b.order);

    const renderSection = (section: Section) => {
        switch (section.type) {
            case 'header':
                return (
                    <HeaderSection
                        key={section.id}
                        config={section.config}
                        schoolSettings={schoolSettings}
                    />
                );

            case 'student_info':
                return (
                    <StudentInfoSection
                        key={section.id}
                        config={section.config}
                        studentData={studentData}
                    />
                );

            case 'fee_table':
                return (
                    <FeeTableSection
                        key={section.id}
                        config={section.config}
                        feeData={feeData}
                    />
                );

            case 'footer':
                return (
                    <FooterSection
                        key={section.id}
                        config={section.config}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <TemplateBase globalStyles={globalStyles}>
            <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
                {/* A4 Paper Simulation */}
                <div
                    className="challan-preview"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '20mm',
                        backgroundColor: 'white',
                    }}
                >
                    {/* Challan Header */}
                    <div className="mb-6">
                        <div
                            className="text-center text-2xl font-bold mb-2"
                            style={{ color: 'var(--primary-color)' }}
                        >
                            FEE CHALLAN
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 border-b pb-2">
                            <span>Challan No: #CH-2026-001</span>
                            <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
                        </div>
                    </div>

                    {/* Dynamic Sections */}
                    <div className="space-y-6">
                        {visibleSections.length > 0 ? (
                            visibleSections.map(renderSection)
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <p>No visible sections</p>
                                <p className="text-sm mt-2">Add sections from the left panel</p>
                            </div>
                        )}
                    </div>

                    {/* Watermark (optional) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                        <div
                            className="text-9xl font-bold rotate-[-45deg]"
                            style={{ color: 'var(--primary-color)' }}
                        >
                            PREVIEW
                        </div>
                    </div>
                </div>
            </div>
        </TemplateBase>
    );
}
