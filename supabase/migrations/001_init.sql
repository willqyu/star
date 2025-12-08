-- Enable pgvector and pg_trgm extensions for similarity search and FTS
create extension if not exists "pg_trgm";
create extension if not exists "pgvector";

-- Create tables
create table public.contacts (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  company text,
  role text,
  email text,
  phone text,
  linkedin_url text,
  tags text[] default array[]::text[],
  relationship_score integer default 0,
  met_at timestamp with time zone,
  timezone text default 'UTC',
  preferred_channel text default 'email', -- email, phone, linkedin, in_person
  last_interaction_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  constraint email_user_unique unique(email, user_id),
  constraint relationship_score_check check (relationship_score >= 0 and relationship_score <= 100)
);

create table public.interactions (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  type text not null, -- email, call, meeting, message, linkedin, other
  timestamp timestamp with time zone not null default now(),
  notes text,
  attachments text[] default array[]::text[],
  created_at timestamp with time zone default now() not null
);

create table public.tasks (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null,
  description text,
  due_at timestamp with time zone,
  status text not null default 'open', -- open, completed, snoozed, cancelled
  priority integer default 0, -- 0 = low, 1 = medium, 2 = high
  auto_generated boolean default false,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone,
  
  constraint task_status_check check (status in ('open', 'completed', 'snoozed', 'cancelled')),
  constraint task_priority_check check (priority >= 0 and priority <= 2)
);

create table public.cadences (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  frequency_days integer not null,
  next_run_at timestamp with time zone not null,
  last_generated_at timestamp with time zone,
  active boolean default true,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  constraint frequency_days_positive check (frequency_days > 0)
);

create table public.attachments (
  id uuid not null default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade,
  interaction_id uuid references public.interactions(id) on delete cascade,
  filename text not null,
  url text not null,
  content_type text,
  size integer,
  uploaded_at timestamp with time zone default now() not null,
  
  constraint at_least_one_reference check (contact_id is not null or interaction_id is not null)
);

create table public.user_settings (
  user_id uuid not null primary key references auth.users(id) on delete cascade,
  cold_contact_threshold_days integer default 90,
  email_reminders_enabled boolean default true,
  digest_frequency text default 'weekly', -- daily, weekly, monthly, never
  timezone text default 'UTC',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create indexes for performance
create index idx_contacts_user_id on public.contacts(user_id);
create index idx_contacts_email_user on public.contacts(email, user_id);
create index idx_contacts_created_at on public.contacts(created_at desc);
create index idx_contacts_last_interaction_at on public.contacts(last_interaction_at) where last_interaction_at is not null;

-- FTS index on contacts
create index idx_contacts_fts on public.contacts using gist (
  (to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(company, '') || ' ' || coalesce(notes, '')))
);

-- Trigram index for similarity search
create index idx_contacts_similarity on public.contacts using gist (
  (first_name || ' ' || last_name) gist_trgm_ops
);

create index idx_interactions_user_id on public.interactions(user_id);
create index idx_interactions_contact_id on public.interactions(contact_id);
create index idx_interactions_timestamp on public.interactions(timestamp desc);

create index idx_tasks_user_id on public.tasks(user_id);
create index idx_tasks_contact_id on public.tasks(contact_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_due_at on public.tasks(due_at) where due_at is not null;
create index idx_tasks_user_status on public.tasks(user_id, status);

create index idx_cadences_user_id on public.cadences(user_id);
create index idx_cadences_contact_id on public.cadences(contact_id);
create index idx_cadences_next_run on public.cadences(next_run_at) where active = true;

create index idx_attachments_contact_id on public.attachments(contact_id);
create index idx_attachments_interaction_id on public.attachments(interaction_id);

-- Create triggers for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_contacts_updated_at before update on public.contacts
  for each row execute function update_updated_at_column();

create trigger update_tasks_updated_at before update on public.tasks
  for each row execute function update_updated_at_column();

create trigger update_cadences_updated_at before update on public.cadences
  for each row execute function update_updated_at_column();

create trigger update_user_settings_updated_at before update on public.user_settings
  for each row execute function update_updated_at_column();

-- Grant default permissions to authenticated users
grant select, insert, update, delete on public.contacts to authenticated;
grant select, insert, update, delete on public.interactions to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.cadences to authenticated;
grant select, insert, update, delete on public.attachments to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;

-- RLS Policies
alter table public.contacts enable row level security;
alter table public.interactions enable row level security;
alter table public.tasks enable row level security;
alter table public.cadences enable row level security;
alter table public.attachments enable row level security;
alter table public.user_settings enable row level security;

-- Contacts RLS
create policy "Users can view their own contacts" on public.contacts
  for select using (auth.uid() = user_id);
create policy "Users can insert their own contacts" on public.contacts
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own contacts" on public.contacts
  for update using (auth.uid() = user_id);
create policy "Users can delete their own contacts" on public.contacts
  for delete using (auth.uid() = user_id);

-- Interactions RLS
create policy "Users can view their own interactions" on public.interactions
  for select using (auth.uid() = user_id);
create policy "Users can insert their own interactions" on public.interactions
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own interactions" on public.interactions
  for update using (auth.uid() = user_id);
create policy "Users can delete their own interactions" on public.interactions
  for delete using (auth.uid() = user_id);

-- Tasks RLS
create policy "Users can view their own tasks" on public.tasks
  for select using (auth.uid() = user_id);
create policy "Users can insert their own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own tasks" on public.tasks
  for update using (auth.uid() = user_id);
create policy "Users can delete their own tasks" on public.tasks
  for delete using (auth.uid() = user_id);

-- Cadences RLS
create policy "Users can view their own cadences" on public.cadences
  for select using (auth.uid() = user_id);
create policy "Users can insert their own cadences" on public.cadences
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own cadences" on public.cadences
  for update using (auth.uid() = user_id);
create policy "Users can delete their own cadences" on public.cadences
  for delete using (auth.uid() = user_id);

-- Attachments RLS - select if user owns the contact or interaction
create policy "Users can view attachments of their contacts" on public.attachments
  for select using (
    exists (select 1 from public.contacts where id = contact_id and user_id = auth.uid()) or
    exists (select 1 from public.interactions where id = interaction_id and user_id = auth.uid())
  );
create policy "Users can upload attachments" on public.attachments
  for insert with check (
    exists (select 1 from public.contacts where id = contact_id and user_id = auth.uid()) or
    exists (select 1 from public.interactions where id = interaction_id and user_id = auth.uid())
  );
create policy "Users can delete their attachments" on public.attachments
  for delete using (
    exists (select 1 from public.contacts where id = contact_id and user_id = auth.uid()) or
    exists (select 1 from public.interactions where id = interaction_id and user_id = auth.uid())
  );

-- User Settings RLS
create policy "Users can manage their own settings" on public.user_settings
  for all using (auth.uid() = user_id);

-- Function to create default user settings on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger to create user settings on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
