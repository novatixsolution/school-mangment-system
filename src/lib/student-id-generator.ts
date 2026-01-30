import { supabase } from './supabase/client'

/**
 * Generates a unique student ID in the format STD-{YEAR}-{SEQUENCE}
 * Example: STD-2026-0001, STD-2026-0002, etc.
 * 
 * The sequence resets each year and is zero-padded to 4 digits.
 */
export async function generateStudentId(): Promise<string> {
    try {
        // Call the database function which handles sequence generation
        const { data, error } = await supabase.rpc('generate_student_id')

        if (error) throw error

        return data as string

    } catch (error: any) {
        console.error('Error generating student ID:', error)

        // Fallback: Generate client-side (less reliable but ensures we return something)
        const year = new Date().getFullYear()
        const random = Math.floor(Math.random() * 9999) + 1
        const fallbackId = `STD-${year}-${String(random).padStart(4, '0')}`

        console.warn('Using fallback student ID:', fallbackId)
        return fallbackId
    }
}

/**
 * Validates if a student ID follows the correct format
 */
export function validateStudentId(studentId: string): boolean {
    const pattern = /^STD-\d{4}-\d{4}$/
    return pattern.test(studentId)
}

/**
 * Extracts the year from a student ID
 */
export function getYearFromStudentId(studentId: string): number | null {
    const match = studentId.match(/^STD-(\d{4})-\d{4}$/)
    return match ? parseInt(match[1]) : null
}

/**
 * Extracts the sequence number from a student ID
 */
export function getSequenceFromStudentId(studentId: string): number | null {
    const match = studentId.match(/^STD-\d{4}-(\d{4})$/)
    return match ? parseInt(match[1]) : null
}

/**
 * Creates a student with auto-generated ID
 * This is a helper function that ensures student_id is generated
 */
export async function createStudentWithId(studentData: any) {
    try {
        // The database trigger will auto-generate the student_id
        // But we can also explicitly generate it if needed
        const { data, error } = await supabase
            .from('students')
            .insert([studentData])
            .select()
            .single()

        if (error) throw error

        return { data, error: null }

    } catch (error: any) {
        console.error('Error creating student:', error)
        return { data: null, error }
    }
}
