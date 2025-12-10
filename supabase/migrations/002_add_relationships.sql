-- 0) Ensure extension for gen_random_uuid exists (if you use it)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Create the table (omit the check with subqueries)
CREATE TABLE IF NOT EXISTS public.contact_relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  to_contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT different_contacts CHECK (from_contact_id != to_contact_id),
  CONSTRAINT unique_relationship UNIQUE (from_contact_id, to_contact_id, relationship_type)
  -- Note: same_user_contacts CHECK with subqueries is not allowed in Postgres
);

-- 2) Create or replace the trigger function that enforces both contacts belong to same user
CREATE OR REPLACE FUNCTION public.validate_contact_relationship_user()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  user_from uuid;
  user_to   uuid;
BEGIN
  -- fetch user_id for from_contact_id and to_contact_id
  SELECT user_id INTO user_from FROM public.contacts WHERE id = NEW.from_contact_id;
  SELECT user_id INTO user_to   FROM public.contacts WHERE id = NEW.to_contact_id;

  -- ensure both contacts exist
  IF user_from IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = format('from_contact_id % does not exist in public.contacts', NEW.from_contact_id);
  END IF;

  IF user_to IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = format('to_contact_id % does not exist in public.contacts', NEW.to_contact_id);
  END IF;

  -- ensure both contacts belong to the same user
  IF user_from <> user_to THEN
    RAISE EXCEPTION USING MESSAGE = format(
      'Contacts % and % do not belong to the same user (users: % vs %)',
      NEW.from_contact_id, NEW.to_contact_id, user_from, user_to
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Drop existing trigger (if any) and create the trigger
DROP TRIGGER IF EXISTS trg_validate_contact_relationship_user ON public.contact_relationships;

CREATE TRIGGER trg_validate_contact_relationship_user
BEFORE INSERT OR UPDATE ON public.contact_relationships
FOR EACH ROW
EXECUTE FUNCTION public.validate_contact_relationship_user();

-- 4) Optional: index to speed contact -> user lookups used by the trigger
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
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