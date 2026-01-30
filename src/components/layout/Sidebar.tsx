'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    DollarSign,
    Calendar,
    FileText,
    Megaphone,
    Settings,
    UserPlus,
    ClipboardList,
    School,
    X,
    Sparkles,
    Settings2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/permissions'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

interface NavItem {
    label: string
    href: string
    icon: React.ReactNode
    permission?: string
}

const getNavItems = (role: UserRole): NavItem[] => {
    const basePath = `/${role.toLowerCase()}`

    const ownerItems: NavItem[] = [
        { label: 'Dashboard', href: `${basePath}/dashboard`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Demo Data', href: `${basePath}/ai-tools`, icon: <Sparkles className="h-5 w-5" /> },
        { label: 'Staff Management', href: `${basePath}/staff`, icon: <Users className="h-5 w-5" /> },
        { label: 'Classes', href: `${basePath}/classes`, icon: <BookOpen className="h-5 w-5" /> },
        { label: 'Students', href: `${basePath}/students`, icon: <GraduationCap className="h-5 w-5" /> },
        { label: 'Admissions', href: `${basePath}/admissions`, icon: <UserPlus className="h-5 w-5" /> },
        { label: 'Fee Structures', href: `${basePath}/fees`, icon: <Settings2 className="h-5 w-5" /> },
        { label: 'Challans', href: `${basePath}/challans`, icon: <DollarSign className="h-5 w-5" /> },
        { label: 'Attendance', href: `${basePath}/attendance`, icon: <Calendar className="h-5 w-5" /> },
        { label: 'Report Cards', href: `${basePath}/report-cards`, icon: <FileText className="h-5 w-5" /> },
        { label: 'Announcements', href: `${basePath}/announcements`, icon: <Megaphone className="h-5 w-5" /> },
        { label: 'Settings', href: `${basePath}/settings`, icon: <Settings className="h-5 w-5" /> },
    ]

    const clerkItems: NavItem[] = [
        { label: 'Dashboard', href: `${basePath}/dashboard`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Admissions', href: `${basePath}/admissions`, icon: <UserPlus className="h-5 w-5" /> },
        { label: 'Students', href: `${basePath}/students`, icon: <GraduationCap className="h-5 w-5" /> },
        { label: 'Classes', href: `${basePath}/classes`, icon: <BookOpen className="h-5 w-5" /> },
        { label: 'Fee Collection', href: `${basePath}/fees`, icon: <DollarSign className="h-5 w-5" /> },
        { label: 'Challans', href: `${basePath}/challans`, icon: <FileText className="h-5 w-5" /> },
        { label: 'Report Cards', href: `${basePath}/report-cards`, icon: <FileText className="h-5 w-5" /> },
        { label: 'Announcements', href: `${basePath}/announcements`, icon: <Megaphone className="h-5 w-5" /> },
    ]

    const teacherItems: NavItem[] = [
        { label: 'Dashboard', href: `${basePath}/dashboard`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'My Classes', href: `${basePath}/classes`, icon: <BookOpen className="h-5 w-5" /> },
        { label: 'Students', href: `${basePath}/students`, icon: <GraduationCap className="h-5 w-5" /> },
        { label: 'Attendance', href: `${basePath}/attendance`, icon: <Calendar className="h-5 w-5" /> },
        { label: 'Marks Entry', href: `${basePath}/marks`, icon: <ClipboardList className="h-5 w-5" /> },
        { label: 'Announcements', href: `${basePath}/announcements`, icon: <Megaphone className="h-5 w-5" /> },
    ]

    switch (role) {
        case 'OWNER':
            return ownerItems
        case 'CLERK':
            return clerkItems
        case 'TEACHER':
            return teacherItems
        default:
            return []
    }
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()
    const { profile } = useAuth()

    const navItems = profile ? getNavItems(profile.role) : []

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
                    'bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                            <School className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">EduManager</h1>
                            <p className="text-xs text-slate-400">School Management</p>
                        </div>
                    </Link>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/10">
                    <div className="px-4 py-3 rounded-xl bg-white/5">
                        <p className="text-xs text-slate-400">Logged in as</p>
                        <p className="text-sm font-medium text-white truncate">
                            {profile?.name || 'Loading...'}
                        </p>
                        <p className="text-xs text-indigo-400">{profile?.role}</p>
                    </div>
                </div>
            </aside>
        </>
    )
}
