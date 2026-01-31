import { createClient } from '@/lib/supabase/client';

export interface Theme {
    id: string;
    name: string;
    display_name: string;
    description: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
        border: string;
    };
    fonts?: {
        heading: string;
        body: string;
        monospace: string;
    };
    is_preset: boolean;
}

/**
 * Fetch all themes from database
 */
export async function getThemes(): Promise<Theme[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching themes:', error);
        throw error;
    }

    return data.map((theme) => ({
        id: theme.id,
        name: theme.name,
        display_name: theme.display_name,
        description: theme.description || '',
        colors: theme.colors,
        fonts: theme.fonts,
        is_preset: theme.is_preset || false,
    }));
}

/**
 * Create a new custom theme
 */
export async function createTheme(theme: Omit<Theme, 'id'>): Promise<Theme> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('themes')
        .insert([
            {
                name: theme.name,
                display_name: theme.display_name,
                description: theme.description,
                colors: theme.colors,
                fonts: theme.fonts,
                is_preset: false,
                is_active: true,
            },
        ])
        .select()
        .single();

    if (error) {
        console.error('Error creating theme:', error);
        throw error;
    }

    return {
        id: data.id,
        name: data.name,
        display_name: data.display_name,
        description: data.description || '',
        colors: data.colors,
        fonts: data.fonts,
        is_preset: data.is_preset || false,
    };
}

/**
 * Update an existing theme
 */
export async function updateTheme(id: string, theme: Partial<Theme>): Promise<Theme> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('themes')
        .update({
            display_name: theme.display_name,
            description: theme.description,
            colors: theme.colors,
            fonts: theme.fonts,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating theme:', error);
        throw error;
    }

    return {
        id: data.id,
        name: data.name,
        display_name: data.display_name,
        description: data.description || '',
        colors: data.colors,
        fonts: data.fonts,
        is_preset: data.is_preset || false,
    };
}

/**
 * Delete a custom theme (cannot delete presets)
 */
export async function deleteTheme(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', id)
        .eq('is_preset', false); // Only allow deleting custom themes

    if (error) {
        console.error('Error deleting theme:', error);
        throw error;
    }
}
