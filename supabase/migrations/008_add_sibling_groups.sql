-- Migration: Add Sibling Groups Support
-- This enables automatic sibling detection and family grouping

-- First, add father_cnic column to students table if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS father_cnic VARCHAR(15);

-- Create index on father_cnic for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_father_cnic ON students(father_cnic);
CREATE INDEX IF NOT EXISTS idx_students_father_name ON students(father_name);

-- Create sibling_groups table
CREATE TABLE IF NOT EXISTS sibling_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name VARCHAR(255), -- Optional: Family name
    father_cnic VARCHAR(15),
    father_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add sibling_group_id to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS sibling_group_id UUID REFERENCES sibling_groups(id) ON DELETE SET NULL;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_sibling_groups_father_cnic ON sibling_groups(father_cnic);
CREATE INDEX IF NOT EXISTS idx_sibling_groups_father_name ON sibling_groups(father_name);
CREATE INDEX IF NOT EXISTS idx_students_sibling_group ON students(sibling_group_id);

-- Function to detect and create sibling groups
-- ONLY matches by father_cnic (unique identifier)
CREATE OR REPLACE FUNCTION detect_sibling_group(
    p_father_cnic VARCHAR,
    p_father_name VARCHAR,
    p_exclude_student_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    existing_group_id UUID;
BEGIN
    -- Only process if CNIC is provided
    IF p_father_cnic IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Check for existing sibling group by CNIC only
    SELECT sibling_group_id INTO existing_group_id
    FROM students
    WHERE father_cnic = p_father_cnic
    AND sibling_group_id IS NOT NULL
    AND (p_exclude_student_id IS NULL OR id != p_exclude_student_id)
    LIMIT 1;
    
    -- If found, return existing group
    IF existing_group_id IS NOT NULL THEN
        RETURN existing_group_id;
    END IF;
    
    -- Check if any OTHER students exist with same CNIC
    IF EXISTS (
        SELECT 1 FROM students 
        WHERE father_cnic = p_father_cnic
        AND (p_exclude_student_id IS NULL OR id != p_exclude_student_id)
    ) THEN
        -- Create new sibling group
        INSERT INTO sibling_groups (father_cnic, father_name)
        VALUES (p_father_cnic, p_father_name)
        RETURNING id INTO existing_group_id;
        
        -- Update all existing students with same CNIC (excluding current one to avoid recursion)
        -- Use a session variable to prevent trigger recursion
        PERFORM set_config('sibling_groups.updating', 'true', true);
        
        UPDATE students
        SET sibling_group_id = existing_group_id
        WHERE father_cnic = p_father_cnic
        AND sibling_group_id IS NULL
        AND (p_exclude_student_id IS NULL OR id != p_exclude_student_id);
        
        PERFORM set_config('sibling_groups.updating', 'false', true);
        
        RETURN existing_group_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically assign sibling group on student insert/update
-- Only works if father_cnic is provided
CREATE OR REPLACE FUNCTION auto_assign_sibling_group()
RETURNS TRIGGER AS $$
DECLARE
    detected_group_id UUID;
    is_updating BOOLEAN;
BEGIN
    -- Check if we're already in an update to prevent recursion
    is_updating := COALESCE(current_setting('sibling_groups.updating', true), 'false')::boolean;
    
    IF is_updating THEN
        RETURN NEW;
    END IF;
    
    -- Only process if CNIC is provided and sibling_group_id is not already set
    IF NEW.father_cnic IS NOT NULL AND NEW.sibling_group_id IS NULL THEN
        detected_group_id := detect_sibling_group(NEW.father_cnic, NEW.father_name, NEW.id);
        
        IF detected_group_id IS NOT NULL THEN
            NEW.sibling_group_id := detected_group_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_sibling_group ON students;
CREATE TRIGGER trigger_auto_assign_sibling_group
    BEFORE INSERT OR UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_sibling_group();

-- Backfill existing students into sibling groups
-- Only process students who have father_cnic
DO $$
DECLARE
    student_record RECORD;
    group_id UUID;
BEGIN
    -- Disable the trigger temporarily
    PERFORM set_config('sibling_groups.updating', 'true', true);
    
    FOR student_record IN 
        SELECT DISTINCT father_cnic, father_name 
        FROM students 
        WHERE father_cnic IS NOT NULL
        AND sibling_group_id IS NULL
    LOOP
        group_id := detect_sibling_group(student_record.father_cnic, student_record.father_name, NULL);
    END LOOP;
    
    PERFORM set_config('sibling_groups.updating', 'false', true);
END $$;

