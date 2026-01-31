# EduManager - School Management System v2.1

A comprehensive, modern school management system built with Next.js 14, TypeScript, Tailwind CSS, and Supabase PostgreSQL.

## 🆕 Version 2.1 - Template System Integration

### New Features in v2.1:
- ✨ **Template Builder** - Visual challan template designer
- 🎨 **Customization** - Logo, signature, colors, QR codes
- 📄 **Auto-population** - Student data from database
- 🔗 **Dynamic QR Codes** - Challan verification via QR scan
- 📱 **Verification Page** - `/verify/[challanId]` for QR scanning
- 🏫 **School Branding** - Custom branding per school

## Features

### 🔐 Authentication & Roles
- **Supabase Auth** for secure authentication
- **Three user roles**: Owner (Super Admin), Clerk, Teacher
- **Permission-based access control** with granular permissions
- Role-based dashboard routing

### 👥 Staff Management (Owner only)
- Create, edit, delete staff accounts
- Assign roles (Clerk/Teacher)
- Manage permissions per staff member
- Enable/disable accounts
- Password reset

### 📚 Classes & Sections
- Create and manage classes
- Add sections per class
- Assign teachers to sections
- Set class capacity
- Medium selection (English/Urdu)

### 📝 Admissions
- **7-step admission form**:
  1. Student Info
  2. Parent Info
  3. Address
  4. Academic History
  5. Medical Info
  6. Transport
  7. Documents
- Auto-approve option based on permissions
- Approval workflow (Pending → Approved/Rejected)
- Automatic student record creation on approval

### 👨‍🎓 Students
- Complete student profiles
- Class/Section assignment
- Photo management
- Parent contact information
- Academic history tracking

### 💰 Fee Management (v2.1 Enhanced)
- Create fee structures per class
- Monthly/Quarterly/Annual frequencies
- Due date configuration
- **🆕 Template-based Challan generation**
- **🆕 Customizable challan design**
- **🆕 QR code verification**
- Payment recording with partial payment support
- Payment history

### 📅 Attendance
- Daily attendance marking
- Class/Section selection
- Present/Absent/Late/Leave status
- Bulk marking options
- Attendance reports

### 📊 Exams & Results
- Create exams per class
- Subject-wise marks entry
- Auto-calculation of:
  - Total marks
  - Percentage
  - Grade
- Report card generation

### 📢 Announcements
- School-wide announcements
- Class-specific announcements
- Section-specific announcements
- Expiration dates

### 💾 Backup & Restore
- Export all data as JSON
- Import from backup
- System reset option

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Supabase | PostgreSQL database + Auth + Storage |
| Recharts | Charts and analytics |
| Lucide React | Icons |
| jsPDF | PDF generation |
| html2canvas | HTML to image conversion |
| qrcode.react | QR code generation |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
git clone https://github.com/novatixsolution/school-mangment-system.git
cd school-management-system
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration scripts in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/021_enhanced_template_system.sql` (for v2.1)
   - `supabase/migrations/022_verify_template_connection.sql`
   - `supabase/migrations/023_fix_template_structure.sql`
3. Create Storage buckets:
   - `photos`
   - `documents`
   - `report-cards`
   - `challans`

### 3. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Create Default Owner Account

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter:
   - Email: `owner@school.com`
   - Password: `Owner@12345`
4. Get the user's ID from the users list
5. Run this SQL in SQL Editor:

```sql
INSERT INTO profiles (id, email, name, role, permissions)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',
  'owner@school.com',
  'School Owner',
  'OWNER',
  '{}'::jsonb
);
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Login

- **Email**: owner@school.com
- **Password**: Owner@12345

## v2.1 Template System Setup

### 1. Configure School Settings

Go to **Settings → School Settings** and configure:
- School name
- Contact details
- Upload logo
- Set default colors

### 2. Create Challan Template

1. Navigate to **Settings → Template Builder**
2. Design your challan:
   - Choose 2 or 3 columns
   - Select portrait or landscape
   - Upload logo and signature
   - Pick primary and secondary colors
   - Enable QR code (optional)
3. Click **"Save as Default Template"**

### 3. Generate Challans

1. Go to **Students**
2. Click **"Generate Challan"** for any student
3. Select month and fees
4. Click generate
5. **Print dialog opens automatically with your template!**

### 4. QR Code Verification

- Scan QR code on printed challan
- Opens: `https://yoursite.com/verify/{challan_id}`
- Shows challan details and payment status

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Login page
│   ├── owner/             # Owner dashboard pages
│   │   └── settings/
│   │       └── template-builder/  # 🆕 Template builder
│   ├── verify/
│   │   └── [challanId]/   # 🆕 QR verification page
│   ├── clerk/             # Clerk dashboard pages
│   └── teacher/           # Teacher dashboard pages
├── components/
│   ├── ui/                # Reusable UI components
│   ├── template-builder/  # 🆕 Template builder components
│   └── layout/            # Layout components
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── challan-template-service.ts    # 🆕 Template database operations
│   ├── challan-template-renderer.ts   # 🆕 Template HTML renderer
│   ├── challan-pdf-generator.ts       # 🆕 PDF generation
│   ├── qr-generator.ts                # 🆕 QR code generation
│   ├── school-settings.ts             # 🆕 School settings service  
│   └── utils.ts           # Utility functions
└── types/                 # TypeScript interfaces
```

## Database Schema (v2.1)

### New Tables in v2.1:
- `challan_templates` - Saved challan templates
- `school_settings` - School branding and info
- `themes` - Color themes
- `section_templates` - Section layout library

### Existing Tables:
- `profiles` - User profiles with roles and permissions
- `classes` - School classes
- `sections` - Sections within classes
- `admissions` - Admission applications
- `students` - Student records
- `fee_structures` - Fee configuration
- `fee_challans` - Fee challans (🆕 now has `template_id`)
- `fee_payments` - Payment records
- `attendance` - Daily attendance
- `exams` - Examination records
- `marks` - Student marks
- `report_cards` - Report card data
- `announcements` - School announcements
- `documents` - File metadata

## Deployment

### Vercel (Recommended)

1. Push to GitHub (v2.1 tag)
2. Import in Vercel
3. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_APP_URL
   ```
4. Deploy
5. Vercel auto-deploys on every push to `main`

### Railway (Database)

1. Create new project
2. Add PostgreSQL service
3. Run migrations from Supabase SQL Editor

## Version History

- **v2.1** (2026-01-31) - Template System Integration
  - Template builder UI
  - Auto-population from database
  - Dynamic QR codes
  - School branding
  - Print system integration

- **v2.0** (Previous) - Challan System
  - Fee challan generation
  - Payment tracking
  - Basic PDF generation

## Support

For issues and feature requests, please create an issue in the repository.

## License

MIT License - feel free to use for your school!
