'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    children: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
}: ModalProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const handleClose = () => {
        setIsVisible(false)
        setTimeout(onClose, 200)
    }

    if (!isOpen && !isVisible) return null

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[90vw]',
    }

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center p-4',
                'transition-opacity duration-200',
                isOpen && isVisible ? 'opacity-100' : 'opacity-0'
            )}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    'relative w-full rounded-2xl bg-white shadow-2xl',
                    'transform transition-all duration-200',
                    isOpen && isVisible ? 'scale-100' : 'scale-95',
                    sizes[size]
                )}
            >
                {/* Header */}
                {(title || description) && (
                    <div className="flex items-start justify-between border-b border-slate-100 p-6">
                        <div>
                            {title && (
                                <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                            )}
                            {description && (
                                <p className="mt-1 text-sm text-slate-500">{description}</p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="h-8 w-8 -mr-2"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Body */}
                <div className="max-h-[85vh] overflow-y-auto p-6">{children}</div>
            </div>
        </div>
    )
}
