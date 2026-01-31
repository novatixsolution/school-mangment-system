-- ============================================================================
-- ENHANCED TEMPLATE SYSTEM - Complete Database Schema
-- Migration: 021_enhanced_template_system.sql
-- ============================================================================

-- ============================================================================
-- TABLE: School Settings (For Global Branding)
-- ============================================================================

CREATE TABLE IF NOT EXISTS school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- School Information
    school_name TEXT NOT NULL DEFAULT 'My School',
    school_address TEXT,
    contact_number TEXT,
    email TEXT,
    website TEXT,
    
    -- Logo
    logo_url TEXT,
    logo_position TEXT DEFAULT 'top-left', -- 'top-left', 'top-center', 'top-right'
    logo_size TEXT DEFAULT 'medium', -- 'small', 'medium', 'large'
    
    -- Default Colors (applied globally)
    primary_color TEXT DEFAULT '#2563eb',
    secondary_color TEXT DEFAULT '#64748b',
    accent_color TEXT DEFAULT '#3b82f6',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO school_settings (school_name, school_address, contact_number) 
VALUES (
    'My School Name',
    'School Address, City',
    '0300-1234567'
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE school_settings IS 'Global school branding and contact information for challans';

-- ============================================================================
-- TABLE: Themes (Color Presets)
-- ============================================================================

CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    
    -- Color scheme
    colors JSONB DEFAULT '{
        "primary": "#2563eb",
        "secondary": "#64748b",
        "accent": "#3b82f6",
        "background": "#ffffff",
        "text": "#000000",
        "border": "#e2e8f0"
    }',
    
    -- Typography
    fonts JSONB DEFAULT '{
        "heading": "Inter",
        "body": "Inter",
        "monospace": "Courier New"
    }',
    
    is_preset BOOLEAN DEFAULT TRUE, -- Built-in themes
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert 5 default themes
INSERT INTO themes (name, display_name, description, colors, sort_order) VALUES
    (
        'professional_blue',
        'Professional Blue',
        'Clean professional design with blue accents',
        '{
            "primary": "#2563eb",
            "secondary": "#64748b",
            "accent": "#3b82f6",
            "background": "#ffffff",
            "text": "#000000",
            "border": "#cbd5e1"
        }',
        1
    ),
    (
        'nature_green',
        'Nature Green',
        'Fresh and natural green theme',
        '{
            "primary": "#16a34a",
            "secondary": "#84cc16",
            "accent": "#22c55e",
            "background": "#ffffff",
            "text": "#000000",
            "border": "#d9f99d"
        }',
        2
    ),
    (
        'royal_purple',
        'Royal Purple',
        'Elegant purple color scheme',
        '{
            "primary": "#9333ea",
            "secondary": "#a855f7",
            "accent": "#c084fc",
            "background": "#ffffff",
            "text": "#000000",
            "border": "#e9d5ff"
        }',
        3
    ),
    (
        'warm_orange',
        'Warm Orange',
        'Vibrant and energetic orange theme',
        '{
            "primary": "#ea580c",
            "secondary": "#f59e0b",
            "accent": "#fb923c",
            "background": "#ffffff",
            "text": "#000000",
            "border": "#fed7aa"
        }',
        4
    ),
    (
        'dark_mode',
        'Dark Mode',
        'Modern dark theme for reduced eye strain',
        '{
            "primary": "#60a5fa",
            "secondary": "#94a3b8",
            "accent": "#38bdf8",
            "background": "#0f172a",
            "text": "#f1f5f9",
            "border": "#334155"
        }',
        5
    )
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE themes IS 'Pre-built and custom color themes for templates';

-- ============================================================================
-- TABLE: Section Templates Library
-- ============================================================================

CREATE TABLE IF NOT EXISTS section_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    section_type TEXT NOT NULL, -- 'header', 'student_info', 'fee_table', 'footer', 'custom'
    description TEXT,
    
    -- Preview (optional)
    preview_image_url TEXT,
    
    -- Section configuration
    config JSONB DEFAULT '{}',
    
    -- Categorization
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample section templates
INSERT INTO section_templates (name, display_name, section_type, description, config, sort_order) VALUES
    (
        'header_centered_logo',
        'Centered Logo Header',
        'header',
        'School logo centered with name below',
        '{
            "show_logo": true,
            "logo_position": "center",
            "show_school_name": true,
            "show_address": true,
            "show_contact": true,
            "alignment": "center"
        }',
        1
    ),
    (
        'student_info_grid',
        'Grid Layout',
        'student_info',
        'Student information in a clean grid layout',
        '{
            "layout": "grid",
            "show_photo": false,
            "show_class": true,
            "show_roll_number": true,
            "show_father_name": true,
            "border": true
        }',
        1
    ),
    (
        'fee_table_bordered',
        'Bordered Table',
        'fee_table',
        'Traditional table with borders',
        '{
            "table_style": "bordered",
            "show_subtotal": true,
            "show_discount": true,
            "highlight_total": true,
            "stripe_rows": false
        }',
        1
    )
ON CONFLICT DO NOTHING;

COMMENT ON TABLE section_templates IS 'Library of pre-designed section layouts';

-- ============================================================================
-- TABLE: Challan Templates (Main)
-- ============================================================================

