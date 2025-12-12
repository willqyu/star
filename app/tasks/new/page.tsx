'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createTask } from '@/app/actions/tasks';
import { listContacts } from '@/app/actions/contacts';
import { Contact } from '@/lib/validation/schemas';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactId, setContactId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [priority, setPriority] = useState('0');
  const [taskStatus, setTaskStatus] = useState('waiting_for_them');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await listContacts();
        setContacts(data);
      } catch (error) {
        console.error('Failed to load contacts:', error);
      }
    };

    loadContacts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createTask({
        title,
        description: description || undefined,
        contact_id: contactId || undefined,
        due_at: dueAt ? new Date(dueAt) : undefined,
        priority: parseInt(priority),
        task_status: taskStatus as 'waiting_for_them' | 'waiting_for_me' | 'on_hold',
      });

      toast.success('Task created successfully');
      router.push('/tasks');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Task</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-border">
          <div>
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Follow up with John about Q4 plans"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add any additional details about this task"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="contact">Related Contact (optional)</Label>
            <select
              id="contact"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
            >
              <option value="">No contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name}
                  {contact.company ? ` (${contact.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due-at">Due Date</Label>
              <Input
                id="due-at"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
              >
                <option value="0">Low</option>
                <option value="1">Medium</option>
                <option value="2">High</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="task-status">Task Status</Label>
            <select
              id="task-status"
              value={taskStatus}
              onChange={(e) => setTaskStatus(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
            >
              <option value="waiting_for_them">Waiting for them</option>
              <option value="waiting_for_me">Waiting for me</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}
