// Local Demo Data Seeder - No AI Required
// Generates realistic Pakistani school data for testing

export interface SeedConfig {
    classCount: number
    sectionsPerClass: number
    studentsPerSection: number
}

// Pakistani names datasets
const MALE_FIRST_NAMES = [
    'Ahmed', 'Muhammad', 'Ali', 'Hassan', 'Hussain', 'Usman', 'Bilal', 'Hamza',
    'Omar', 'Zain', 'Fahad', 'Talha', 'Saad', 'Faisal', 'Arslan', 'Adnan',
    'Kamran', 'Imran', 'Junaid', 'Kashif', 'Waseem', 'Naeem', 'Salman', 'Rizwan',
    'Tariq', 'Shahid', 'Asad', 'Waqas', 'Shoaib', 'Aamir', 'Danish', 'Farhan'
]

const FEMALE_FIRST_NAMES = [
    'Fatima', 'Ayesha', 'Zainab', 'Maryam', 'Hafsa', 'Khadija', 'Sana', 'Hira',
    'Amna', 'Rabia', 'Noor', 'Sara', 'Aliza', 'Mahnoor', 'Iqra', 'Bushra',
    'Sidra', 'Nimra', 'Areeba', 'Laiba', 'Momina', 'Javeria', 'Mehwish', 'Saba'
]

const LAST_NAMES = [
    'Khan', 'Ahmed', 'Ali', 'Malik', 'Sheikh', 'Rana', 'Butt', 'Chaudhry',
    'Qureshi', 'Syed', 'Hashmi', 'Gillani', 'Abbasi', 'Mughal', 'Bhatti', 'Gondal',
    'Arain', 'Jatt', 'Rajput', 'Mirza', 'Baig', 'Shah', 'Hussain', 'Awan'
]

const CLASS_NAMES = [
    'Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4',
    'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
]

const SECTION_NAMES = ['A', 'B', 'C', 'D']

const SUBJECTS = {
    primary: ['English', 'Urdu', 'Mathematics', 'Islamiat', 'General Knowledge'],
    middle: ['English', 'Urdu', 'Mathematics', 'Science', 'Islamiat', 'Social Studies', 'Computer'],
    secondary: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Islamiat', 'Pakistan Studies', 'Computer']
}

// Helper functions
function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function generatePhone(): string {
    const prefixes = ['0300', '0301', '0302', '0303', '0304', '0311', '0312', '0313', '0321', '0322', '0323', '0331', '0332', '0333']
    return `${randomFrom(prefixes)}-${randomBetween(1000000, 9999999)}`
}

function generateDOB(classIndex: number): string {
    // Age based on class (Nursery = 4-5 years, each class adds 1 year)
    const baseAge = 4 + classIndex
    const currentYear = new Date().getFullYear()
    const birthYear = currentYear - baseAge - randomBetween(0, 1)
    const month = randomBetween(1, 12).toString().padStart(2, '0')
    const day = randomBetween(1, 28).toString().padStart(2, '0')
    return `${birthYear}-${month}-${day}`
}

// Generate classes data
export function generateClasses(count: number = 10) {
    return CLASS_NAMES.slice(0, count).map((className) => ({
        class_name: className,
        medium: 'English',
        status: 'active' as const
    }))
}

// Generate sections for classes
export function generateSections(classes: { id: string; class_name: string }[], sectionsPerClass: number = 2) {
    const sections: any[] = []
    classes.forEach((cls) => {
        const sectionCount = Math.min(sectionsPerClass, SECTION_NAMES.length)
        for (let i = 0; i < sectionCount; i++) {
            sections.push({
                class_id: cls.id,
                section_name: SECTION_NAMES[i],
                capacity: randomBetween(30, 40),
                status: 'active'
            })
        }
    })
    return sections
}

