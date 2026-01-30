import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'

export interface StudentCardData {
    id: string
    name: string
    rollNumber?: string
    admissionNumber?: string
    class?: string
    section?: string
    photoUrl?: string
    fatherName?: string
    fatherPhone?: string
    validUntil?: string
    bloodGroup?: string
    emergencyContact?: string
}

/**
 * Generate QR code data URL for student
 */
export async function generateQRCode(studentId: string, additionalData?: any): Promise<string> {
    try {
        const data = JSON.stringify({
            studentId,
            type: 'STUDENT_ID',
            timestamp: new Date().toISOString(),
            ...additionalData
        })

        const qrCodeDataURL = await QRCode.toDataURL(data, {
            width: 200,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        })

        return qrCodeDataURL
    } catch (error) {
        console.error('Error generating QR code:', error)
        return ''
    }
}

/**
 * Generate barcode for admission number
 */
export function generateBarcode(admissionNumber: string): string {
    try {
        const canvas = document.createElement('canvas')
        JsBarcode(canvas, admissionNumber, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: false
        })
        return canvas.toDataURL()
    } catch (error) {
        console.error('Error generating barcode:', error)
        return ''
    }
}

/**
 * Get default avatar based on gender
 */
export function getDefaultAvatar(gender: 'male' | 'female'): string {
    if (gender === 'female') {
        return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#ec4899"/>
        <text x="100" y="120" font-size="100" text-anchor="middle" fill="white" font-family="Arial">👧</text>
      </svg>
    `)}`
    }

    return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#3b82f6"/>
      <text x="100" y="120" font-size="100" text-anchor="middle" fill="white" font-family="Arial">👦</text>
    </svg>
  `)}`
}

/**
 * Format validity date (1 year from now)
 */
export function getValidityDate(): string {
    const date = new Date()
    date.setFullYear(date.getFullYear() + 1)
    return date.toLocaleDateString('en-GB')
}

/**
 * ID Card dimensions (CR80 standard)
 */
export const ID_CARD_DIMENSIONS = {
    width: 85.6, // mm
    height: 53.98, // mm
    widthPx: 324, // pixels at 96 DPI
    heightPx: 204 // pixels at 96 DPI
}

/**
 * ID Card color schemes
 */
export const ID_CARD_THEMES = {
    blue: {
        primary: '#3b82f6',
        secondary: '#1e40af',
        accent: '#60a5fa',
        text: '#1e293b'
    },
    green: {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#34d399',
        text: '#1e293b'
    },
    purple: {
        primary: '#8b5cf6',
        secondary: '#6d28d9',
        accent: '#a78bfa',
        text: '#1e293b'
    },
    red: {
        primary: '#ef4444',
        secondary: '#dc2626',
        accent: '#f87171',
        text: '#1e293b'
    }
}
