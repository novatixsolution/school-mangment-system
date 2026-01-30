/**
 * Teacher Data Filter Helper
 * Provides filtering and access control for teacher-specific data
 */

import { Profile } from '@/types/permissions'
import { supabase } from '@/lib/supabase/client'

/**
 * Get assigned classes for a teacher
 * @param profile - Teacher's profile
 * @returns Array of class IDs or empty array
 */
export function getAssignedClasses(profile: Profile | null): string[] {
    if (!profile || profile.role !== 'TEACHER') {
        return []
    }
    return profile.assigned_classes || []
}

/**
 * Check if teacher has any assigned classes
 * @param profile - Teacher's profile
 * @returns true if teacher has assigned classes
 */
export function hasAssignedClasses(profile: Profile | null): boolean {
    const classes = getAssignedClasses(profile)
    return classes.length > 0
}

/**
 * Get assigned sections for a teacher
 * Fetches sections where teacher is assigned as teacher_id
 * @param teacherId - Teacher's user ID
 * @returns Promise with sections data
 */
export async function getAssignedSections(teacherId: string) {
    try {
        const { data, error } = await supabase
            .from('sections')
            .select('*, class:classes(id, class_name)')
            .eq('teacher_id', teacherId)
            .eq('status', 'active')

        if (error) throw error
        return { data: data || [], error: null }
    } catch (error) {
        console.error('Error fetching assigned sections:', error)
        return { data: [], error }
    }
}

/**
 * Get class IDs from assigned sections
 * @param teacherId - Teacher's user ID
 * @returns Promise with array of class IDs
 */
export async function getClassIdsFromSections(teacherId: string): Promise<string[]> {
    const { data } = await getAssignedSections(teacherId)
    const classIds = [...new Set(data.map(section => section.class_id))]
    return classIds
}

/**
 * Check if teacher can access a specific student
 * @param studentClassId - Student's class ID
 * @param teacherClassIds - Teacher's assigned class IDs
 * @returns true if teacher can access this student
 */
export function canAccessStudent(studentClassId: string, teacherClassIds: string[]): boolean {
    return teacherClassIds.includes(studentClassId)
}

/**
 * Check if teacher can access a specific class
 * @param classId - Class ID to check
 * @param teacherClassIds - Teacher's assigned class IDs
 * @returns true if teacher can access this class
 */
export function canAccessClass(classId: string, teacherClassIds: string[]): boolean {
    return teacherClassIds.includes(classId)
}

/**
 * Filter students by teacher's assigned classes
 * @param students - Array of all students
 * @param teacherClassIds - Teacher's assigned class IDs
 * @returns Filtered array of students
 */
export function filterStudentsByClass<T extends { class_id: string }>(
    students: T[],
    teacherClassIds: string[]
): T[] {
    return students.filter(student => teacherClassIds.includes(student.class_id))
}

/**
 * Filter sections by teacher's assigned classes
 * @param sections - Array of all sections
 * @param teacherClassIds - Teacher's assigned class IDs
 * @returns Filtered array of sections
 */
export function filterSectionsByClass<T extends { class_id: string }>(
    sections: T[],
    teacherClassIds: string[]
): T[] {
    return sections.filter(section => teacherClassIds.includes(section.class_id))
}

/**
 * Build Supabase query filter for assigned classes
 * Use this in .in() clause for queries
 * @param teacherClassIds - Teacher's assigned class IDs
 * @returns Filter array for Supabase query
 */
export function buildClassFilter(teacherClassIds: string[]): string[] {
    if (teacherClassIds.length === 0) {
        // Return impossible value to ensure no results
        return ['00000000-0000-0000-0000-000000000000']
    }
    return teacherClassIds
}

/**
 * Fetch students for teacher's assigned classes only
 * @param teacherId - Teacher's user ID
 * @returns Promise with filtered students
 */
export async function getTeacherStudents(teacherId: string) {
    try {
        // Get class IDs from assigned sections
        const classIds = await getClassIdsFromSections(teacherId)

        if (classIds.length === 0) {
            return { data: [], error: null }
        }

        // Fetch students only from assigned classes
        const { data, error } = await supabase
            .from('students')
            .select('*, class:classes(id, class_name), section:sections(id, section_name)')
            .in('class_id', classIds)
            .eq('status', 'active')
            .order('class_id')
            .order('roll_number')

        if (error) throw error
        return { data: data || [], error: null }
    } catch (error) {
        console.error('Error fetching teacher students:', error)
        return { data: [], error }
    }
}

/**
 * Validate if teacher can perform action on student
 * @param teacherId - Teacher's user ID
 * @param studentId - Student's ID
 * @returns Promise with validation result
 */
export async function validateTeacherStudentAccess(
    teacherId: string,
    studentId: string
): Promise<{ allowed: boolean; reason?: string }> {
    try {
        // Get teacher's class IDs
        const classIds = await getClassIdsFromSections(teacherId)

        if (classIds.length === 0) {
            return { allowed: false, reason: 'No classes assigned to teacher' }
        }

        // Get student's class
        const { data: student, error } = await supabase
            .from('students')
            .select('class_id')
            .eq('id', studentId)
            .single()

        if (error || !student) {
            return { allowed: false, reason: 'Student not found' }
        }

        // Check if student's class is in teacher's assigned classes
        if (!classIds.includes(student.class_id)) {
            return { allowed: false, reason: 'Student not in your assigned classes' }
        }

        return { allowed: true }
    } catch (error) {
        console.error('Error validating teacher access:', error)
        return { allowed: false, reason: 'Validation error' }
    }
}

/**
 * Get exams for teacher's assigned classes
 * @param teacherId - Teacher's user ID
 * @returns Promise with filtered exams
 */
export async function getTeacherExams(teacherId: string) {
    try {
        const classIds = await getClassIdsFromSections(teacherId)

        if (classIds.length === 0) {
            return { data: [], error: null }
        }

        const { data, error } = await supabase
            .from('exams')
            .select('*, class:classes(id, class_name)')
            .in('class_id', classIds)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { data: data || [], error: null }
    } catch (error) {
        console.error('Error fetching teacher exams:', error)
        return { data: [], error }
    }
}

/**
 * Check if teacher can enter marks for a specific exam
 * @param teacherId - Teacher's user ID
 * @param examId - Exam ID
 * @returns Promise with validation result
 */
export async function canEnterMarksForExam(
    teacherId: string,
    examId: string
): Promise<boolean> {
    try {
        const classIds = await getClassIdsFromSections(teacherId)

        const { data: exam } = await supabase
            .from('exams')
            .select('class_id')
            .eq('id', examId)
            .single()

        if (!exam) return false

        return classIds.includes(exam.class_id)
    } catch (error) {
        console.error('Error checking exam access:', error)
        return false
    }
}
