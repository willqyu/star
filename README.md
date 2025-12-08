# Personal CRM

A modern, full-featured Customer Relationship Management (CRM) system designed for managing personal relationships, interactions, and follow-ups. Built with Next.js 15, Supabase, and TypeScript.

## Features

### Core Functionality

- **Contacts Management**
  - Create, read, update, delete contacts
  - Store email, phone, LinkedIn, timezone, preferred communication channel
  - Add tags and notes to organize relationships
  - Track relationship score (0-100)
  - Search contacts by name, email, or company

- **Interaction Logging**
  - Log interactions with contacts (emails, calls, meetings, messages)
  - Timestamp tracking for each interaction
  - Add notes to interactions
  - View interaction timeline per contact

- **Task Management**
  - Create tasks with priority levels (Low, Medium, High)
  - Set due dates and get notified
  - Link tasks to specific contacts
  - Mark tasks as complete, snoozed, or cancelled
  - Auto-generated tasks from cadences

- **Cadences & Reminders**
  - Set up automatic follow-up reminders
  - Configure frequency (e.g., every 30 days)
  - Automatic task generation
  - One-time reminders and recurring cadences

- **Cold Contact Detection**
  - Automatically identify contacts you haven't contacted recently
  - Configurable threshold (default: 90 days)
  - Auto-generate follow-up tasks
  - Customizable per user

### Advanced Features

- **Third-Party Integrations**
  - Google Calendar sync
  - Gmail integration for email tracking
  - LinkedIn enrichment
  - SMTP email notifications
  - Slack notifications

- **Security & Privacy**
  - Row-Level Security (RLS) for user data isolation
  - Email-based authentication with Supabase Auth
  - Encrypted OAuth token storage
  - HTTPS-only communication

- **Analytics & Reporting**
  - Dashboard with overview statistics
  - Recent contacts list
  - Upcoming tasks
  - Relationship score tracking
  - Activity timeline

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **React Hook Form** - Form state management
- **Zod** - TypeScript-first schema validation
- **Sonner** - Toast notifications
- **date-fns** - Date manipulation
- **Lucide Icons** - Beautiful icon library

### Backend
- **Supabase** - PostgreSQL database as a service
- **Supabase Auth** - Authentication provider
- **Supabase Storage** - File storage
- **Edge Functions** - Serverless functions for automation
- **RLS Policies** - Row-level security

### Deployment
- **Vercel** - Next.js hosting platform
- **GitHub** - Version control and CI/CD

## Project Structure

