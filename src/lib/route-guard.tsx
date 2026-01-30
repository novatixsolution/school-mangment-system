'use client'

import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { canAccessRoute, getDefaultRoute, getUnauthorizedMessage, type UserRole } from '@/lib/permissions-helper'
import { toast } from '@/components/ui/toast'

/**
 * Route Guard Component
 * Provides client-side route protection as an additional security layer
 * Use this as a wrapper around protected pages
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { profile, loading } = useAuth()

    useEffect(() => {
        // Wait for auth to load
        if (loading) return

        // Check for error parameter from middleware redirect
        const error = searchParams.get('error')
        const attemptedPath = searchParams.get('attempted')

        if (error === 'unauthorized' && attemptedPath) {
            toast({
                title: 'Access Denied',
                message: `You don't have permission to access ${attemptedPath}`,
                type: 'error',
                duration: 5000
            })

            // Clean up URL parameters
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('error')
            newUrl.searchParams.delete('attempted')
            router.replace(newUrl.pathname + newUrl.search)
        }

        // Verify access on client side
        if (profile && profile.role) {
            const userRole = profile.role as UserRole

            if (!canAccessRoute(userRole, pathname)) {
                const message = getUnauthorizedMessage(userRole, pathname)
                const defaultRoute = getDefaultRoute(userRole)

                toast({
                    title: 'Access Denied',
                    message: message,
                    type: 'error',
                    duration: 5000
                })

                // Redirect to user's dashboard
                router.replace(defaultRoute)
            }
        }
    }, [profile, loading, pathname, router, searchParams])

    // Show loading state while checking permissions
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // If no profile, don't render (middleware will handle redirect)
    if (!profile) {
        return null
    }

    // Render children if authorized
    return <>{children}</>
}

/**
 * Higher Order Component for route protection
 * Wrap your page components with this HOC
 * 
 * Example:
 * export default withRouteGuard(StaffManagementPage)
 */
export function withRouteGuard<P extends object>(
    Component: React.ComponentType<P>
) {
    return function ProtectedComponent(props: P) {
        return (
            <RouteGuard>
                <Component {...props} />
            </RouteGuard>
        )
    }
}

/**
 * Hook to check if current user has access to a specific route
 * Useful for conditionally rendering navigation links
 * 
 * Example:
 * const canAccessStaff = useCanAccessRoute('/owner/staff')
 */
export function useCanAccessRoute(route: string): boolean {
    const { profile } = useAuth()

    if (!profile || !profile.role) {
        return false
    }

    return canAccessRoute(profile.role as UserRole, route)
}

/**
 * Component to conditionally render based on route access
 * 
 * Example:
 * <ProtectedLink route="/owner/staff">
 *   <a href="/owner/staff">Staff Management</a>
 * </ProtectedLink>
 */
export function ProtectedLink({
    route,
    children
}: {
    route: string
    children: React.ReactNode
}) {
    const canAccess = useCanAccessRoute(route)

    if (!canAccess) {
        return null
    }

    return <>{children}</>
}