// Generate students
export function generateStudents(
    sections: { id: string; class_id: string; section_name: string }[],
    classes: { id: string; class_name: string }[],
    studentsPerSection: number = 10
) {
    const students: any[] = []

    sections.forEach((section) => {
        const classIndex = classes.findIndex(c => c.id === section.class_id)

        for (let i = 0; i < studentsPerSection; i++) {
            const isMale = Math.random() > 0.5
            const firstName = isMale ? randomFrom(MALE_FIRST_NAMES) : randomFrom(FEMALE_FIRST_NAMES)
            const lastName = randomFrom(LAST_NAMES)
            const fatherFirstName = randomFrom(MALE_FIRST_NAMES)

            students.push({
                class_id: section.class_id,
                section_id: section.id,
                name: `${firstName} ${lastName}`,
                father_name: `${fatherFirstName} ${lastName}`,
                dob: generateDOB(classIndex >= 0 ? classIndex : 0),
                gender: isMale ? 'male' : 'female',
                father_phone: generatePhone(),
                status: 'active'
            })
        }
    })

    return students
}

// Generate subjects
export function generateSubjects(classes: { id: string; class_name: string }[]) {
    const subjects: any[] = []

    classes.forEach((cls) => {
        const classIndex = CLASS_NAMES.indexOf(cls.class_name)
        let subjectList: string[]

        if (classIndex <= 4) {
            subjectList = SUBJECTS.primary
        } else if (classIndex <= 7) {
            subjectList = SUBJECTS.middle
        } else {
            subjectList = SUBJECTS.secondary
        }

        subjectList.forEach((subjectName) => {
            subjects.push({
                class_id: cls.id,
                name: subjectName
            })
        })
    })

    return subjects
}

// Generate fee structures
export function generateFeeStructures(classes: { id: string; class_name: string }[]) {
    const fees: any[] = []

    classes.forEach((cls, index) => {
        // Base fee increases with class level
        const baseFee = 3000 + (index * 500)

        fees.push({
            class_id: cls.id,
            name: 'Tuition Fee',
            amount: baseFee,
            frequency: 'monthly',
            fee_type: 'tuition'
        })

        // Add admission fee for each class
        fees.push({
            class_id: cls.id,
            name: 'Admission Fee',
            amount: baseFee * 2,
            frequency: 'annual',
            fee_type: 'admission'
        })
    })

    return fees
}

// Generate exams
export function generateExams(classes: { id: string; class_name: string }[]) {
    const currentYear = new Date().getFullYear()
    const exams: any[] = []

    const examTypes = [
        { name: 'First Term', startMonth: 4, endMonth: 4 },
        { name: 'Mid Term', startMonth: 8, endMonth: 8 },
        { name: 'Final Term', startMonth: 12, endMonth: 12 }
    ]

    classes.forEach((cls) => {
        examTypes.forEach((exam) => {
            exams.push({
                class_id: cls.id,
                name: exam.name,
                start_date: `${currentYear}-${exam.startMonth.toString().padStart(2, '0')}-01`,
                end_date: `${currentYear}-${exam.endMonth.toString().padStart(2, '0')}-15`
            })
        })
    })

    return exams
}

