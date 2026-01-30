// Fee frequency
export type FeeFrequency = 'monthly' | 'quarterly' | 'annual' | 'one_time'

// Fee structure interface
export interface FeeStructure {
    id: string
    class_id?: string
    name: string
    amount: number
    frequency: FeeFrequency
    due_day: number
    created_at: string
    // Joined data
    class?: {
        id: string
        class_name: string
    }
}

// Invoice status
export type InvoiceStatus = 'pending' | 'partial' | 'paid'

// Fee invoice interface
export interface FeeInvoice {
    id: string
    student_id: string
    fee_structure_id?: string
    month: number
    year: number
    amount: number
    due_date: string
    status: InvoiceStatus
    created_at: string
    // Joined data
    student?: {
        id: string
        name: string
        roll_number?: string
        class?: {
            id: string
            class_name: string
        }
        section?: {
            id: string
            section_name: string
        }
    }
    fee_structure?: FeeStructure
    payments?: FeePayment[]
}

// Fee payment interface
export interface FeePayment {
    id: string
    invoice_id: string
    amount: number
    payment_date: string
    payment_method?: string
    received_by?: string
    notes?: string
    created_at: string
    // Joined data
    receiver?: {
        id: string
        name: string
    }
}
