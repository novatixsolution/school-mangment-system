// Announcement target
export type AnnouncementTarget = 'school' | 'class' | 'section'

// Announcement interface
export interface Announcement {
    id: string
    title: string
    content: string
    target: AnnouncementTarget
    target_id?: string
    created_by: string
    expires_at?: string
    created_at: string
    // Joined data
    creator?: {
        id: string
        name: string
    }
    target_class?: {
        id: string
        class_name: string
    }
    target_section?: {
        id: string
        section_name: string
    }
}
