'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { CadenceFormSchema, Cadence } from '@/lib/validation/schemas';
import * as cadenceUtils from '@/lib/utils/cadences';

export async function createCadence(formData: unknown): Promise<Cadence> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const validated = CadenceFormSchema.parse(formData);
  const cadence = await cadenceUtils.createCadence(user.id, validated);

  revalidatePath('/contacts');

  return cadence;
}

export async function updateCadence(id: string, formData: unknown): Promise<Cadence> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const validated = CadenceFormSchema.partial().parse(formData);
  const cadence = await cadenceUtils.updateCadence(id, validated);

  revalidatePath('/contacts');

  return cadence;
}

export async function deleteCadence(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  await cadenceUtils.deleteCadence(id);

  revalidatePath('/contacts');
}

export async function listCadences(): Promise<Cadence[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return cadenceUtils.getCadences(user.id);
}

export async function listContactCadences(contactId: string): Promise<Cadence[]> {
  return cadenceUtils.getCadencesByContact(contactId);
}
