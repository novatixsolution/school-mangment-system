import React from 'react';
import { getSectionStyle } from '../TemplateBase';

interface StudentInfoSectionProps {
    config: Record<string, any>;
    studentData?: {
        name: string;
        class_name: string;
        roll_number?: string;
        father_name?: string;
        photo_url?: string;
    };
}

export function StudentInfoSection({ config, studentData }: StudentInfoSectionProps) {
    const sectionStyle = getSectionStyle(config);

    // Sample student data
    const student = studentData || {
        name: 'Ahmed Ali Khan',
        class_name: 'Class 5-A',
        roll_number: '15',
        father_name: 'Ali Khan',
    };

    const renderGridLayout = () => (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
                <span className="text-gray-600 text-sm">Student Name:</span>
                <span className="ml-2 font-medium">{student.name}</span>
            </div>

            {config.show_class && (
                <div>
                    <span className="text-gray-600 text-sm">Class:</span>
                    <span className="ml-2 font-medium">{student.class_name}</span>
                </div>
            )}

            {config.show_roll_number && (
                <div>
                    <span className="text-gray-600 text-sm">Roll Number:</span>
                    <span className="ml-2 font-medium">{student.roll_number}</span>
                </div>
            )}

            {config.show_father_name && (
                <div>
                    <span className="text-gray-600 text-sm">Father Name:</span>
                    <span className="ml-2 font-medium">{student.father_name}</span>
                </div>
            )}
        </div>
    );

    const renderTableLayout = () => (
        <table className="w-full border-collapse">
            <tbody>
                <tr className="border-b">
                    <td className="py-1.5 px-2 text-sm text-gray-600 font-medium w-1/3">
                        Student Name
                    </td>
                    <td className="py-1.5 px-2">{student.name}</td>
                </tr>

                {config.show_class && (
                    <tr className="border-b">
                        <td className="py-1.5 px-2 text-sm text-gray-600 font-medium">Class</td>
                        <td className="py-1.5 px-2">{student.class_name}</td>
                    </tr>
                )}

                {config.show_roll_number && (
                    <tr className="border-b">
                        <td className="py-1.5 px-2 text-sm text-gray-600 font-medium">Roll Number</td>
                        <td className="py-1.5 px-2">{student.roll_number}</td>
                    </tr>
                )}

                {config.show_father_name && (
                    <tr>
                        <td className="py-1.5 px-2 text-sm text-gray-600 font-medium">Father Name</td>
                        <td className="py-1.5 px-2">{student.father_name}</td>
                    </tr>
                )}
            </tbody>
        </table>
    );

    const renderListLayout = () => (
        <div className="space-y-1.5">
            <div>
                <span className="text-gray-600 text-sm font-medium">Student Name: </span>
                <span>{student.name}</span>
            </div>

            {config.show_class && (
                <div>
                    <span className="text-gray-600 text-sm font-medium">Class: </span>
                    <span>{student.class_name}</span>
                </div>
            )}

            {config.show_roll_number && (
                <div>
                    <span className="text-gray-600 text-sm font-medium">Roll Number: </span>
                    <span>{student.roll_number}</span>
                </div>
            )}

            {config.show_father_name && (
                <div>
                    <span className="text-gray-600 text-sm font-medium">Father Name: </span>
                    <span>{student.father_name}</span>
                </div>
            )}
        </div>
    );

    return (
        <div style={sectionStyle} className="student-info-section">
            <h3
                className="text-base font-semibold mb-3"
                style={{ color: 'var(--primary-color)' }}
            >
                Student Information
            </h3>

            <div className="flex gap-4">
                {/* Student Photo */}
                {config.show_photo && (
                    <div className="flex-shrink-0">
                        {student.photo_url ? (
                            <img
                                src={student.photo_url}
                                alt="Student"
                                className="w-20 h-24 object-cover rounded border-2"
                                style={{ borderColor: 'var(--primary-color)' }}
                            />
                        ) : (
                            <div
                                className="w-20 h-24 bg-gray-100 rounded border-2 flex items-center justify-center"
                                style={{ borderColor: 'var(--primary-color)' }}
                            >
                                <span className="text-3xl">👤</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Student Details */}
                <div className="flex-1">
                    {config.layout === 'table' && renderTableLayout()}
                    {config.layout === 'list' && renderListLayout()}
                    {(!config.layout || config.layout === 'grid') && renderGridLayout()}
                </div>
            </div>
        </div>
    );
}
