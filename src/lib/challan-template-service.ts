import { supabase } from './supabase/client';

export interface ChallanTemplate {
    id?: string;
    name: string;
    display_name: string;
    description?: string;
    columns: 2 | 3;
    orientation: 'portrait' | 'landscape';
    school_logo?: string;
    signature_image?: string;
    primary_color: string;
    secondary_color: string;
    show_qr: boolean;
    qr_text?: string;
    is_default?: boolean;
    structure?: any;
}

/**
 * Get the default challan template
 */
export async function getDefaultTemplate(): Promise<ChallanTemplate | null> {
    try {
        const { data, error } = await supabase
            .from('challan_templates')
            .select('*')
            .eq('is_default', true)
            .eq('is_active', true)
            .limit(1)
            .single();

        if (error || !data) {
            console.error('Error fetching default template:', error);
            return null;
        }

        // Extract from structure JSONB
        const structure = data.structure || {};

        return {
            id: data.id,
            name: data.name,
            display_name: data.display_name,
            description: data.description,
            columns: structure.columns || 3,
            orientation: structure.orientation || 'landscape',
            school_logo: structure.school_logo || '',
            signature_image: structure.signature_image || '',
            primary_color: structure.primary_color || '#2563eb',
            secondary_color: structure.secondary_color || '#16a34a',
            show_qr: structure.show_qr || false,
            qr_text: structure.qr_text || '',
            is_default: data.is_default,
            structure: data.structure,
        };
    } catch (error) {
        console.error('Error in getDefaultTemplate:', error);
        return null;
    }
}

/**
 * Save or update challan template
 */
export async function saveTemplate(template: ChallanTemplate): Promise<boolean> {
    try {
        // Prepare template data with complete structure
        const templateData = {
            name: template.name,
            display_name: template.display_name,
            description: template.description || 'Custom template',
            template_type: 'custom',
            structure: {
                // Layout settings
                columns: template.columns,
                orientation: template.orientation,

                // School branding
                school_logo: template.school_logo || null,
                signature_image: template.signature_image || null,

                // Colors
                primary_color: template.primary_color,
                secondary_color: template.secondary_color,

                // Features
                show_qr: template.show_qr,
                qr_text: template.qr_text || '',

                // Global styles (for future enhancements)
                global_styles: {
                    primary_color: template.primary_color,
                    secondary_color: template.secondary_color,
                    font_family: 'Inter',
                    font_size_base: 12,
                },

                // Page settings
                page_settings: {
                    size: 'A4',
                    orientation: template.orientation,
                    copies: template.columns,
                    copy_labels: template.columns === 3
                        ? ['STUDENT COPY', 'SCHOOL COPY', 'BANK COPY']
                        : ['STUDENT COPY', 'SCHOOL COPY']
                }
            },
            is_default: template.is_default || false,
            is_active: true,
        };

        // Update if template has ID, otherwise insert
        if (template.id) {
            const { error } = await supabase
                .from('challan_templates')
                .update(templateData)
                .eq('id', template.id);

            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('challan_templates')
                .insert(templateData);

            if (error) throw error;
        }

        return true;
    } catch (error) {
        console.error('Error saving template:', error);
        return false;
    }
}

/**
 * Set template as default
 */
export async function setDefaultTemplate(templateId: string): Promise<boolean> {
    try {
        // First, unset all defaults
        await supabase
            .from('challan_templates')
            .update({ is_default: false })
            .neq('id', '00000000-0000-0000-0000-000000000000');

        // Then set the new default
        const { error } = await supabase
            .from('challan_templates')
            .update({ is_default: true })
            .eq('id', templateId);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error setting default template:', error);
        return false;
    }
}

/**
 * Get all templates
 */
export async function getAllTemplates(): Promise<ChallanTemplate[]> {
    try {
        const { data, error } = await supabase
            .from('challan_templates')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error || !data) {
            console.error('Error fetching templates:', error);
            return [];
        }

        return data.map((d) => {
            const structure = d.structure || {};

            return {
                id: d.id,
                name: d.name,
                display_name: d.display_name,
                description: d.description,
                columns: structure.columns || 3,
                orientation: structure.orientation || 'landscape',
                school_logo: structure.school_logo || '',
                signature_image: structure.signature_image || '',
                primary_color: structure.primary_color || '#2563eb',
                secondary_color: structure.secondary_color || '#16a34a',
                show_qr: structure.show_qr || false,
                qr_text: structure.qr_text || '',
                is_default: d.is_default,
                structure: d.structure,
            };
        });
    } catch (error) {
        console.error('Error in getAllTemplates:', error);
        return [];
    }
}

/**
 * Delete template
 */
export async function deleteTemplate(templateId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('challan_templates')
            .update({ is_active: false })
            .eq('id', templateId);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error deleting template:', error);
        return false;
    }
}
