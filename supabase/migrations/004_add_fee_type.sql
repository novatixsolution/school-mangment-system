-- Add fee_type column to fee_structures table
-- Run this in Supabase SQL Editor

ALTER TABLE fee_structures
ADD COLUMN IF NOT EXISTS fee_type TEXT DEFAULT 'tuition' 
CHECK (fee_type IN ('tuition', 'admission', 'exam', 'final_exam', 'science_lab', 'computer_lab', 'sports'));

COMMENT ON COLUMN fee_structures.fee_type IS 'Type of fee: tuition, admission, exam (mid-term), final_exam, science_lab, computer_lab, sports';
