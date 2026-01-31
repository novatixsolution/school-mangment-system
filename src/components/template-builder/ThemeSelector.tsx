import { useState, useEffect } from 'react';
import { Palette, Plus, Trash2 } from 'lucide-react';
import { getThemes, createTheme, deleteTheme } from '@/lib/theme-service';
import { CustomThemeCreator } from './CustomThemeCreator';

export interface Theme {
    id: string;
    name: string;
    display_name: string;
    description: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
        border: string;
    };
    fonts?: {
        heading: string;
        body: string;
        monospace: string;
    };
    is_preset: boolean;
}

interface ThemeSelectorProps {
    currentTheme?: string;
    onThemeSelect: (theme: Theme) => void;
}

// 5 Built-in themes (fallback if database fails)
const BUILT_IN_THEMES: Theme[] = [
    {
        id: 'professional_blue',
        name: 'professional_blue',
        display_name: 'Professional Blue',
        description: 'Clean professional design with blue accents',
        colors: {
            primary: '#2563eb',
            secondary: '#64748b',
            accent: '#3b82f6',
            background: '#ffffff',
            text: '#000000',
            border: '#cbd5e1',
        },
        is_preset: true,
    },
    {
        id: 'nature_green',
        name: 'nature_green',
        display_name: 'Nature Green',
        description: 'Fresh and natural green theme',
        colors: {
            primary: '#16a34a',
            secondary: '#84cc16',
            accent: '#22c55e',
            background: '#ffffff',
            text: '#000000',
            border: '#d9f99d',
        },
        is_preset: true,
    },
    {
        id: 'royal_purple',
        name: 'royal_purple',
        display_name: 'Royal Purple',
        description: 'Elegant purple color scheme',
        colors: {
            primary: '#9333ea',
            secondary: '#a855f7',
            accent: '#c084fc',
            background: '#ffffff',
            text: '#000000',
            border: '#e9d5ff',
        },
        is_preset: true,
    },
    {
        id: 'warm_orange',
        name: 'warm_orange',
        display_name: 'Warm Orange',
        description: 'Vibrant and energetic orange theme',
        colors: {
            primary: '#ea580c',
            secondary: '#f59e0b',
            accent: '#fb923c',
            background: '#ffffff',
            text: '#000000',
            border: '#fed7aa',
        },
        is_preset: true,
    },
    {
        id: 'dark_mode',
        name: 'dark_mode',
        display_name: 'Dark Mode',
        description: 'Modern dark theme for reduced eye strain',
        colors: {
            primary: '#60a5fa',
            secondary: '#94a3b8',
            accent: '#38bdf8',
            background: '#0f172a',
            text: '#f1f5f9',
            border: '#334155',
        },
        is_preset: true,
    },
];

export function ThemeSelector({ currentTheme, onThemeSelect }: ThemeSelectorProps) {
    const [themes, setThemes] = useState<Theme[]>(BUILT_IN_THEMES);
    const [loading, setLoading] = useState(false);
    const [showCreator, setShowCreator] = useState(false);

    // Load themes from database
    useEffect(() => {
        loadThemes();
    }, []);

    const loadThemes = async () => {
        try {
            setLoading(true);
            const dbThemes = await getThemes();
            setThemes(dbThemes.length > 0 ? dbThemes : BUILT_IN_THEMES);
        } catch (error) {
            console.error('Failed to load themes, using built-in:', error);
            setThemes(BUILT_IN_THEMES);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTheme = async (themeData: any) => {
        try {
            const newTheme = await createTheme({
                ...themeData,
                is_preset: false,
            });
            setThemes([...themes, newTheme]);
            setShowCreator(false);
            onThemeSelect(newTheme);
            alert('Theme created successfully!');
        } catch (error) {
            console.error('Failed to create theme:', error);
            alert('Failed to create theme. Please try again.');
        }
    };

    const handleDeleteTheme = async (themeId: string) => {
        if (!confirm('Are you sure you want to delete this theme?')) return;

        try {
            await deleteTheme(themeId);
            setThemes(themes.filter((t) => t.id !== themeId));
            alert('Theme deleted successfully!');
        } catch (error) {
            console.error('Failed to delete theme:', error);
            alert('Failed to delete theme. Cannot delete preset themes.');
        }
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-gray-600" />
                        <h4 className="text-sm font-semibold text-gray-900">Themes</h4>
                    </div>
                    <button
                        onClick={() => setShowCreator(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        title="Create custom theme"
                    >
                        <Plus className="w-3 h-3" />
                        Custom
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-4 text-sm text-gray-500">Loading themes...</div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {themes.map((theme) => (
                            <ThemeCard
                                key={theme.id}
                                theme={theme}
                                isActive={currentTheme === theme.name}
                                onClick={() => onThemeSelect(theme)}
                                onDelete={!theme.is_preset ? () => handleDeleteTheme(theme.id) : undefined}
                            />
                        ))}
                    </div>
                )}

                <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Click any theme to apply instantly
                    </p>
                </div>
            </div>

            {/* Custom Theme Creator Modal */}
            {showCreator && (
                <CustomThemeCreator
                    onSave={handleCreateTheme}
                    onCancel={() => setShowCreator(false)}
                />
            )}
        </>
    );
}

interface ThemeCardProps {
    theme: Theme;
    isActive: boolean;
    onClick: () => void;
    onDelete?: () => void;
}

function ThemeCard({ theme, isActive, onClick, onDelete }: ThemeCardProps) {
    return (
        <button
            onClick={onClick}
            className={`
        w-full p-3 rounded-lg border-2 transition-all text-left relative group
        ${isActive
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
      `}
        >
            {/* Delete Button (for custom themes) */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-100 hover:bg-red-200 rounded"
                    title="Delete theme"
                >
                    <Trash2 className="w-3 h-3 text-red-600" />
                </button>
            )}

            {/* Theme Name */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">
                    {theme.display_name}
                    {!theme.is_preset && <span className="ml-1 text-xs text-blue-600">(Custom)</span>}
                </span>
                {isActive && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                        Active
                    </span>
                )}
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 mb-3">{theme.description}</p>

            {/* Color Palette */}
            <div className="flex gap-2">
                <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: theme.colors.primary }}
                    title="Primary"
                />
                <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: theme.colors.secondary }}
                    title="Secondary"
                />
                <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: theme.colors.accent }}
                    title="Accent"
                />
                <div
                    className="w-6 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: theme.colors.background }}
                    title="Background"
                />
                <div
                    className="w-6 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: theme.colors.text }}
                    title="Text"
                />
            </div>
        </button>
    );
}

export { BUILT_IN_THEMES };
