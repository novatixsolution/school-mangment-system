import { useState } from 'react';
import { BookTemplate, Plus, X } from 'lucide-react';
import {
    SECTION_TEMPLATES,
    getSectionTemplatesByCategory,
    createSectionFromTemplate,
    type SectionTemplate,
} from '@/lib/section-templates';

interface SectionLibraryProps {
    onAddSection: (section: any) => void;
    onClose: () => void;
}

export function SectionLibrary({ onAddSection, onClose }: SectionLibraryProps) {
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'header' | 'content' | 'footer'>('all');

    const categories = [
        { value: 'all', label: 'All Templates', count: SECTION_TEMPLATES.length },
        { value: 'header', label: 'Headers', count: getSectionTemplatesByCategory('header').length },
        { value: 'content', label: 'Content', count: getSectionTemplatesByCategory('content').length },
        { value: 'footer', label: 'Footers', count: getSectionTemplatesByCategory('footer').length },
    ];

    const filteredTemplates =
        selectedCategory === 'all'
            ? SECTION_TEMPLATES
            : getSectionTemplatesByCategory(selectedCategory as any);

    const handleAddTemplate = (template: SectionTemplate) => {
        const newSection = createSectionFromTemplate(template, 999); // Order will be updated when added
        onAddSection(newSection);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <BookTemplate className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Section Templates Library</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Category Filter */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex gap-2 overflow-x-auto">
                        {categories.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setSelectedCategory(cat.value as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.label} ({cat.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates.map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onAdd={() => handleAddTemplate(template)}
                            />
                        ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <BookTemplate className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No templates found in this category</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface TemplateCardProps {
    template: SectionTemplate;
    onAdd: () => void;
}

function TemplateCard({ template, onAdd }: TemplateCardProps) {
    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all">
            {/* Preview placeholder */}
            <div className="bg-gray-100 rounded-lg h-32 mb-3 flex items-center justify-center border border-gray-200">
                <div className="text-center text-gray-400">
                    <BookTemplate className="w-8 h-8 mx-auto mb-1" />
                    <p className="text-xs">Preview</p>
                </div>
            </div>

            {/* Template Info */}
            <div className="mb-3">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{template.display_name}</h4>
                <p className="text-xs text-gray-600">{template.description}</p>
            </div>

            {/* Category Badge */}
            <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {template.category}
                </span>
                <button
                    onClick={onAdd}
                    className="flex items-center gap-1 px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add
                </button>
            </div>
        </div>
    );
}
