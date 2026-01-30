-- Migration: Add Fee Structure Versioning and History
-- This adds versioning to fee structures to track changes over time

-- Add version tracking columns to fee_structures (only if they don't exist)
DO $$ 
BEGIN
    -- Add version column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'version'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add effective_from column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'effective_from'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN effective_from DATE DEFAULT CURRENT_DATE;
    END IF;

    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create index for active fee structures (if not exists)
CREATE INDEX IF NOT EXISTS idx_fee_structures_active ON fee_structures(class_id, is_active) WHERE is_active = TRUE;

-- Add fee_structure_id to fee_challans (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_challans' AND column_name = 'fee_structure_id'
    ) THEN
        ALTER TABLE fee_challans ADD COLUMN fee_structure_id UUID REFERENCES fee_structures(id);
    END IF;
END $$;

-- Create index for fee structure tracking in challans
CREATE INDEX IF NOT EXISTS idx_fee_challans_fee_structure ON fee_challans(fee_structure_id);

-- Create or replace trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fee_structure_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS trigger_update_fee_structure_timestamp ON fee_structures;
CREATE TRIGGER trigger_update_fee_structure_timestamp
BEFORE UPDATE ON fee_structures
FOR EACH ROW
EXECUTE FUNCTION update_fee_structure_timestamp();

-- Function to create new version of fee structure
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
    -- Get the next version number
    SELECT COALESCE(MAX(version), 0) + 1
    INTO v_new_version
    FROM fee_structures
    WHERE class_id = p_class_id;
    
    -- Deactivate previous versions
    UPDATE fee_structures
    SET is_active = FALSE
    WHERE class_id = p_class_id
    AND is_active = TRUE;
    
    -- Create new version
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

-- Only add comment if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_challans' AND column_name = 'fee_structure_id'
    ) THEN
        COMMENT ON COLUMN fee_challans.fee_structure_id IS 'References the fee structure version used to generate this challan';
    END IF;
END $$;
