// User roles
export type UserRole = 'OWNER' | 'CLERK' | 'TEACHER'

// User status
export type UserStatus = 'active' | 'inactive'

// Profile interface
export interface Profile {
    id: string
    email: string
    name: string
    role: UserRole
    status: UserStatus
    permissions: Permissions
    assigned_classes?: string[]
    created_at: string
    updated_at: string
}

// Permission categories
export interface Permissions {
    // Admissions
    'admissions.view'?: boolean
    'admissions.create'?: boolean
    'admissions.approve'?: boolean
    'admissions.reject'?: boolean
    'admissions.autoApprove'?: boolean
    'admissions.delete'?: boolean

    // Students
    'students.view'?: boolean
    'students.create'?: boolean
    'students.edit'?: boolean
    'students.delete'?: boolean

    // Classes & Sections
    'classes.view'?: boolean
    'classes.create'?: boolean
    'classes.edit'?: boolean
    'classes.delete'?: boolean
    'sections.view'?: boolean
    'sections.create'?: boolean
    'sections.edit'?: boolean
    'sections.delete'?: boolean

    // Fees
    'fees.view'?: boolean
    'fees.collect'?: boolean
    'fees.edit'?: boolean
    'fees.delete'?: boolean
    'fees.structure.create'?: boolean
    'fees.structure.edit'?: boolean
    'fees.challan.generate'?: boolean

    // Attendance
    'attendance.view'?: boolean
    'attendance.mark'?: boolean
    'attendance.edit'?: boolean

    // Report Cards
    'reportCards.view'?: boolean
    'reportCards.generate'?: boolean
    'reportCards.edit'?: boolean

    // Announcements
    'announcements.view'?: boolean
    'announcements.create'?: boolean
    'announcements.edit'?: boolean
    'announcements.delete'?: boolean

    // Staff Management (Owner only)
    'staff.view'?: boolean
    'staff.create'?: boolean
    'staff.edit'?: boolean
    'staff.delete'?: boolean
    'staff.resetPassword'?: boolean

    // System Settings (Owner only)
    'settings.view'?: boolean
    'settings.edit'?: boolean
    'settings.backup'?: boolean
    'settings.restore'?: boolean

    // Allow any string key for flexibility
    [key: string]: boolean | undefined
}

// Default permissions for each role
export const DEFAULT_OWNER_PERMISSIONS: Permissions = {
    'admissions.view': true,
    'admissions.create': true,
    'admissions.approve': true,
    'admissions.reject': true,
    'admissions.autoApprove': true,
    'admissions.delete': true,
    'students.view': true,
    'students.create': true,
    'students.edit': true,
    'students.delete': true,
    'classes.view': true,
    'classes.create': true,
    'classes.edit': true,
    'classes.delete': true,
    'sections.view': true,
    'sections.create': true,
    'sections.edit': true,
    'sections.delete': true,
    'fees.view': true,
    'fees.collect': true,
    'fees.edit': true,
    'fees.delete': true,
    'fees.structure.create': true,
    'fees.structure.edit': true,
    'fees.challan.generate': true,
    'attendance.view': true,
    'attendance.mark': true,
    'attendance.edit': true,
    'reportCards.view': true,
    'reportCards.generate': true,
    'reportCards.edit': true,
    'announcements.view': true,
    'announcements.create': true,
    'announcements.edit': true,
    'announcements.delete': true,
    'staff.view': true,
    'staff.create': true,
    'staff.edit': true,
    'staff.delete': true,
    'staff.resetPassword': true,
    'settings.view': true,
    'settings.edit': true,
    'settings.backup': true,
    'settings.restore': true,
}

export const DEFAULT_CLERK_PERMISSIONS: Permissions = {
    'admissions.view': true,
    'admissions.create': true,
    'admissions.approve': false,
    'admissions.reject': false,
    'admissions.autoApprove': false,
    'admissions.delete': false,
    'students.view': true,
    'students.create': true,
    'students.edit': true,
    'students.delete': false,
    'classes.view': true,
    'classes.create': true,
    'classes.edit': true,
    'classes.delete': false,
    'sections.view': true,
    'sections.create': true,
    'sections.edit': true,
    'sections.delete': false,
    'fees.view': true,
    'fees.collect': true,
    'fees.edit': false,
    'fees.delete': false,
    'fees.structure.create': false,
    'fees.structure.edit': false,
    'fees.challan.generate': true,
    'attendance.view': true,
    'attendance.mark': false,
    'attendance.edit': false,
    'reportCards.view': true,
    'reportCards.generate': true,
    'reportCards.edit': false,
    'announcements.view': true,
    'announcements.create': false,
    'announcements.edit': false,
    'announcements.delete': false,
    'staff.view': false,
    'staff.create': false,
    'staff.edit': false,
    'staff.delete': false,
    'staff.resetPassword': false,
    'settings.view': false,
    'settings.edit': false,
    'settings.backup': false,
    'settings.restore': false,
}

