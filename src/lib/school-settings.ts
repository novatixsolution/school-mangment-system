import { supabase } from './supabase/client';

export interface SchoolSettings {
    id: string;
    school_name: string;
    school_address: string;
    contact_number: string;
    email?: string;
    website?: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
}

/**
 * Get school settings from database
 */
export async function getSchoolSettings(): Promise<SchoolSettings | null> {
    const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching school settings:', error);
        // Return default settings
        return {
            id: '',
            school_name: 'School Name',
            school_address: 'School Address',
            contact_number: '0300-0000000',
            primary_color: '#2563eb',
            secondary_color: '#16a34a',
            accent_color: '#3b82f6',
        };
    }

    return data;
}

/**
 * Update school settings
 */
export async function updateSchoolSettings(settings: Partial<SchoolSettings>): Promise<boolean> {
    const { error } = await supabase
        .from('school_settings')
        .update(settings)
        .eq('id', settings.id);

    if (error) {
        console.error('Error updating school settings:', error);
        return false;
    }

    return true;
}
