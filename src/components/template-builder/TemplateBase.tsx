import React from 'react';

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

interface TemplateBaseProps {
    children: React.ReactNode;
    globalStyles?: GlobalStyles;
    className?: string;
}

export function TemplateBase({ children, globalStyles, className = '' }: TemplateBaseProps) {
    const defaultStyles: GlobalStyles = {
        primary_color: '#2563eb',
        secondary_color: '#64748b',
        accent_color: '#3b82f6',
        font_family: 'Inter',
        font_size_base: 12,
    };

    const styles = globalStyles || defaultStyles;

    return (
        <div
            className={`template-base ${className}`}
            style={{
                '--primary-color': styles.primary_color,
                '--secondary-color': styles.secondary_color,
                '--accent-color': styles.accent_color,
                fontFamily: styles.font_family,
                fontSize: `${styles.font_size_base}px`,
                color: '#000000',
                backgroundColor: '#ffffff',
                lineHeight: 1.6,
            } as React.CSSProperties}
        >
            {children}
        </div>
    );
}

// Helper function to apply section-level styles
export function getSectionStyle(config: Record<string, any>) {
    return {
        padding: `${config.padding || 10}px`,
        border: config.border ? `1px solid ${config.border_color || '#e2e8f0'}` : 'none',
        backgroundColor: config.background_color || 'transparent',
        color: config.text_color || 'inherit',
        textAlign: (config.alignment || 'left') as any,
    };
}
