-- Update existing templates to have correct structure format
-- Run this AFTER creating templates in builder

UPDATE challan_templates
SET structure = jsonb_set(
  structure,
  '{columns}',
  COALESCE(structure->'page_settings'->>'copies', '3')::text::jsonb,
  true
)
WHERE structure->'columns' IS NULL;

UPDATE challan_templates
SET structure = jsonb_set(
  structure,
  '{orientation}',
  to_jsonb(COALESCE(structure->'page_settings'->>'orientation', 'landscape')),
  true
)
WHERE structure->'orientation' IS NULL;

UPDATE challan_templates
SET structure = jsonb_set(
  structure,
  '{primary_color}',
  to_jsonb(COALESCE(structure->'global_styles'->>'primary_color', '#2563eb')),
  true
)
WHERE structure->'primary_color' IS NULL;

UPDATE challan_templates
SET structure = jsonb_set(
  structure,
  '{secondary_color}',
  to_jsonb(COALESCE(structure->'global_styles'->>'secondary_color', '#16a34a')),
  true
)
WHERE structure->'secondary_color' IS NULL;

UPDATE challan_templates
SET structure = jsonb_set(
  structure,
  '{show_qr}',
  COALESCE(structure->'features'->'show_qr_code', 'false')::jsonb,
  true
)
WHERE structure->'show_qr' IS NULL;

-- Verify updated structure
SELECT 
  display_name,
  structure->>'columns' as columns,
  structure->>'orientation' as orientation,
  structure->>'primary_color' as primary_color,
  structure->>'show_qr' as show_qr
FROM challan_templates;