CREATE TABLE IF NOT EXISTS challan_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    
    -- Template type
    template_type TEXT DEFAULT 'custom', -- 'standard', 'bank', 'compact', 'custom'
    
    -- Template structure (JSONB for flexibility)
    structure JSONB DEFAULT '{
        "sections": [
            {
                "id": "header",
                "type": "header",
                "order": 1,
                "visible": true,
                "config": {
                    "show_logo": true,
                    "logo_position": "left",
                    "show_school_name": true,
                    "show_address": true,
                    "show_contact": true,
                    "alignment": "center",
                    "background_color": null,
                    "text_color": null,
                    "padding": 20,
                    "border": false
                }
            },
            {
                "id": "student_info",
                "type": "student_info",
                "order": 2,
                "visible": true,
                "config": {
                    "show_photo": false,
                    "show_class": true,
                    "show_roll_number": true,
                    "show_father_name": true,
                    "layout": "grid",
                    "border": true,
                    "padding": 15
                }
            },
            {
                "id": "fee_breakdown",
                "type": "fee_table",
                "order": 3,
                "visible": true,
                "config": {
                    "table_style": "bordered",
                    "show_subtotal": true,
                    "show_discount": true,  
                    "highlight_total": true,
                    "stripe_rows": false,
                    "padding": 10
                }
            },
            {
                "id": "footer",
                "type": "footer",
                "order": 4,
                "visible": true,
                "config": {
                    "footer_text": "Please pay on or before due date to avoid late fee",
                    "show_signature_line": true,
                    "show_date": true,
                    "alignment": "center",
                    "padding": 15
                }
            }
        ],
        "global_styles": {
            "primary_color": "#2563eb",
            "secondary_color": "#64748b",
            "accent_color": "#3b82f6",
            "font_family": "Inter",
            "font_size_base": 12,
            "page_margins": {
                "top": 20,
                "right": 20,
                "bottom": 20,
                "left": 20
            }
        },
        "page_settings": {
            "size": "A4",
            "orientation": "portrait",
            "copies": 1,
            "copy_labels": ["Student Copy"]
        },
        "features": {
            "show_qr_code": false,
            "qr_config": {
                "type": "url",
                "url": "",
                "size": "medium",
                "position": "bottom-right"
            },
            "show_barcode": false,
            "barcode_config": {
                "format": "CODE128",
                "show_text": true
            },
            "watermark": null,
            "background_image": null
        },
        "custom_fields": []
    }',
    
    -- Theme reference
    theme_id UUID REFERENCES themes(id),
    
    -- Uploaded images
    images JSONB DEFAULT '[]',
    
    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Versioning
    parent_template_id UUID REFERENCES challan_templates(id),
    change_log TEXT,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default standard template
INSERT INTO challan_templates (
    name, 
    display_name, 
    description, 
    template_type,
    theme_id,
    is_default
) VALUES (
    'standard_template',
    'Standard Template',
    'Clean modern template with all essential sections',
    'standard',
    (SELECT id FROM themes WHERE name = 'professional_blue' LIMIT 1),
    true
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE challan_templates IS 'Custom challan templates with flexible JSONB structure';

-- ============================================================================
-- Update fee_challans to reference template
-- ============================================================================

-- Add template reference to challans
ALTER TABLE fee_challans 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES challan_templates(id);

-- Set default template for existing challans
UPDATE fee_challans 
SET template_id = (SELECT id FROM challan_templates WHERE is_default = true LIMIT 1)
WHERE template_id IS NULL;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_templates_active ON challan_templates(is_active, template_type);
CREATE INDEX IF NOT EXISTS idx_templates_default ON challan_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_themes_active ON themes(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_section_templates_type ON section_templates(section_type, is_active);
CREATE INDEX IF NOT EXISTS idx_challans_template ON fee_challans(template_id);

-- ============================================================================
-- Utility Functions
-- ============================================================================

-- Function to get default template
CREATE OR REPLACE FUNCTION get_default_template()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM challan_templates WHERE is_default = true LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- Function to duplicate template
CREATE OR REPLACE FUNCTION duplicate_template(p_template_id UUID, p_new_name TEXT)
RETURNS UUID AS $$
DECLARE
    v_new_id UUID;
    v_template_data RECORD;
BEGIN
    -- Get original template
    SELECT * INTO v_template_data
    FROM challan_templates
    WHERE id = p_template_id;
    
    -- Insert duplicate
    INSERT INTO challan_templates (
        name,
        display_name,
        description,
        template_type,
        structure,
        theme_id,
        images,
        parent_template_id,
        created_by
    ) VALUES (
        p_new_name,
        v_template_data.display_name || ' (Copy)',
        v_template_data.description,
        'custom',
        v_template_data.structure,
        v_template_data.theme_id,
        v_template_data.images,
        p_template_id,
        auth.uid()
    )
    RETURNING id INTO v_new_id;
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION duplicate_template IS 'Create a copy of an existing template';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check templates
SELECT id, display_name, template_type, is_default FROM challan_templates;

-- Check themes
SELECT id, display_name, colors->>'primary' as primary_color FROM themes WHERE is_active = true;

-- Check section templates
SELECT display_name, section_type FROM section_templates WHERE is_active = true;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Enhanced Template System Migration Complete!';
    RAISE NOTICE '📋 Tables created:';
    RAISE NOTICE '   - school_settings (1 default record)';
    RAISE NOTICE '   - themes (5 presets)';
    RAISE NOTICE '   - section_templates (library)';
    RAISE NOTICE '   - challan_templates (enhanced structure)';
    RAISE NOTICE '🎨 Features enabled:';
    RAISE NOTICE '   - Drag & drop sections';
    RAISE NOTICE '   - Theme presets';
    RAISE NOTICE '   - QR code support';
    RAISE NOTICE '   - Barcode support';
    RAISE NOTICE '   - Custom fields';
    RAISE NOTICE '   - Multiple images';
    RAISE NOTICE 'Ready to build UI!';
END $$;
