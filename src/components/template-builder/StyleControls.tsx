import { HexColorPicker } from 'react-colorful';
import { useState } from 'react';

interface Section {
    id: string;
    type: 'header' | 'student_info' | 'fee_table' | 'footer';
    config: Record<string, any>;
}

interface StyleControlsProps {
    section: Section;
    onChange: (key: string, value: any) => void;
}

export function StyleControls({ section, onChange }: StyleControlsProps) {
    const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

    const renderHeaderControls = () => (
        <>
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.show_logo ?? true}
                        onChange={(e) => onChange('show_logo', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Show Logo</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.show_school_name ?? true}
                        onChange={(e) => onChange('show_school_name', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Show School Name</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.show_address ?? true}
                        onChange={(e) => onChange('show_address', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Show Address</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.show_contact ?? true}
                        onChange={(e) => onChange('show_contact', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Show Contact</span>
                </label>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Position
                </label>
                <select
                    value={section.config.logo_position || 'left'}
                    onChange={(e) => onChange('logo_position', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alignment
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={() => onChange('alignment', 'left')}
                        className={`flex-1 py-2 px-3 text-sm rounded ${section.config.alignment === 'left'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Left
                    </button>
                    <button
                        onClick={() => onChange('alignment', 'center')}
                        className={`flex-1 py-2 px-3 text-sm rounded ${section.config.alignment === 'center'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Center
                    </button>
                    <button
                        onClick={() => onChange('alignment', 'right')}
                        className={`flex-1 py-2 px-3 text-sm rounded ${section.config.alignment === 'right'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Right
                    </button>
                </div>
            </div>
        </>
    );

    const renderStudentInfoControls = () => (
        <>
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.show_photo ?? false}
                        onChange={(e) => onChange('show_photo', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Show Student Photo</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.show_class ?? true}
                        onChange={(e) => onChange('show_class', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Show Class</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.show_roll_number ?? true}
                        onChange={(e) => onChange('show_roll_number', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Show Roll Number</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.show_father_name ?? true}
                        onChange={(e) => onChange('show_father_name', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Show Father Name</span>
                </label>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Layout
                </label>
                <select
                    value={section.config.layout || 'grid'}
                    onChange={(e) => onChange('layout', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="grid">Grid</option>
                    <option value="table">Table</option>
                    <option value="list">List</option>
                </select>
            </div>
        </>
    );

    const renderFeeTableControls = () => (
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table Style
                </label>
                <select
                    value={section.config.table_style || 'bordered'}
                    onChange={(e) => onChange('table_style', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="simple">Simple</option>
                    <option value="bordered">Bordered</option>
                    <option value="striped">Striped</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.show_subtotal ?? true}
                        onChange={(e) => onChange('show_subtotal', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Show Subtotal</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.show_discount ?? true}
                        onChange={(e) => onChange('show_discount', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Show Discount</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.highlight_total ?? true}
                        onChange={(e) => onChange('highlight_total', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Highlight Total</span>
                </label>
            </div>
        </>
    );

    const renderFooterControls = () => (
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Footer Text
                </label>
                <textarea
                    value={section.config.footer_text || ''}
                    onChange={(e) => onChange('footer_text', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Enter footer message..."
                />
            </div>

            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.show_signature_line ?? true}
                        onChange={(e) => onChange('show_signature_line', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Show Signature Line</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={section.config.show_date ?? true}
                        onChange={(e) => onChange('show_date', e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span>Show Date</span>
                </label>
            </div>
        </>
    );

    const renderCommonControls = () => (
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Padding (px)
                </label>
                <input
                    type="range"
                    min="0"
                    max="40"
                    value={section.config.padding || 10}
                    onChange={(e) => onChange('padding', parseInt(e.target.value))}
                    className="w-full"
                />
                <div className="text-xs text-gray-500 text-right">
                    {section.config.padding || 10}px
                </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={section.config.border ?? false}
                    onChange={(e) => onChange('border', e.target.checked)}
                    className="rounded border-gray-300"
                />
                <span>Show Border</span>
            </label>

            {section.config.border && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Border Color
                    </label>
                    <div className="relative">
                        <button
                            onClick={() => setShowColorPicker(showColorPicker ? null : 'border')}
                            className="w-full h-10 rounded border border-gray-300 flex items-center justify-between px-3"
                            style={{
                                backgroundColor: section.config.border_color || '#e2e8f0',
                            }}
                        >
                            <span className="text-sm">{section.config.border_color || '#e2e8f0'}</span>
                        </button>
                        {showColorPicker === 'border' && (
                            <div className="absolute z-10 mt-2">
                                <div
                                    className="fixed inset-0"
                                    onClick={() => setShowColorPicker(null)}
                                />
                                <HexColorPicker
                                    color={section.config.border_color || '#e2e8f0'}
                                    onChange={(color) => onChange('border_color', color)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="space-y-4">
            <div className="pb-3 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900">
                    {section.type === 'header' && 'Header Settings'}
                    {section.type === 'student_info' && 'Student Info Settings'}
                    {section.type === 'fee_table' && 'Fee Table Settings'}
                    {section.type === 'footer' && 'Footer Settings'}
                </h4>
            </div>

            {section.type === 'header' && renderHeaderControls()}
            {section.type === 'student_info' && renderStudentInfoControls()}
            {section.type === 'fee_table' && renderFeeTableControls()}
            {section.type === 'footer' && renderFooterControls()}

            <div className="pt-3 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Common Settings</h4>
                {renderCommonControls()}
            </div>
        </div>
    );
}
