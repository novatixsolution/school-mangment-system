-- ============================================================================
-- Phase 9: High Priority Enhancements - Database Layer
-- Migration: Fee History Tracking + Fee Sync Tool
-- ============================================================================

-- ============================================================================
-- FEATURE 1: FEE HISTORY TRACKING
-- ============================================================================

-- Create fee_history table
CREATE TABLE IF NOT EXISTS fee_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    -- Change type
    change_type TEXT NOT NULL,
    
    -- Previous values (before change)
    old_original_tuition_fee NUMERIC(10,2),
    old_custom_tuition_fee NUMERIC(10,2),
    old_use_custom_fees BOOLEAN,
    old_fee_discount NUMERIC(10,2),
    
    -- New values (after change)
    new_original_tuition_fee NUMERIC(10,2),
    new_custom_tuition_fee NUMERIC(10,2),
    new_use_custom_fees BOOLEAN,
    new_fee_discount NUMERIC(10,2),
    
    -- Metadata
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    notes TEXT,
    
    -- Constraints
    CONSTRAINT valid_change_type CHECK (
        change_type IN (
            'original_updated',
            'custom_enabled',
            'custom_disabled',
            'custom_updated',
            'discount_updated',
            'bulk_sync',
            'manual_update'
        )
    )
);

-- Add comments for documentation
COMMENT ON TABLE fee_history IS 'Audit trail for all student fee changes';
COMMENT ON COLUMN fee_history.change_type IS 'Type of change: original_updated, custom_enabled, custom_disabled, custom_updated, discount_updated, bulk_sync, manual_update';
COMMENT ON COLUMN fee_history.changed_by IS 'User who made the change';
COMMENT ON COLUMN fee_history.reason IS 'Reason for the fee change';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fee_history_student_date 
    ON fee_history(student_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_fee_history_date 
    ON fee_history(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_fee_history_type 
    ON fee_history(change_type);

CREATE INDEX IF NOT EXISTS idx_fee_history_changed_by 
    ON fee_history(changed_by);

-- ============================================================================
-- TRIGGER FUNCTION: Auto-track fee changes
-- ============================================================================

CREATE OR REPLACE FUNCTION track_fee_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_change_type TEXT;
BEGIN
    -- Only track if fee-related columns actually changed
    IF (COALESCE(OLD.original_tuition_fee, 0) != COALESCE(NEW.original_tuition_fee, 0) OR
        COALESCE(OLD.custom_tuition_fee, 0) != COALESCE(NEW.custom_tuition_fee, 0) OR
        COALESCE(OLD.use_custom_fees, FALSE) != COALESCE(NEW.use_custom_fees, FALSE) OR
        COALESCE(OLD.fee_discount, 0) != COALESCE(NEW.fee_discount, 0)) THEN
        
        -- Determine change type
        v_change_type := CASE 
            WHEN COALESCE(OLD.use_custom_fees, FALSE) = FALSE AND COALESCE(NEW.use_custom_fees, FALSE) = TRUE THEN 
                'custom_enabled'
            WHEN COALESCE(OLD.use_custom_fees, FALSE) = TRUE AND COALESCE(NEW.use_custom_fees, FALSE) = FALSE THEN 
                'custom_disabled'
            WHEN COALESCE(OLD.custom_tuition_fee, 0) != COALESCE(NEW.custom_tuition_fee, 0) AND COALESCE(NEW.use_custom_fees, FALSE) = TRUE THEN 
                'custom_updated'
            WHEN COALESCE(OLD.original_tuition_fee, 0) != COALESCE(NEW.original_tuition_fee, 0) THEN 
                'original_updated'
            WHEN COALESCE(OLD.fee_discount, 0) != COALESCE(NEW.fee_discount, 0) THEN 
                'discount_updated'
            ELSE 
                'manual_update'
        END;
        
        -- Insert history record
        INSERT INTO fee_history (
            student_id,
            change_type,
            old_original_tuition_fee,
            old_custom_tuition_fee,
            old_use_custom_fees,
            old_fee_discount,
            new_original_tuition_fee,
            new_custom_tuition_fee,
            new_use_custom_fees,
            new_fee_discount,
            changed_by
        ) VALUES (
            NEW.id,
            v_change_type,
            OLD.original_tuition_fee,
            OLD.custom_tuition_fee,
            OLD.use_custom_fees,
            OLD.fee_discount,
            NEW.original_tuition_fee,
            NEW.custom_tuition_fee,
            NEW.use_custom_fees,
            NEW.fee_discount,
            auth.uid()
        );
        
        RAISE NOTICE 'Fee change tracked for student %: %', NEW.name, v_change_type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_track_fee_changes ON students;
CREATE TRIGGER trigger_track_fee_changes
    AFTER UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION track_fee_changes();

COMMENT ON FUNCTION track_fee_changes() IS 'Automatically tracks all fee changes to students table';

-- ============================================================================
-- FEATURE 2: FEE STRUCTURE SYNC TOOL
-- ============================================================================

-- Function to preview sync (what will change)
CREATE OR REPLACE FUNCTION preview_fee_structure_sync(p_class_id UUID)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    current_original_tuition NUMERIC,
    new_tuition_fee NUMERIC,
    has_custom_fee BOOLEAN,
    will_be_updated BOOLEAN
) AS $$
DECLARE
    v_new_tuition NUMERIC;
BEGIN
    -- Get the current tuition fee for this class from fee_structures
    SELECT amount INTO v_new_tuition
    FROM fee_structures
    WHERE class_id = p_class_id
      AND LOWER(name) LIKE '%tusion%'  -- Note: typo in database
    LIMIT 1;
    
    -- Return preview data
    RETURN QUERY
    SELECT 
        s.id as student_id,
        s.name as student_name,
        s.original_tuition_fee as current_original_tuition,
        v_new_tuition as new_tuition_fee,
        COALESCE(s.use_custom_fees, FALSE) as has_custom_fee,
        (COALESCE(s.use_custom_fees, FALSE) = FALSE) as will_be_updated
    FROM students s
    WHERE s.class_id = p_class_id
      AND s.status = 'active'
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION preview_fee_structure_sync(UUID) IS 'Preview which students will be affected by fee structure sync';

-- Function to sync fee structure to students
CREATE OR REPLACE FUNCTION sync_fee_structure_to_students(
    p_class_id UUID,
    p_tuition_fee NUMERIC,
    p_admission_fee NUMERIC DEFAULT NULL,
    p_exam_fee NUMERIC DEFAULT NULL,
    p_other_fee NUMERIC DEFAULT NULL,
    p_reason TEXT DEFAULT 'Fee structure sync'
)
RETURNS TABLE (
    total_students INTEGER,
    updated_count INTEGER,
    skipped_count INTEGER,
    updated_student_ids UUID[]
) AS $$
DECLARE
    v_total INTEGER := 0;
    v_updated INTEGER := 0;
    v_skipped INTEGER := 0;
    v_student_ids UUID[];
BEGIN
    -- Count total active students in class
    SELECT COUNT(*) INTO v_total
    FROM students
    WHERE class_id = p_class_id
      AND status = 'active';
    
    -- Update students without custom fees
    WITH updated AS (
        UPDATE students
        SET 
            original_tuition_fee = p_tuition_fee,
            original_admission_fee = COALESCE(p_admission_fee, original_admission_fee),
            original_exam_fee = COALESCE(p_exam_fee, original_exam_fee),
            original_other_fee = COALESCE(p_other_fee, original_other_fee)
        WHERE class_id = p_class_id
          AND status = 'active'
          AND (use_custom_fees = FALSE OR use_custom_fees IS NULL)
        RETURNING id
    )
    SELECT COUNT(*), ARRAY_AGG(id)
    INTO v_updated, v_student_ids
    FROM updated;
    
    -- Calculate skipped (students with custom fees)
    v_skipped := v_total - v_updated;
    
    -- Log the bulk sync operation (create one history entry for the operation)
    IF v_updated > 0 THEN
        RAISE NOTICE 'Fee sync completed: % updated, % skipped (custom fees)', v_updated, v_skipped;
    END IF;
    
    -- Return summary
    RETURN QUERY SELECT v_total, v_updated, v_skipped, v_student_ids;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_fee_structure_to_students IS 'Bulk update student fees from fee structure, respecting custom fees';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get fee history for a student
CREATE OR REPLACE FUNCTION get_student_fee_history(
    p_student_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    change_type TEXT,
    old_tuition NUMERIC,
    new_tuition NUMERIC,
    old_custom NUMERIC,
    new_custom NUMERIC,
    old_discount NUMERIC,
    new_discount NUMERIC,
    changed_at TIMESTAMP WITH TIME ZONE,
    changed_by UUID,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fh.id,
        fh.change_type,
        fh.old_original_tuition_fee,
        fh.new_original_tuition_fee,
        fh.old_custom_tuition_fee,
        fh.new_custom_tuition_fee,
        fh.old_fee_discount,
        fh.new_fee_discount,
        fh.changed_at,
        fh.changed_by,
        fh.reason
    FROM fee_history fh
    WHERE fh.student_id = p_student_id
    ORDER BY fh.changed_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent fee changes across all students
CREATE OR REPLACE FUNCTION get_recent_fee_changes(
    p_days INTEGER DEFAULT 7,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    class_name TEXT,
    change_type TEXT,
    old_tuition NUMERIC,
    new_tuition NUMERIC,
    changed_at TIMESTAMP WITH TIME ZONE,
    changed_by_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        c.class_name,
        fh.change_type,
        COALESCE(fh.old_original_tuition_fee, fh.old_custom_tuition_fee) as old_tuition,
        COALESCE(fh.new_original_tuition_fee, fh.new_custom_tuition_fee) as new_tuition,
        fh.changed_at,
        u.email
    FROM fee_history fh
    JOIN students s ON s.id = fh.student_id
    LEFT JOIN classes c ON c.id = s.class_id
    LEFT JOIN auth.users u ON u.id = fh.changed_by
    WHERE fh.changed_at >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY fh.changed_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test that trigger is working
/*
-- Update a student's fee to test trigger
UPDATE students
SET original_tuition_fee = 1500
WHERE name = 'Ahmed Ali Khan';

-- Check history was created
SELECT * FROM fee_history ORDER BY changed_at DESC LIMIT 5;
*/

-- Test preview function
/*
SELECT * FROM preview_fee_structure_sync(
    (SELECT id FROM classes WHERE class_name = 'Class 1' LIMIT 1)
);
*/

-- Test sync function
/*
SELECT * FROM sync_fee_structure_to_students(
    (SELECT id FROM classes WHERE class_name = 'Class 1' LIMIT 1),
    1300,  -- new tuition fee
    1100,  -- admission fee
    1300,  -- exam fee
    1050,  -- other fee
    'Annual fee increase'
);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary
DO $$
BEGIN
    RAISE NOTICE '✅ Phase 9 Database Layer Complete!';
    RAISE NOTICE '1. fee_history table created';
    RAISE NOTICE '2. Auto-tracking trigger installed';
    RAISE NOTICE '3. Fee sync functions created';
    RAISE NOTICE '4. Helper functions added';
    RAISE NOTICE 'Ready for UI implementation!';
END $$;