```
personal-crm/
├── app/                           # Next.js app router
│   ├── auth/                      # Authentication pages
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/page.tsx         # Dashboard
│   ├── contacts/                  # Contacts management
│   │   ├── page.tsx               # Contacts list
│   │   ├── new/page.tsx          # Create contact
│   │   └── [id]/                  # Contact detail pages
│   │       ├── page.tsx
│   │       └── edit/page.tsx
│   ├── tasks/                     # Task management
│   │   ├── page.tsx               # Tasks list
│   │   └── new/page.tsx          # Create task
│   ├── settings/page.tsx          # User settings
│   ├── actions/                   # Server actions
│   │   ├── contacts.ts
│   │   ├── interactions.ts
│   │   ├── tasks.ts
│   │   └── cadences.ts
│   ├── layout.tsx
│   ├── page.tsx                   # Landing page
│   └── globals.css
│
├── components/                    # React components
│   ├── forms/
│   │   └── contact-form.tsx
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── label.tsx
│   │   ├── dialog.tsx
│   │   └── select.tsx
│   └── navbar.tsx
│
├── lib/                           # Utilities and libraries
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   └── server.ts              # Server client
│   ├── utils/
│   │   ├── contacts.ts
│   │   ├── interactions.ts
│   │   ├── tasks.ts
│   │   └── cadences.ts
│   ├── validation/
│   │   └── schemas.ts             # Zod schemas
│   ├── database.types.ts          # Auto-generated DB types
│   ├── utils.ts                   # Helper utilities
│
├── supabase/                      # Supabase configuration
│   ├── config.toml                # Supabase project config
│   ├── migrations/
│   │   └── 001_init.sql          # Database schema
│   └── functions/                 # Edge functions
│       ├── process-cadences/      # Cadence automation
│       └── detect-cold-contacts/  # Cold contact detection
│
├── docs/                          # Documentation
│   ├── SUPABASE_SETUP.md         # Supabase configuration guide
│   ├── INTEGRATIONS.md            # Third-party integration guides
│   └── DEPLOYMENT.md              # Vercel deployment guide
│
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── tailwind.config.ts             # TailwindCSS config
├── postcss.config.js              # PostCSS config
├── next.config.js                 # Next.js config
└── README.md                       # This file
```

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Git
- GitHub account
- Supabase account
- Vercel account (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/personal-crm.git
   cd personal-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase** (See `docs/SUPABASE_SETUP.md`)
   - Create a Supabase project
   - Run database migrations
   - Configure environment variables

4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### tables

- **contacts** - Store contact information
- **interactions** - Log interactions with contacts
- **tasks** - Manage tasks and follow-ups
- **cadences** - Configure automated reminders
- **attachments** - Store file attachments
- **user_settings** - Store user preferences

All tables include Row-Level Security policies for user isolation.

## Usage

### Creating a Contact

1. Navigate to **Contacts** page
2. Click **New Contact**
3. Fill in contact details
4. Add tags and notes
5. Submit form

### Logging an Interaction

1. Open a contact's detail page
2. Click **Log Interaction**
3. Select interaction type (email, call, meeting, etc.)
4. Add notes (optional)
5. Submit

### Creating a Task

1. Navigate to **Tasks** page
2. Click **New Task**
3. Set title, description, due date, priority
4. Link to a contact (optional)
5. Submit

### Setting Up Cadences

1. Open a contact's detail page
2. Look for related cadences section
3. Set frequency and auto-generate tasks
4. System will automatically create tasks and track follow-ups

## Integrations

The CRM supports integration with:

- **Google Calendar** - Sync meetings and auto-create interactions
- **Gmail** - Extract emails and track last contact
- **LinkedIn** - Enrich contact data
- **SMTP** - Send email notifications
- **Slack** - Receive notifications in Slack

See `docs/INTEGRATIONS.md` for detailed setup instructions.

## API Routes

### Server Actions

All major operations are implemented as Next.js Server Actions for type safety and minimal API surface.

- `app/actions/contacts.ts` - Contact CRUD
- `app/actions/interactions.ts` - Interaction logging
- `app/actions/tasks.ts` - Task management
- `app/actions/cadences.ts` - Cadence configuration

### Edge Functions

Supabase Edge Functions handle automation:

- `process-cadences` - Generate tasks from cadences (runs hourly)
- `detect-cold-contacts` - Identify stale contacts (runs daily)

## Security

- **Authentication** - Supabase Auth with email/password
- **Authorization** - Row-Level Security policies
- **Data Encryption** - OAuth tokens encrypted in database
- **HTTPS** - All communication is encrypted
- **Input Validation** - Zod schema validation on all inputs

## Performance Optimizations

- Server-side rendering with Next.js App Router
- Optimistic updates with Server Actions
- Database indexes on frequently queried columns
- Efficient search with PostgreSQL FTS
- CSS-in-JS optimization with TailwindCSS

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Code Quality

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Format code
npx prettier --write .
```

## Deployment

### To Vercel

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Set environment variables
4. Deploy

See `docs/DEPLOYMENT.md` for detailed instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## Roadmap

- [ ] Mobile app (React Native)
- [ ] AI-powered contact summaries
- [ ] Meeting transcription integration
- [ ] Advanced analytics and reporting
- [ ] Multi-user team features
- [ ] Contact import/export
- [ ] Calendar view for tasks
- [ ] Bulk operations

## Support

For issues, questions, or suggestions:

1. Check existing documentation
2. Search GitHub issues
3. Create a new issue with details
4. Contact support

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Deployed on [Vercel](https://vercel.com/)

---

**Version:** 0.1.0  
**Last Updated:** December 2025

Made with ❤️ for managing meaningful relationships
