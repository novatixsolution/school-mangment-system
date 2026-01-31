import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { X, Plus } from 'lucide-react';

interface CustomThemeCreatorProps {
    onSave: (theme: {
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
    }) => void;
    onCancel: () => void;
}

export function CustomThemeCreator({ onSave, onCancel }: CustomThemeCreatorProps) {
    const [themeName, setThemeName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [description, setDescription] = useState('');
    const [colors, setColors] = useState({
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#3b82f6',
        background: '#ffffff',
        text: '#000000',
        border: '#e2e8f0',
    });
    const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

    const handleSave = () => {
        if (!themeName || !displayName) {
            alert('Please fill in theme name and display name');
            return;
        }

        const name = themeName.toLowerCase().replace(/\s+/g, '_');

        onSave({
            name,
            display_name: displayName,
            description,
            colors,
        });
    };

    const ColorPicker = ({ label, colorKey }: { label: string; colorKey: keyof typeof colors }) => (
        <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
                <button
                    onClick={() => setActiveColorPicker(activeColorPicker === colorKey ? null : colorKey)}
                    className="w-full h-10 rounded border border-gray-300 flex items-center justify-between px-3 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: colors[colorKey] }}
                >
                    <span className="text-sm font-mono">{colors[colorKey]}</span>
                </button>
                {activeColorPicker === colorKey && (
                    <div className="absolute z-10 mt-2">
                        <div className="fixed inset-0" onClick={() => setActiveColorPicker(null)} />
                        <div className="relative">
                            <HexColorPicker
                                color={colors[colorKey]}
                                onChange={(color) => setColors({ ...colors, [colorKey]: color })}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Create Custom Theme</h3>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-4 space-y-4">
                    {/* Theme Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Theme Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={themeName}
                            onChange={(e) => setThemeName(e.target.value)}
                            placeholder="my_custom_theme"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Lowercase, no spaces (use underscores)</p>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Display Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="My Custom Theme"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your theme..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Color Pickers */}
                    <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Color Palette</h4>
                        <ColorPicker label="Primary Color" colorKey="primary" />
                        <ColorPicker label="Secondary Color" colorKey="secondary" />
                        <ColorPicker label="Accent Color" colorKey="accent" />
                        <ColorPicker label="Background Color" colorKey="background" />
                        <ColorPicker label="Text Color" colorKey="text" />
                        <ColorPicker label="Border Color" colorKey="border" />
                    </div>

                    {/* Preview */}
                    <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Preview</h4>
                        <div
                            className="p-4 rounded-lg border-2"
                            style={{
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text,
                            }}
                        >
                            <div
                                className="text-lg font-bold mb-2"
                                style={{ color: colors.primary }}
                            >
                                {displayName || 'Theme Preview'}
                            </div>
                            <div className="flex gap-2 mb-2">
                                <div
                                    className="w-8 h-8 rounded"
                                    style={{ backgroundColor: colors.primary }}
                                    title="Primary"
                                />
                                <div
                                    className="w-8 h-8 rounded"
                                    style={{ backgroundColor: colors.secondary }}
                                    title="Secondary"
                                />
                                <div
                                    className="w-8 h-8 rounded"
                                    style={{ backgroundColor: colors.accent }}
                                    title="Accent"
                                />
                            </div>
                            <p className="text-sm">{description || 'Sample text with your theme colors'}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Theme
                    </button>
                </div>
            </div>
        </div>
    );
}
