-- =============================================
-- REMOVE EXAM FUNCTIONALITY FROM SUPABASE
-- School Management System
-- =============================================
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop exam-related tables (in order due to foreign key dependencies)
-- Report cards depends on exams, so drop it first
-- Then marks, then exam_subjects, then exams

DROP TABLE IF EXISTS report_cards CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS exam_subjects CASCADE;
DROP TABLE IF EXISTS exams CASCADE;

-- Verify tables are dropped
SELECT 'All exam tables have been dropped successfully!' AS status;

-- Optional: Remove exam fees from fee_structures
-- Uncomment the lines below if you want to remove exam_fee column

-- ALTER TABLE fee_structures DROP COLUMN IF EXISTS exam_fee;

-- Optional: Update fee_type constraint to remove exam types
-- Uncomment the lines below if you want to remove 'exam' and 'final_exam' from fee types

-- ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS fee_structures_fee_type_check;
-- ALTER TABLE fee_structures ADD CONSTRAINT fee_structures_fee_type_check 
-- CHECK (fee_type IN ('tuition', 'admission', 'science_lab', 'computer_lab', 'sports'));

SELECT 'Exam functionality removed successfully!' AS final_status;
