-- Fee Enhancements Migration
-- Adds comprehensive fee management capabilities

-- Step 1: Add fee columns to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS admission_fee DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS fee_discount DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS fee_notes TEXT;

-- Step 2: Create fee challans table
CREATE TABLE IF NOT EXISTS fee_challans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  challan_number TEXT UNIQUE NOT NULL,
  month TEXT NOT NULL,
  
  -- Fee breakdown
  monthly_fee DECIMAL NOT NULL DEFAULT 0,
  exam_fee DECIMAL DEFAULT 0,
  admission_fee DECIMAL DEFAULT 0,
  other_fees DECIMAL DEFAULT 0,
  discount DECIMAL DEFAULT 0,
  total_amount DECIMAL NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_date DATE,
  payment_id UUID REFERENCES fee_payments(id),
  
  -- Metadata
  notes TEXT,
  generated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enhance fee_structures table
ALTER TABLE fee_structures
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS academic_year TEXT;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_challans_student_id ON fee_challans(student_id);
CREATE INDEX IF NOT EXISTS idx_challans_status ON fee_challans(status);
CREATE INDEX IF NOT EXISTS idx_challans_month ON fee_challans(month);
CREATE INDEX IF NOT EXISTS idx_challans_number ON fee_challans(challan_number);
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_id ON fee_structures(class_id);

-- Step 5: Add comments for documentation
COMMENT ON TABLE fee_challans IS 'Fee challans for student fee collection and tracking';
COMMENT ON COLUMN students.admission_fee IS 'One-time admission fee paid by student';
COMMENT ON COLUMN students.fee_discount IS 'Monthly discount or scholarship amount';
COMMENT ON COLUMN students.fee_notes IS 'Reason for fee adjustment (scholarship, sibling discount, etc)';
COMMENT ON COLUMN fee_structures.is_active IS 'Whether this fee structure is currently active';
COMMENT ON COLUMN fee_structures.academic_year IS 'Academic year this fee applies to (e.g., 2024-2025)';

-- Step 6: Row Level Security (RLS) for fee_challans
ALTER TABLE fee_challans ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view challans
CREATE POLICY "Fee challans are viewable by authenticated users" ON fee_challans
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert challans
CREATE POLICY "Fee challans can be created by authenticated users" ON fee_challans
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update challans
CREATE POLICY "Fee challans can be updated by authenticated users" ON fee_challans
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);
