# Supabase SQL Queries for Contact Relationships & Backlinks

This document contains all the SQL queries you need to run in your Supabase SQL Editor to set up the backlinks and network visualization features.

## 1. First Time Setup - Create the Relationships Table

Copy and run this entire migration in the Supabase SQL Editor:

```sql
-- Add relationships table to track backlinks
-- This table records connections between contacts:
-- - who referred someone to you (referred_by)
-- - who they know (knows)

create table public.contact_relationships (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_contact_id uuid not null references public.contacts(id) on delete cascade,
  to_contact_id uuid not null references public.contacts(id) on delete cascade,
  relationship_type text not null, -- 'referred_by', 'knows', 'works_with', 'friend'
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  -- Ensure contacts are different
  constraint different_contacts check (from_contact_id != to_contact_id),
  -- Ensure no duplicate relationships in the same direction
  constraint unique_relationship unique(from_contact_id, to_contact_id, relationship_type),
  -- Ensure all contacts belong to the same user
  constraint same_user_contacts check (
    (select user_id from contacts where id = from_contact_id) = 
    (select user_id from contacts where id = to_contact_id)
  )
);

-- Create indexes for performance
create index idx_relationships_user_id on public.contact_relationships(user_id);
create index idx_relationships_from_contact on public.contact_relationships(from_contact_id);
create index idx_relationships_to_contact on public.contact_relationships(to_contact_id);
create index idx_relationships_type on public.contact_relationships(relationship_type);
create index idx_relationships_from_to on public.contact_relationships(from_contact_id, to_contact_id);

-- Create trigger for updated_at
create trigger update_contact_relationships_updated_at before update on public.contact_relationships
  for each row execute function update_updated_at_column();

-- Enable RLS on contact_relationships table
alter table public.contact_relationships enable row level security;

-- Create RLS policies
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

## 2. Query: Get All Backlinks for a Specific Contact

**Use case:** Show who referred this contact to you

```sql
-- Get all contacts who referred the given contact
select 
  cr.id,
  cr.relationship_type,
  cr.notes,
  cr.created_at,
  c.id as contact_id,
  c.first_name,
  c.last_name,
  c.email,
  c.company,
  c.linkedin_url
from public.contact_relationships cr
join public.contacts c on cr.from_contact_id = c.id
where cr.to_contact_id = 'CONTACT_ID_HERE'
  and cr.relationship_type = 'referred_by'
  and cr.user_id = 'USER_ID_HERE'
order by cr.created_at desc;
```

## 3. Query: Get All Connections from a Contact

**Use case:** Show who this contact knows

```sql
-- Get all contacts that this contact knows
select 
  cr.id,
  cr.relationship_type,
  cr.notes,
  cr.created_at,
  c.id as contact_id,
  c.first_name,
  c.last_name,
  c.email,
  c.company,
  c.linkedin_url
from public.contact_relationships cr
join public.contacts c on cr.to_contact_id = c.id
where cr.from_contact_id = 'CONTACT_ID_HERE'
  and cr.user_id = 'USER_ID_HERE'
order by cr.created_at desc;
```

## 4. Query: Build a Network Graph for Visualization

**Use case:** Get all connections (nodes and edges) for a specific contact and their network

```sql
-- Get complete network: the contact + all direct connections + relationship types
with target_contact as (
  select id, first_name, last_name, email, company, linkedin_url
  from public.contacts
  where id = 'CONTACT_ID_HERE'
    and user_id = 'USER_ID_HERE'
),
all_connected_contacts as (
  -- Get contacts that refer the target
  select c.id, c.first_name, c.last_name, c.email, c.company, c.linkedin_url, 'referrer' as connection_type
  from public.contacts c
  join public.contact_relationships cr on c.id = cr.from_contact_id
  where cr.to_contact_id = 'CONTACT_ID_HERE'
    and cr.user_id = 'USER_ID_HERE'
  
  union all
  
  -- Get contacts that the target knows
  select c.id, c.first_name, c.last_name, c.email, c.company, c.linkedin_url, 'knows' as connection_type
  from public.contacts c
  join public.contact_relationships cr on c.id = cr.to_contact_id
  where cr.from_contact_id = 'CONTACT_ID_HERE'
    and cr.user_id = 'USER_ID_HERE'
),
relationships as (
  select 
    cr.from_contact_id,
    cr.to_contact_id,
    cr.relationship_type,
    cr.notes
  from public.contact_relationships cr
  where (cr.from_contact_id = 'CONTACT_ID_HERE' or cr.to_contact_id = 'CONTACT_ID_HERE')
    and cr.user_id = 'USER_ID_HERE'
)
select 
  tc.id,
  tc.first_name,
  tc.last_name,
  tc.email,
  tc.company,
  tc.linkedin_url,
  'target' as node_type,
  acc.id as connected_id,
  acc.first_name as connected_first_name,
  acc.last_name as connected_last_name,
  acc.email as connected_email,
  acc.company as connected_company,
  acc.linkedin_url as connected_linkedin_url,
  acc.connection_type as connected_type,
  r.relationship_type,
  r.notes
from target_contact tc
left join all_connected_contacts acc on true
left join relationships r on (r.from_contact_id = 'CONTACT_ID_HERE' and r.to_contact_id = acc.id)
  or (r.to_contact_id = 'CONTACT_ID_HERE' and r.from_contact_id = acc.id);
