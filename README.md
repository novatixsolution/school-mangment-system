<<<<<<< HEAD
# EduManager - School Management System

A comprehensive, modern school management system built with Next.js 14, TypeScript, Tailwind CSS, and Supabase PostgreSQL.

![EduManager](https://via.placeholder.com/1200x600/4F46E5/ffffff?text=EduManager+School+Management+System)

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

### 💰 Fee Management
- Create fee structures per class
- Monthly/Quarterly/Annual frequencies
- Due date configuration
- Fee invoice (Challan) generation
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
| JSZip | ZIP file creation |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
cd school-management-system
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration script:
   - Copy contents from `supabase/migrations/001_initial_schema.sql`
   - Run in SQL Editor
3. Create Storage buckets:
   - `photos`
   - `documents`
   - `report-cards`
   - `challans`

### 3. Configure Environment

The `.env.local` file is already configured with your Supabase credentials.

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

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Login page
│   ├── owner/             # Owner dashboard pages
│   ├── clerk/             # Clerk dashboard pages
│   └── teacher/           # Teacher dashboard pages
├── components/
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── contexts/
│   └── AuthContext.tsx    # Authentication context
├── lib/
│   ├── supabase/          # Supabase clients
│   └── utils.ts           # Utility functions
└── types/                 # TypeScript interfaces
```

## Database Schema

The system uses these main tables:
- `profiles` - User profiles with roles and permissions
- `classes` - School classes
- `sections` - Sections within classes
- `admissions` - Admission applications
- `students` - Student records
- `fee_structures` - Fee configuration
- `fee_invoices` - Fee challans
- `fee_payments` - Payment records
- `attendance` - Daily attendance
- `exams` - Examination records
- `marks` - Student marks
- `report_cards` - Report card data
- `announcements` - School announcements
- `documents` - File metadata

## Permissions System

Permissions are stored as JSON and checked at the component level:

```typescript
// Example permission categories
{
  "admissions.create": true,
  "admissions.approve": false,
  "fees.collect": true,
  "attendance.mark": true
}
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

## Support

For issues and feature requests, please create an issue in the repository.

## License

MIT License - feel free to use for your school!
=======
# Py-test-New.
A Proof of Concept (PoC) for a School Management System using a decoupled architecture. Integrates a Next.js frontend with a Python (FastAPI) backend hosted on Railway and Supabase (PostgreSQL) for the database.
>>>>>>> 208eadc950ab7ce2f3fad4e5c8f3f29986b11a55
