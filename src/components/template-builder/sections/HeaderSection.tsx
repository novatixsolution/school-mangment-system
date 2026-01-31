import React from 'react';
import { getSectionStyle } from '../TemplateBase';

interface HeaderSectionProps {
    config: Record<string, any>;
    schoolSettings?: {
        school_name: string;
        school_address?: string;
        contact_number?: string;
        logo_url?: string;
    };
}

export function HeaderSection({ config, schoolSettings }: HeaderSectionProps) {
    const sectionStyle = getSectionStyle(config);

    // Default school settings
    const settings = schoolSettings || {
        school_name: 'School Name',
        school_address: 'School Address, City',
        contact_number: '0300-1234567',
    };

    const getAlignmentClass = () => {
        const alignment = config.alignment || 'center';
        return {
            left: 'text-left',
            center: 'text-center',
            right: 'text-right',
        }[alignment];
    };

    const getLogoPlacement = () => {
        const position = config.logo_position || 'left';
        if (position === 'center') return 'flex-col items-center';
        if (position === 'right') return 'flex-row-reverse';
        return 'flex-row';
    };

    return (
        <div style={sectionStyle} className="header-section">
            <div className={`flex gap-4 ${getLogoPlacement()} ${getAlignmentClass()}`}>
                {/* Logo */}
                {config.show_logo && (
                    <div className="flex-shrink-0">
                        {settings.logo_url ? (
                            <img
                                src={settings.logo_url}
                                alt="School Logo"
                                className="w-16 h-16 object-contain"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-2xl">🏫</span>
                            </div>
                        )}
                    </div>
                )}

                {/* School Info */}
                <div className="flex-1">
                    {config.show_school_name && (
                        <h1
                            className="font-bold mb-1"
                            style={{
                                fontSize: '20px',
                                color: 'var(--primary-color)',
                            }}
                        >
                            {settings.school_name}
                        </h1>
                    )}

                    {config.show_address && (
                        <p className="text-sm text-gray-600 mb-0.5">
                            {settings.school_address}
                        </p>
                    )}

                    {config.show_contact && (
                        <p className="text-sm text-gray-600">
                            Contact: {settings.contact_number}
                        </p>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div
                className="mt-3 pt-3"
                style={{
                    borderTop: '2px solid var(--primary-color)',
                }}
            />
        </div>
    );
}