export const DEFAULT_TEACHER_PERMISSIONS: Permissions = {
    'admissions.view': false,
    'admissions.create': false,
    'admissions.approve': false,
    'admissions.reject': false,
    'admissions.autoApprove': false,
    'admissions.delete': false,
    'students.view': true,
    'students.create': false,
    'students.edit': false,
    'students.delete': false,
    'classes.view': true,
    'classes.create': false,
    'classes.edit': false,
    'classes.delete': false,
    'sections.view': true,
    'sections.create': false,
    'sections.edit': false,
    'sections.delete': false,
    'fees.view': false,
    'fees.collect': false,
    'fees.edit': false,
    'fees.delete': false,
    'fees.structure.create': false,
    'fees.structure.edit': false,
    'fees.challan.generate': false,
    'attendance.view': true,
    'attendance.mark': true,
    'attendance.edit': false,
    'reportCards.view': true,
    'reportCards.generate': false,
    'reportCards.edit': false,
    'announcements.view': true,
    'announcements.create': false,
    'announcements.edit': false,
    'announcements.delete': false,
    'staff.view': false,
    'staff.create': false,
    'staff.edit': false,
    'staff.delete': false,
    'staff.resetPassword': false,
    'settings.view': false,
    'settings.edit': false,
    'settings.backup': false,
    'settings.restore': false,
}

// Permission categories for UI grouping
export const PERMISSION_CATEGORIES = {
    admissions: {
        label: 'Admissions',
        permissions: [
            { key: 'admissions.view', label: 'View Admissions' },
            { key: 'admissions.create', label: 'Create Admissions' },
            { key: 'admissions.approve', label: 'Approve Admissions' },
            { key: 'admissions.reject', label: 'Reject Admissions' },
            { key: 'admissions.autoApprove', label: 'Auto-Approve Admissions' },
            { key: 'admissions.delete', label: 'Delete Admissions' },
        ],
    },
    students: {
        label: 'Students',
        permissions: [
            { key: 'students.view', label: 'View Students' },
            { key: 'students.create', label: 'Create Students' },
            { key: 'students.edit', label: 'Edit Students' },
            { key: 'students.delete', label: 'Delete Students' },
        ],
    },
    classes: {
        label: 'Classes & Sections',
        permissions: [
            { key: 'classes.view', label: 'View Classes' },
            { key: 'classes.create', label: 'Create Classes' },
            { key: 'classes.edit', label: 'Edit Classes' },
            { key: 'classes.delete', label: 'Delete Classes' },
            { key: 'sections.view', label: 'View Sections' },
            { key: 'sections.create', label: 'Create Sections' },
            { key: 'sections.edit', label: 'Edit Sections' },
            { key: 'sections.delete', label: 'Delete Sections' },
        ],
    },
    fees: {
        label: 'Fees',
        permissions: [
            { key: 'fees.view', label: 'View Fees' },
            { key: 'fees.collect', label: 'Collect Fees' },
            { key: 'fees.edit', label: 'Edit Fees' },
            { key: 'fees.delete', label: 'Delete Fees' },
            { key: 'fees.structure.create', label: 'Create Fee Structure' },
            { key: 'fees.structure.edit', label: 'Edit Fee Structure' },
            { key: 'fees.challan.generate', label: 'Generate Challans' },
        ],
    },
    attendance: {
        label: 'Attendance',
        permissions: [
            { key: 'attendance.view', label: 'View Attendance' },
            { key: 'attendance.mark', label: 'Mark Attendance' },
            { key: 'attendance.edit', label: 'Edit Attendance' },
        ],
    },
    reportCards: {
        label: 'Report Cards',
        permissions: [
            { key: 'reportCards.view', label: 'View Report Cards' },
            { key: 'reportCards.generate', label: 'Generate Report Cards' },
            { key: 'reportCards.edit', label: 'Edit Report Cards' },
        ],
    },
    announcements: {
        label: 'Announcements',
        permissions: [
            { key: 'announcements.view', label: 'View Announcements' },
            { key: 'announcements.create', label: 'Create Announcements' },
            { key: 'announcements.edit', label: 'Edit Announcements' },
            { key: 'announcements.delete', label: 'Delete Announcements' },
        ],
    },
    staff: {
        label: 'Staff Management',
        permissions: [
            { key: 'staff.view', label: 'View Staff' },
            { key: 'staff.create', label: 'Create Staff' },
            { key: 'staff.edit', label: 'Edit Staff' },
            { key: 'staff.delete', label: 'Delete Staff' },
            { key: 'staff.resetPassword', label: 'Reset Password' },
        ],
    },
    settings: {
        label: 'System Settings',
        permissions: [
            { key: 'settings.view', label: 'View Settings' },
            { key: 'settings.edit', label: 'Edit Settings' },
            { key: 'settings.backup', label: 'Backup Data' },
            { key: 'settings.restore', label: 'Restore Data' },
        ],
    },
}
