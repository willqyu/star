'use client';

import { useState } from 'react';
import { Task } from '@/lib/validation/schemas';
import { TaskStatusTag } from '@/components/task-status-tag';
import { ContactNameTag } from '@/components/contact-name-tag';
import { formatDistanceToNow } from 'date-fns';

interface DashboardTaskListProps {
  tasks: Task[];
}

export function DashboardTaskList({ tasks }: DashboardTaskListProps) {
  const [taskList, setTaskList] = useState(tasks);

  return (
    <div className="space-y-4">
      {taskList.map((task) => (
        <div
          key={task.id}
          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{task.title}</h3>
            <div className="flex items-center gap-3 mt-2 flex-wrap text-sm">
              {task.due_at && (
                <span className="text-gray-500">
                  📅 {formatDistanceToNow(new Date(task.due_at), { addSuffix: true })}
                </span>
              )}
              <TaskStatusTag
                taskId={task.id}
                taskStatus={task.task_status as 'waiting_for_them' | 'waiting_for_me' | 'on_hold'}
                onStatusChange={(newStatus) => {
                  setTaskList((prev) =>
                    prev.map((t) =>
                      t.id === task.id
                        ? { ...t, task_status: newStatus }
                        : t
                    )
                  );
                }}
                compact
              />
            </div>
            {task.contacts && (
              <div className="mt-2">
                <ContactNameTag
                  contactId={task.contacts.id}
                  firstName={task.contacts.first_name}
                  lastName={task.contacts.last_name}
                  company={task.contacts.company}
                  role={task.contacts.role}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
