export const AVAILABLE_FONTS = [
    { value: 'Inter', label: 'Inter (Default)', category: 'Sans-serif' },
    { value: 'Arial', label: 'Arial', category: 'Sans-serif' },
    { value: 'Helvetica', label: 'Helvetica', category: 'Sans-serif' },
    { value: 'Roboto', label: 'Roboto', category: 'Sans-serif' },
    { value: 'Open Sans', label: 'Open Sans', category: 'Sans-serif' },
    { value: 'Lato', label: 'Lato', category: 'Sans-serif' },
    { value: 'Montserrat', label: 'Montserrat', category: 'Sans-serif' },
    { value: 'Poppins', label: 'Poppins', category: 'Sans-serif' },
    { value: 'Georgia', label: 'Georgia', category: 'Serif' },
    { value: 'Times New Roman', label: 'Times New Roman', category: 'Serif' },
    { value: 'Merriweather', label: 'Merriweather', category: 'Serif' },
    { value: 'Playfair Display', label: 'Playfair Display', category: 'Serif' },
    { value: 'Courier New', label: 'Courier New', category: 'Monospace' },
    { value: 'Consolas', label: 'Consolas', category: 'Monospace' },
    { value: 'Monaco', label: 'Monaco', category: 'Monospace' },
];

interface FontSelectorProps {
    value: string;
    onChange: (font: string) => void;
    label?: string;
}

export function FontSelector({ value, onChange, label = 'Font Family' }: FontSelectorProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontFamily: value }}
            >
                {AVAILABLE_FONTS.map((font) => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.label}
                    </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
                Preview: <span style={{ fontFamily: value }}>The quick brown fox jumps</span>
            </p>
        </div>
    );
}
