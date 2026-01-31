import React from 'react';
import { getSectionStyle } from '../TemplateBase';

interface FooterSectionProps {
    config: Record<string, any>;
}

export function FooterSection({ config }: FooterSectionProps) {
    const sectionStyle = getSectionStyle(config);

    const defaultFooterText = 'Please pay on or before due date to avoid late fee. Thank you for your cooperation.';
    const footerText = config.footer_text || defaultFooterText;

    const getAlignmentClass = () => {
        const alignment = config.alignment || 'center';
        return {
            left: 'text-left',
            center: 'text-center',
            right: 'text-right',
        }[alignment];
    };

    return (
        <div style={sectionStyle} className="footer-section">
            {/* Footer Message */}
            <div className={`text-sm text-gray-700 mb-4 ${getAlignmentClass()}`}>
                {footerText}
            </div>

            {/* Signature and Date Section */}
            {(config.show_signature_line || config.show_date) && (
                <div className="mt-6 pt-4 border-t border-gray-300">
                    <div className="flex justify-between items-end">
                        {/* Date */}
                        {config.show_date && (
                            <div className="text-sm">
                                <div className="mb-2 text-gray-600">Date:</div>
                                <div className="border-b border-gray-400 w-40 pb-1">
                                    {new Date().toLocaleDateString('en-GB')}
                                </div>
                            </div>
                        )}

                        {/* Signature */}
                        {config.show_signature_line && (
                            <div className="text-sm">
                                <div className="mb-2 text-gray-600">Authorized Signature:</div>
                                <div className="border-b border-gray-400 w-48 pb-1 h-6">
                                    {/* Empty space for signature */}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* School Stamp Area */}
            <div className="mt-6 flex justify-center">
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-400">School Stamp</span>
                </div>
            </div>

            {/* Contact Info */}
            <div className="mt-4 text-xs text-gray-500 text-center space-y-0.5">
                <p>For queries, please contact school office</p>
                <p>Office Hours: Monday - Friday, 8:00 AM - 2:00 PM</p>
            </div>
        </div>
    );
}