```

## 5. Query: Get All Relationships for Graph Data Export

**Use case:** Export all connections for a user's entire network

```sql
-- Get all relationships for the current user (for bulk graph visualization)
select 
  cr.id,
  cr.from_contact_id,
  cr.to_contact_id,
  cr.relationship_type,
  cr.notes,
  c1.first_name as from_first_name,
  c1.last_name as from_last_name,
  c1.company as from_company,
  c2.first_name as to_first_name,
  c2.last_name as to_last_name,
  c2.company as to_company
from public.contact_relationships cr
join public.contacts c1 on cr.from_contact_id = c1.id
join public.contacts c2 on cr.to_contact_id = c2.id
where cr.user_id = 'USER_ID_HERE'
order by cr.created_at desc;
```

## 6. Query: Find All Paths Between Two Contacts

**Use case:** Find how two people are connected through your network

```sql
-- Find shortest paths between two contacts (up to 3 hops)
with recursive paths as (
  -- Base case: direct connections
  select 
    from_contact_id,
    to_contact_id,
    relationship_type,
    array[from_contact_id, to_contact_id] as path,
    1 as depth
  from public.contact_relationships
  where user_id = 'USER_ID_HERE'
    and (from_contact_id = 'START_CONTACT_ID' or to_contact_id = 'START_CONTACT_ID')
  
  union all
  
  -- Recursive case: find connections through intermediaries
  select 
    p.from_contact_id,
    cr.to_contact_id,
    cr.relationship_type,
    p.path || cr.to_contact_id,
    p.depth + 1
  from paths p
  join public.contact_relationships cr on (
    p.to_contact_id = cr.from_contact_id 
    or p.to_contact_id = cr.to_contact_id
  )
  where p.depth < 3
    and not cr.to_contact_id = any(p.path)
    and cr.user_id = 'USER_ID_HERE'
)
select 
  p.path,
  p.depth,
  p.relationship_type,
  c1.first_name || ' ' || c1.last_name as from_contact,
  c2.first_name || ' ' || c2.last_name as to_contact
from paths p
join public.contacts c1 on p.from_contact_id = c1.id
join public.contacts c2 on p.to_contact_id = c2.id
where p.to_contact_id = 'END_CONTACT_ID'
order by p.depth asc
limit 1;
```

## 7. Query: Count Network Statistics

**Use case:** Show overview stats about a contact's network

```sql
-- Get network statistics for a contact
select 
  c.id,
  c.first_name,
  c.last_name,
  count(distinct case when cr.from_contact_id = c.id then cr.to_contact_id end) as people_they_know,
  count(distinct case when cr.to_contact_id = c.id then cr.from_contact_id end) as people_who_know_them,
  count(distinct case when cr.to_contact_id = c.id and cr.relationship_type = 'referred_by' then cr.from_contact_id end) as referrers_count,
  count(distinct case when cr.from_contact_id = c.id then 1 end) as total_outgoing_connections,
  count(distinct case when cr.to_contact_id = c.id then 1 end) as total_incoming_connections
from public.contacts c
left join public.contact_relationships cr on (c.id = cr.from_contact_id or c.id = cr.to_contact_id)
where c.user_id = 'USER_ID_HERE'
  and c.id = 'CONTACT_ID_HERE'
group by c.id, c.first_name, c.last_name;
```

## 8. Query: Find Mutual Connections

**Use case:** Find contacts that two people have in common

```sql
-- Find mutual connections between two contacts
select distinct
  c.id,
  c.first_name,
  c.last_name,
  c.email,
  c.company
from public.contacts c
where c.user_id = 'USER_ID_HERE'
  and exists (
    -- Contact is known by or knows first contact
    select 1 from public.contact_relationships cr1
    where c.user_id = 'USER_ID_HERE'
      and (
        (cr1.from_contact_id = 'CONTACT_1_ID' and cr1.to_contact_id = c.id)
        or (cr1.to_contact_id = 'CONTACT_1_ID' and cr1.from_contact_id = c.id)
      )
  )
  and exists (
    -- Contact is known by or knows second contact
    select 1 from public.contact_relationships cr2
    where cr2.user_id = 'USER_ID_HERE'
      and (
        (cr2.from_contact_id = 'CONTACT_2_ID' and cr2.to_contact_id = c.id)
        or (cr2.to_contact_id = 'CONTACT_2_ID' and cr2.from_contact_id = c.id)
      )
  );
```

## Usage Instructions

1. **Replace placeholders** in the queries:
   - `'CONTACT_ID_HERE'` → Your contact's UUID
   - `'USER_ID_HERE'` → Your Supabase auth user ID
   - `'START_CONTACT_ID'` and `'END_CONTACT_ID'` → for path finding

2. **In the Application:** These queries will be wrapped in server actions so you don't need to run them manually. They're provided for reference and testing.

3. **To get your User ID:**
   - Go to Supabase Dashboard → Authentication → Users
      - Copy the `uid` column value for your user

4. **To get Contact IDs:**
   - Go to Supabase Dashboard → Table Editor → contacts
      - The `id` column contains the UUID

## Relationship Types

The `relationship_type` field supports:
- `referred_by` - Someone referred this contact to you
- `knows` - This contact knows another contact
- `works_with` - Two contacts work together
- `friend` - Two contacts are friends

Feel free to extend this list by modifying the constraint in the migration!
