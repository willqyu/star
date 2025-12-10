'use server';

import { revalidatePath } from 'next/cache';
// In-memory cache for contacts per user
const contactsCache: { [userId: string]: Contact[] | null } = {};
let contactsCacheTimestamp: { [userId: string]: number } = {};
import { createClient } from '@/lib/supabase/server';
import { ContactFormSchema, Contact } from '@/lib/validation/schemas';
import * as contactUtils from '@/lib/utils/contacts';

export async function createContact(formData: unknown): Promise<Contact> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const validated = ContactFormSchema.parse(formData);

  const contact = await contactUtils.createContact(user.id, validated);


  // Invalidate contacts cache for this user
  contactsCache[user.id] = null;
  contactsCacheTimestamp[user.id] = 0;
  revalidatePath('/contacts');
  revalidatePath('/dashboard');

  return contact;
}

export async function updateContact(id: string, formData: unknown): Promise<Contact> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const validated = ContactFormSchema.partial().parse(formData);
  const contact = await contactUtils.updateContact(id, validated);


  // Invalidate contacts cache for this user
  contactsCache[user.id] = null;
  contactsCacheTimestamp[user.id] = 0;
  revalidatePath(`/contacts/${id}`);
  revalidatePath('/contacts');
  revalidatePath('/dashboard');

  return contact;
}

export async function deleteContact(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  await contactUtils.deleteContact(id);

  // Invalidate contacts cache for this user
  contactsCache[user.id] = null;
  contactsCacheTimestamp[user.id] = 0;
  revalidatePath('/contacts');
  revalidatePath('/dashboard');
}

export async function listContacts(): Promise<Contact[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Serve from cache if available and not older than 10 minutes
  const now = Date.now();
  if (
    contactsCache[user.id] &&
    contactsCacheTimestamp[user.id] &&
    now - contactsCacheTimestamp[user.id] < 10 * 60 * 1000
  ) {
    return contactsCache[user.id]!;
  }
  const contacts = await contactUtils.getContacts(user.id, supabase);
  contactsCache[user.id] = contacts;
  contactsCacheTimestamp[user.id] = now;
  return contacts;
}

export async function getContact(id: string): Promise<Contact | null> {
  return contactUtils.getContactById(id);
}

export async function searchContacts(query: string): Promise<Contact[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Simple substring search (RPC version would use postgres FTS)
  const contacts = await contactUtils.getContacts(user.id);
  const lowerQuery = query.toLowerCase();

  return contacts.filter(
    (c) =>
      c.first_name.toLowerCase().includes(lowerQuery) ||
      c.last_name.toLowerCase().includes(lowerQuery) ||
      c.email?.toLowerCase().includes(lowerQuery) ||
      c.company?.toLowerCase().includes(lowerQuery)
  );
}
