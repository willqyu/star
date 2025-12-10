import { createClient } from '@/lib/supabase/server';
import { Contact, ContactInput } from '@/lib/validation/schemas';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export async function getContacts(userId: string, supabase?: SupabaseClient<Database>): Promise<Contact[]> {
  // If no supabase client provided, create one (for non-cached calls)
  const client = supabase || await createClient();

  const { data, error } = await client
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Contact[];
}

export async function getContactById(id: string): Promise<Contact | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Contact | null;
}

export async function searchContacts(userId: string, query: string): Promise<Contact[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('search_contacts', {
    p_user_id: userId,
    p_query: query,
  });

  if (error) throw error;
  return data as Contact[];
}

export async function createContact(
  userId: string,
  input: ContactInput
): Promise<Contact> {
  const supabase = await createClient();

  const { referred_by_id, ...contactData } = input;

  // Convert empty strings to null to avoid unique constraint issues
  const cleanedData = {
    ...contactData,
    email: contactData.email && contactData.email.trim() ? contactData.email.trim() : null,
    linkedin_url: contactData.linkedin_url && contactData.linkedin_url.trim() ? contactData.linkedin_url.trim() : null,
  };

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      ...cleanedData,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // If referred_by_id is provided, create the relationship (if it doesn't already exist)
  if (referred_by_id && referred_by_id !== '') {
    try {
      // First check if relationship already exists
      const { data: existingRel, error: checkError } = await supabase
        .from('contact_relationships')
        .select('id')
        .eq('from_contact_id', referred_by_id)
        .eq('to_contact_id', data.id)
        .eq('relationship_type', 'referred_by')
        .single();

      // Only insert if it doesn't exist (checkError with code PGRST116 means no match)
      if (checkError?.code === 'PGRST116') {
        const { error: relError } = await supabase
          .from('contact_relationships')
          .insert({
            user_id: userId,
            from_contact_id: referred_by_id,
            to_contact_id: data.id,
            relationship_type: 'referred_by',
          });

        if (relError) {
          console.error('Error creating referred_by relationship:', relError);
          // Don't throw - contact was created successfully
        }
      }
    } catch (err) {
      console.error('Error creating referred_by relationship:', err);
      // Don't throw - contact was created successfully
    }
  }

  return data as Contact;
}

export async function updateContact(id: string, input: Partial<ContactInput>): Promise<Contact> {
  const supabase = await createClient();

  // Convert empty strings to null to avoid unique constraint issues
  const cleanedData = {
    ...input,
    ...(input.email !== undefined && {
      email: input.email && input.email.trim() ? input.email.trim() : null,
    }),
    ...(input.linkedin_url !== undefined && {
      linkedin_url: input.linkedin_url && input.linkedin_url.trim() ? input.linkedin_url.trim() : null,
    }),
  };

  const { data, error } = await supabase
    .from('contacts')
    .update(cleanedData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Contact;
}

export async function deleteContact(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('contacts').delete().eq('id', id);

  if (error) throw error;
}

export async function updateContactLastInteraction(contactId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('contacts')
    .update({ last_interaction_at: new Date().toISOString() })
    .eq('id', contactId);

  if (error) throw error;
}
