import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface Section {
    id: string;
    type: 'header' | 'student_info' | 'fee_table' | 'footer';
    order: number;
    visible: boolean;
    config: Record<string, any>;
}

interface SectionItemProps {
    section: Section;
    isSelected: boolean;
    onSelect: () => void;
    onToggle: () => void;
}

export function SectionItem({
    section,
    isSelected,
    onSelect,
    onToggle,
}: SectionItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getSectionIcon = (type: string) => {
        const icons: Record<string, string> = {
            header: '📄',
            student_info: '👤',
            fee_table: '💰',
            footer: '📝',
        };
        return icons[type] || '📋';
    };

    const getSectionName = (type: string) => {
        const names: Record<string, string> = {
            header: 'Header',
            student_info: 'Student Information',
            fee_table: 'Fee Breakdown',
            footer: 'Footer',
        };
        return names[type] || type;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        flex items-center gap-3 p-3 rounded-lg border transition-all
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
        ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }
        ${!section.visible ? 'opacity-60' : ''}
      `}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
            >
                <GripVertical className="w-4 h-4" />
            </button>

            {/* Section Info */}
            <div
                className="flex-1 flex items-center gap-2 cursor-pointer"
                onClick={onSelect}
            >
                <span className="text-lg">{getSectionIcon(section.type)}</span>
                <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                        {getSectionName(section.type)}
                    </div>
                    <div className="text-xs text-gray-500">
                        Order: {section.order}
                    </div>
                </div>
            </div>

            {/* Visibility Toggle */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title={section.visible ? 'Hide section' : 'Show section'}
            >
                {section.visible ? (
                    <Eye className="w-4 h-4 text-gray-600" />
                ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                )}
            </button>
        </div>
    );
}
