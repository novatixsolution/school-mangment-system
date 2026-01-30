'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Profile, Permissions, DEFAULT_OWNER_PERMISSIONS } from '@/types/permissions'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    hasPermission: (permission: keyof Permissions) => boolean
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    // Fetch user profile
    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            // PGRST116 means no rows found - this is expected for new users
            if (error) {
                if (error.code !== 'PGRST116') {
                    console.error('Error fetching profile:', error.message)
                }
                return null
            }

            return data as Profile
        } catch (err) {
            console.error('Profile fetch exception:', err)
            return null
        }
    }

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Get current session
                const { data: { session: currentSession } } = await supabase.auth.getSession()

                if (currentSession?.user) {
                    setSession(currentSession)
                    setUser(currentSession.user)
                    const userProfile = await fetchProfile(currentSession.user.id)
                    setProfile(userProfile)
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
            } finally {
                setLoading(false)
            }
        }

        initAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                setSession(newSession)
                setUser(newSession?.user ?? null)

                if (newSession?.user) {
                    const userProfile = await fetchProfile(newSession.user.id)
                    setProfile(userProfile)
                } else {
                    setProfile(null)
                }

                setLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    // Sign in
    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                return { error }
            }

            return { error: null }
        } catch (error) {
            return { error: error as Error }
        }
    }

    // Sign out
    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setSession(null)
    }

    // Check permission
    const hasPermission = (permission: keyof Permissions): boolean => {
        if (!profile) return false

        // Owner has all permissions
        if (profile.role === 'OWNER') {
            return DEFAULT_OWNER_PERMISSIONS[permission] ?? false
        }

        return profile.permissions?.[permission] ?? false
    }

    // Refresh profile
    const refreshProfile = async () => {
        if (user) {
            const userProfile = await fetchProfile(user.id)
            setProfile(userProfile)
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                loading,
                signIn,
                signOut,
                hasPermission,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
