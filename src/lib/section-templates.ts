interface SectionTemplate {
    id: string;
    name: string;
    display_name: string;
    description: string;
    category: 'header' | 'content' | 'footer' | 'misc';
    section_type: 'header' | 'student_info' | 'fee_table' | 'footer';
    config: Record<string, any>;
    preview_image?: string;
}

// Pre-built section templates library
export const SECTION_TEMPLATES: SectionTemplate[] = [
    // Header Templates
    {
        id: 'header_centered_logo',
        name: 'header_centered_logo',
        display_name: 'Centered Logo Header',
        description: 'School logo and name centered with contact below',
        category: 'header',
        section_type: 'header',
        config: {
            show_logo: true,
            logo_position: 'center',
            show_school_name: true,
            show_address: true,
            show_contact: true,
            alignment: 'center',
        },
    },
    {
        id: 'header_left_logo',
        name: 'header_left_logo',
        display_name: 'Left Aligned Header',
        description: 'Logo on left, school info on right',
        category: 'header',
        section_type: 'header',
        config: {
            show_logo: true,
            logo_position: 'left',
            show_school_name: true,
            show_address: true,
            show_contact: true,
            alignment: 'left',
        },
    },
    {
        id: 'header_minimal',
        name: 'header_minimal',
        display_name: 'Minimal Header',
        description: 'School name only, no logo',
        category: 'header',
        section_type: 'header',
        config: {
            show_logo: false,
            show_school_name: true,
            show_address: false,
            show_contact: false,
            alignment: 'center',
        },
    },

    // Student Info Templates
    {
        id: 'student_grid_with_photo',
        name: 'student_grid_with_photo',
        display_name: 'Grid with Photo',
        description: 'Student info in grid layout with photo',
        category: 'content',
        section_type: 'student_info',
        config: {
            show_photo: true,
            show_class: true,
            show_roll_number: true,
            show_father_name: true,
            layout: 'grid',
        },
    },
    {
        id: 'student_table_simple',
        name: 'student_table_simple',
        display_name: 'Simple Table',
        description: 'Student details in clean table format',
        category: 'content',
        section_type: 'student_info',
        config: {
            show_photo: false,
            show_class: true,
            show_roll_number: true,
            show_father_name: true,
            layout: 'table',
        },
    },
    {
        id: 'student_list_compact',
        name: 'student_list_compact',
        display_name: 'Compact List',
        description: 'Minimal student info in list format',
        category: 'content',
        section_type: 'student_info',
        config: {
            show_photo: false,
            show_class: true,
            show_roll_number: true,
            show_father_name: false,
            layout: 'list',
        },
    },

    // Fee Table Templates
    {
        id: 'fee_table_detailed',
        name: 'fee_table_detailed',
        display_name: 'Detailed Fee Table',
        description: 'Complete breakdown with subtotals and discounts',
        category: 'content',
        section_type: 'fee_table',
        config: {
            table_style: 'bordered',
            show_subtotal: true,
            show_discount: true,
            highlight_total: true,
        },
    },
    {
        id: 'fee_table_simple',
        name: 'fee_table_simple',
        display_name: 'Simple Fee Table',
        description: 'Clean table with total only',
        category: 'content',
        section_type: 'fee_table',
        config: {
            table_style: 'simple',
            show_subtotal: false,
            show_discount: false,
            highlight_total: true,
        },
    },
    {
        id: 'fee_table_striped',
        name: 'fee_table_striped',
        display_name: 'Striped Fee Table',
        description: 'Alternating row colors for easy reading',
        category: 'content',
        section_type: 'fee_table',
        config: {
            table_style: 'striped',
            show_subtotal: true,
            show_discount: true,
            highlight_total: true,
        },
    },

    // Footer Templates
    {
        id: 'footer_with_qr',
        name: 'footer_with_qr',
        display_name: 'Footer with QR Code',
        description: 'Payment instructions with QR code for digital payment',
        category: 'footer',
        section_type: 'footer',
        config: {
            footer_text: 'Scan QR code for online payment. Thank you!',
            show_signature_line: true,
            show_date: true,
            show_qr_code: true,
            qr_code_value: 'https://payment.school.com',
            show_barcode: false,
            alignment: 'center',
        },
    },
    {
        id: 'footer_with_barcode',
        name: 'footer_with_barcode',
        display_name: 'Footer with Barcode',
        description: 'Receipt footer with barcode reference',
        category: 'footer',
        section_type: 'footer',
        config: {
            footer_text: 'Please keep this receipt for your records',
            show_signature_line: true,
            show_date: true,
            show_qr_code: false,
            show_barcode: true,
            barcode_value: '1234567890',
            alignment: 'center',
        },
    },
    {
        id: 'footer_minimal',
        name: 'footer_minimal',
        display_name: 'Minimal Footer',
        description: 'Simple thank you message',
        category: 'footer',
        section_type: 'footer',
        config: {
            footer_text: 'Thank you for your payment',
            show_signature_line: false,
            show_date: true,
            show_qr_code: false,
            show_barcode: false,
            alignment: 'center',
        },
    },
];

export function getSectionTemplatesByCategory(category: SectionTemplate['category']) {
    return SECTION_TEMPLATES.filter((t) => t.category === category);
}

export function getSectionTemplateById(id: string) {
    return SECTION_TEMPLATES.find((t) => t.id === id);
}

export function createSectionFromTemplate(template: SectionTemplate, order: number) {
    return {
        id: `${template.section_type}_${Date.now()}`,
        type: template.section_type,
        order,
        visible: true,
        config: { ...template.config },
    };
}
