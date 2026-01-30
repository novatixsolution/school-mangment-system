-- Migration: Add Payment Reminder History Tracking
-- This creates a table to track all payment reminders sent

-- Create reminder_history table (with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS reminder_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challan_id UUID REFERENCES fee_challans(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL, -- 'sms', 'email', 'both'
    template_used TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_by UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed', 'pending'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_reminder_history_challan ON reminder_history(challan_id);
CREATE INDEX IF NOT EXISTS idx_reminder_history_student ON reminder_history(student_id);
CREATE INDEX IF NOT EXISTS idx_reminder_history_sent_at ON reminder_history(sent_at);

-- Create reminder_templates table (with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS reminder_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    template_type VARCHAR(20) NOT NULL, -- 'sms', 'email'
    subject VARCHAR(200), -- For email
    message_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active templates (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_reminder_templates_active ON reminder_templates(is_active) WHERE is_active = TRUE;

-- Insert default SMS template (ON CONFLICT DO NOTHING prevents duplicates)
INSERT INTO reminder_templates (name, template_type, message_template, is_active)
VALUES (
    'Default SMS Reminder',
    'sms',
    'Dear Parent, Fee challan {challan_number} for {student_name} (Class {class_name}) of Rs {amount} is due on {due_date}. Please pay at your earliest. - School Management',
    TRUE
) ON CONFLICT DO NOTHING;

-- Insert default Email template (ON CONFLICT DO NOTHING prevents duplicates)
INSERT INTO reminder_templates (name, template_type, subject, message_template, is_active)
VALUES (
    'Default Email Reminder',
    'email',
    'Fee Payment Reminder - {student_name}',
    'Dear Parent,

This is a reminder that the fee payment for {student_name} (Class {class_name}) is due.

Challan Number: {challan_number}
Month: {month}
Amount: Rs {amount}
Due Date: {due_date}
Days Remaining: {days_remaining}

Please make the payment at your earliest convenience to avoid any late fees.

Thank you,
School Management',
    TRUE
) ON CONFLICT DO NOTHING;

-- Add comments (safe to run multiple times)
COMMENT ON TABLE reminder_history IS 'Tracks all payment reminders sent to students/parents';
COMMENT ON TABLE reminder_templates IS 'Templates for SMS and Email reminders';
COMMENT ON COLUMN reminder_history.reminder_type IS 'Type of reminder: sms, email, or both';
COMMENT ON COLUMN reminder_history.status IS 'Status of reminder: sent, failed, or pending';
