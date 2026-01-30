-- =========================================
-- Migration: Add Student-Level Fee Columns
-- Purpose: Store original fees from fee_structure at student level
-- =========================================

-- Step 1: Add fee columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS original_tuition_fee NUMERIC DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS original_admission_fee NUMERIC DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS original_exam_fee NUMERIC DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS original_other_fee NUMERIC DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN students.original_tuition_fee IS 'Original monthly tuition fee from fee_structure (before custom override)';
COMMENT ON COLUMN students.original_admission_fee IS 'Original admission fee from fee_structure';
COMMENT ON COLUMN students.original_exam_fee IS 'Original exam fee from fee_structure';
COMMENT ON COLUMN students.original_other_fee IS 'Original other fees from fee_structure';

-- Step 2: Create function to auto-populate fees from fee_structure
CREATE OR REPLACE FUNCTION auto_set_student_fees()
RETURNS TRIGGER AS $$
DECLARE
    class_tuition NUMERIC;
    all_admission NUMERIC;
    all_mid_exam NUMERIC;
    all_final_exam NUMERIC;
    all_sports NUMERIC;
    all_science NUMERIC;
    all_comp NUMERIC;
    total_exam NUMERIC;
    total_other NUMERIC;
BEGIN
    -- Initialize variables
    class_tuition := 0;
    all_admission := 0;
    total_exam := 0;
    total_other := 0;

    -- Get class-specific tuition fee
    -- Look for fee with name like "Class X Tuition"
    SELECT COALESCE(amount, 0) INTO class_tuition
    FROM fee_structures
    WHERE class_id = NEW.class_id
    AND LOWER(name) LIKE '%tuition%'
    LIMIT 1;

    -- Get "All Class" fees
    -- Admission fee
    SELECT COALESCE(amount, 0) INTO all_admission
    FROM fee_structures
    WHERE LOWER(name) LIKE '%admission%'
    LIMIT 1;

    -- Mid exam fee
    SELECT COALESCE(amount, 0) INTO all_mid_exam
    FROM fee_structures
    WHERE LOWER(name) LIKE '%mid%'
    LIMIT 1;

    -- Final exam fee
    SELECT COALESCE(amount, 0) INTO all_final_exam
    FROM fee_structures
    WHERE LOWER(name) LIKE '%final%'
    LIMIT 1;

    -- Sports fee
    SELECT COALESCE(amount, 0) INTO all_sports
    FROM fee_structures
    WHERE LOWER(name) LIKE '%sport%'
    LIMIT 1;

    -- Science lab fee
    SELECT COALESCE(amount, 0) INTO all_science
    FROM fee_structures
    WHERE LOWER(name) LIKE '%science%'
    LIMIT 1;

    -- Computer lab fee
    SELECT COALESCE(amount, 0) INTO all_comp
    FROM fee_structures
    WHERE LOWER(name) LIKE '%comp%'
    LIMIT 1;

    -- Calculate total exam fee (mid + final)
    total_exam := all_mid_exam + all_final_exam;

    -- Calculate total other fees (sports + labs)
    total_other := all_sports + all_science + all_comp;

    -- Set the student's original fees
    NEW.original_tuition_fee := class_tuition;
    NEW.original_admission_fee := all_admission;
    NEW.original_exam_fee := total_exam;
    NEW.original_other_fee := total_other;

    -- Log for debugging
    RAISE NOTICE 'Auto-set fees for student %: tuition=%, admission=%, exam=%, other=%', 
        NEW.name, class_tuition, all_admission, total_exam, total_other;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to run on INSERT
DROP TRIGGER IF EXISTS set_student_fees_on_insert ON students;
CREATE TRIGGER set_student_fees_on_insert
    BEFORE INSERT ON students
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_student_fees();

-- Step 4: Backfill existing students with fees from fee_structures
DO $$
DECLARE
    student_record RECORD;
    class_tuition NUMERIC;
    all_admission NUMERIC;
    all_mid_exam NUMERIC;
    all_final_exam NUMERIC;
    all_sports NUMERIC;
    all_science NUMERIC;
    all_comp NUMERIC;
    total_exam NUMERIC;
    total_other NUMERIC;
    updated_count INTEGER := 0;
BEGIN
    -- Get "All Class" fees once (they're the same for everyone)
    SELECT COALESCE(amount, 0) INTO all_admission
    FROM fee_structures
    WHERE LOWER(name) LIKE '%admission%'
    LIMIT 1;

    SELECT COALESCE(amount, 0) INTO all_mid_exam
    FROM fee_structures
    WHERE LOWER(name) LIKE '%mid%'
    LIMIT 1;

    SELECT COALESCE(amount, 0) INTO all_final_exam
    FROM fee_structures
    WHERE LOWER(name) LIKE '%final%'
    LIMIT 1;

    SELECT COALESCE(amount, 0) INTO all_sports
    FROM fee_structures
    WHERE LOWER(name) LIKE '%sport%'
    LIMIT 1;

    SELECT COALESCE(amount, 0) INTO all_science
    FROM fee_structures
    WHERE LOWER(name) LIKE '%science%'
    LIMIT 1;

    SELECT COALESCE(amount, 0) INTO all_comp
    FROM fee_structures
    WHERE LOWER(name) LIKE '%comp%'
    LIMIT 1;

    total_exam := all_mid_exam + all_final_exam;
    total_other := all_sports + all_science + all_comp;

    -- Loop through each student
    FOR student_record IN 
        SELECT id, name, class_id 
        FROM students
        WHERE original_tuition_fee = 0 OR original_tuition_fee IS NULL
    LOOP
        -- Get class-specific tuition fee for this student
        SELECT COALESCE(amount, 0) INTO class_tuition
        FROM fee_structures
        WHERE class_id = student_record.class_id
        AND LOWER(name) LIKE '%tuition%'
        LIMIT 1;

        -- Update this student
        UPDATE students
        SET 
            original_tuition_fee = class_tuition,
            original_admission_fee = all_admission,
            original_exam_fee = total_exam,
            original_other_fee = total_other
        WHERE id = student_record.id;

        updated_count := updated_count + 1;

        RAISE NOTICE 'Updated student %: tuition=%, admission=%, exam=%, other=%',
            student_record.name, class_tuition, all_admission, total_exam, total_other;
    END LOOP;

    RAISE NOTICE 'Backfill complete: Updated % students', updated_count;
END $$;

-- Step 5: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_original_tuition_fee ON students(original_tuition_fee);
CREATE INDEX IF NOT EXISTS idx_students_fees_combined ON students(original_tuition_fee, use_custom_fees);

-- Step 6: Verification query (optional - for testing)
-- Uncomment to run verification after migration
/*
SELECT 
    COUNT(*) as total_students,
    COUNT(CASE WHEN original_tuition_fee > 0 THEN 1 END) as with_tuition_fee,
    COUNT(CASE WHEN original_tuition_fee = 0 THEN 1 END) as without_tuition_fee,
    AVG(original_tuition_fee) as avg_tuition,
    AVG(original_admission_fee) as avg_admission,
    AVG(original_exam_fee) as avg_exam,
    AVG(original_other_fee) as avg_other
FROM students;
*/

-- Migration complete!
-- Students will now have original fees populated from fee_structures
-- New students will automatically get fees from their class fee_structure
