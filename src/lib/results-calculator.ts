// Results Calculator Utility
// Handles all result calculations: totals, percentages, grades, positions, rankings

export interface GradeConfig {
    grade: string
    minPercentage: number
    maxPercentage: number
    gpa?: number
}

export interface SubjectMark {
    subjectId: string
    subjectName: string
    obtainedMarks: number
    maxMarks: number
}

export interface StudentResult {
    studentId: string
    studentName: string
    rollNumber: string
    subjects: SubjectMark[]
    totalObtained: number
    totalMax: number
    percentage: number
    grade: string
    position: number | null
    subjectRanks: Record<string, { rank: number; total: number }>
}

export interface ClassStatistics {
    totalStudents: number
    averagePercentage: number
    highestPercentage: number
    lowestPercentage: number
    passCount: number
    failCount: number
    top3: { studentId: string; name: string; percentage: number; position: number }[]
}

// Default grade configuration
export const DEFAULT_GRADE_CONFIG: GradeConfig[] = [
    { grade: 'A+', minPercentage: 90, maxPercentage: 100, gpa: 4.0 },
    { grade: 'A', minPercentage: 80, maxPercentage: 89.99, gpa: 3.7 },
    { grade: 'B+', minPercentage: 70, maxPercentage: 79.99, gpa: 3.3 },
    { grade: 'B', minPercentage: 60, maxPercentage: 69.99, gpa: 3.0 },
    { grade: 'C+', minPercentage: 50, maxPercentage: 59.99, gpa: 2.5 },
    { grade: 'C', minPercentage: 40, maxPercentage: 49.99, gpa: 2.0 },
    { grade: 'D', minPercentage: 33, maxPercentage: 39.99, gpa: 1.0 },
    { grade: 'F', minPercentage: 0, maxPercentage: 32.99, gpa: 0 },
]

/**
 * Calculate grade based on percentage
 */
export function calculateGrade(percentage: number, gradeConfig: GradeConfig[] = DEFAULT_GRADE_CONFIG): string {
    const config = gradeConfig.find(
        g => percentage >= g.minPercentage && percentage <= g.maxPercentage
    )
    return config?.grade || 'F'
}

/**
 * Calculate total marks for a student
 */
export function calculateTotalMarks(subjects: SubjectMark[]): { obtained: number; max: number } {
    return subjects.reduce(
        (acc, subject) => ({
            obtained: acc.obtained + (subject.obtainedMarks || 0),
            max: acc.max + (subject.maxMarks || 0),
        }),
        { obtained: 0, max: 0 }
    )
}

/**
 * Calculate percentage
 */
export function calculatePercentage(obtained: number, max: number): number {
    if (max === 0) return 0
    return Math.round((obtained / max) * 100 * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate positions with tie handling
 * Students with same percentage get the same position
 */
export function calculatePositions(students: { studentId: string; percentage: number }[]): Record<string, number | null> {
    // Sort by percentage descending
    const sorted = [...students].sort((a, b) => b.percentage - a.percentage)

    const positions: Record<string, number | null> = {}
    let currentPosition = 1
    let previousPercentage: number | null = null
    let samePositionCount = 0

    sorted.forEach((student, index) => {
        if (student.percentage === previousPercentage) {
            // Same percentage as previous, same position
            samePositionCount++
        } else {
            // New percentage, update position
            currentPosition = index + 1
            samePositionCount = 0
        }

        positions[student.studentId] = currentPosition
        previousPercentage = student.percentage
    })

    return positions
}

/**
 * Calculate Top 3 positions for a class
 */
export function calculateTop3(
    students: { studentId: string; name: string; percentage: number }[]
): { studentId: string; name: string; percentage: number; position: number }[] {
    const sorted = [...students].sort((a, b) => b.percentage - a.percentage)
    const top3: { studentId: string; name: string; percentage: number; position: number }[] = []

    let currentPosition = 1
    let previousPercentage: number | null = null
    let count = 0

    for (const student of sorted) {
        if (count >= 3 && student.percentage !== previousPercentage) break

        if (student.percentage !== previousPercentage) {
            currentPosition = count + 1
        }

        if (currentPosition <= 3) {
            top3.push({
                ...student,
                position: currentPosition
            })
        }

        previousPercentage = student.percentage
        count++
    }

    return top3
}

/**
 * Calculate class statistics
 */
export function calculateClassStatistics(
    students: { studentId: string; name: string; percentage: number }[],
    passingPercentage: number = 33
): ClassStatistics {
    if (students.length === 0) {
        return {
            totalStudents: 0,
            averagePercentage: 0,
            highestPercentage: 0,
            lowestPercentage: 0,
            passCount: 0,
            failCount: 0,
            top3: []
        }
    }

    const percentages = students.map(s => s.percentage)
    const totalPercentage = percentages.reduce((sum, p) => sum + p, 0)

    return {
        totalStudents: students.length,
        averagePercentage: Math.round((totalPercentage / students.length) * 100) / 100,
        highestPercentage: Math.max(...percentages),
        lowestPercentage: Math.min(...percentages),
        passCount: students.filter(s => s.percentage >= passingPercentage).length,
        failCount: students.filter(s => s.percentage < passingPercentage).length,
        top3: calculateTop3(students)
    }
}

/**
 * Calculate subject-wise ranks for all students
 */
export function calculateSubjectRanks(
    students: { studentId: string; subjectId: string; marks: number }[]
): Record<string, Record<string, { rank: number; total: number }>> {
    // Group by subject
    const subjectGroups: Record<string, { studentId: string; marks: number }[]> = {}

    students.forEach(record => {
        if (!subjectGroups[record.subjectId]) {
            subjectGroups[record.subjectId] = []
        }
        subjectGroups[record.subjectId].push({
            studentId: record.studentId,
            marks: record.marks
        })
    })

    // Calculate ranks per subject
    const result: Record<string, Record<string, { rank: number; total: number }>> = {}

    Object.entries(subjectGroups).forEach(([subjectId, subjectStudents]) => {
        // Sort by marks descending
        const sorted = [...subjectStudents].sort((a, b) => b.marks - a.marks)
        const total = sorted.length

        let currentRank = 1
        let previousMarks: number | null = null

        sorted.forEach((student, index) => {
            if (student.marks !== previousMarks) {
                currentRank = index + 1
            }

            if (!result[student.studentId]) {
                result[student.studentId] = {}
            }

            result[student.studentId][subjectId] = {
                rank: currentRank,
                total
            }

            previousMarks = student.marks
        })
    })

    return result
}

/**
 * Get position suffix (1st, 2nd, 3rd, 4th, etc.)
 */
export function getPositionSuffix(position: number): string {
    if (position >= 11 && position <= 13) return `${position}th`

    switch (position % 10) {
        case 1: return `${position}st`
        case 2: return `${position}nd`
        case 3: return `${position}rd`
        default: return `${position}th`
    }
}

/**
 * Check if student is in top 3
 */
export function isInTop3(position: number | null): boolean {
    return position !== null && position >= 1 && position <= 3
}

/**
 * Get grade color for UI
 */
export function getGradeColor(grade: string): string {
    switch (grade) {
        case 'A+':
        case 'A':
            return 'text-green-600 bg-green-50'
        case 'B+':
        case 'B':
            return 'text-blue-600 bg-blue-50'
        case 'C+':
        case 'C':
            return 'text-amber-600 bg-amber-50'
        case 'D':
            return 'text-orange-600 bg-orange-50'
        case 'F':
            return 'text-red-600 bg-red-50'
        default:
            return 'text-slate-600 bg-slate-50'
    }
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number): string {
    return `${percentage.toFixed(2)}%`
}
