-- Add task_status column to track waiting for them/me or on hold
ALTER TABLE public.tasks
ADD COLUMN task_status text DEFAULT 'waiting_for_me';

-- Add constraint for valid task_status values
ALTER TABLE public.tasks
ADD CONSTRAINT task_status_values_check CHECK (task_status IN ('waiting_for_them', 'waiting_for_me', 'on_hold'));

-- Create index for faster queries
CREATE INDEX idx_tasks_task_status ON public.tasks(user_id, task_status);
