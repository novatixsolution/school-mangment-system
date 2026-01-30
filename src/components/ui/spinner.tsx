import { cn } from '@/lib/utils'

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
    const sizes = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-3',
        lg: 'h-12 w-12 border-4',
    }

    return (
        <div
            className={cn(
                'animate-spin rounded-full border-indigo-200 border-t-indigo-600',
                sizes[size],
                className
            )}
        />
    )
}

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-sm text-slate-500">Loading...</p>
            </div>
        </div>
    )
}
