// Document entity type
export type DocumentEntityType = 'admission' | 'student' | 'report_card'

// Document interface
export interface Document {
    id: string
    name: string
    file_path: string
    file_type?: string
    file_size?: number
    entity_type: DocumentEntityType
    entity_id: string
    uploaded_by?: string
    created_at: string
}
