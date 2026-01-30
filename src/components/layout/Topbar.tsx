'use client'

import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface TopbarProps {
    onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
    const { profile, signOut } = useAuth()
    const router = useRouter()
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
            <div className="flex items-center justify-between h-full px-4 lg:px-8">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors lg:hidden"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="hidden sm:block">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Welcome back, {profile?.name?.split(' ')[0] || 'User'}! 👋
                        </h2>
                        <p className="text-sm text-slate-500">
                            Here&apos;s what&apos;s happening today
                        </p>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <button className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    {/* User dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            <Avatar name={profile?.name || 'U'} size="sm" />
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-slate-900">
                                    {profile?.name || 'Loading...'}
                                </p>
                                <p className="text-xs text-slate-500">{profile?.role}</p>
                            </div>
                            <ChevronDown className={cn(
                                'h-4 w-4 text-slate-400 transition-transform',
                                showDropdown && 'rotate-180'
                            )} />
                        </button>

                        {/* Dropdown menu */}
                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-56 py-2 bg-white rounded-xl shadow-xl border border-slate-200/60 animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <p className="text-sm font-medium text-slate-900">{profile?.name}</p>
                                    <p className="text-xs text-slate-500">{profile?.email}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false)
                                            // Navigate to profile
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <User className="h-4 w-4" />
                                        My Profile
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
