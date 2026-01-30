-- Add one_time frequency option to fee_structures table
-- Run this in Supabase SQL Editor

-- First drop the existing constraint
ALTER TABLE fee_structures 
DROP CONSTRAINT IF EXISTS fee_structures_frequency_check;

-- Add the new constraint with one_time option
ALTER TABLE fee_structures
ADD CONSTRAINT fee_structures_frequency_check 
CHECK (frequency IN ('monthly', 'quarterly', 'annual', 'one_time'));

COMMENT ON COLUMN fee_structures.frequency IS 'Payment frequency: monthly, quarterly, annual, or one_time (for admission fees)';
