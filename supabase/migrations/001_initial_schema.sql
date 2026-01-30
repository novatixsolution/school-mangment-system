-- =============================================
-- SCHOOL MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'CLERK', 'TEACHER')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  permissions JSONB DEFAULT '{}',
  assigned_classes UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CLASSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_name TEXT NOT NULL,
  medium TEXT NOT NULL DEFAULT 'English',
  fee_structure_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SECTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  capacity INTEGER DEFAULT 40,
  teacher_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, section_name)
);

-- =============================================
-- ADMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Student Info
  student_name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT NOT NULL,
  b_form TEXT,
  photo_url TEXT,
  
  -- Parent Info
  father_name TEXT NOT NULL,
  father_cnic TEXT,
  father_phone TEXT,
  mother_name TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  
  -- Address
  address TEXT,
  emergency_contact TEXT,
  
  -- Academic History
  previous_school TEXT,
  last_class TEXT,
  last_percentage DECIMAL,
  
  -- Medical
  blood_group TEXT,
  disease TEXT,
  allergy TEXT,
  
  -- Transport
  transport_required BOOLEAN DEFAULT FALSE,
  
  -- Class Assignment
  class_id UUID REFERENCES classes(id),
  section_id UUID REFERENCES sections(id),
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ
);

-- =============================================
-- STUDENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_id UUID REFERENCES admissions(id),
  roll_number TEXT,
  class_id UUID NOT NULL REFERENCES classes(id),
  section_id UUID NOT NULL REFERENCES sections(id),
  
  -- Basic Info
  name TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  photo_url TEXT,
  father_name TEXT,
  father_phone TEXT,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'left')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FEE STRUCTURES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id),
  name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  frequency TEXT CHECK (frequency IN ('monthly', 'quarterly', 'annual')),
  due_day INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FEE INVOICES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS fee_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES fee_structures(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  amount DECIMAL NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, fee_structure_id, month, year)
);

-- =============================================
-- FEE PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES fee_invoices(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT,
  received_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ATTENDANCE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id),
  section_id UUID NOT NULL REFERENCES sections(id),
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave')),
  marked_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- =============================================
-- SUBJECTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  class_id UUID REFERENCES classes(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EXAMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES classes(id),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EXAM SUBJECTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exam_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  total_marks INTEGER DEFAULT 100,
  passing_marks INTEGER DEFAULT 33
);

-- =============================================
-- MARKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  obtained_marks DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id, subject_id)
);

-- =============================================
-- REPORT CARDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS report_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  total_marks DECIMAL,
  obtained_marks DECIMAL,
  percentage DECIMAL,
  grade TEXT,
  rank INTEGER,
  remarks TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, exam_id)
);

-- =============================================
-- ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target TEXT NOT NULL CHECK (target IN ('school', 'class', 'section')),
  target_id UUID,
  created_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view all profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow insert during signup" ON profiles
  FOR INSERT WITH CHECK (true);

-- General read access for authenticated users
CREATE POLICY "Authenticated read access" ON classes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON sections
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON admissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON students
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON fee_structures
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON fee_invoices
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON fee_payments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON attendance
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON subjects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON exams
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON exam_subjects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON marks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON report_cards
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read access" ON documents
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Full access for authenticated users (modify based on role in application)
CREATE POLICY "Authenticated write access" ON classes
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON sections
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON admissions
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON students
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON fee_structures
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON fee_invoices
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON fee_payments
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON attendance
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON subjects
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON exams
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON exam_subjects
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON marks
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON report_cards
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON announcements
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated write access" ON documents
  FOR ALL USING (auth.uid() IS NOT NULL);

-- =============================================
-- TRIGGER FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CREATE DEFAULT OWNER ACCOUNT
-- Note: Run this after creating user via Supabase Auth
-- Replace 'YOUR_AUTH_USER_ID' with actual user ID
-- =============================================
-- INSERT INTO profiles (id, email, name, role, permissions)
-- VALUES (
--   'YOUR_AUTH_USER_ID',
--   'owner@school.com',
--   'School Owner',
--   'OWNER',
--   '{}'::jsonb
-- );
