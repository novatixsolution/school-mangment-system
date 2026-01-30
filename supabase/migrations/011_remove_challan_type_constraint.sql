-- Quick fix: Remove challan_type constraint
-- This allows any text value for challan_type

ALTER TABLE fee_challans DROP CONSTRAINT IF EXISTS check_challan_type;
