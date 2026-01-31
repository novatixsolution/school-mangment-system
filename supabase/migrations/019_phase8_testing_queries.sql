-- ============================================================================
-- Phase 8: Testing & Verification - Complete SQL Test Suite
-- ============================================================================

-- ============================================================================
-- SECTION 1: DATABASE VERIFICATION
-- ============================================================================

-- 1.1 Check all students have original_tuition_fee set
SELECT 
    '✅ Students with original_tuition_fee' as status,
    COUNT(*) as count
FROM students
WHERE original_tuition_fee > 0 AND status = 'active';

SELECT 
    '⚠️ Students missing original_tuition_fee' as status,
    COUNT(*) as count
FROM students
WHERE (original_tuition_fee IS NULL OR original_tuition_fee = 0) AND status = 'active';

-- 1.2 Verify use_custom_fees flag is correct
SELECT 
    'Students with custom fees enabled' as status,
    COUNT(*) as count
FROM students
WHERE use_custom_fees = true AND status = 'active';

SELECT 
    'Students with custom_tuition_fee but flag not set' as issue,
    name,
    custom_tuition_fee,
    use_custom_fees
FROM students
WHERE custom_tuition_fee IS NOT NULL 
  AND custom_tuition_fee > 0 
  AND use_custom_fees = false
  AND status = 'active';

-- 1.3 Complete data integrity check
SELECT 
    name,
    original_tuition_fee,
    original_admission_fee,
    original_exam_fee,
    original_other_fee,
    custom_tuition_fee,
    use_custom_fees,
    CASE 
        WHEN use_custom_fees AND custom_tuition_fee IS NOT NULL 
        THEN custom_tuition_fee 
        ELSE original_tuition_fee 
    END as resolved_tuition_fee,
    CASE 
        WHEN use_custom_fees AND custom_tuition_fee IS NOT NULL 
        THEN 'Custom'
        ELSE 'Original'
    END as fee_source
FROM students
WHERE status = 'active'
ORDER BY name;

-- 1.4 Summary by class
SELECT 
    COALESCE(c.class_name, 'No Class') as class_name,
    COUNT(*) as total_students,
    COUNT(CASE WHEN s.use_custom_fees THEN 1 END) as with_custom_fees,
    COUNT(CASE WHEN NOT s.use_custom_fees OR s.use_custom_fees IS NULL THEN 1 END) as with_original_fees,
    ROUND(AVG(s.original_tuition_fee)) as avg_original_tuition,
    ROUND(AVG(CASE WHEN s.use_custom_fees THEN s.custom_tuition_fee END)) as avg_custom_tuition
FROM students s
LEFT JOIN classes c ON c.id = s.class_id
WHERE s.status = 'active'
GROUP BY c.class_name
ORDER BY c.class_name;

-- ============================================================================
-- SECTION 2: INDIVIDUAL CHALLAN TESTING
-- ============================================================================

-- 2.1 Find students to test
-- Students WITH custom fees
SELECT 
    '📋 Students with custom fees (for testing)' as category,
    name,
    custom_tuition_fee as tuition,
    use_custom_fees
FROM students
WHERE use_custom_fees = true AND status = 'active'
ORDER BY name
LIMIT 3;

-- Students WITHOUT custom fees
SELECT 
    '📋 Students with original fees (for testing)' as category,
    name,
    original_tuition_fee as tuition,
    use_custom_fees
FROM students
WHERE (use_custom_fees = false OR use_custom_fees IS NULL) AND status = 'active'
ORDER BY name
LIMIT 3;

-- 2.2 Check existing challans (to verify fees after generation)
SELECT 
    fc.id as challan_id,
    s.name as student_name,
    fc.month,
    fc.monthly_fee,
    fc.admission_fee,
    fc.exam_fee,
    fc.other_fees,
    fc.discount,
    fc.total_amount,
    s.original_tuition_fee,
    s.custom_tuition_fee,
    s.use_custom_fees,
    CASE 
        WHEN s.use_custom_fees AND s.custom_tuition_fee IS NOT NULL 
        THEN 'Should use Custom: ' || s.custom_tuition_fee
        ELSE 'Should use Original: ' || s.original_tuition_fee
    END as expected_tuition
FROM fee_challans fc
JOIN students s ON s.id = fc.student_id
WHERE fc.created_at > NOW() - INTERVAL '1 hour'  -- Recent challans
ORDER BY fc.created_at DESC
LIMIT 10;

-- ============================================================================
-- SECTION 3: BULK CHALLAN VERIFICATION
-- ============================================================================

-- 3.1 Check students without challans for current month
SELECT 
    s.name,
    c.class_name,
    s.original_tuition_fee,
    s.custom_tuition_fee,
    s.use_custom_fees,
    CASE 
        WHEN s.use_custom_fees AND s.custom_tuition_fee IS NOT NULL 
        THEN s.custom_tuition_fee 
        ELSE s.original_tuition_fee 
    END as should_charge
FROM students s
LEFT JOIN classes c ON c.id = s.class_id
LEFT JOIN fee_challans fc ON fc.student_id = s.id 
    AND fc.month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
WHERE s.status = 'active' 
  AND fc.id IS NULL
