-- Add missing DELETE policy for fee_challans table
-- RLS is enabled but DELETE policy was missing

-- Drop policy if it already exists (to avoid duplicate error)
DROP POLICY IF EXISTS "Fee challans can be deleted by authenticated users" ON fee_challans;

-- Allow authenticated users to delete challans
CREATE POLICY "Fee challans can be deleted by authenticated users" ON fee_challans
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

COMMENT ON POLICY "Fee challans can be deleted by authenticated users" ON fee_challans IS 'Allows any authenticated user to delete challans';
