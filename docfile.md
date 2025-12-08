# Personal CRM – Full Design + Implementation Spec (Next.js + Supabase Optimized)

This is a unified specification intended for direct consumption by a development agent. It includes architecture, data modeling, implementation strategy, recommended frameworks, and operational details tailored to a **Next.js + Supabase** stack.

---

# 1. System Goal

Build a personal CRM that tracks relationships, logs interactions, manages tasks and follow-ups, detects cold contacts, and automates recurring reminders.

System must be:

* Fast to build and iterate
* Low maintenance
* Scalable for future AI features and mobile clients
* Fully typed end-to-end
* Secure with strict multi-user isolation

The chosen stack is **Next.js (App Router) + Supabase**.

---

# 2. Architecture Overview

## 2.1 Frontend

* **Next.js (App Router) + TypeScript**
* Server Components for data loading
* Client Components for forms, task actions, real-time updates
* TailwindCSS for styling
* React Query *optional* (can rely on Server Actions and real-time instead)

## 2.2 Backend

Handled via:

* **Supabase Edge Functions** (secure server logic)
* **Next.js Server Actions** (RPC-like backend)
* Supabase Postgres as primary query engine
* Row-Level Security for user isolation

## 2.3 Database

* Supabase Postgres
* Prisma ORM **optional** — Supabase client + SQL also valid

## 2.4 Scheduling / Background Jobs

* **Supabase Scheduled Functions** (cron)
* Run hourly or daily
* Used for: recurring cadences, cold-contact detection, task generation

## 2.5 Storage

* Supabase Storage (attachments)
* Bucket: `attachments/`

## 2.6 Integrations

* OAuth tokens stored encrypted
* External API calls via Edge Functions

---

# 3. Data Model

## contacts

```
id uuid pk
user_id uuid fk -> users.id
first_name text
last_name text
company text
role text
email text
phone text
linkedin_url text
tags text[]
relationship_score int default 0
met_at timestamp
timezone text
preferred_channel text
last_interaction_at timestamp
notes text
created_at timestamp
updated_at timestamp
```

Indexes:

* FTS on (first_name, last_name, company, notes)
* unique(email, user_id)

## interactions

```
id uuid pk
user_id uuid
type text
timestamp timestamp
notes text
contact_id uuid fk
attachments text[]
created_at timestamp
```

## tasks

```
id uuid pk
user_id uuid
contact_id uuid nullable
title text
description text
due_at timestamp
status text (open, completed, snoozed, cancelled)
priority int
auto_generated bool default false
created_at timestamp
updated_at timestamp
completed_at timestamp
```

## cadences

```
id uuid pk
user_id uuid
contact_id uuid
frequency_days int
next_run_at timestamp
last_generated_at timestamp
active bool
```

## attachments

```
id uuid pk
contact_id uuid
interaction_id uuid nullable
filename text
url text
content_type text
size int
uploaded_at timestamp
```

RLS: every table includes `user_id = auth.uid()` match.

---

# 4. API + Framework Strategy

Use a hybrid approach:

* **Next.js Server Actions** for CRUD (fast, type-safe, minimal API surface)
* **Supabase Edge Functions** for sensitive logic:

  * Merge duplicates
  * Calendar sync
  * Email parsing
  * Reminder/cadence generation

## Patterns

* Server Actions = lightweight synchronous operations
* Edge Functions = long-running, background, secure operations

---

# 5. Feature Implementation Details

## 5.1 Contacts

**Create/Edit/Delete:** via Server Actions using Supabase client
**Search:** Postgres full-text search with tsvector index
**Tags:** stored as text[]; client uses multi-select UI
**Merge Duplicates:**

* Use pg_trgm similarity
* Edge function consolidates data safely

**Real-time optional**: Supabase Realtime → update UI after create/edit.

---

## 5.2 Interaction Log

* New interactions logged via server action
* Attachments uploaded via Supabase Storage then referenced in DB
* Timeline UI merges interactions + tasks chronologically

