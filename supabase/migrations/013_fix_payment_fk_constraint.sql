-- Fix foreign key constraint for fee_challans.payment_id
-- Allow deleting payments when challans still reference them

-- Drop the existing foreign key constraint
ALTER TABLE fee_challans
DROP CONSTRAINT IF EXISTS fee_challans_payment_id_fkey;

-- Add it back with ON DELETE SET NULL
ALTER TABLE fee_challans
ADD CONSTRAINT fee_challans_payment_id_fkey
FOREIGN KEY (payment_id)
REFERENCES fee_payments(id)
ON DELETE SET NULL;

-- Add comment
COMMENT ON CONSTRAINT fee_challans_payment_id_fkey ON fee_challans IS 'Payment reference - set to null if payment is deleted';
