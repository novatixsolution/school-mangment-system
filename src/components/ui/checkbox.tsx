'use client'

import { cn } from '@/lib/utils'

interface CheckboxProps {
    id?: string
    checked?: boolean
    onChange?: (checked: boolean) => void
    label?: string
    disabled?: boolean
    className?: string
}

export function Checkbox({
    id,
    checked = false,
    onChange,
    label,
    disabled = false,
    className,
}: CheckboxProps) {
    return (
        <label
            className={cn(
                'flex items-center gap-3 cursor-pointer select-none',
                disabled && 'cursor-not-allowed opacity-50',
                className
            )}
        >
            <div className="relative">
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={(e) => onChange?.(e.target.checked)}
                    disabled={disabled}
                    className="peer sr-only"
                />
                <div
                    className={cn(
                        'h-5 w-5 rounded-md border-2 transition-all duration-200',
                        'border-slate-300 bg-white',
                        'peer-checked:border-indigo-600 peer-checked:bg-indigo-600',
                        'peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-500/20',
                        'peer-disabled:bg-slate-100'
                    )}
                >
                    <svg
                        className={cn(
                            'h-full w-full text-white transform scale-0 transition-transform duration-200',
                            'peer-checked:scale-100'
                        )}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            </div>
            {label && <span className="text-sm text-slate-700">{label}</span>}
        </label>
    )
}
