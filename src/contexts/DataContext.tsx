'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getCached, setCache, clearCache, CACHE_KEYS, CACHE_DURATION } from '@/lib/cache'

// Types
interface Class {
    id: string
    class_name: string
    medium: string
    status: string
}

interface Section {
    id: string
    class_id: string
    section_name: string
    capacity: number
    status: string
}

interface DataContextType {
    classes: Class[]
    sections: Section[]
    loading: boolean
    error: string | null
    refreshClasses: () => Promise<void>
    refreshSections: () => Promise<void>
    refreshAll: () => Promise<void>
    clearDataCache: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
    const [classes, setClasses] = useState<Class[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchClasses = useCallback(async (useCache = true) => {
        try {
            // Check cache first
            if (useCache) {
                const cached = getCached<Class[]>(CACHE_KEYS.CLASSES)
                if (cached) {
                    setClasses(cached)
                    return
                }
            }

            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('status', 'active')
                .order('class_name')

            if (error) throw error

            setClasses(data || [])
            setCache(CACHE_KEYS.CLASSES, data || [], CACHE_DURATION.MEDIUM)
        } catch (err: any) {
            console.error('Error fetching classes:', err)
            setError(err.message)
        }
    }, [])

    const fetchSections = useCallback(async (useCache = true) => {
        try {
            // Check cache first
            if (useCache) {
                const cached = getCached<Section[]>(CACHE_KEYS.SECTIONS)
                if (cached) {
                    setSections(cached)
                    return
                }
            }

            const { data, error } = await supabase
                .from('sections')
                .select('*')
                .eq('status', 'active')
                .order('section_name')

            if (error) throw error

            setSections(data || [])
            setCache(CACHE_KEYS.SECTIONS, data || [], CACHE_DURATION.MEDIUM)
        } catch (err: any) {
            console.error('Error fetching sections:', err)
            setError(err.message)
        }
    }, [])

    const refreshClasses = useCallback(async () => {
        clearCache(CACHE_KEYS.CLASSES)
        await fetchClasses(false)
    }, [fetchClasses])

    const refreshSections = useCallback(async () => {
        clearCache(CACHE_KEYS.SECTIONS)
        await fetchSections(false)
    }, [fetchSections])

    const refreshAll = useCallback(async () => {
        setLoading(true)
        clearCache(CACHE_KEYS.CLASSES)
        clearCache(CACHE_KEYS.SECTIONS)
        await Promise.all([fetchClasses(false), fetchSections(false)])
        setLoading(false)
    }, [fetchClasses, fetchSections])

    const clearDataCache = useCallback(() => {
        clearCache(CACHE_KEYS.CLASSES)
        clearCache(CACHE_KEYS.SECTIONS)
    }, [])

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            await Promise.all([fetchClasses(), fetchSections()])
            setLoading(false)
        }
        loadData()
    }, [fetchClasses, fetchSections])

    return (
        <DataContext.Provider value={{
            classes,
            sections,
            loading,
            error,
            refreshClasses,
            refreshSections,
            refreshAll,
            clearDataCache
        }}>
            {children}
        </DataContext.Provider>
    )
}

export function useData() {
    const context = useContext(DataContext)
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider')
    }
    return context
}
