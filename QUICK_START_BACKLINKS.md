# Quick Start: Backlinks & Network Visualization

## 🚀 Get Started in 3 Minutes

### 1. Run the Database Migration (1 min)

**In Supabase Dashboard:**

1. Go to **SQL Editor** → Click **New Query**
2. Paste this SQL:

```sql
-- Run this in Supabase SQL Editor
create table public.contact_relationships (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_contact_id uuid not null references public.contacts(id) on delete cascade,
  to_contact_id uuid not null references public.contacts(id) on delete cascade,
  relationship_type text not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  constraint different_contacts check (from_contact_id != to_contact_id),
  constraint unique_relationship unique(from_contact_id, to_contact_id, relationship_type),
  constraint same_user_contacts check (
    (select user_id from contacts where id = from_contact_id) = 
    (select user_id from contacts where id = to_contact_id)
  )
);

create index idx_relationships_user_id on public.contact_relationships(user_id);
create index idx_relationships_from_contact on public.contact_relationships(from_contact_id);
create index idx_relationships_to_contact on public.contact_relationships(to_contact_id);
create index idx_relationships_type on public.contact_relationships(relationship_type);

create trigger update_contact_relationships_updated_at before update on public.contact_relationships
  for each row execute function update_updated_at_column();

alter table public.contact_relationships enable row level security;

create policy "Users can view their own contact relationships"
  on public.contact_relationships for select
  using (auth.uid() = user_id);

create policy "Users can create contact relationships"
  on public.contact_relationships for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own contact relationships"
  on public.contact_relationships for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own contact relationships"
  on public.contact_relationships for delete
  using (auth.uid() = user_id);
```

3. Click **Run** ✅

### 2. Start Your App (1 min)

```bash
npm run dev
```

### 3. Try It Out (1 min)

1. Open http://localhost:3000
2. Go to any **Contact's Detail Page**
3. Scroll down to **"Network Connections"**
4. Click **"Add Connection"**
5. Select two contacts and create a relationship
6. Scroll to **"Network Overview"** to see stats
7. Click **"View Graph"** to visualize the network

---

## 📋 What You Can Do

✅ Add relationships between contacts
- Who referred someone to you
- Who they know
- Who they work with
- Who they're friends with

✅ View network statistics
- Total connections
- People they know
- People who know them
- Who referred them

✅ Visualize the network
- Interactive graph visualization
- Pan and zoom
- Click nodes for details
- Force-directed layout

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `/docs/RELATIONSHIP_QUERIES.md` | SQL queries for manual testing |
| `/docs/BACKLINKS_FEATURE.md` | Complete feature documentation |
| `/BACKLINKS_IMPLEMENTATION.md` | Implementation details |

---

## 🛠️ File Locations

**New Files Created:**
- `/supabase/migrations/002_add_relationships.sql` - Database migration
- `/app/actions/relationships.ts` - Server-side functions
- `/components/relationship-manager.tsx` - Relationship UI
- `/components/network-graph.tsx` - Graph visualization

**Updated Files:**
- `/app/contacts/[id]/page.tsx` - Contact detail page
- `/lib/database.types.ts` - TypeScript types
- `/lib/validation/schemas.ts` - Zod schemas

---

## 💡 Common Tasks

### Add a relationship
1. Go to contact detail page
2. Scroll to "Network Connections"
3. Click "Add Connection"
4. Select direction, contact, type
5. Click "Add Connection"

### View network graph
1. Scroll to "Network Overview"
2. Click "View Graph"
3. Drag to pan, scroll to zoom, click nodes for info

### Edit relationship
1. Find the relationship in the list
2. Click the pencil icon
3. Update and click "Update Connection"

### Delete relationship
1. Find the relationship in the list
2. Click the trash icon
3. Confirm deletion

---

## ✅ Verify It Worked

In Supabase Dashboard:
1. Go to **Table Editor**
2. You should see **`contact_relationships`** table
3. Click on it - it should be empty initially

In your app:
1. Add a relationship
2. Refresh the Supabase table - it should appear
3. Try the graph visualization

---

## 🎯 Next Steps

1. **Read full docs:** `/docs/BACKLINKS_FEATURE.md`
2. **Try SQL queries:** `/docs/RELATIONSHIP_QUERIES.md`
3. **Customize:** Edit relationship types in `/supabase/migrations/002_add_relationships.sql`
4. **Extend:** Add more features from the "Future Enhancements" section in the docs

---

## ❓ Need Help?

1. Check browser console for errors (F12 → Console tab)
2. Verify migration ran in Supabase
3. Ensure you're logged in
4. Check that contacts have names
5. Review `/docs/BACKLINKS_FEATURE.md` troubleshooting section

---

**That's it! You're all set. Start adding connections to your contacts! 🎉**
