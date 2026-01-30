-- Add fee-related columns to admissions table
-- These columns are needed to store fee information during admission process

ALTER TABLE admissions
ADD COLUMN IF NOT EXISTS admission_fee DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS admission_fee_discount_type VARCHAR(20) CHECK (admission_fee_discount_type IN ('none', 'percentage', 'amount')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS admission_fee_discount_value DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_admission_fee DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_fee_structure_id UUID REFERENCES fee_structures(id);

-- Add comments
COMMENT ON COLUMN admissions.admission_fee IS 'Admission fee amount before discount';
COMMENT ON COLUMN admissions.admission_fee_discount_type IS 'Type of discount on admission fee (none/percentage/amount)';
COMMENT ON COLUMN admissions.admission_fee_discount_value IS 'Value of admission fee discount';
COMMENT ON COLUMN admissions.final_admission_fee IS 'Final admission fee after discount';
COMMENT ON COLUMN admissions.monthly_fee_structure_id IS 'Selected fee structure for monthly fees';
