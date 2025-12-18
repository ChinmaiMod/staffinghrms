# Staffing HRMS - Employee Management System

Multi-tenant HRMS system for managing employees across IT and Healthcare staffing, built with React + Supabase.

## 🚀 Quick Links

- **GitHub Repository:** https://github.com/ChinmaiMod/staffinghrms
- **Related Project:** [Staffing CRM](https://github.com/ChinmaiMod/staffingcrm10092025)
- **Documentation:** See `HRMS_DATA_MODEL.md` and `HRMS_PROJECT_PLAN.md`

## 📋 Overview

Staffing HRMS is a comprehensive employee management system designed for staffing agencies managing:
- **Internal Employees** (India & USA)
- **IT Contractors** (USA)
- **Healthcare Professionals** (USA)

### Key Features

✅ **Employee Management**
- Complete employee profiles with multi-type support
- **Employee Code Format:** `<business_short_name><5-digit-seq>` (e.g., `IES00001` for Intuites LLC)
- Time-based address history tracking
- SSN encryption and secure data handling

✅ **Smart Document Management**
- Customizable checklists per employee type
- AI-powered document parsing (OpenRouter Claude)
- Version control with expiry tracking
- Automated compliance alerts

✅ **Project Management**
- Complex vendor chain visualization (up to 10 levels)
- LCA project tracking for visa holders
- Rate management with tenure/volume discounts
- MSA/PO and COI tracking

✅ **Compliance Manager**
- Automated reminders (30 days before expiry)
- Priority-based compliance tracking
- Document expiry monitoring
- Visa renewal alerts
- Amendment requirement detection

✅ **Timesheet System**
- Daily/Weekly/Monthly time tracking
- Approval workflows
- Project-based time allocation

✅ **CRM Integration**
- Seamless bridge with Staffing CRM
- Contact-to-Employee conversion
- Shared lookup tables

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **State Management:** Context API
- **Forms:** React Hook Form + Yup
- **Styling:** Custom CSS (matching CRM)

### Backend
- **Database:** Supabase (PostgreSQL 15)
- **Functions:** Supabase Edge Functions (Deno)
- **Storage:** Supabase Storage
- **Auth:** Supabase Auth

### External Services
- **AI Parsing:** OpenRouter API (Claude)
- **Email:** Resend API
- **Billing:** Stripe (shared with CRM)
- **Hosting:** Vercel

## 📁 Project Structure

```
D:\Staffing-HRMS\
├── src/
│   ├── components/
│   │   └── HRMS/
│   │       ├── Dashboard/
│   │       ├── Employees/
│   │       ├── Documents/
│   │       ├── Compliance/
│   │       ├── Projects/
│   │       ├── Timesheets/
│   │       └── Visa/
│   ├── contexts/
│   ├── api/
│   └── utils/
├── supabase/
│   ├── functions/
│   └── migrations/
├── HRMS_DATA_MODEL.md
├── HRMS_PROJECT_PLAN.md
└── README.md
```

## 🗄️ Database Schema

**35 Core Tables** (all prefixed with `hrms_`) - Optimized via universal checklist architecture

### Core Tables
- `hrms_employees` - Employee master data (employee_code format: `IES00001`)
- `hrms_employee_sequences` - Auto-increment sequence per business for employee codes
- `hrms_employee_addresses` - Time-based address history
- `hrms_checklist_types` - Admin-configurable checklist type definitions
- `hrms_checklist_templates` - **UNIVERSAL** checklist templates for ALL document types
- `hrms_checklist_groups` - Document grouping (e.g., Educational Docs, Project Docs)
- `hrms_checklist_items` - Individual checklist items
- `hrms_documents` - **UNIVERSAL** document storage (employee, project, timesheet, compliance)

### Project Management
- `hrms_projects` - Employee projects with financials
- `hrms_project_rate_history` - Tracks rate changes with effective dates
- `hrms_project_vendors` - Vendor chain (up to 10 levels)
- `hrms_timesheets` - Time tracking
- `hrms_timesheet_entries` - Daily time entries

### Visa & Immigration
- `hrms_visa_statuses` - Visa history with expiry tracking
- `hrms_dependents` - Family members
- `hrms_lca_job_titles` - LCA job titles for H1B/L1 compliance with SOC codes

### Compliance
- `hrms_compliance_items` - Compliance tracking
- `hrms_compliance_reminders` - Automated reminder schedules

### Employee Tickets/Support System ⭐ NEW
- `hrms_tickets` - **NEW:** Employee support tickets (HR/Immigration departments)
- `hrms_ticket_sequences` - **NEW:** Auto-generated ticket numbers (TKT-2025-0042)
- `hrms_ticket_comments` - **NEW:** Comments and messages on tickets
- `hrms_ticket_attachments` - **NEW:** File attachments for tickets
- `hrms_ticket_status_history` - **NEW:** Status change audit trail
- `hrms_ticket_request_types` - **NEW:** Configurable request types per department

### Additional Features
- `hrms_employee_resumes` - Multiple resumes per employee
- `hrms_background_checks` - Background verification
- `hrms_performance_reports` - Annual reviews
- `hrms_notifications` - In-app notifications
- `hrms_email_templates` - Customizable email templates
- `hrms_newsletters` - Employee communications
- `hrms_ai_prompts` - AI prompt templates for newsletter generation
- `hrms_suggestions` - Ideas and feedback
- `hrms_issue_reports` - Bug tracking
- `crm_hrms_contact_bridge` - CRM integration bridge

### CRM-Linked Reference Tables (Managed in CRM, Referenced in HRMS)
- `businesses` - Company/business entities
- `countries` - Country reference data
- `states` - State/province reference data
- `cities` - City reference data
- `job_title` - IT job titles
- `visa_status` - Visa type reference data

**See `HRMS_DATA_MODEL.md` for complete schema details.**

## 🎯 Core Features

### 1. Universal Document Checklist System ⭐ NEW ARCHITECTURE
**Key Innovation:** Single, reusable checklist system for ALL document types across the entire HRMS.

**Supported Checklist Types:**
- 📋 **Immigration Checklists** - I9, W4, H1B, Passport, Visa documents
- 📋 **Project Checklists** - MSA, PO, COI, Vendor agreements
- 📋 **Timesheet Checklists** - Supporting documents, receipts
- 📋 **Compliance Checklists** - Regulatory documents, certifications
- 📋 **Onboarding Checklists** - Employee onboarding documents
- 📋 **Offboarding Checklists** - Exit documents
- 📋 **Background Check Checklists** - Verification documents
- 📋 **Performance Review Checklists** - Review supporting documents
- 📋 **Custom Checklists** - Any other document workflow

Create customizable checklists for each context:

**Example 1: IT Employee Immigration Checklist** (`checklist_type='immigration'`)
- Group 1: Immigration Documents (I9, W4, H1B Copy, Passport)
- Group 2: Educational Documents (Bachelor's, Master's)

**Example 2: Healthcare Employee Immigration Checklist** (`checklist_type='immigration'`)
- Group 1: Licenses (BLS, Nursing License)
- Group 2: Certifications (Dementia Training, Physical Fit Test)
- Group 3: Background Checks (NH Police Report, Background Check)

**Example 3: Project Document Checklist** (`checklist_type='project'`)
- Group 1: Legal Agreements (MSA, Purchase Order)
- Group 2: Insurance (Certificate of Insurance, Liability Coverage)
- Group 3: Client Documents (SOW, Rate Sheet)

**Example 4: Timesheet Document Checklist** (`checklist_type='timesheet'`)
- Group 1: Supporting Documents (Receipts, Expense Reports)
- Group 2: Approvals (Manager Approval, Client Approval)

**Universal Features:**
- ✅ Optional checklist items (not all apply to all contexts)
- ✅ AI-powered date extraction from ALL documents
- ✅ Automatic compliance item creation for items with expiry dates
- ✅ Version control (track renewals: passports, MSAs, COIs, etc.)
- ✅ Polymorphic document storage (employee, project, timesheet, compliance)
- ✅ Metadata flexibility (JSONB for document numbers, policy numbers, etc.)

### 2. Universal Document Storage Architecture

**Key Benefits of Generalized Checklist System:**

#### Before (29 tables):
- Separate tables for MSA/PO (`hrms_project_msa_po`)
- Separate table for COI (`hrms_project_coi`)
- Employee-specific documents (`hrms_employee_documents`)
- Rigid structure, hard to extend

#### After (26 tables): ⭐
- **Single document table** (`hrms_documents`) for ALL contexts
- **Single checklist system** for ALL workflows
- **Polymorphic storage:** `entity_type` + `entity_id` pattern
- **Easy to extend:** Add new `checklist_type` without schema changes

**Usage Examples:**
```sql
-- Employee H1B document
entity_type='employee', entity_id=employee_id, document_type='h1b'

-- Project MSA
entity_type='project', entity_id=project_id, document_type='msa'

-- Project COI
entity_type='project', entity_id=project_id, document_type='coi'

-- Timesheet attachment
entity_type='timesheet', entity_id=timesheet_id, document_type='timesheet'
```

### 3. AI Document Parsing
Upload any document → AI extracts:
- Document type
- Start date
- Expiry date
- Document numbers (MSA #, PO #, Policy #)
- Other metadata

Uses **OpenRouter Claude** for high accuracy across ALL document types.

### 4. Compliance Reminders

**Automated Alerts (Works for ALL document types):**
1. **Employee Document Expiry** → 30 days before (passport, visa, license, etc.)
2. **Visa Renewal** → 60 days before H1B expiry
3. **Project Document Expiry** → 30 days before MSA/PO/COI end date
4. **I9/E-Verify** → Triggered when new visa uploaded
5. **Amendment Required** → New project added for visa holder
6. **Timesheet Document Expiry** → If timesheet supporting docs have expiry dates

**Recipients:** Employee + HRMS administrators + Project managers

### 5. Project Vendor Chain
Visual representation of complex vendor chains:

```
Employee (Your Company)
  ↓ Vendor 4
    ↓ Vendor 3
      ↓ Vendor 2
        ↓ Vendor 1
          ↓ End Client
```

Track contact details for each vendor (CEO, HR, Finance, Invoicing).

### 6. LCA Project Tracking
Special handling for visa holders:
- Only ONE LCA project allowed at a time
- Adding new LCA project triggers amendment alert
- Public Access Folder URL storage
- LCA rate tracking vs actual pay rate

## 🚦 Getting Started (Once Setup Complete)

### Prerequisites
- Node.js 18+
- Supabase account
- OpenRouter API key
- Resend API key (shared with CRM)

### Installation

```bash
# Clone the repository
git clone https://github.com/ChinmaiMod/staffinghrms.git
cd staffinghrms

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_FUNCTIONS_URL=your_edge_functions_url
```

## 📚 Documentation

- **[Data Model](HRMS_DATA_MODEL.md)** - Complete database schema with 29 tables
- **[Project Plan](HRMS_PROJECT_PLAN.md)** - 12-week implementation roadmap
- **[Requirements](Staffing_HRMS_Requirements.pdf)** - Original requirements document

## 🏗️ Development Workflow

### TDD-Guard Best Practices
1. **Analysis** - Review requirements and dependencies
2. **Write Tests** - Create failing tests first
3. **Implement** - Write minimum code to pass tests
4. **Verify** - Run tests, linting, build
5. **Document** - Update docs and commit
6. **Deploy** - Push to main → auto-deploy to Vercel

### Git Workflow
```bash
# Make changes
git add .
git commit -m "feat: add employee document upload"
git push origin main  # Auto-deploys to Vercel
```

## 📅 Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- Repository setup
- Database migrations
- Auth & Tenant context

### Phase 2: Core Features (Week 3-4)
- Employee management
- Document checklist system
- AI document parsing

### Phase 3: Compliance (Week 5-6)
- Compliance dashboard
- Automated reminders
- Email notifications

### Phase 4: Projects (Week 7-8)
- Project management
- Vendor chain builder
- Timesheet system

### Phase 5-6: Additional Features (Week 9-11)
- Visa tracking
- Resumes & background checks
- Performance reviews
- Notifications & newsletters

### Phase 7: Integration (Week 12)
- CRM-HRMS bridge
- Data migration
- Testing & deployment

**See `HRMS_PROJECT_PLAN.md` for detailed breakdown.**

## 🔒 Security

- **Multi-Tenant Isolation:** Row Level Security (RLS) on all tables
- **SSN Encryption:** Sensitive data encrypted at rest
- **Audit Trail:** All changes tracked with created_by/updated_by
- **Role-Based Access:** Shared with CRM role system
- **JWT Authentication:** Supabase Auth tokens

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Check coverage
npm run test:coverage
```

## 📊 Menu Structure

```
HRMS Dashboard
├── Employee Management
├── Employee Project
├── Compliance Dashboard
├── Compliance Manager
├── Data Administration
│   ├── Checklist Templates
│   └── Email Templates
├── Notifications
├── Newsletter
├── Suggestions/Ideas
└── Report an Issue
```

## 🔗 CRM Integration

### Bridge Mechanism
- **Table:** `crm_hrms_contact_bridge` (in both databases)
- **Sync:** Edge function for bidirectional updates
- **Trigger:** When CRM contact becomes "Placed into Job"

### Shared Resources
- Lookup tables (`job_titles`, `visa_status`, `cities`, `states`, `countries`)
- Tenant and business structure
- User authentication
- Stripe billing

## 🤝 Contributing

1. Follow TDD workflow for all changes
2. Write tests before implementation
3. Ensure all tests pass before committing
4. Follow existing code patterns from CRM
5. Update documentation as needed
6. Push to main branch for auto-deployment

## 📝 License

Proprietary - All rights reserved by Intuites LLC

## 📞 Support

- **Issues:** Report via "Report an Issue" in HRMS
- **Suggestions:** Submit via "Suggestions/Ideas" menu
- **Email:** contact@intuites.com

---

**Status:** 🏗️ Planning & Design Phase  
**Version:** 0.1.0 (Pre-release)  
**Last Updated:** November 9, 2025  

**Next Steps:** 
1. Review and approve data model
2. Review and approve project plan  
3. Initialize repository on GitHub
4. Begin Phase 1 implementation
