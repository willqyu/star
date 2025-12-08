# Personal CRM - Setup Instructions

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18.17 or later) - [Download here](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **Git** (already initialized in this repo)

## Initial Setup

### Step 1: Install Dependencies

Run this command in the project root:

```bash
npm install
```

This will install all required dependencies including:
- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- Supabase client
- Zod validation
- React Hook Form
- And more...

### Step 2: Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Optional: Analytics & Error Tracking
NEXT_PUBLIC_SENTRY_DSN=optional_sentry_dsn
```

**Note:** See `SUPABASE_SETUP.md` for detailed Supabase configuration instructions.

### Step 3: Set Up Supabase

Follow the instructions in `docs/SUPABASE_SETUP.md` to:
1. Create a Supabase project
2. Run database migrations
3. Configure RLS policies
4. Set up storage buckets

### Step 4: Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Step 5: Build for Production

```bash
npm run build
npm run start
```

---

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/
│   ├── contacts/
│   ├── tasks/
│   ├── settings/
│   └── auth/
├── components/             # React components
│   ├── forms/
│   ├── ui/
│   ├── contacts/
│   └── tasks/
├── packages/               # Shared code
│   ├── types/             # TypeScript types & Zod schemas
│   ├── utils/             # Utilities & helpers
│   └── ui/                # shadcn/ui components
├── lib/                    # Libraries & helpers
│   ├── supabase/          # Supabase client config
│   ├── validation/        # Zod schemas
│   └── utils/             # Utility functions
├── supabase/              # Supabase configuration
│   ├── migrations/        # SQL migrations
│   ├── functions/         # Edge functions
│   └── config.toml        # Supabase CLI config
├── docs/                  # Documentation
│   ├── SUPABASE_SETUP.md
│   ├── INTEGRATIONS.md
│   └── DEPLOYMENT.md
└── package.json
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run tests |
| `npx supabase start` | Start local Supabase instance |
| `npx supabase migration new <name>` | Create new migration |

---

## Troubleshooting

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Node modules issues
```bash
rm -r node_modules package-lock.json
npm install
```

### Supabase connection issues
- Verify `.env.local` has correct keys
- Check Supabase project is running
- Review RLS policies in dashboard

---

## Next Steps

1. Complete the Supabase setup (see `docs/SUPABASE_SETUP.md`)
2. Create your first contact via the UI
3. Explore the dashboard
4. Check integration guides in `docs/INTEGRATIONS.md`

For detailed documentation, see the `/docs` directory.
