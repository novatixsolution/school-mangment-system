'use client'

import { forwardRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getDefaultAvatar, getValidityDate } from '@/lib/id-card-utils'

interface StudentIDCardProps {
    student: {
        id: string
        name: string
        rollNumber?: string
        admissionNumber?: string
        className?: string
        section?: string
        photoUrl?: string
        gender: 'male' | 'female'
        fatherName?: string
        fatherPhone?: string
        bloodGroup?: string
    }
    schoolInfo?: {
        name: string
        logo?: string
        address?: string
        phone?: string
    }
    theme?: 'blue' | 'green' | 'purple' | 'red'
}

const THEMES = {
    blue: {
        primary: 'bg-gradient-to-r from-blue-600 to-blue-800',
        accent: 'bg-blue-500',
        text: 'text-blue-900',
        border: 'border-blue-600'
    },
    green: {
        primary: 'bg-gradient-to-r from-green-600 to-green-800',
        accent: 'bg-green-500',
        text: 'text-green-900',
        border: 'border-green-600'
    },
    purple: {
        primary: 'bg-gradient-to-r from-purple-600 to-purple-800',
        accent: 'bg-purple-500',
        text: 'text-purple-900',
        border: 'border-purple-600'
    },
    red: {
        primary: 'bg-gradient-to-r from-red-600 to-red-800',
        accent: 'bg-red-500',
        text: 'text-red-900',
        border: 'border-red-600'
    }
}

export const StudentIDCard = forwardRef<HTMLDivElement, StudentIDCardProps>(
    ({ student, schoolInfo, theme = 'blue' }, ref) => {
        const colors = THEMES[theme]
        const validUntil = getValidityDate()
        const photoUrl = student.photoUrl || getDefaultAvatar(student.gender)

        return (
            <div ref={ref} className="inline-block">
                {/* Front Side */}
                <div className={`w-[324px] h-[204px] bg-white rounded-lg overflow-hidden shadow-lg border-2 ${colors.border} relative`}>
                    {/* Header */}
                    <div className={`${colors.primary} text-white p-2 flex items-center gap-2`}>
                        {schoolInfo?.logo && (
                            <img src={schoolInfo.logo} alt="School Logo" className="w-10 h-10 bg-white rounded-full p-1" />
                        )}
                        <div className="flex-1">
                            <h3 className="font-bold text-sm leading-tight">{schoolInfo?.name || 'School Name'}</h3>
                            <p className="text-xs opacity-90">Student ID Card</p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-3 flex gap-3">
                        {/* Photo */}
                        <div className="flex-shrink-0">
                            <div className="w-20 h-24 border-2 border-slate-300 rounded overflow-hidden bg-slate-100">
                                <img
                                    src={photoUrl}
                                    alt={student.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-1">
                            <div>
                                <p className="text-xs text-slate-600 uppercase font-semibold">Name</p>
                                <p className="text-sm font-bold text-slate-900 leading-tight">{student.name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {student.className && (
                                    <div>
                                        <p className="text-xs text-slate-600">Class</p>
                                        <p className="text-sm font-semibold">{student.className} {student.section && `- ${student.section}`}</p>
                                    </div>
                                )}
                                {student.rollNumber && (
                                    <div>
                                        <p className="text-xs text-slate-600">Roll No.</p>
                                        <p className="text-sm font-semibold">{student.rollNumber}</p>
                                    </div>
                                )}
                            </div>

                            {student.admissionNumber && (
                                <div>
                                    <p className="text-xs text-slate-600">Admission No.</p>
                                    <p className="text-sm font-semibold">{student.admissionNumber}</p>
                                </div>
                            )}

                            {student.bloodGroup && (
                                <div>
                                    <p className="text-xs text-slate-600">Blood Group</p>
                                    <p className="text-sm font-semibold text-red-600">{student.bloodGroup}</p>
                                </div>
                            )}
                        </div>

                        {/* QR Code */}
                        <div className="flex-shrink-0">
                            <div className="bg-white p-1 rounded border border-slate-300">
                                <QRCodeSVG
                                    value={JSON.stringify({
                                        id: student.id,
                                        admission: student.admissionNumber,
                                        type: 'STUDENT_ID'
                                    })}
                                    size={60}
                                    level="M"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={`absolute bottom-0 left-0 right-0 ${colors.accent} text-white px-3 py-1 flex justify-between text-xs`}>
                        <span>Valid Until: {validUntil}</span>
                        <span className="font-semibold">{student.gender === 'male' ? 'M' : 'F'}</span>
                    </div>
                </div>

                {/* Back Side */}
                <div className={`w-[324px] h-[204px] bg-white rounded-lg overflow-hidden shadow-lg border-2 ${colors.border} mt-2`}>
                    {/* Header */}
                    <div className={`${colors.primary} text-white p-2 text-center`}>
                        <h3 className="font-bold text-sm">Emergency Contact</h3>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-3">
                        {student.fatherName && (
                            <div>
                                <p className="text-xs text-slate-600">Parent/Guardian</p>
                                <p className="text-sm font-semibold">{student.fatherName}</p>
                            </div>
                        )}

                        {student.fatherPhone && (
                            <div>
                                <p className="text-xs text-slate-600">Contact Number</p>
                                <p className="text-lg font-bold text-red-600">{student.fatherPhone}</p>
                            </div>
                        )}

                        {schoolInfo?.phone && (
                            <div>
                                <p className="text-xs text-slate-600">School Contact</p>
                                <p className="text-sm font-semibold">{schoolInfo.phone}</p>
                            </div>
                        )}

                        {schoolInfo?.address && (
                            <div>
                                <p className="text-xs text-slate-600">Address</p>
                                <p className="text-xs text-slate-800">{schoolInfo.address}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`absolute bottom-0 left-0 right-0 ${colors.accent} text-white px-3 py-1.5 text-center text-xs`}>
                        <p>If found, please contact school or parent</p>
                    </div>
                </div>
            </div>
        )
    }
)

StudentIDCard.displayName = 'StudentIDCard'