// Generate admissions (pending applications)
export function generateAdmissions(
    classes: { id: string; class_name: string }[],
    sections: { id: string; class_id: string; section_name: string }[],
    count: number = 10
) {
    const admissions: any[] = []
    const statuses = ['pending', 'pending', 'pending', 'approved', 'rejected'] // More pending

    for (let i = 0; i < count; i++) {
        const isMale = Math.random() > 0.5
        const firstName = isMale ? randomFrom(MALE_FIRST_NAMES) : randomFrom(FEMALE_FIRST_NAMES)
        const lastName = randomFrom(LAST_NAMES)
        const fatherFirstName = randomFrom(MALE_FIRST_NAMES)
        const motherFirstName = randomFrom(FEMALE_FIRST_NAMES)

        // Random class and section
        const randomClass = randomFrom(classes)
        const classSections = sections.filter(s => s.class_id === randomClass.id)
        const randomSection = classSections.length > 0 ? randomFrom(classSections) : null
        const classIndex = CLASS_NAMES.indexOf(randomClass.class_name)

        const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
        const cities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta']
        const areas = ['Gulberg', 'DHA', 'Model Town', 'Johar Town', 'Bahria Town', 'Cantt', 'Saddar', 'F-10']

        admissions.push({
            status: randomFrom(statuses),
            // Student Info
            student_name: `${firstName} ${lastName}`,
            dob: generateDOB(classIndex >= 0 ? classIndex : 0),
            gender: isMale ? 'male' : 'female',
            father_name: `${fatherFirstName} ${lastName}`,
            father_cnic: `${randomBetween(10000, 99999)}-${randomBetween(1000000, 9999999)}-${randomBetween(1, 9)}`,
            father_phone: generatePhone(),
            mother_name: `${motherFirstName} ${randomFrom(LAST_NAMES)}`,
            address: `House ${randomBetween(1, 500)}, ${randomFrom(areas)}, ${randomFrom(cities)}`,
            emergency_contact: generatePhone(),
            previous_school: Math.random() > 0.5 ? `${randomFrom(['Al-Huda', 'City', 'National', 'Allied'])} School` : null,
            blood_group: randomFrom(bloodGroups),
            class_id: randomClass.id,
            section_id: randomSection?.id || null
        })
    }

    return admissions
}

// Generate attendance records (last 30 days)
export function generateAttendance(
    students: { id: string; class_id: string; section_id: string }[],
    daysBack: number = 30,
    markedBy: string
) {
    const attendance: any[] = []
    const today = new Date()

    students.forEach((student) => {
        for (let i = 0; i < daysBack; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)

            // Skip weekends (Saturday=6, Sunday=0)
            const dayOfWeek = date.getDay()
            if (dayOfWeek === 0 || dayOfWeek === 6) continue

            // 85% present, 10% late, 5% absent
            const rand = Math.random()
            const status = rand < 0.85 ? 'present' : rand < 0.95 ? 'late' : 'absent'

            attendance.push({
                student_id: student.id,
                class_id: student.class_id,
                section_id: student.section_id,
                date: date.toISOString().split('T')[0],
                status,
                marked_by: markedBy
            })
        }
    })

    return attendance
}

// Generate fee payments (last 6 months)
export function generateFeePayments(
    students: { id: string; class_id: string; section_id: string }[],
    feeStructures: { id: string; class_id: string; amount: number; name: string }[]
) {
    const payments: any[] = []
    const today = new Date()

    students.forEach((student) => {
        // Get tuition fee for this student's class
        const tuitionFee = feeStructures.find(
            f => f.class_id === student.class_id && f.name === 'Tuition Fee'
        )

        if (!tuitionFee) return

        // Generate 3-6 months of payments (some students have paid more than others)
        const monthsPaid = randomBetween(3, 6)

        for (let i = 0; i < monthsPaid; i++) {
            const paymentDate = new Date(today)
            paymentDate.setMonth(paymentDate.getMonth() - i)
            paymentDate.setDate(randomBetween(1, 10)) // Paid between 1st-10th

            const month = new Date(paymentDate)
            month.setDate(1) // First day of month

            payments.push({
                student_id: student.id,
                fee_structure_id: tuitionFee.id,
                amount: tuitionFee.amount,
                payment_date: paymentDate.toISOString().split('T')[0],
                month: month.toISOString().split('T')[0],
                payment_method: Math.random() > 0.3 ? 'cash' : 'bank_transfer',
                status: 'paid'
            })
        }
    })

    return payments
}

// Seed size configurations
export const SEED_CONFIGS = {
    small: { classCount: 5, sectionsPerClass: 1, studentsPerSection: 5 },
    medium: { classCount: 8, sectionsPerClass: 2, studentsPerSection: 15 },
    large: { classCount: 12, sectionsPerClass: 3, studentsPerSection: 30 }
}
