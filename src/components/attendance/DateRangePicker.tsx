'use client'

import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DateRangePickerProps {
    startDate: string
    endDate: string
    onRangeChange: (startDate: string, endDate: string) => void
    mode?: 'single' | 'range'
    onModeChange?: (mode: 'single' | 'range') => void
}

export function DateRangePicker({
    startDate,
    endDate,
    onRangeChange,
    mode = 'single',
    onModeChange
}: DateRangePickerProps) {
    const today = new Date().toISOString().split('T')[0]

    const handlePreset = (preset: string) => {
        const end = today
        let start = today
        const date = new Date()

        switch (preset) {
            case 'today':
                start = today
                break
            case 'yesterday':
                date.setDate(date.getDate() - 1)
                start = date.toISOString().split('T')[0]
                break
            case 'last7':
                date.setDate(date.getDate() - 7)
                start = date.toISOString().split('T')[0]
                break
            case 'last30':
                date.setDate(date.getDate() - 30)
                start = date.toISOString().split('T')[0]
                break
            case 'last90':
                date.setDate(date.getDate() - 90)
                start = date.toISOString().split('T')[0]
                break
            case 'thisMonth':
                date.setDate(1)
                start = date.toISOString().split('T')[0]
                break
        }

        onRangeChange(start, end)
        if (onModeChange && preset !== 'today') {
            onModeChange('range')
        }
    }

    const getDayCount = () => {
        if (mode === 'single') return 0
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays + 1
    }

    return (
        <div className="space-y-4">
            {/* Mode Toggle */}
            {onModeChange && (
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => {
                            onModeChange('single')
                            onRangeChange(today, today)
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'single'
                                ? 'bg-white shadow-sm text-indigo-600'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Calendar className="h-4 w-4 inline mr-2" />
                        Single Date
                    </button>
                    <button
                        onClick={() => onModeChange('range')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'range'
                                ? 'bg-white shadow-sm text-indigo-600'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Calendar className="h-4 w-4 inline mr-2" />
                        Date Range
                    </button>
                </div>
            )}

            {/* Date Inputs */}
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        {mode === 'single' ? 'Date' : 'From Date'}
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                            const newStart = e.target.value
                            if (mode === 'single') {
                                onRangeChange(newStart, newStart)
                            } else {
                                onRangeChange(newStart, endDate)
                            }
                        }}
                        max={today}
                        className="w-full h-10 px-3 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm"
                    />
                </div>

                {mode === 'range' && (
                    <>
                        <div className="text-slate-400 mt-6">→</div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => onRangeChange(startDate, e.target.value)}
                                min={startDate}
                                max={today}
                                className="w-full h-10 px-3 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Range Info */}
            {mode === 'range' && getDayCount() > 0 && (
                <div className="text-xs text-slate-600 bg-blue-50 px-3 py-2 rounded-lg">
                    📅 Selected range: <span className="font-semibold">{getDayCount()} days</span>
                    {getDayCount() > 90 && (
                        <span className="text-orange-600 ml-2">
                            ⚠️ Large range may take longer to export
                        </span>
                    )}
                </div>
            )}

            {/* Quick Presets */}
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Quick Select:</label>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreset('today')}
                        className="text-xs"
                    >
                        Today
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreset('yesterday')}
                        className="text-xs"
                    >
                        Yesterday
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreset('last7')}
                        className="text-xs"
                    >
                        Last 7 Days
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreset('last30')}
                        className="text-xs"
                    >
                        Last 30 Days
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreset('last90')}
                        className="text-xs"
                    >
                        Last 90 Days
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreset('thisMonth')}
                        className="text-xs"
                    >
                        This Month
                    </Button>
                </div>
            </div>
        </div>
    )
}
