'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    title: string
    message?: string
}

// Toast store
let toasts: Toast[] = []
let listeners: ((toasts: Toast[]) => void)[] = []

function notifyListeners() {
    listeners.forEach((listener) => listener([...toasts]))
}

export const toast = {
    success: (title: string, message?: string) => {
        const id = Date.now().toString()
        toasts = [...toasts, { id, type: 'success', title, message }]
        notifyListeners()
        setTimeout(() => toast.dismiss(id), 5000)
    },
    error: (title: string, message?: string) => {
        const id = Date.now().toString()
        toasts = [...toasts, { id, type: 'error', title, message }]
        notifyListeners()
        setTimeout(() => toast.dismiss(id), 5000)
    },
    warning: (title: string, message?: string) => {
        const id = Date.now().toString()
        toasts = [...toasts, { id, type: 'warning', title, message }]
        notifyListeners()
        setTimeout(() => toast.dismiss(id), 5000)
    },
    info: (title: string, message?: string) => {
        const id = Date.now().toString()
        toasts = [...toasts, { id, type: 'info', title, message }]
        notifyListeners()
        setTimeout(() => toast.dismiss(id), 5000)
    },
    dismiss: (id: string) => {
        toasts = toasts.filter((t) => t.id !== id)
        notifyListeners()
    },
}

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
}

const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const iconStyles = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
}

export function Toaster() {
    const [activeToasts, setActiveToasts] = useState<Toast[]>([])

    useEffect(() => {
        const listener = (newToasts: Toast[]) => setActiveToasts(newToasts)
        listeners.push(listener)
        return () => {
            listeners = listeners.filter((l) => l !== listener)
        }
    }, [])

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
            {activeToasts.map((t) => {
                const Icon = icons[t.type]
                return (
                    <div
                        key={t.id}
                        className={cn(
                            'flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-right',
                            styles[t.type]
                        )}
                    >
                        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconStyles[t.type])} />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium">{t.title}</p>
                            {t.message && (
                                <p className="mt-1 text-sm opacity-80">{t.message}</p>
                            )}
                        </div>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
