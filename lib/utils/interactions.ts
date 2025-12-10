import { createClient } from '@/lib/supabase/server';
import { Interaction, InteractionInput } from '@/lib/validation/schemas';

export async function getInteractions(contactId: string): Promise<Interaction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('contact_id', contactId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data as Interaction[];
}

export async function createInteraction(
  userId: string,
  input: InteractionInput
): Promise<Interaction> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('interactions')
    .insert({
      ...input,
      user_id: userId,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Update contact's last_interaction_at
  await supabase
    .from('contacts')
    .update({ last_interaction_at: new Date().toISOString() })
    .eq('id', input.contact_id);

  return data as Interaction;
}

export async function getRecentInteractions(userId: string, limit: number = 10): Promise<Interaction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Interaction[];
}

export async function updateInteraction(
  id: string,
  input: Partial<InteractionInput>
): Promise<Interaction> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('interactions')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Interaction;
}

export async function deleteInteraction(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('interactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
