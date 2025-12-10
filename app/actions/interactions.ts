'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { InteractionFormSchema, Interaction } from '@/lib/validation/schemas';
import * as interactionUtils from '@/lib/utils/interactions';

export async function createInteraction(formData: unknown): Promise<Interaction> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const validated = InteractionFormSchema.parse(formData);
  const interaction = await interactionUtils.createInteraction(user.id, validated);

  revalidatePath(`/contacts/${validated.contact_id}`);
  revalidatePath('/dashboard');

  return interaction;
}

export async function listInteractions(contactId: string): Promise<Interaction[]> {
  return interactionUtils.getInteractions(contactId);
}

export async function listRecentInteractions(limit?: number): Promise<Interaction[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return interactionUtils.getRecentInteractions(user.id, limit);
}

export async function updateInteraction(id: string, formData: unknown): Promise<Interaction> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const validated = InteractionFormSchema.partial().parse(formData);
  const interaction = await interactionUtils.updateInteraction(id, validated);

  revalidatePath(`/contacts/${interaction.contact_id}`);
  revalidatePath('/dashboard');

  return interaction;
}

export async function deleteInteraction(id: string, contactId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  await interactionUtils.deleteInteraction(id);

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath('/dashboard');
}
