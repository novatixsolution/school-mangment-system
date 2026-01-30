-- Add custom_fee column to students table
-- This allows setting individual monthly fees per student

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS custom_fee DECIMAL;

COMMENT ON COLUMN students.custom_fee IS 'Custom monthly fee amount for individual student (overrides class default)';
