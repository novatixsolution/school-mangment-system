-- Fix for tuition fee backfill
-- Run this to populate the missing tuition fees

DO $$
DECLARE
    student_record RECORD;
    class_tuition NUMERIC;
    class_name_text TEXT;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting tuition fee fix...';
    
    -- Loop through each student
    FOR student_record IN 
        SELECT s.id, s.name, s.class_id, c.class_name
        FROM students s
        JOIN classes c ON c.id = s.class_id
        WHERE s.original_tuition_fee IS NULL OR s.original_tuition_fee = 0
    LOOP
        class_tuition := 0;
        class_name_text := student_record.class_name;
        
        RAISE NOTICE 'Processing student: %, Class: %', student_record.name, class_name_text;
        
        -- Try to find tuition fee by matching class name in fee name
        -- For example: "Class 1 Tuition" for a student in "Class 1"
        SELECT COALESCE(amount, 0) INTO class_tuition
        FROM fee_structures
        WHERE LOWER(name) LIKE '%' || LOWER(class_name_text) || '%'
        AND LOWER(name) LIKE '%tuition%'
        LIMIT 1;
        
        IF class_tuition > 0 THEN
            RAISE NOTICE '  → Found tuition fee: %', class_tuition;
            
            UPDATE students
            SET original_tuition_fee = class_tuition
            WHERE id = student_record.id;
            
            updated_count := updated_count + 1;
        ELSE
            RAISE NOTICE '  → No tuition fee found for %', class_name_text;
        END IF;
    END LOOP;
    
    RAISE NOTICE '======================';
    RAISE NOTICE 'Fix complete: Updated % students with tuition fees', updated_count;
    RAISE NOTICE '======================';
END $$;

-- Verify the fix
SELECT 
    c.class_name,
    COUNT(*) as student_count,
    AVG(s.original_tuition_fee) as avg_tuition,
    MIN(s.original_tuition_fee) as min_tuition,
    MAX(s.original_tuition_fee) as max_tuition
FROM students s
JOIN classes c ON c.id = s.class_id
GROUP BY c.class_name
ORDER BY c.class_name;
