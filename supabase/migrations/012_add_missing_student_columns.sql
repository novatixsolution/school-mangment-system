-- Add missing columns to students table
-- These columns are required by the admission form but are missing from initial schema

ALTER TABLE students
ADD COLUMN IF NOT EXISTS father_cnic TEXT,
ADD COLUMN IF NOT EXISTS use_custom_fees BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_tuition_fee DECIMAL,
ADD COLUMN IF NOT EXISTS custom_exam_fee DECIMAL;

-- Add comments
COMMENT ON COLUMN students.father_cnic IS 'Father CNIC number';
COMMENT ON COLUMN students.use_custom_fees IS 'Whether student uses custom fees instead of class fee structure';
COMMENT ON COLUMN students.custom_tuition_fee IS 'Custom tuition fee amount if use_custom_fees is true';
COMMENT ON COLUMN students.custom_exam_fee IS 'Custom exam fee amount if use_custom_fees is true';
