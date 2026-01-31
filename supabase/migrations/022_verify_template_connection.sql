-- Quick verification script to check if template system is properly connected

-- 1. Check if template_id column exists in fee_challans
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fee_challans' AND column_name = 'template_id';

-- 2. Check if challan_templates table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'challan_templates'
);

-- 3. Check if school_settings table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'school_settings'
);

-- 4. List all templates
SELECT id, display_name, template_type, is_default 
FROM challan_templates;

-- 5. Check school settings
SELECT id, school_name, school_address, contact_number 
FROM school_settings 
LIMIT 1;

-- ============================================================================
-- IF MIGRATION FAILED, RUN THIS TO FIX:
-- ============================================================================

--  Add template_id if missing
DO $$ 
BEGIN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_challans' AND column_name = 'template_id'
    ) THEN
        ALTER TABLE fee_challans 
        ADD COLUMN template_id UUID REFERENCES challan_templates(id);
        
        RAISE NOTICE '✅ Added template_id column to fee_challans';
    ELSE
        RAISE NOTICE '✓ template_id column already exists';
    END IF;
END $$;

-- Set default template for existing challans
UPDATE fee_challans 
SET template_id = (SELECT id FROM challan_templates WHERE is_default = true LIMIT 1)
WHERE template_id IS NULL;

-- Verify the update
SELECT COUNT(*) as challans_with_template 
FROM fee_challans 
WHERE template_id IS NOT NULL;
