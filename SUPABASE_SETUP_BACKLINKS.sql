-- ============================================================================
-- SUPABASE SQL SETUP FOR BACKLINKS & NETWORK VISUALIZATION
-- ============================================================================
-- 
-- Copy this entire file and paste into Supabase SQL Editor
-- Then click "Run" to create the relationships table and policies
--
-- Duration: ~2 seconds
-- ============================================================================

-- Create the contact_relationships table
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

-- Create trigger for updated_at column
create trigger update_contact_relationships_updated_at before update on public.contact_relationships
  for each row execute function update_updated_at_column();

-- Enable Row Level Security
alter table public.contact_relationships enable row level security;

-- RLS Policy: Users can view their own relationships
create policy "Users can view their own contact relationships"
  on public.contact_relationships for select
  using (auth.uid() = user_id);

-- RLS Policy: Users can create relationships
create policy "Users can create contact relationships"
  on public.contact_relationships for insert
  with check (auth.uid() = user_id);

-- RLS Policy: Users can update their own relationships
create policy "Users can update their own contact relationships"
  on public.contact_relationships for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Users can delete their own relationships
create policy "Users can delete their own contact relationships"
  on public.contact_relationships for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
--
-- The contact_relationships table is now ready to use.
-- All RLS policies are in place and will automatically secure the data.
--
-- You can now:
-- 1. Restart your app (npm run dev)
-- 2. Go to any contact detail page
-- 3. Click "Add Connection" to create relationships
-- 4. View the network graph and statistics
--
-- ============================================================================
