-- Migration: Populate Original Fees for All Students
-- Purpose: Fill original_tuition_fee, original_admission_fee, original_exam_fee, original_other_fee
--          from fee_structures table based on student's class
-- Date: 2026-01-30

-- ============================================================================
-- STEP 1: Populate Original Fees from Fee Structures
-- ============================================================================

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

    RAISE NOTICE 'Global fees calculated: admission=%, exam=%, other=%', 
        all_admission, total_exam, total_other;

    -- Loop through each student and set their fees
    FOR student_record IN 
        SELECT id, name, class_id 
        FROM students
        WHERE status = 'active'
    LOOP
        -- Get class-specific tuition fee for this student
        -- NOTE: Database has typo "Tusion" instead of "Tuition"
        SELECT COALESCE(amount, 0) INTO class_tuition
        FROM fee_structures
        WHERE class_id = student_record.class_id
        AND LOWER(name) LIKE '%tusion%'  -- Fixed: was 'tuition', database has 'tusion'
        LIMIT 1;

        -- Update this student's fees
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

    RAISE NOTICE '✅ Backfill complete: Updated % students', updated_count;
END $$;

-- ============================================================================
-- STEP 2: Handle Students Without Class Assignment
-- ============================================================================

-- Set default fees for students without a class (if any)
UPDATE students
SET 
    original_tuition_fee = COALESCE(original_tuition_fee, 0),
    original_admission_fee = COALESCE(original_admission_fee, 0),
    original_exam_fee = COALESCE(original_exam_fee, 0),
    original_other_fee = COALESCE(original_other_fee, 0)
WHERE class_id IS NULL 
  AND status = 'active';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check how many students got fees populated
SELECT 
    '✅ Students with fees populated' as status,
    COUNT(*) as count
FROM students
WHERE original_tuition_fee > 0
  AND status = 'active';

-- Check students still missing tuition fees
SELECT 
    '⚠️ Students missing tuition fees' as status,
    COUNT(*) as count
FROM students
WHERE (original_tuition_fee IS NULL OR original_tuition_fee = 0)
  AND status = 'active';

-- View sample data
SELECT 
    s.name,
    c.class_name,
    s.original_tuition_fee,
    s.original_admission_fee,
    s.original_exam_fee,
    s.original_other_fee,
    s.custom_tuition_fee,
    s.use_custom_fees,
    CASE 
        WHEN s.use_custom_fees AND s.custom_tuition_fee IS NOT NULL 
        THEN s.custom_tuition_fee 
        ELSE s.original_tuition_fee 
    END as resolved_tuition_fee
FROM students s
LEFT JOIN classes c ON c.id = s.class_id
WHERE s.status = 'active'
ORDER BY c.class_name, s.name
LIMIT 20;

-- Summary by class
SELECT 
    COALESCE(c.class_name, 'No Class') as class_name,
    COUNT(*) as total_students,
    COUNT(CASE WHEN s.use_custom_fees THEN 1 END) as students_with_custom_fees,
    AVG(s.original_tuition_fee) as avg_original_tuition,
    AVG(CASE WHEN s.use_custom_fees THEN s.custom_tuition_fee END) as avg_custom_tuition
FROM students s
LEFT JOIN classes c ON c.id = s.class_id
WHERE s.status = 'active'
GROUP BY c.class_name
ORDER BY c.class_name;
