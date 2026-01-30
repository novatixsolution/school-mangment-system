-- Add student_id column to fee_payments table
-- This allows tracking which student the payment is for
-- Also make invoice_id nullable for direct payments without invoice

-- Add student_id column
ALTER TABLE fee_payments 
ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Make invoice_id nullable (allow payments without invoice)
ALTER TABLE fee_payments 
ALTER COLUMN invoice_id DROP NOT NULL;

COMMENT ON COLUMN fee_payments.student_id IS 'Direct reference to student for easier payment tracking';
COMMENT ON COLUMN fee_payments.invoice_id IS 'Optional invoice reference - can be null for direct payments';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments(student_id);
