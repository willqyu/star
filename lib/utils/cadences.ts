import { createClient } from '@/lib/supabase/server';
import { Cadence, CadenceInput } from '@/lib/validation/schemas';

export async function getCadences(userId: string): Promise<Cadence[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cadences')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('next_run_at', { ascending: true });

  if (error) throw error;
  return data as Cadence[];
}

export async function getCadencesByContact(contactId: string): Promise<Cadence[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cadences')
    .select('*')
    .eq('contact_id', contactId);

  if (error) throw error;
  return data as Cadence[];
}

export async function createCadence(
  userId: string,
  input: CadenceInput
): Promise<Cadence> {
  const supabase = await createClient();

  const nextRunAt = new Date();
  nextRunAt.setDate(nextRunAt.getDate() + input.frequency_days);

  const { data, error } = await supabase
    .from('cadences')
    .insert({
      ...input,
      user_id: userId,
      next_run_at: nextRunAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Cadence;
}

export async function updateCadence(id: string, input: Partial<CadenceInput>): Promise<Cadence> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cadences')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Cadence;
}

export async function deleteCadence(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('cadences').delete().eq('id', id);

  if (error) throw error;
}

export async function getCadencesToRun(userId: string): Promise<Cadence[]> {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('cadences')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .lte('next_run_at', now);

  if (error) throw error;
  return data as Cadence[];
}
