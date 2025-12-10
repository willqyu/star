'use client';

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Plus, CheckCircle2, Circle, AlertCircle, Edit2 } from 'lucide-react';
import { listTasks, completeTask, deleteTask, snoozeTask, updateTask } from '@/app/actions/tasks';
import { Task } from '@/lib/validation/schemas';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useCtrlEnter } from '@/lib/hooks/useCtrlEnter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TaskStatus = 'all' | 'open' | 'completed';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<TaskStatus>('open');
  const [loading, setLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const editFormRef = useRef<HTMLFormElement>(null);

  useCtrlEnter(editFormRef);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await listTasks();
        setTasks(data);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  useEffect(() => {
    const filtered =
      status === 'all'
        ? tasks
        : tasks.filter((t) => t.status === status);
    setFilteredTasks(filtered);
  }, [tasks, status]);

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
      );
      toast.success('Task completed');
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task');
    }
  };

  const handleSnooze = async (taskId: string) => {
    try {
      await snoozeTask(taskId, 1);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'snoozed' } : t))
      );
      toast.success('Task snoozed for 1 hour');
    } catch (error) {
      console.error('Failed to snooze task:', error);
      toast.error('Failed to snooze task');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleEditOpen = (task: Task) => {
    setEditingTaskId(task.id);
    setEditFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_at: task.due_at ? new Date(task.due_at).toISOString().slice(0, 16) : '',
      status: task.status,
    });
  };

  const handleEditSubmit = async () => {
    if (!editingTaskId) return;

    setIsSubmitting(true);
    try {
      const updatedTask = await updateTask(editingTaskId, {
        title: editFormData.title,
        description: editFormData.description || undefined,
        priority: parseInt(editFormData.priority),
        due_at: editFormData.due_at ? new Date(editFormData.due_at) : undefined,
        status: editFormData.status,
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === editingTaskId ? updatedTask : t))
      );

      setEditingTaskId(null);
      toast.success('Task updated');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">Loading tasks...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-1">Manage your to-do items and follow-ups</p>
          </div>
          <Link href="/tasks/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </Link>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6">
          {(['all', 'open', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                status === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {' '}
              {tasks.filter((t) => (s === 'all' ? true : t.status === s)).length}
            </button>
          ))}
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks</h3>
            <p className="text-gray-500 mb-4">
              {status === 'open'
                ? 'Great! All caught up.'
                : status === 'completed'
                ? 'No completed tasks'
                : 'No tasks yet'}
            </p>
            <Link href="/tasks/new">
              <Button>Create a Task</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-4 rounded-lg border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      onClick={() =>
                        task.status === 'completed'
                          ? handleDelete(task.id)
                          : handleComplete(task.id)
                      }
                      className="mt-1 flex-shrink-0 focus:outline-none"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 hover:text-blue-600" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium text-gray-900 ${
                          task.status === 'completed'
                            ? 'line-through text-gray-500'
                            : ''
                        }`}
                      >
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-3 text-sm">
                        {task.due_at && (
                          <span className="flex items-center gap-1 text-gray-500">
                            📅{' '}
                            {formatDistanceToNow(new Date(task.due_at), {
                              addSuffix: true,
                            })}
                          </span>
                        )}

                        {task.auto_generated && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                            Auto
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.priority === 2
                          ? 'bg-red-100 text-red-800'
                          : task.priority === 1
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {task.priority === 2 ? 'High' : task.priority === 1 ? 'Medium' : 'Low'}
                    </div>

                    {task.status === 'open' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditOpen(task)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSnooze(task.id)}
                        >
                          Snooze
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(task.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Task Modal */}
        <Dialog open={!!editingTaskId} onOpenChange={(open) => !open && setEditingTaskId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form ref={editFormRef} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <select
                    id="edit-priority"
                    value={editFormData.priority}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
                  >
                    <option value="0">Low</option>
                    <option value="1">Medium</option>
                    <option value="2">High</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="edit-due-at">Due Date</Label>
                  <Input
                    id="edit-due-at"
                    type="datetime-local"
                    value={editFormData.due_at}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, due_at: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
                >
                  <option value="open">Open</option>
                  <option value="completed">Completed</option>
                  <option value="snoozed">Snoozed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditingTaskId(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