ORDER BY c.class_name, s.name;

-- 3.2 Verify all challans have correct fees (after bulk generation)
SELECT 
    c.class_name,
    COUNT(fc.id) as total_challans,
    COUNT(CASE 
        WHEN s.use_custom_fees AND fc.monthly_fee = s.custom_tuition_fee THEN 1 
        WHEN NOT s.use_custom_fees AND fc.monthly_fee = s.original_tuition_fee THEN 1
    END) as correct_tuition_fees,
    COUNT(CASE 
        WHEN s.use_custom_fees AND fc.monthly_fee != s.custom_tuition_fee THEN 1 
        WHEN NOT s.use_custom_fees AND fc.monthly_fee != s.original_tuition_fee THEN 1
    END) as incorrect_tuition_fees
FROM fee_challans fc
JOIN students s ON s.id = fc.student_id
LEFT JOIN classes c ON c.id = s.class_id
WHERE fc.month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
GROUP BY c.class_name
ORDER BY c.class_name;

-- 3.3 Find any mismatches in challan fees
SELECT 
    '⚠️ MISMATCH FOUND' as alert,
    s.name,
    s.original_tuition_fee,
    s.custom_tuition_fee,
    s.use_custom_fees,
    fc.monthly_fee as challan_tuition_fee,
    CASE 
        WHEN s.use_custom_fees THEN s.custom_tuition_fee
        ELSE s.original_tuition_fee
    END as expected_tuition_fee
FROM fee_challans fc
JOIN students s ON s.id = fc.student_id
WHERE fc.month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  AND (
    (s.use_custom_fees = true AND fc.monthly_fee != s.custom_tuition_fee) OR
    (s.use_custom_fees = false AND fc.monthly_fee != s.original_tuition_fee) OR
    (s.use_custom_fees IS NULL AND fc.monthly_fee != s.original_tuition_fee)
  );

-- ============================================================================
-- SECTION 4: STUDENT EDIT FORM TESTING
-- ============================================================================

-- 4.1 Create test data for form testing
-- Pick one student to test the edit form
SELECT 
    'Test this student in edit form:' as instruction,
    id,
    name,
    original_tuition_fee,
    original_admission_fee,
    original_exam_fee,
    original_other_fee,
    custom_tuition_fee,
    use_custom_fees,
    fee_discount
FROM students
WHERE status = 'active'
  AND use_custom_fees = false  -- Pick student with original fees
ORDER BY name
LIMIT 1;

-- 4.2 After toggling custom fee and saving, verify the update
-- Replace 'STUDENT_ID_HERE' with actual student ID from above
/*
SELECT 
    'After edit - verify changes' as status,
    name,
    original_tuition_fee,
    custom_tuition_fee,
    use_custom_fees,
    fee_discount,
    updated_at
FROM students
WHERE id = 'STUDENT_ID_HERE';
*/

-- ============================================================================
-- SECTION 5: FINAL COMPREHENSIVE VERIFICATION
-- ============================================================================

-- 5.1 Complete system health check
SELECT 
    'Total Active Students' as metric,
    COUNT(*) as value
FROM students WHERE status = 'active'
UNION ALL
SELECT 
    'Students with Original Fees',
    COUNT(*) FROM students WHERE original_tuition_fee > 0 AND status = 'active'
UNION ALL
SELECT 
    'Students with Custom Fees',
    COUNT(*) FROM students WHERE use_custom_fees = true AND status = 'active'
UNION ALL
SELECT 
    'Total Challans This Month',
    COUNT(*) FROM fee_challans WHERE month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
UNION ALL
SELECT 
    'Challans with Correct Fees',
    COUNT(*)
FROM fee_challans fc
JOIN students s ON s.id = fc.student_id
WHERE fc.month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  AND (
    (s.use_custom_fees = true AND fc.monthly_fee = s.custom_tuition_fee) OR
    ((s.use_custom_fees = false OR s.use_custom_fees IS NULL) AND fc.monthly_fee = s.original_tuition_fee)
  );

-- 5.2 Export data for review
SELECT 
    s.name,
    c.class_name,
    s.original_tuition_fee,
    s.original_admission_fee,
    s.original_exam_fee,
    s.original_other_fee,
    s.custom_tuition_fee,
    s.use_custom_fees,
    s.fee_discount,
    CASE 
        WHEN s.use_custom_fees AND s.custom_tuition_fee IS NOT NULL THEN 'Custom'
        ELSE 'Original'
    END as fee_source,
    CASE 
        WHEN s.use_custom_fees AND s.custom_tuition_fee IS NOT NULL 
        THEN s.custom_tuition_fee 
        ELSE s.original_tuition_fee 
    END as resolved_tuition,
    COUNT(fc.id) as total_challans_generated
FROM students s
LEFT JOIN classes c ON c.id = s.class_id
LEFT JOIN fee_challans fc ON fc.student_id = s.id
WHERE s.status = 'active'
GROUP BY s.id, s.name, c.class_name, s.original_tuition_fee, 
         s.original_admission_fee, s.original_exam_fee, s.original_other_fee,
         s.custom_tuition_fee, s.use_custom_fees, s.fee_discount
ORDER BY c.class_name, s.name;
