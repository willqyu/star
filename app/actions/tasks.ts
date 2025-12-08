'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { TaskFormSchema, Task } from '@/lib/validation/schemas';
import * as taskUtils from '@/lib/utils/tasks';

export async function createTask(formData: unknown): Promise<Task> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const validated = TaskFormSchema.parse(formData);
  const task = await taskUtils.createTask(user.id, validated);

  revalidatePath('/tasks');
  revalidatePath('/dashboard');

  return task;
}

export async function updateTask(id: string, formData: unknown): Promise<Task> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const validated = TaskFormSchema.partial().parse(formData);
  const task = await taskUtils.updateTask(id, validated);

  revalidatePath('/tasks');
  revalidatePath('/dashboard');
  if (validated.contact_id) {
    revalidatePath(`/contacts/${validated.contact_id}`);
  }

  return task;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  await taskUtils.deleteTask(id);

  revalidatePath('/tasks');
  revalidatePath('/dashboard');
}

export async function listTasks(status?: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return taskUtils.getTasks(user.id, status);
}

export async function snoozeTask(id: string, hours?: number): Promise<Task> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const task = await taskUtils.snoozeTask(id, hours);

  revalidatePath('/tasks');
  revalidatePath('/dashboard');

  return task;
}

export async function completeTask(id: string): Promise<Task> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const task = await taskUtils.updateTask(id, {
    status: 'completed',
  });

  revalidatePath('/tasks');
  revalidatePath('/dashboard');

  return task;
}
