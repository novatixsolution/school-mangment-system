import { supabase } from './supabase/client'

/**
 * DELETE ALL SCHOOL DATA - DANGEROUS OPERATION
 * This function permanently deletes all school data from the database
 * USE WITH EXTREME CAUTION
 */

export interface DeleteAllDataOptions {
    includeStaff: boolean
    currentUserId: string // Never delete the current user
    onProgress?: (progress: number, message: string) => void // Progress callback
}

export interface DeleteAllDataResult {
    success: boolean
    error?: string
    deletedCounts?: {
        students: number
        admissions: number
        classes: number
        sections: number
        subjects: number
        attendance: number
        challans: number
        payments: number
        feeStructures: number
        siblingGroups: number
        staff?: number
    }
}

export async function deleteAllSchoolData(
    options: DeleteAllDataOptions
): Promise<DeleteAllDataResult> {
    const { includeStaff, currentUserId, onProgress } = options
    const deletedCounts: any = {}

    // Calculate total steps for accurate progress
    const totalSteps = includeStaff ? 11 : 10
    let currentStep = 0

    try {
        console.log('⚠️ STARTING DELETE ALL DATA OPERATION...')

        // Step 1: Delete fee payments (no foreign keys depend on it)
        onProgress?.(Math.round((currentStep / totalSteps) * 100), 'Deleting fee payments...')
        const { data: payments, error: paymentsError } = await supabase
            .from('fee_payments')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
            .select('id')

        if (paymentsError) throw paymentsError
        deletedCounts.payments = payments?.length || 0
        console.log(`✓ Deleted ${deletedCounts.payments} fee payments`)
        currentStep++
        onProgress?.(Math.round((currentStep / totalSteps) * 100), `Deleted ${deletedCounts.payments} payments`)

        // Step 2: Delete fee challans
        onProgress?.(Math.round((currentStep / totalSteps) * 100), 'Deleting fee challans...')
        const { data: challans, error: challansError } = await supabase
            .from('fee_challans')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id')

        if (challansError) throw challansError
        deletedCounts.challans = challans?.length || 0
        console.log(`✓ Deleted ${deletedCounts.challans} fee challans`)
        currentStep++
        onProgress?.(Math.round((currentStep / totalSteps) * 100), `Deleted ${deletedCounts.challans} challans`)

        // Step 3: Delete attendance records
        onProgress?.(Math.round((currentStep / totalSteps) * 100), 'Deleting attendance records...')
        const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id')

        if (attendanceError) throw attendanceError
        deletedCounts.attendance = attendance?.length || 0
        console.log(`✓ Deleted ${deletedCounts.attendance} attendance records`)
        currentStep++
        onProgress?.(Math.round((currentStep / totalSteps) * 100), `Deleted ${deletedCounts.attendance} attendance records`)

        // Step 4: Delete sibling groups
        onProgress?.(Math.round((currentStep / totalSteps) * 100), 'Deleting sibling groups...')
        const { data: siblingGroups, error: siblingGroupsError } = await supabase
            .from('sibling_groups')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id')

        if (siblingGroupsError) throw siblingGroupsError
        deletedCounts.siblingGroups = siblingGroups?.length || 0
        console.log(`✓ Deleted ${deletedCounts.siblingGroups} sibling groups`)
        currentStep++
        onProgress?.(Math.round((currentStep / totalSteps) * 100), `Deleted ${deletedCounts.siblingGroups} sibling groups`)

        // Step 5: Delete students
        onProgress?.(Math.round((currentStep / totalSteps) * 100), 'Deleting students...')
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id')

        if (studentsError) throw studentsError
        deletedCounts.students = students?.length || 0
        console.log(`✓ Deleted ${deletedCounts.students} students`)
        currentStep++
        onProgress?.(Math.round((currentStep / totalSteps) * 100), `Deleted ${deletedCounts.students} students`)

        // Step 6: Delete admissions
        onProgress?.(Math.round((currentStep / totalSteps) * 100), 'Deleting admissions...')
        const { data: admissions, error: admissionsError } = await supabase
            .from('admissions')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id')

        if (admissionsError) throw admissionsError
        deletedCounts.admissions = admissions?.length || 0
        console.log(`✓ Deleted ${deletedCounts.admissions} admissions`)
        currentStep++
        onProgress?.(Math.round((currentStep / totalSteps) * 100), `Deleted ${deletedCounts.admissions} admissions`)

        // Step 7: Delete fee structures
        onProgress?.(Math.round((currentStep / totalSteps) * 100), 'Deleting fee structures...')
        const { data: feeStructures, error: feeStructuresError } = await supabase
            .from('fee_structures')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id')

        if (feeStructuresError) throw feeStructuresError
        deletedCounts.feeStructures = feeStructures?.length || 0
        console.log(`✓ Deleted ${deletedCounts.feeStructures} fee structures`)
        currentStep++
        onProgress?.(Math.round((currentStep / totalSteps) * 100), `Deleted ${deletedCounts.feeStructures} fee structures`)

        // Step 8: Delete sections
        onProgress?.(Math.round((currentStep / totalSteps) * 100), 'Deleting sections...')
        const { data: sections, error: sectionsError } = await supabase
            .from('sections')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id')

        if (sectionsError) throw sectionsError
        deletedCounts.sections = sections?.length || 0
        console.log(`✓ Deleted ${deletedCounts.sections} sections`)
        currentStep++
        onProgress?.(Math.round((currentStep / totalSteps) * 100), `Deleted ${deletedCounts.sections} sections`)

        // Step 9: Delete subjects (MUST be before classes due to foreign key)
        onProgress?.(Math.round((currentStep / totalSteps) * 100), 'Deleting subjects...')
        const { data: subjects, error: subjectsError } = await supabase
            .from('subjects')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id')

        if (subjectsError) throw subjectsError
        deletedCounts.subjects = subjects?.length || 0
        console.log(`✓ Deleted ${deletedCounts.subjects} subjects`)
        currentStep++
        onProgress?.(Math.round((currentStep / totalSteps) * 100), `Deleted ${deletedCounts.subjects} subjects`)

        // Step 10: Delete classes
        onProgress?.(Math.round((currentStep / totalSteps) * 100), 'Deleting classes...')
        const { data: classes, error: classesError } = await supabase
            .from('classes')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id')

        if (classesError) throw classesError
        deletedCounts.classes = classes?.length || 0
        console.log(`✓ Deleted ${deletedCounts.classes} classes`)
        currentStep++
        onProgress?.(Math.round((currentStep / totalSteps) * 100), `Deleted ${deletedCounts.classes} classes`)

        // Step 11: Delete staff (OPTIONAL - if includeStaff is true)
        if (includeStaff) {
            onProgress?.(Math.round((currentStep / totalSteps) * 100), 'Deleting staff...')
            // Delete all staff EXCEPT current user
            const { data: staff, error: staffError } = await supabase
                .from('staff')
                .delete()
                .neq('id', currentUserId) // Keep current user
                .select('id')

            if (staffError) throw staffError
            deletedCounts.staff = staff?.length || 0
            console.log(`✓ Deleted ${deletedCounts.staff} staff members (kept current user)`)
            currentStep++
            onProgress?.(Math.round((currentStep / totalSteps) * 100), `Deleted ${deletedCounts.staff} staff members`)
        }

        console.log('✅ DELETE ALL DATA OPERATION COMPLETED SUCCESSFULLY')
        onProgress?.(100, 'Deletion complete!')

        return {
            success: true,
            deletedCounts
        }
    } catch (error: any) {
        console.error('❌ DELETE ALL DATA OPERATION FAILED:', error)
        return {
            success: false,
            error: error.message || 'Failed to delete data',
            deletedCounts
        }
    }
}

