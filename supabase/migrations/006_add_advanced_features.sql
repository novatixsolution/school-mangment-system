-- Phase 1 Advanced Features: Database Schema
-- Add columns to students table for new features

-- Add new columns to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS admission_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS sibling_group_id UUID;

-- Create sibling groups table
CREATE TABLE IF NOT EXISTS sibling_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_name VARCHAR(255),
    primary_parent_name VARCHAR(255),
    primary_parent_cnic VARCHAR(20),
    primary_parent_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key for sibling_group_id
ALTER TABLE students
ADD CONSTRAINT fk_sibling_group
FOREIGN KEY (sibling_group_id) REFERENCES sibling_groups(id)
ON DELETE SET NULL;

-- Create ID card templates table
CREATE TABLE IF NOT EXISTS id_card_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    design_config JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create number sequences table for auto-numbering
CREATE TABLE IF NOT EXISTS number_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_type VARCHAR(50) NOT NULL, -- 'admission_number', 'roll_number'
    class_id BIGINT REFERENCES classes(id),
    year INTEGER,
    current_value INTEGER DEFAULT 0,
    format_template VARCHAR(100), -- e.g., '{YEAR}-{CLASS}-{SEQ}'
    prefix VARCHAR(20),
    suffix VARCHAR(20),
    padding INTEGER DEFAULT 3, -- for zero padding
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(sequence_type, class_id, year)
);

-- Insert default admission number sequence
INSERT INTO number_sequences (sequence_type, format_template, current_value, padding)
VALUES ('admission_number', '{YEAR}-{SEQ}', 0, 4)
ON CONFLICT DO NOTHING;

-- Create function to get next sequence number
CREATE OR REPLACE FUNCTION get_next_sequence_number(
    p_sequence_type VARCHAR(50),
    p_class_id BIGINT DEFAULT NULL,
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())
)
RETURNS VARCHAR AS $$
DECLARE
    v_sequence_id UUID;
    v_current_value INTEGER;
    v_format VARCHAR(100);
    v_padding INTEGER;
    v_result VARCHAR(100);
    v_class_code VARCHAR(20);
BEGIN
    -- Get or create sequence
    INSERT INTO number_sequences (sequence_type, class_id, year, current_value, format_template, padding)
    VALUES (p_sequence_type, p_class_id, p_year, 0, '{YEAR}-{CLASS}-{SEQ}', 3)
    ON CONFLICT (sequence_type, class_id, year) DO NOTHING;
    
    -- Get sequence info
    SELECT id, current_value, format_template, padding
    INTO v_sequence_id, v_current_value, v_format, v_padding
    FROM number_sequences
    WHERE sequence_type = p_sequence_type
        AND (class_id = p_class_id OR (class_id IS NULL AND p_class_id IS NULL))
        AND year = p_year;
    
    -- Increment value
    v_current_value := v_current_value + 1;
    
    -- Update sequence
    UPDATE number_sequences
    SET current_value = v_current_value, updated_at = NOW()
    WHERE id = v_sequence_id;
    
    -- Get class code if needed
    IF p_class_id IS NOT NULL THEN
        SELECT UPPER(LEFT(class_name, 2))
        INTO v_class_code
        FROM classes
        WHERE id = p_class_id;
    END IF;
    
    -- Format the result
    v_result := v_format;
    v_result := REPLACE(v_result, '{YEAR}', p_year::TEXT);
    v_result := REPLACE(v_result, '{CLASS}', COALESCE(v_class_code, ''));
    v_result := REPLACE(v_result, '{SEQ}', LPAD(v_current_value::TEXT, v_padding, '0'));
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create index for faster sibling lookup
CREATE INDEX IF NOT EXISTS idx_students_sibling_group 
ON students(sibling_group_id) WHERE sibling_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_students_admission_number 
ON students(admission_number) WHERE admission_number IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN students.photo_url IS 'URL to student profile photo';
COMMENT ON COLUMN students.admission_number IS 'Unique admission number (auto-generated)';
COMMENT ON COLUMN students.sibling_group_id IS 'Link to sibling group for family management';
COMMENT ON TABLE sibling_groups IS 'Groups students who are siblings for family management';
COMMENT ON TABLE number_sequences IS 'Manages auto-incrementing sequences for admission/roll numbers';
