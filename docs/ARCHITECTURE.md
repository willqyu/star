# Architecture Guide

This guide explains the architecture and design decisions behind Personal CRM.

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Technology Stack](#technology-stack)
3. [Design Principles](#design-principles)
4. [Layered Architecture](#layered-architecture)
5. [Data Flow](#data-flow)
6. [Security Model](#security-model)
7. [Performance Strategies](#performance-strategies)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Testing Strategy](#testing-strategy)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                  │
│  React Components | Server Components | UI Elements         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│           Next.js App Router & Server Actions               │
│  Route Handlers | Server Actions | Middleware               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Application Layer (Next.js Server)             │
│  Business Logic | Validation | Authorization               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│           Supabase (Backend as a Service)                   │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌────────┐ │
│  │  PostgreSQL  │ │   Auth   │ │   Storage    │ │EdgeFunc│ │
│  │  Database    │ │  Service │ │   (S3-like)  │ │        │ │
│  └──────────────┘ └──────────┘ └──────────────┘ └────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Key Layers Explained

| Layer | Purpose | Technologies |
|-------|---------|---------------|
| **Client** | User interface and interactivity | React, Next.js Client Components |
| **Server** | API logic, authorization, business rules | Next.js Server Components, Server Actions |
| **Validation** | Type safety and data validation | Zod, TypeScript |
| **Database** | Data persistence and relationships | PostgreSQL via Supabase |
| **Background Jobs** | Automated tasks and scheduling | Supabase Edge Functions |

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5.3
- **Styling**: TailwindCSS 3.4
- **Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend
- **Runtime**: Node.js (Next.js)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Background Jobs**: Supabase Edge Functions (Deno)
- **API**: REST via Supabase, Server Actions

### Development & DevOps
- **Package Manager**: npm
- **Build Tool**: Next.js (webpack)
- **Deployment**: Vercel
- **Version Control**: Git
- **Testing**: Jest, Playwright
- **Code Quality**: ESLint, Prettier

## Design Principles

### 1. Server-First Architecture

**Principle**: Fetch data and perform mutations on the server whenever possible.

**Benefits**:
- Type safety across the wire (TypeScript)
- Better security (no exposing database details to client)
- Improved performance (less network overhead)
- Easier to maintain and refactor

**Implementation**:
```typescript
// ✅ Good: Server Component fetches data
export async function ContactPage() {
  const contacts = await getContacts(); // Server-side
  return <ContactList contacts={contacts} />;
}

// ❌ Avoid: Unnecessary client-side fetching
export function ContactList() {
  const [contacts, setContacts] = useState([]);
  useEffect(() => {
    fetch('/api/contacts').then(res => res.json());
  }, []);
}
```

### 2. Type Safety End-to-End

**Principle**: Leverage TypeScript and Zod to catch errors at compile time and runtime.

**Implementation**:
```typescript
// Define schema with Zod
const ContactSchema = z.object({
  first_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

// Use in components
const result = ContactSchema.safeParse(formData);
if (!result.success) {
  // Type-safe error handling
  console.error(result.error);
} else {
  // result.data is fully typed
  await createContact(result.data);
}
```

### 3. Security by Default

**Principle**: Implement security at every layer, not just the database.

**Layers**:
1. **Authentication**: Supabase Auth handles user sessions
2. **Authorization**: Server actions verify user identity
3. **RLS Policies**: Database enforces access control
4. **Validation**: Zod validates all inputs
5. **Encryption**: Sensitive data encrypted at rest and in transit

```typescript
// Server Action with authorization
export async function createContact(formData: FormData) {
  // 1. Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 2. Validate input
  const validData = ContactSchema.parse(formData);

  // 3. Create with user association
  // 4. Database RLS enforces user_id = auth.uid()
  const { data } = await supabase
    .from('contacts')
    .insert({ ...validData, user_id: user.id });
}
```

### 4. Progressive Enhancement

**Principle**: Build features that work with JavaScript disabled, enhance with interactivity.

**Implementation**:
- Forms work as traditional submissions
- JavaScript adds client-side validation and better UX
- Critical content is server-rendered

## Layered Architecture

### Layer 1: UI Components (`components/`)

**Responsibility**: Render UI and handle user interaction

```
components/
├── ui/                    # Reusable UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── forms/                 # Form components
│   ├── contact-form.tsx
│   └── task-form.tsx
└── navbar.tsx            # Layout components
```

**Characteristics**:
- Dumb components (minimal logic)
- Reusable across pages
- Use variant management (CVA)
- Accept props for flexibility

### Layer 2: Pages (`app/`)

**Responsibility**: Aggregate data and compose UI

```
app/
├── dashboard/page.tsx     # Dashboard page
├── contacts/
│   ├── page.tsx          # Contacts list
│   ├── new/page.tsx      # Create contact
│   └── [id]/page.tsx     # Contact detail
└── tasks/
    ├── page.tsx          # Tasks list
    └── new/page.tsx      # Create task
```

**Characteristics**:
- Server Components by default
- Fetch data at component level
- Compose multiple components
- Handle layout and routing

### Layer 3: Server Actions (`app/actions/`)

**Responsibility**: Handle mutations and business logic

```
app/actions/
├── contacts.ts    # Contact mutations
├── tasks.ts       # Task mutations
├── interactions.ts # Interaction logging
└── cadences.ts    # Cadence management
```

**Pattern**:
```typescript
// Server action with proper authorization and validation
'use server'

export async function createContact(formData: unknown) {
  // 1. Validate input
  const data = ContactSchema.parse(formData);

  // 2. Check authorization
  const user = await getCurrentUser();

  // 3. Call utility function
  const contact = await createContactUtil(user.id, data);

  // 4. Revalidate related data
  revalidatePath('/contacts');
  revalidateTag('contacts-list');

  return contact;
}
```

### Layer 4: Utilities (`lib/utils/`)

**Responsibility**: Database operations and business logic

```
lib/utils/
├── contacts.ts      # Contact CRUD & queries
├── tasks.ts         # Task CRUD & queries
├── interactions.ts  # Interaction CRUD & queries
└── cadences.ts      # Cadence CRUD & scheduling
```

**Characteristics**:
- Pure functions (no state)
- Reusable across actions and other utilities
- Handle all business logic
- Interface with database

```typescript
// Utility function - reusable, testable
export async function createContact(
  userId: string,
  data: CreateContactInput
): Promise<Contact> {
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert([{ ...data, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return contact;
}
```

### Layer 5: Validation (`lib/validation/`)

**Responsibility**: Schema definitions for type safety

```typescript
// Define once, use everywhere
export const ContactFormSchema = z.object({
  first_name: z.string().min(1, 'First name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
});

export type Contact = z.infer<typeof ContactSchema>;
```

### Layer 6: Database (`supabase/`)

**Responsibility**: Data persistence and relationships

```sql
-- Tables with relationships
contacts          -- User's contacts
interactions      -- Contact interactions
tasks            -- Tasks to follow up
cadences         -- Recurring reminders
attachments      -- File storage references
user_settings    -- User preferences

-- Security
RLS policies     -- Row-level access control
Triggers         -- Data consistency (updated_at)
Indexes          -- Performance optimization
```

## Data Flow

### Create Contact Flow

```
1. User fills form in browser
   └─> React captures form data

2. Form submitted (Server Action)
   └─> createContact('use server')

3. Server Action runs
   ├─> Validate with Zod
   ├─> Check authorization
   └─> Call createContactUtil()

4. Utility function
   ├─> Check user context (RLS)
   └─> Insert into database

5. Database receives data
   ├─> RLS policy: user_id = auth.uid()
   ├─> Trigger: set updated_at
   └─> Insert confirmed

6. Response returned to client
   ├─> Revalidate cache
   └─> Show toast notification

7. UI updates
   └─> Redirect to contact detail
```

### Read Contact Flow

```
1. User navigates to /contacts/123
   └─> Next.js routes to [id]/page.tsx

2. Server Component renders
   ├─> Await getContact(123)
   └─> Pass data to client component

3. Utility function runs
   ├─> Query database
   ├─> RLS: user_id = auth.uid()
   └─> Return contact data

4. Component renders
   ├─> Display contact info
   ├─> Show interactions
   └─> Show related tasks
```

### Update Contact Flow

```
1. User edits contact and submits
   └─> updateContact() Server Action

2. Server side
   ├─> Validate new data
   ├─> Check authorization
   └─> Update in database

3. Database
   ├─> RLS: only their record
   ├─> Trigger: update updated_at
   └─> Confirm update

4. Revalidate and respond
   └─> UI shows success
```

## Security Model

### Authentication

```
User Signs Up/In
    ↓
Supabase Auth Service
    ↓
JWT Token Created
    ↓
Token stored in secure HTTP-only cookie
    ↓
Request sent with cookie
    ↓
Server extracts user from JWT
```

### Authorization

```
Server Action Called
    ↓
Extract user from auth context
    ↓
Verify user exists
    ↓
Proceed with operation
    ↓
Pass user_id to database
    ↓
Database RLS policy:
    SELECT/UPDATE/DELETE WHERE user_id = auth.uid()
```

### RLS Policy Example

```sql
-- Only users can see their own contacts
CREATE POLICY contacts_own
  ON contacts
  FOR SELECT
  USING (user_id = auth.uid());

-- Only users can update their own contacts
CREATE POLICY contacts_update_own
  ON contacts
  FOR UPDATE
  USING (user_id = auth.uid());

-- Prevent deletion (optional business logic)
CREATE POLICY no_delete_contacts
  ON contacts
  FOR DELETE
  USING (false);
```

### Input Validation

```typescript
// Zod catches invalid data before database
const schema = z.object({
  email: z.string().email(),        // Must be valid email
  phone: z.string().min(10),        // At least 10 chars
  relationship_score: z.number()
    .min(0)
    .max(100),                       // 0-100 range
});

// Fails fast and safely
const result = schema.safeParse(untrustedInput);
```

## Performance Strategies

### 1. Server-Side Rendering

**Strategy**: Render pages on server, send HTML to client

**Benefits**:
- Faster first contentful paint
- Better SEO
- Reduced JavaScript bundle size
- Automatic caching at edge

### 2. Incremental Static Regeneration

**Strategy**: Build static pages at deploy time, regenerate on demand

```typescript
// Revalidate cache after changes
revalidatePath('/contacts');
```

### 3. Database Optimization

**Indexes**:
```sql
-- Index frequently queried columns
CREATE INDEX idx_contacts_user_id 
  ON contacts(user_id);

CREATE INDEX idx_tasks_status 
  ON tasks(user_id, status);

-- Full-text search index
CREATE INDEX idx_contacts_search 
  ON contacts USING gin(to_tsvector('english', first_name || ' ' || last_name));
```

### 4. Lazy Loading

```typescript
// Load components only when needed
const AdvancedSettings = dynamic(() => 
  import('./AdvancedSettings'),
  { loading: () => <Skeleton /> }
);
```

### 5. Query Optimization

**Bad**: N+1 queries
```typescript
const contacts = await getContacts();
for (const contact of contacts) {
  const tasks = await getTasks(contact.id);  // N queries!
}
```

**Good**: Single query with relations
```typescript
const contacts = await supabase
  .from('contacts')
  .select('*, tasks(*)')  // Fetch relations
  .eq('user_id', userId);
```

## Scalability

### Horizontal Scaling

**Stateless Design**: Each request can go to any server
- No session state stored in server memory
- JWT tokens self-contained
- Database is central source of truth

**Database Connection Pooling**: Manage connections efficiently
```typescript
// Supabase handles connection pooling automatically
const supabase = createClient(url, key); // Shared pool
```

### Vertical Scaling

**Optimize Individual Requests**:
1. Reduce query complexity
2. Cache frequently accessed data
3. Use indexes appropriately
4. Monitor slow queries

### Edge Functions Scaling

**Background Jobs**: Offload heavy work
```typescript
// Process-cadences runs hourly
// Scales independently from main app
// Doesn't block user requests
serve(async (req) => {
  // Heavy computation here
});
```

## Error Handling

### Client Errors (User Facing)

```typescript
'use client'

export function ContactForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    try {
      await createContact(formData);
    } catch (err) {
      // Show user-friendly error
      setError('Failed to create contact. Please try again.');
      toast.error(error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert>{error}</Alert>}
      {/* form fields */}
    </form>
  );
}
```

### Server Errors

```typescript
export async function createContact(formData: FormData) {
  try {
    // Validation
    const data = ContactSchema.parse(formData);

    // Authorization
    const user = await getCurrentUser();
    if (!user) {
      throw new AuthError('Not authenticated');
    }

    // Database operation
    const result = await supabase
      .from('contacts')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single();

    if (!result.data) {
      throw new Error('Failed to create contact');
    }

    return result.data;
  } catch (err) {
    // Log for debugging
    console.error('Contact creation failed:', err);

    // Return safe error to client
    throw new Error('Failed to create contact');
  }
}
```

### Database Errors

```typescript
const { data, error } = await supabase
  .from('contacts')
  .insert([newContact]);

if (error) {
  if (error.code === '23505') {
    // Unique constraint violation
    throw new Error('Email already exists');
  } else if (error.code === '42P01') {
    // Table doesn't exist
    throw new Error('Database not initialized');
  } else {
    throw new Error('Database error');
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// Test utility functions in isolation
describe('createContact', () => {
  it('should validate input before creating', async () => {
    const result = await createContact(userId, invalidData);
    expect(result).toThrow(ValidationError);
  });

  it('should associate contact with user', async () => {
    const contact = await createContact(userId, validData);
    expect(contact.user_id).toBe(userId);
  });
});
```

### Integration Tests

```typescript
// Test full flow from action to database
describe('createContact action', () => {
  it('should create contact and update UI', async () => {
    const formData = new FormData();
    formData.append('first_name', 'John');

    const result = await createContact(formData);

    expect(result.id).toBeDefined();
    expect(result.first_name).toBe('John');
  });
});
```

### E2E Tests

```typescript
// Test user flows in browser
test('should create and display new contact', async ({ page }) => {
  await page.goto('/contacts');
  await page.click('button:has-text("New Contact")');
  
  await page.fill('input[placeholder="First Name"]', 'John');
  await page.fill('input[placeholder="Email"]', 'john@example.com');
  await page.click('button:has-text("Create")');

  await expect(page).toHaveURL(/\/contacts\/\d+/);
  await expect(page.locator('text=John')).toBeVisible();
});
```

## Future Architectural Improvements

### 1. Real-Time Updates

```typescript
// Use Supabase Realtime subscriptions
const channel = supabase
  .channel('contacts')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'contacts' },
    (payload) => {
      // Update UI in real-time
    }
  )
  .subscribe();
```

### 2. GraphQL API

```typescript
// Add Apollo Server for more complex queries
// Supplement REST with GraphQL
type Query {
  contact(id: ID!): Contact
  contacts(filter: ContactFilter!): [Contact!]!
}
```

### 3. Event-Driven Architecture

```typescript
// Use event streams for loosely coupled systems
// Contact created → trigger email, notification, analytics
```

### 4. Mobile App

```typescript
// Reuse backend with React Native
// Same Supabase client, same server actions
```

---

**For questions about architecture**, see [docs/](.) or create an issue on GitHub.

**For implementation details**, see the relevant file documentation or code comments.

**For deployment architecture**, see [DEPLOYMENT.md](./DEPLOYMENT.md).
