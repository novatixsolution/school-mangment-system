-- Migration: Add custom fees and first challan support
-- Created: 2026-01-28
-- Purpose: Support custom student fees and mark first admission challans

-- Add custom fee columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS custom_tuition_fee DECIMAL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_exam_fee DECIMAL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS use_custom_fees BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN students.custom_tuition_fee IS 'Custom monthly tuition fee for this student (overrides fee structure)';
COMMENT ON COLUMN students.custom_exam_fee IS 'Custom exam fee for this student (overrides fee structure)';
COMMENT ON COLUMN students.use_custom_fees IS 'If true, use custom fees instead of class fee structure';

-- Add first challan flag to fee_challans table
ALTER TABLE fee_challans
ADD COLUMN IF NOT EXISTS is_first_challan BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS challan_type TEXT DEFAULT 'regular';

-- Add comment for clarity
COMMENT ON COLUMN fee_challans.is_first_challan IS 'True if this is the first challan generated for student admission';
COMMENT ON COLUMN fee_challans.challan_type IS 'Type of challan: first_admission, regular, late_fee, etc.';

-- Create index for faster queries on first challans
CREATE INDEX IF NOT EXISTS idx_fee_challans_first_challan ON fee_challans(is_first_challan) WHERE is_first_challan = true;
CREATE INDEX IF NOT EXISTS idx_fee_challans_type ON fee_challans(challan_type);

-- Add check constraint for challan_type
ALTER TABLE fee_challans DROP CONSTRAINT IF EXISTS check_challan_type;
ALTER TABLE fee_challans ADD CONSTRAINT check_challan_type 
CHECK (challan_type IN ('first_admission', 'regular', 'late_fee', 'make_up'));
