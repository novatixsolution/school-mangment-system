-- Migration: Add Fee Discount Fields
-- Adds discount tracking for admission fees

-- Add discount fields to admissions table
ALTER TABLE admissions 
ADD COLUMN IF NOT EXISTS admission_fee_discount_type VARCHAR(20) CHECK (admission_fee_discount_type IN ('none', 'percentage', 'amount')),
ADD COLUMN IF NOT EXISTS admission_fee_discount_value DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_admission_fee DECIMAL DEFAULT 0;

-- Add monthly fee structure reference
ALTER TABLE admissions
ADD COLUMN IF NOT EXISTS monthly_fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE SET NULL;

-- Add discount fields to students table  
ALTER TABLE students
ADD COLUMN IF NOT EXISTS admission_fee_discount_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS admission_fee_discount_value DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE SET NULL;

-- Create index for faster fee queries
CREATE INDEX IF NOT EXISTS idx_admissions_monthly_fee ON admissions(monthly_fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_students_monthly_fee ON students(monthly_fee_structure_id);
