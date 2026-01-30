// Simple Cache Utility with localStorage persistence
// Reduces API calls and improves performance

interface CacheItem<T> {
    data: T
    timestamp: number
    expiresIn: number // milliseconds
}

const CACHE_PREFIX = 'sms_cache_'

// Default cache duration: 5 minutes
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000

/**
 * Get cached data if valid
 */
export function getCached<T>(key: string): T | null {
    try {
        const cached = localStorage.getItem(CACHE_PREFIX + key)
        if (!cached) return null

        const item: CacheItem<T> = JSON.parse(cached)
        const now = Date.now()

        // Check if cache is still valid
        if (now - item.timestamp < item.expiresIn) {
            return item.data
        }

        // Cache expired, remove it
        localStorage.removeItem(CACHE_PREFIX + key)
        return null
    } catch {
        return null
    }
}

/**
 * Set data in cache
 */
export function setCache<T>(key: string, data: T, expiresIn: number = DEFAULT_CACHE_DURATION): void {
    try {
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            expiresIn
        }
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
    } catch (error) {
        console.warn('Cache write error:', error)
    }
}

/**
 * Clear specific cache key
 */
export function clearCache(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key)
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(key)
        }
    })
}

/**
 * Fetch with cache - returns cached data if valid, otherwise fetches fresh
 */
export async function fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    expiresIn: number = DEFAULT_CACHE_DURATION
): Promise<T> {
    // Check cache first
    const cached = getCached<T>(key)
    if (cached !== null) {
        return cached
    }

    // Fetch fresh data
    const data = await fetcher()

    // Cache the result
    setCache(key, data, expiresIn)

    return data
}

// Cache keys for common data
export const CACHE_KEYS = {
    CLASSES: 'classes',
    SECTIONS: 'sections',
    STUDENTS: 'students',
    SUBJECTS: 'subjects',
    STAFF: 'staff',
    FEE_STRUCTURES: 'fee_structures',
    EXAMS: 'exams',
    ADMISSIONS: 'admissions'
}

// Cache durations
export const CACHE_DURATION = {
    SHORT: 1 * 60 * 1000,      // 1 minute
    MEDIUM: 5 * 60 * 1000,     // 5 minutes
    LONG: 30 * 60 * 1000,      // 30 minutes
    VERY_LONG: 60 * 60 * 1000  // 1 hour
}
