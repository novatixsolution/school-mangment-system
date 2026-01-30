// Class status
export type ClassStatus = 'active' | 'inactive'

// Class interface
export interface Class {
    id: string
    class_name: string
    medium: string
    fee_structure_id?: string
    status: ClassStatus
    created_at: string
}

// Section interface
export interface Section {
    id: string
    class_id: string
    section_name: string
    capacity: number
    teacher_id?: string
    status: ClassStatus
    created_at: string
    // Joined data
    class?: Class
    teacher?: {
        id: string
        name: string
    }
}

// Subject interface
export interface Subject {
    id: string
    name: string
    class_id?: string
    created_at: string
}
