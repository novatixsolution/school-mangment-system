-- Migration: Add Student ID System
-- This adds a unique student_id column to the students table
-- Format: STD-{YEAR}-{SEQUENCE} (e.g., STD-2026-0001)

-- Add student_id column
ALTER TABLE students 
ADD COLUMN student_id VARCHAR(20) UNIQUE;

-- Create index for fast lookups
CREATE INDEX idx_students_student_id ON students(student_id);

-- Create a function to generate the next student ID
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    next_sequence INT;
    new_id TEXT;
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get the highest sequence number for current year
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(student_id FROM 'STD-' || current_year || '-([0-9]+)') 
                AS INTEGER
            )
        ), 
        0
    ) + 1
    INTO next_sequence
    FROM students
    WHERE student_id LIKE 'STD-' || current_year || '-%';
    
    -- Format the new ID with zero-padding (4 digits)
    new_id := 'STD-' || current_year || '-' || LPAD(next_sequence::TEXT, 4, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-generate student_id on insert if not provided
CREATE OR REPLACE FUNCTION auto_generate_student_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.student_id IS NULL THEN
        NEW.student_id := generate_student_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_student_id
BEFORE INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION auto_generate_student_id();

-- Update existing students with student IDs
-- This will assign IDs to all existing students
DO $$
DECLARE
    student_record RECORD;
BEGIN
    FOR student_record IN 
        SELECT id FROM students WHERE student_id IS NULL ORDER BY created_at, id
    LOOP
        UPDATE students 
        SET student_id = generate_student_id()
        WHERE id = student_record.id;
    END LOOP;
END $$;

-- Make student_id NOT NULL after populating existing records
ALTER TABLE students 
ALTER COLUMN student_id SET NOT NULL;

-- Add comment
COMMENT ON COLUMN students.student_id IS 'Unique student identifier in format STD-{YEAR}-{SEQUENCE}';
