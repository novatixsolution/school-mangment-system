-- Emergency Fix: Enable use_custom_fees for students who have custom fees set
-- This should be run immediately to fix the issue

-- Step 1: Enable use_custom_fees for all students who have custom_tuition_fee set
UPDATE students
SET use_custom_fees = true
WHERE custom_tuition_fee IS NOT NULL 
  AND custom_tuition_fee > 0
  AND (use_custom_fees = false OR use_custom_fees IS NULL);

-- Step 2: Verify the fix
SELECT 
    name,
    custom_tuition_fee,
    original_tuition_fee,
    use_custom_fees,
    CASE 
        WHEN use_custom_fees THEN custom_tuition_fee
        ELSE original_tuition_fee
    END as resolved_tuition_fee
FROM students
WHERE custom_tuition_fee IS NOT NULL
ORDER BY name;

-- This will show:
-- - Ahmed Ali Khan: custom=2250, use_custom=true, resolved=2250 ✅
-- - Fatima Zahra: custom=2350, use_custom=true, resolved=2350 ✅
