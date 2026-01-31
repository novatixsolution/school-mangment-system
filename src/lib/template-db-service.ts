import { createClient } from '@/lib/supabase/client';

interface Template {
    id?: string;
    name: string;
    display_name: string;
    description?: string;
    theme_name?: string;
    structure: any;
    is_default?: boolean;
    is_active?: boolean;
}

/**
 * Save template to database
 */
export async function saveTemplate(template: Template): Promise<Template> {
    const supabase = createClient();

    try {
        if (template.id) {
            // Update existing template
            const { data, error } = await supabase
                .from('challan_templates')
                .update({
                    display_name: template.display_name,
                    description: template.description,
                    theme_name: template.theme_name,
                    structure: template.structure,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', template.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            // Create new template
            const { data, error } = await supabase
                .from('challan_templates')
                .insert([
                    {
                        name: template.name,
                        display_name: template.display_name,
                        description: template.description,
                        theme_name: template.theme_name,
                        structure: template.structure,
                        is_default: template.is_default || false,
                        is_active: true,
                    },
                ])
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('Failed to save template:', error);
        throw new Error('Failed to save template to database');
    }
}

/**
 * Load template by ID
 */
export async function loadTemplate(id: string): Promise<Template | null> {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('challan_templates')
            .select('*')
            .eq('id', id)
            .eq('is_active', true)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Failed to load template:', error);
        return null;
    }
}

/**
 * Load all templates
 */
export async function loadAllTemplates(): Promise<Template[]> {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('challan_templates')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Failed to load templates:', error);
        return [];
    }
}

/**
 * Get default template
 */
export async function getDefaultTemplate(): Promise<Template | null> {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('challan_templates')
            .select('*')
            .eq('is_default', true)
            .eq('is_active', true)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Failed to load default template:', error);
        return null;
    }
}

/**
 * Set template as default
 */
export async function setDefaultTemplate(id: string): Promise<void> {
    const supabase = createClient();

    try {
        // First, unset all defaults
        await supabase
            .from('challan_templates')
            .update({ is_default: false })
            .eq('is_default', true);

        // Then set the new default
        const { error } = await supabase
            .from('challan_templates')
            .update({ is_default: true })
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error('Failed to set default template:', error);
        throw new Error('Failed to set default template');
    }
}

/**
 * Delete template
 */
export async function deleteTemplate(id: string): Promise<void> {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('challan_templates')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error('Failed to delete template:', error);
        throw new Error('Failed to delete template');
    }
}