/**
 * Get count of records that will be deleted (for preview)
 */
export async function getDeletePreviewCounts(): Promise<{
    students: number
    admissions: number
    classes: number
    sections: number
    subjects: number
    attendance: number
    challans: number
    payments: number
    feeStructures: number
    siblingGroups: number
    staff: number
}> {
    const [
        studentsCount,
        admissionsCount,
        classesCount,
        sectionsCount,
        subjectsCount,
        attendanceCount,
        challansCount,
        paymentsCount,
        feeStructuresCount,
        siblingGroupsCount,
        staffCount
    ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('admissions').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('sections').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('id', { count: 'exact', head: true }),
        supabase.from('fee_challans').select('id', { count: 'exact', head: true }),
        supabase.from('fee_payments').select('id', { count: 'exact', head: true }),
        supabase.from('fee_structures').select('id', { count: 'exact', head: true }),
        supabase.from('sibling_groups').select('id', { count: 'exact', head: true }),
        supabase.from('staff').select('id', { count: 'exact', head: true })
    ])

    return {
        students: studentsCount.count || 0,
        admissions: admissionsCount.count || 0,
        classes: classesCount.count || 0,
        sections: sectionsCount.count || 0,
        subjects: subjectsCount.count || 0,
        attendance: attendanceCount.count || 0,
        challans: challansCount.count || 0,
        payments: paymentsCount.count || 0,
        feeStructures: feeStructuresCount.count || 0,
        siblingGroups: siblingGroupsCount.count || 0,
        staff: (staffCount.count || 0) - 1 // Subtract current user
    }
}
