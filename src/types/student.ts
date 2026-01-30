// Admission status
export type AdmissionStatus = 'pending' | 'approved' | 'rejected'

// Admission interface
export interface Admission {
    id: string
    status: AdmissionStatus

    // Student Info
    student_name: string
    dob: string
    gender: string
    b_form?: string
    photo_url?: string

    // Parent Info
    father_name: string
    father_cnic?: string
    father_phone?: string
    mother_name?: string
    guardian_name?: string
    guardian_phone?: string

    // Address
    address?: string
    emergency_contact?: string

    // Academic History
    previous_school?: string
    last_class?: string
    last_percentage?: number

    // Medical
    blood_group?: string
    disease?: string
    allergy?: string

    // Transport
    transport_required: boolean

    // Class Assignment
    class_id?: string
    section_id?: string

    // Metadata
    created_by?: string
    created_at: string
    approved_by?: string
    approved_at?: string

    // Joined data
    class?: {
        id: string
        class_name: string
    }
    section?: {
        id: string
        section_name: string
    }
}

// Student status
export type StudentStatus = 'active' | 'inactive' | 'left'

// Student interface
export interface Student {
    id: string
    admission_id?: string
    roll_number?: string
    class_id: string
    section_id: string

    // Basic Info
    name: string
    dob?: string
    gender?: string
    photo_url?: string
    father_name?: string
    father_cnic?: string
    father_phone?: string

    status: StudentStatus
    created_at: string

    // Joined data
    class?: {
        id: string
        class_name: string
    }
    section?: {
        id: string
        section_name: string
    }
    admission?: Admission
}
