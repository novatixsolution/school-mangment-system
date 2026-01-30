import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessRoute, getDefaultRoute, type UserRole } from '@/lib/permissions-helper'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Check if route is protected
    const isAuthPage = request.nextUrl.pathname === '/'
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/owner') ||
        request.nextUrl.pathname.startsWith('/clerk') ||
        request.nextUrl.pathname.startsWith('/teacher')

    // Redirect unauthenticated users to login
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // Handle authenticated users
    if (user && isProtectedRoute) {
        // Fetch user's role from database
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile && profile.role) {
            const userRole = profile.role as UserRole
            const currentPath = request.nextUrl.pathname

            // Check if user has permission to access this route
            if (!canAccessRoute(userRole, currentPath)) {
                // User is trying to access unauthorized route
                // Redirect to their dashboard with error parameter
                const url = request.nextUrl.clone()
                url.pathname = getDefaultRoute(userRole)
                url.searchParams.set('error', 'unauthorized')
                url.searchParams.set('attempted', currentPath)

                console.warn(`Unauthorized access attempt: User ${user.id} (${userRole}) tried to access ${currentPath}`)

                return NextResponse.redirect(url)
            }
        }
    }

    // Redirect authenticated users from login page to their dashboard
    if (user && isAuthPage) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile) {
            const url = request.nextUrl.clone()
            const userRole = profile.role as UserRole
            url.pathname = getDefaultRoute(userRole)
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
