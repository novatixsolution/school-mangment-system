import { supabase } from './supabase/client'

export interface NumberSequenceConfig {
    sequenceType: 'admission_number' | 'roll_number'
    classId?: string
    year?: number
    formatTemplate?: string
    padding?: number
}

/**
 * Get the next sequence number for admission or roll numbers
 */
export async function getNextSequenceNumber(
    config: NumberSequenceConfig
): Promise<string | null> {
    try {
        const { data, error } = await supabase.rpc('get_next_sequence_number', {
            p_sequence_type: config.sequenceType,
            p_class_id: config.classId || null,
            p_year: config.year || new Date().getFullYear()
        })

        if (error) {
            console.error('Error getting next sequence number:', error)
            return null
        }

        return data
    } catch (error) {
        console.error('Error in getNextSequenceNumber:', error)
        return null
    }
}

/**
 * Generate admission number for a new student
 */
export async function generateAdmissionNumber(
    classId?: string
): Promise<string | null> {
    return getNextSequenceNumber({
        sequenceType: 'admission_number',
        classId
    })
}

/**
 * Generate roll number for a student in a class
 */
export async function generateRollNumber(
    classId: string
): Promise<string | null> {
    return getNextSequenceNumber({
        sequenceType: 'roll_number',
        classId
    })
}

/**
 * Format a number with custom pattern
 */
export function formatNumber(
    value: number,
    pattern: string,
    classCode?: string,
    year?: number
): string {
    const actualYear = year || new Date().getFullYear()
    let result = pattern

    result = result.replace('{YEAR}', actualYear.toString())
    result = result.replace('{CLASS}', classCode || '')
    result = result.replace('{SEQ}', value.toString().padStart(3, '0'))

    return result
}

/**
 * Get current sequence value for a given type
 */
export async function getCurrentSequenceValue(
    sequenceType: 'admission_number' | 'roll_number',
    classId?: string
): Promise<number> {
    try {
        const year = new Date().getFullYear()

        const { data, error } = await supabase
            .from('number_sequences')
            .select('current_value')
            .eq('sequence_type', sequenceType)
            .eq('year', year)
            .is('class_id', classId === undefined ? null : classId)
            .single()

        if (error || !data) {
            return 0
        }

        return data.current_value
    } catch (error) {
        console.error('Error getting current sequence value:', error)
        return 0
    }
}

/**
 * Reset sequence counter for a new year
 */
export async function resetSequenceForNewYear(
    sequenceType: 'admission_number' | 'roll_number',
    classId?: string
): Promise<boolean> {
    try {
        const newYear = new Date().getFullYear() + 1

        const { error } = await supabase
            .from('number_sequences')
            .insert({
                sequence_type: sequenceType,
                class_id: classId || null,
                year: newYear,
                current_value: 0
            })

        return !error
    } catch (error) {
        console.error('Error resetting sequence:', error)
        return false
    }
}
