import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

        const variants = {
            default: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl focus-visible:ring-indigo-500',
            destructive: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:from-red-600 hover:to-rose-700 hover:shadow-xl focus-visible:ring-red-500',
            outline: 'border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 focus-visible:ring-slate-500',
            secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-500',
            ghost: 'hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-500',
            link: 'text-indigo-600 underline-offset-4 hover:underline focus-visible:ring-indigo-500',
        }

        const sizes = {
            default: 'h-11 px-5 py-2',
            sm: 'h-9 rounded-md px-3',
            lg: 'h-12 rounded-lg px-8 text-base',
            icon: 'h-10 w-10',
        }

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = 'Button'

export { Button }
