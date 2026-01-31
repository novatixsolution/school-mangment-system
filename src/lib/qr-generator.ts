/**
 * Generate dynamic QR code data for challan
 */

export interface ChallanQRData {
    challan_id: string;
    student_id: string;
    amount: number;
    month: string;
}

/**
 * Generate QR code text for challan verification
 */
export function generateChallanQRData(challan: {
    id: string;
    student_id: string;
    total_amount: number;
    month: string;
}): string {
    // Option 1: Verification URL (recommended)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/verify/${challan.id}`;
}

/**
 * Generate QR code with embedded data (alternative)
 */
export function generateChallanQRDataEmbedded(challan: {
    id: string;
    student_id: string;
    total_amount: number;
    month: string;
    challan_number?: string;
}): string {
    const data: ChallanQRData = {
        challan_id: challan.id,
        student_id: challan.student_id,
        amount: challan.total_amount,
        month: challan.month,
    };

    return JSON.stringify(data);
}

/**
 * Parse QR code data
 */
export function parseChallanQRData(qrText: string): ChallanQRData | null {
    try {
        return JSON.parse(qrText);
    } catch {
        return null;
    }
}
