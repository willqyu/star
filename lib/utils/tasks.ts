import { createClient } from '@/lib/supabase/server';
import { Task, TaskInput } from '@/lib/validation/schemas';

export async function getTasks(userId: string, status?: string): Promise<Task[]> {
  const supabase = await createClient();

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('due_at', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data as Task[];
}

export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as Task | null;
}

export async function createTask(userId: string, input: TaskInput): Promise<Task> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...input,
      user_id: userId,
      status: 'open',
      priority: input.priority ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  const supabase = await createClient();

  const updateData: any = { ...input };

  // If marking as completed, set completed_at
  if (input.status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  } else if (input.status && input.status !== 'completed') {
    updateData.completed_at = null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) throw error;
}

export async function snoozeTask(id: string, hours: number = 1): Promise<Task> {
  const supabase = await createClient();

  const dueDate = new Date();
  dueDate.setHours(dueDate.getHours() + hours);

  const { data, error } = await supabase
    .from('tasks')
    .update({
      due_at: dueDate.toISOString(),
      status: 'snoozed',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}
