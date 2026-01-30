import { useState } from 'react'
import { Search, Filter, X, Calendar, Users, FileText, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export interface SearchFilters {
    studentId?: string
    challanNumber?: string
    status?: string
    classId?: string
    dateFrom?: string
    dateTo?: string
    searchText?: string
}

interface AdvancedSearchFiltersProps {
    filters: SearchFilters
    onFilterChange: (filters: SearchFilters) => void
    classes: Array<{ id: string; class_name: string }>
    onSearch: () => void
}

export function AdvancedSearchFilters({
    filters,
    onFilterChange,
    classes,
    onSearch
}: AdvancedSearchFiltersProps) {
    const [showAdvanced, setShowAdvanced] = useState(false)

    const handleFilterChange = (key: keyof SearchFilters, value: string) => {
        onFilterChange({
            ...filters,
            [key]: value || undefined
        })
    }

    const clearFilters = () => {
        onFilterChange({})
        onSearch()
    }

    const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '')

    const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length

    return (
        <div className="space-y-4">
            {/* Quick Search Bar */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search by student name, challan number, or student ID..."
                        value={filters.searchText || ''}
                        onChange={(e) => handleFilterChange('searchText', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                        className="pl-10"
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="relative"
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                        <Badge className="ml-2 bg-purple-600 text-white px-2 py-0.5 text-xs">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
                <Button onClick={onSearch} className="bg-purple-600 hover:bg-purple-700">
                    Search
                </Button>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvanced && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Advanced Filters
                        </h3>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-red-600 hover:text-red-700"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear All
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Student ID Search */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Users className="inline h-4 w-4 mr-1" />
                                Student ID
                            </label>
                            <Input
                                placeholder="STD-2026-0001"
                                value={filters.studentId || ''}
                                onChange={(e) => handleFilterChange('studentId', e.target.value)}
                            />
                        </div>

                        {/* Challan Number Search */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <FileText className="inline h-4 w-4 mr-1" />
                                Challan Number
                            </label>
                            <Input
                                placeholder="CHL-2026-0001"
                                value={filters.challanNumber || ''}
                                onChange={(e) => handleFilterChange('challanNumber', e.target.value)}
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <DollarSign className="inline h-4 w-4 mr-1" />
                                Status
                            </label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Class Filter */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Users className="inline h-4 w-4 mr-1" />
                                Class
                            </label>
                            <select
                                value={filters.classId || ''}
                                onChange={(e) => handleFilterChange('classId', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.class_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Calendar className="inline h-4 w-4 mr-1" />
                                Date From
                            </label>
                            <Input
                                type="date"
                                value={filters.dateFrom || ''}
                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Calendar className="inline h-4 w-4 mr-1" />
                                Date To
                            </label>
                            <Input
                                type="date"
                                value={filters.dateTo || ''}
                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {hasActiveFilters && (
                        <div className="pt-3 border-t border-slate-300">
                            <p className="text-sm font-medium text-slate-700 mb-2">Active Filters:</p>
                            <div className="flex flex-wrap gap-2">
                                {filters.studentId && (
                                    <Badge variant="default" className="bg-blue-600">
                                        Student ID: {filters.studentId}
                                        <button
                                            onClick={() => handleFilterChange('studentId', '')}
                                            className="ml-2 hover:text-red-200"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {filters.challanNumber && (
                                    <Badge variant="default" className="bg-purple-600">
                                        Challan: {filters.challanNumber}
                                        <button
                                            onClick={() => handleFilterChange('challanNumber', '')}
                                            className="ml-2 hover:text-red-200"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {filters.status && (
                                    <Badge variant="default" className="bg-green-600">
                                        Status: {filters.status}
                                        <button
                                            onClick={() => handleFilterChange('status', '')}
                                            className="ml-2 hover:text-red-200"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {filters.classId && (
                                    <Badge variant="default" className="bg-indigo-600">
                                        Class: {classes.find(c => c.id === filters.classId)?.class_name}
                                        <button
                                            onClick={() => handleFilterChange('classId', '')}
                                            className="ml-2 hover:text-red-200"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {filters.dateFrom && (
                                    <Badge variant="default" className="bg-orange-600">
                                        From: {new Date(filters.dateFrom).toLocaleDateString()}
                                        <button
                                            onClick={() => handleFilterChange('dateFrom', '')}
                                            className="ml-2 hover:text-red-200"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {filters.dateTo && (
                                    <Badge variant="default" className="bg-orange-600">
                                        To: {new Date(filters.dateTo).toLocaleDateString()}
                                        <button
                                            onClick={() => handleFilterChange('dateTo', '')}
                                            className="ml-2 hover:text-red-200"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {filters.searchText && (
                                    <Badge variant="default" className="bg-slate-600">
                                        Search: {filters.searchText}
                                        <button
                                            onClick={() => handleFilterChange('searchText', '')}
                                            className="ml-2 hover:text-red-200"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Apply Filters Button */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={onSearch}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Apply Filters
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
