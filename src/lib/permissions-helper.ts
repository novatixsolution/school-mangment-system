/**
 * Permissions Helper
 * Centralized logic for role-based route access control
 */

export type UserRole = 'OWNER' | 'CLERK' | 'TEACHER'

/**
 * Route access configuration
 * Defines which routes each role can access
 */
const ROLE_ROUTE_ACCESS: Record<UserRole, string[]> = {
    OWNER: ['/owner', '/clerk', '/teacher'],    // Owner can access everything
    CLERK: ['/clerk'],                          // Clerk can only access clerk routes
    TEACHER: ['/teacher']                       // Teacher can only access teacher routes
}

/**
 * Default dashboard routes for each role
 */
const DEFAULT_ROUTES: Record<UserRole, string> = {
    OWNER: '/owner/dashboard',
    CLERK: '/clerk/dashboard',
    TEACHER: '/teacher/dashboard'
}

/**
 * Check if a role can access a specific route
 * @param role - User's role
 * @param pathname - Route pathname (e.g., '/owner/staff')
 * @returns true if access is allowed, false otherwise
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
    // Get allowed route prefixes for this role
    const allowedPrefixes = ROLE_ROUTE_ACCESS[role]

    if (!allowedPrefixes) {
        return false
    }

    // Check if the pathname starts with any allowed prefix
    return allowedPrefixes.some(prefix => pathname.startsWith(prefix))
}

/**
 * Get all allowed routes for a role
 * @param role - User's role
 * @returns Array of allowed route prefixes
 */
export function getAllowedRoutes(role: UserRole): string[] {
    return ROLE_ROUTE_ACCESS[role] || []
}

/**
 * Get the default dashboard route for a role
 * @param role - User's role
 * @returns Default route path
 */
export function getDefaultRoute(role: UserRole): string {
    return DEFAULT_ROUTES[role] || '/owner/dashboard'
}

/**
 * Check if a route is owner-only
 * @param pathname - Route pathname
 * @returns true if route is owner-only
 */
export function isOwnerRoute(pathname: string): boolean {
    return pathname.startsWith('/owner')
}

/**
 * Check if a route is accessible by clerk
 * @param pathname - Route pathname
 * @returns true if route is clerk-accessible
 */
export function isClerkRoute(pathname: string): boolean {
    return pathname.startsWith('/clerk')
}

/**
 * Check if a route is accessible by teacher
 * @param pathname - Route pathname
 * @returns true if route is teacher-accessible
 */
export function isTeacherRoute(pathname: string): boolean {
    return pathname.startsWith('/teacher')
}

/**
 * Get user-friendly error message for unauthorized access
 * @param role - User's role
 * @param attemptedPath - Path user tried to access
 * @returns Error message string
 */
export function getUnauthorizedMessage(role: UserRole, attemptedPath: string): string {
    if (isOwnerRoute(attemptedPath)) {
        return 'Access Denied: This page is only available for School Owners.'
    }

    if (isClerkRoute(attemptedPath)) {
        return 'Access Denied: This page is only available for Clerks and Owners.'
    }

    if (isTeacherRoute(attemptedPath)) {
        return 'Access Denied: This page is only available for Teachers and Owners.'
    }

    return 'Access Denied: You don\'t have permission to access this page.'
}
