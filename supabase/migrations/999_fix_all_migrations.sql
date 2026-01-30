-- ========================================
-- CONSOLIDATED FIX SCRIPT
-- Run this entire script in Supabase SQL Editor
-- ========================================

-- ========================================
-- STEP 1: Clean up any partial migrations
-- ========================================

-- Drop columns if they exist (safe cleanup)
ALTER TABLE students DROP COLUMN IF EXISTS student_id CASCADE;
ALTER TABLE fee_structures DROP COLUMN IF EXISTS version CASCADE;
ALTER TABLE fee_structures DROP COLUMN IF EXISTS is_active CASCADE;
ALTER TABLE fee_structures DROP COLUMN IF EXISTS effective_from CASCADE;
ALTER TABLE fee_structures DROP COLUMN IF EXISTS created_by CASCADE;
ALTER TABLE fee_structures DROP COLUMN IF EXISTS updated_at CASCADE;
ALTER TABLE fee_challans DROP COLUMN IF EXISTS fee_structure_id CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_student_id() CASCADE;
DROP FUNCTION IF EXISTS auto_generate_student_id() CASCADE;
DROP FUNCTION IF EXISTS update_fee_structure_timestamp() CASCADE;
DROP FUNCTION IF EXISTS create_fee_structure_version(UUID, INTEGER, INTEGER, INTEGER, INTEGER, UUID) CASCADE;

-- Drop tables
DROP TABLE IF EXISTS reminder_history CASCADE;
DROP TABLE IF EXISTS reminder_templates CASCADE;

-- ========================================
-- STEP 2: Migration 013 - Student ID System
-- ========================================

-- Add student_id column
ALTER TABLE students ADD COLUMN student_id VARCHAR(20) UNIQUE;

-- Create index
CREATE INDEX idx_students_student_id ON students(student_id);

-- Create function to generate student ID
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    next_sequence INT;
    new_id TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
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
    
    new_id := 'STD-' || current_year || '-' || LPAD(next_sequence::TEXT, 4, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function
CREATE OR REPLACE FUNCTION auto_generate_student_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.student_id IS NULL THEN
        NEW.student_id := generate_student_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_auto_generate_student_id
BEFORE INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION auto_generate_student_id();

-- Backfill existing students
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

-- Make student_id NOT NULL
ALTER TABLE students ALTER COLUMN student_id SET NOT NULL;

-- Add comment
COMMENT ON COLUMN students.student_id IS 'Unique student identifier in format STD-{YEAR}-{SEQUENCE}';

-- ========================================
-- STEP 3: Migration 014 - Fee Structure Versioning
-- ========================================

-- Add columns to fee_structures
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS effective_from DATE DEFAULT CURRENT_DATE;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index
CREATE INDEX IF NOT EXISTS idx_fee_structures_active ON fee_structures(class_id, is_active) WHERE is_active = TRUE;

-- Add fee_structure_id to fee_challans
ALTER TABLE fee_challans ADD COLUMN IF NOT EXISTS fee_structure_id UUID REFERENCES fee_structures(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_fee_challans_fee_structure ON fee_challans(fee_structure_id);

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION update_fee_structure_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_fee_structure_timestamp ON fee_structures;
CREATE TRIGGER trigger_update_fee_structure_timestamp
BEFORE UPDATE ON fee_structures
FOR EACH ROW
EXECUTE FUNCTION update_fee_structure_timestamp();

-- Create versioning function
CREATE OR REPLACE FUNCTION create_fee_structure_version(
    p_class_id UUID,
    p_tuition_fee INTEGER,
    p_admission_fee INTEGER,
    p_exam_fee INTEGER,
    p_other_fee INTEGER,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_new_version INTEGER;
    v_new_id UUID;
BEGIN
    SELECT COALESCE(MAX(version), 0) + 1
    INTO v_new_version
    FROM fee_structures
    WHERE class_id = p_class_id;
    
    UPDATE fee_structures
    SET is_active = FALSE
    WHERE class_id = p_class_id
    AND is_active = TRUE;
    
    INSERT INTO fee_structures (
        class_id,
        tuition_fee,
        admission_fee,
        exam_fee,
        other_fee,
        version,
        is_active,
        effective_from,
        created_by
    ) VALUES (
        p_class_id,
        p_tuition_fee,
        p_admission_fee,
        p_exam_fee,
        p_other_fee,
        v_new_version,
        TRUE,
        CURRENT_DATE,
        p_user_id
    )
    RETURNING id INTO v_new_id;
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON COLUMN fee_structures.version IS 'Version number of this fee structure';
COMMENT ON COLUMN fee_structures.is_active IS 'Whether this is the currently active version';
COMMENT ON COLUMN fee_structures.effective_from IS 'Date from which this fee structure is effective';
COMMENT ON COLUMN fee_challans.fee_structure_id IS 'References the fee structure version used to generate this challan';

-- ========================================
-- STEP 4: Migration 015 - Reminder History
-- ========================================

-- Create reminder_history table
CREATE TABLE reminder_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challan_id UUID REFERENCES fee_challans(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL,
    template_used TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_by UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_reminder_history_challan ON reminder_history(challan_id);
CREATE INDEX idx_reminder_history_student ON reminder_history(student_id);
CREATE INDEX idx_reminder_history_sent_at ON reminder_history(sent_at);

-- Create reminder_templates table
CREATE TABLE reminder_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    template_type VARCHAR(20) NOT NULL,
    subject VARCHAR(200),
    message_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_reminder_templates_active ON reminder_templates(is_active) WHERE is_active = TRUE;

-- Insert default templates
INSERT INTO reminder_templates (name, template_type, message_template, is_active)
VALUES (
    'Default SMS Reminder',
    'sms',
    'Dear Parent, Fee challan {challan_number} for {student_name} (Class {class_name}) of Rs {amount} is due on {due_date}. Please pay at your earliest. - School Management',
    TRUE
);

INSERT INTO reminder_templates (name, template_type, subject, message_template, is_active)
VALUES (
    'Default Email Reminder',
    'email',
    'Fee Payment Reminder - {student_name}',
    'Dear Parent,

This is a reminder that the fee payment for {student_name} (Class {class_name}) is due.

Challan Number: {challan_number}
Month: {month}
Amount: Rs {amount}
Due Date: {due_date}
Days Remaining: {days_remaining}

Please make the payment at your earliest convenience to avoid any late fees.

Thank you,
School Management',
    TRUE
);

-- Add comments
COMMENT ON TABLE reminder_history IS 'Tracks all payment reminders sent to students/parents';
COMMENT ON TABLE reminder_templates IS 'Templates for SMS and Email reminders';

-- ========================================
-- DONE! All migrations applied successfully!
-- ========================================
