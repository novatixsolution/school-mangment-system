-- Migration: Add edit tracking to fee_challans
-- Created: 2026-01-29
-- Purpose: Track challan edit history (who, when, how many times)

-- Add edit tracking columns
ALTER TABLE fee_challans 
ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN fee_challans.last_edited_by IS 'User who last edited this challan';
COMMENT ON COLUMN fee_challans.last_edited_at IS 'Timestamp of last edit';
COMMENT ON COLUMN fee_challans.edit_count IS 'Number of times this challan has been edited';

-- Create index for faster queries on edited challans
CREATE INDEX IF NOT EXISTS idx_fee_challans_edited ON fee_challans(last_edited_at) 
WHERE last_edited_at IS NOT NULL;