---

## 5.3 Tasks

* Inbox page uses server component for initial load
* Completing/snoozing tasks uses client component + server action
* Realtime optional refresh

**Auto-generated tasks** flagged via `auto_generated=true`.

---

## 5.4 Reminders & Cadences

**Cron-based workflow:**

* Supabase Scheduled Function executes every 1h
* Queries cadences where `next_run_at <= now()`
* Generates tasks
* Sets `next_run_at = now() + frequency_days`
* Sends notification via email (Edge Function + SMTP)

---

## 5.5 Cold Contact Detection

Executed in the same scheduled function:

* For each contact:

  * If `now() - last_interaction_at > threshold`, create task

Threshold stored in user settings or default global value.

---

## 5.6 Integrations

### Calendar Sync

* OAuth stored encrypted in Postgres
* Supabase Edge Function polls Google Calendar events
* Cross-reference attendees with known contacts
* Auto-create interactions for relevant meetings

### Email Parsing (optional)

* Edge Function connects to Gmail API
* Fetches messages
* Extracts last-contact date & signatures

### LinkedIn Enrichment

* Edge Function calls external enrichment API
* Writes data back to the contact record

---

# 6. Frontend Structure

```
app/
  layout.tsx
  dashboard/page.tsx
  contacts/page.tsx
  contacts/[id]/page.tsx
  tasks/page.tsx
  settings/page.tsx
components/
  forms/
  ui/
  contacts/
  tasks/
lib/
  supabase/
  validation/
  utils/
```

**Principles:**

* Server Components fetch data
* Client Components handle interactivity
* Zod for input validation
* Dedicate components for Quick Add, Task Actions, Interaction logging

---

# 7. Scheduling & Background Jobs

## Tools Used

* **Supabase Cron:** triggers functions
* **Supabase Edge Functions:** actually run the logic

## Cron Script Responsibilities

1. Generate cadence-based tasks
2. Detect cold contacts
3. Send digest email (optional)
4. Recalculate relationship scores

All operations must be idempotent to avoid duplicate tasks.

---

# 8. Authentication & RLS Strategy

* Supabase Auth handles login
* Every table contains `user_id`
* RLS policies enforce access:

```
(user_id = auth.uid())
```

* Server Actions run with authenticated session via cookies

---

# 9. Deployment

* Next.js hosted on Vercel
* Supabase handles DB/Auth/Storage/Cron
* Edge Functions deployed inside Supabase project automatically

---

# 10. Observability

* Use Vercel Analytics for frontend
* Supabase logs for DB and functions
* Optionally integrate Sentry for error tracking

---

# 11. Testing Strategy

* **Unit tests:** Zod schemas + pure functions
* **Integration tests:** Supabase Edge Functions
* **E2E:** Playwright for core flows (add contact, create task, cadence fires)

---

# 12. Suggested Developer Frameworks/Libraries

* **Zod** — validation
* **Lucid Icons** — icons
* **TailwindCSS + shadcn/ui** — UI components
* **Sonner** — toasts
* **React Hook Form** — forms
* **SWR or React Query** (optional) — data cache
* **Day.js or Luxon** — timezones
* **Postgres trigram extension** — duplicate detection
* **React Virtualized** — large contact lists

---

# 13. MVP Scope

### Must-have

* Contact CRUD
* Interaction logging
* Tasks
* Reminders (one-time)
* Dashboard
* Full RLS and authentication

### Next Tier

* Cadences
* Cold contact detection
* Attachments
* Search
* Tags

### Advanced Tier

* Calendar import
* Enrichment
* AI summaries/drafts
* Mobile app later

---

# 14. Optional: Sample Server Action (TypeScript)

```ts
'use server';
import { createClient } from '@/lib/supabase/server';

export async function createContact(input: ContactInput) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('contacts')
    .insert({ ...input, user_id: (await supabase.auth.getUser()).data.user?.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

