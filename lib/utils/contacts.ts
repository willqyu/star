import { createClient } from '@/lib/supabase/server';
import { Contact, ContactInput } from '@/lib/validation/schemas';

export async function getContacts(userId: string): Promise<Contact[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
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

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      ...input,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Contact;
}

export async function updateContact(id: string, input: Partial<ContactInput>): Promise<Contact> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('contacts')
    .update(input)
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
