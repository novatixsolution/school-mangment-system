# Quick Upload Script - v2.1

# Navigate to project
cd d:\AAAAA\school-management-system

# 1. Create backup (safety first!)
git branch backup-before-v2.1

# 2. Check what's changed
git status

# 3. Add all changes
git add .

# 4. Commit with message
git commit -m "v2.1: Complete Template System Integration

✨ New Features:
- Template Builder UI with customization
- Auto-population of student data from database
- Dynamic QR codes with verification page
- School branding (logo, signature, colors)
- Print system integrated with templates

🔧 Technical Changes:
- New services: template-service, qr-generator, school-settings, template-renderer
- Rewritten: challan-pdf-generator
- Updated: challan modals, print pages
- New pages: /verify/[challanId], /template-builder
- Migrations: 021, 022, 023

📊 Database:
- challan_templates table
- school_settings table  
- themes and section_templates
- template_id added to fee_challans"

# 5. Create v2.1 tag
git tag -a v2.1-template-system -m "v2.1: Template System - Auto-populate challans with saved templates"

# 6. Push everything
git push origin main
git push origin --tags

# 7. Verify
echo "✅ Uploaded to GitHub!"
echo "Check: https://github.com/novaticsolution/school-management-system"
echo ""
echo "📌 Tags:"
git tag

# If you need to rollback to v2.0:
# git checkout v2.0-challan-issues-just
