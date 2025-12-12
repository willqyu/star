import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await Promise.resolve(params);
  
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_status } = body;

    if (!task_status || !['waiting_for_them', 'waiting_for_me', 'on_hold'].includes(task_status)) {
      return NextResponse.json(
        { error: 'Invalid task_status value' },
        { status: 400 }
      );
    }

    // Update the task status
    const response = await (supabase as any)
      .from('tasks')
      .update({
        task_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    const { data, error } = response;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
