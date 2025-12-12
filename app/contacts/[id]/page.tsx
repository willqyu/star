'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useCtrlEnter } from '@/lib/hooks/useCtrlEnter';
import { getContact, deleteContact, listContacts } from '@/app/actions/contacts';
import { listInteractions, createInteraction, updateInteraction, deleteInteraction } from '@/app/actions/interactions';
import { listTasks, createTask, completeTask } from '@/app/actions/tasks';
import {
  getAllRelationships,
} from '@/app/actions/relationships';
import { Contact, Interaction, Task, ContactRelationship } from '@/lib/validation/schemas';
import { formatDistanceToNow, addDays } from 'date-fns';
import { toast } from 'sonner';
import { ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RelationshipManager } from '@/components/relationship-manager';
import { LinkifiedText } from '@/components/linkified-text';

interface ContactDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { id } = use(params);
  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [relationships, setRelationships] = useState<
    Array<ContactRelationship & { from_contact?: Contact; to_contact?: Contact }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Interaction>>({});
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskTab, setTaskTab] = useState<'open' | 'completed'>('open');
  const [quickFollowUpData, setQuickFollowUpData] = useState<{ daysFromNow: number; title: string } | null>(null);

  const interactionFormRef = useRef<HTMLFormElement>(null);
  const taskFormRef = useRef<HTMLFormElement>(null);

  useCtrlEnter(interactionFormRef);
  useCtrlEnter(taskFormRef);

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          contactData,
          interactionData,
          taskData,
          allContactsData,
          relationshipsData,
        ] = await Promise.all([
          getContact(id),
          listInteractions(id),
          listTasks(),
          listContacts(),
          getAllRelationships(id),
        ]);

        setContact(contactData);
        setInteractions(interactionData || []);
        setTasks(taskData?.filter((t) => t.contact_id === id) || []);
        setAllContacts(allContactsData || []);
        setRelationships(relationshipsData || []);
      } catch (error) {
        console.error('Failed to load contact:', error);
        toast.error('Failed to load contact');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!contact) return;

    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteContact(contact.id);
      toast.success('Contact deleted');
      router.push('/contacts');
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const handleAddInteraction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contact) return;

    const formData = new FormData(e.currentTarget);
    try {
      if (editingInteractionId) {
        // Update existing interaction
        await updateInteraction(editingInteractionId, {
          type: formData.get('type') as string,
          notes: formData.get('notes') as string,
          location: formData.get('location') as string | undefined,
        });
        toast.success('Interaction updated');
      } else {
        // Create new interaction
        await createInteraction({
          contact_id: contact.id,
          type: formData.get('type') as string,
          notes: formData.get('notes') as string,
          location: formData.get('location') as string | undefined,
        });
        toast.success('Interaction logged');
      }

      // Reload interactions
      const updated = await listInteractions(contact.id);
      setInteractions(updated || []);

      setShowInteractionDialog(false);
      setEditingInteractionId(null);
      setEditFormData({});
      if (e.currentTarget) {
        e.currentTarget.reset();
      }
    } catch (error) {
      console.error('Failed to save interaction:', error);
      toast.error('Failed to save interaction');
    }
  };

  const handleEditInteraction = (interaction: Interaction) => {
    setEditingInteractionId(interaction.id);
    setEditFormData(interaction);
    setShowInteractionDialog(true);
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    if (!confirm('Are you sure you want to delete this interaction?')) {
      return;
    }

    try {
      await deleteInteraction(interactionId, contact!.id);
      const updated = await listInteractions(contact!.id);
      setInteractions(updated || []);
      toast.success('Interaction deleted');
    } catch (error) {
      console.error('Failed to delete interaction:', error);
      toast.error('Failed to delete interaction');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      const updated = await listTasks();
      setTasks(updated?.filter((t) => t.contact_id === contact!.id) || []);
      toast.success('Task marked as complete');
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task');
    }
  };

  const handleRelationshipChange = async () => {
    try {
      const relationshipsData = await getAllRelationships(id);
      setRelationships(relationshipsData || []);
      toast.success('Network updated');
    } catch (error) {
      console.error('Failed to update relationships:', error);
      toast.error('Failed to update relationships');
    }
  };

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contact) return;

    const formData = new FormData(e.currentTarget);
    try {
      let dueDate: Date | undefined;

      if (quickFollowUpData) {
        // If this is from a quick follow-up, calculate the due date
        dueDate = addDays(new Date(), quickFollowUpData.daysFromNow);
      } else {
        // Otherwise use the form's due date
        dueDate = formData.get('due_at') ? new Date(formData.get('due_at') as string) : undefined;
      }

      await createTask({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        contact_id: contact.id,
        due_at: dueDate,
        priority: formData.get('priority') ? parseInt(formData.get('priority') as string) : 0,
      });

      // Reload tasks
      const updated = await listTasks();
      setTasks(updated?.filter((t) => t.contact_id === contact.id) || []);

      setShowTaskDialog(false);
      setQuickFollowUpData(null);
      toast.success('Task created');
      if (e.currentTarget) {
        e.currentTarget.reset();
      }
    } catch (error) {
      console.error('Failed to add task:', error);
      toast.error('Failed to create task');
    }
  };

  const createQuickFollowUp = (daysFromNow: number, title: string) => {
    setQuickFollowUpData({ daysFromNow, title });
    setShowTaskDialog(true);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">Loading...</p>
        </main>
      </>
    );
  }

  if (!contact) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">Contact not found</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/contacts">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {contact.first_name} {contact.last_name}
              </h1>
              {contact.company && (
                <p className="text-gray-600 mt-1">{contact.company} • {contact.role}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/contacts/${contact.id}/edit`}>
              <Button size="sm">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-border">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>

            <div className="space-y-4">
              {contact.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                    {contact.email}
                  </a>
                </div>
              )}

              {contact.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                    {contact.phone}
                  </a>
                </div>
              )}

              {contact.linkedin_url && (
                <div>
                  <p className="text-sm text-gray-500">LinkedIn</p>
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Profile
                  </a>
                </div>
              )}

              {contact.twitter_url && (
                <div>
                  <p className="text-sm text-gray-500">Twitter</p>
                  <a
                    href={contact.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    @{contact.twitter_url.split('/').pop()}
                  </a>
                </div>
              )}

              {contact.website_url && (
                <div>
                  <p className="text-sm text-gray-500">Website</p>
                  <a
                    href={contact.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Preferred Channel</p>
                <p className="text-gray-900 capitalize">{contact.preferred_channel}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Timezone</p>
                <p className="text-gray-900">{contact.timezone}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Relationship</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Relationship Score</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${contact.relationship_score}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-900 font-medium">{contact.relationship_score}</span>
                </div>
              </div>

              {contact.last_interaction_at && (
                <div>
                  <p className="text-sm text-gray-500">Last Interaction</p>
                  <p className="text-gray-900">
                    {formatDistanceToNow(new Date(contact.last_interaction_at), { addSuffix: true })}
                  </p>
                </div>
              )}

              {contact.met_at && (
                <div>
                  <p className="text-sm text-gray-500">Met On</p>
                  <p className="text-gray-900">
                    {new Date(contact.met_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {contact.tags && contact.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {contact.notes && (
          <div className="bg-white p-6 rounded-lg border border-border mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Notes</h2>
            <LinkifiedText text={contact.notes} />
          </div>
        )}

        {/* Network Connections */}
        <div className="bg-white p-6 rounded-lg border border-border mb-8">
          <RelationshipManager
            contactId={contact.id}
            allContacts={allContacts}
            relationships={relationships}
            onRelationshipAdded={handleRelationshipChange}
            onRelationshipDeleted={handleRelationshipChange}
          />
        </div>

        {/* Interactions */}
        <div className="bg-white p-6 rounded-lg border border-border mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Interactions</h2>
            <Dialog 
              open={showInteractionDialog} 
              onOpenChange={(open) => {
                setShowInteractionDialog(open);
                if (!open) {
                  setEditingInteractionId(null);
                  setEditFormData({});
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Interaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingInteractionId ? 'Edit Interaction' : 'Log New Interaction'}
                  </DialogTitle>
                </DialogHeader>
                <form ref={interactionFormRef} onSubmit={handleAddInteraction} className="space-y-4">
                  <div>
                    <Label htmlFor="type">Interaction Type</Label>
                    <select
                      id="type"
                      name="type"
                      required
                      defaultValue={editFormData.type || ''}
                      className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
                    >
                      <option value="">Select a type...</option>
                      <option value="email">Email</option>
                      <option value="call">Call</option>
                      <option value="meeting">Meeting</option>
                      <option value="message">Message</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., Coffee shop, Google Meet, Zoom, or full address"
                      defaultValue={editFormData.location || ''}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="What did you discuss?"
                      defaultValue={editFormData.notes || ''}
                      className="mt-1"
                    />
                  </div>

                  <Button type="submit">
                    {editingInteractionId ? 'Update Interaction' : 'Log Interaction'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {interactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No interactions yet</p>
          ) : (
            <div className="space-y-4">
              {interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 capitalize">
                      {interaction.type}
                    </h3>
                    <div className="flex gap-2">
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true })}
                      </span>
                      <button
                        onClick={() => handleEditInteraction(interaction)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit interaction"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInteraction(interaction.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete interaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {(interaction as any).location && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Location:</span> {(interaction as any).location}
                    </p>
                  )}
                  {interaction.notes && (
                    <p className="text-gray-700">{interaction.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Tasks */}
        <div className="bg-white p-6 rounded-lg border border-border">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900">Related Tasks</h2>
              <div className="flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => setTaskTab('open')}
                  className={`pb-2 px-2 font-medium text-sm transition-colors ${
                    taskTab === 'open'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Open ({tasks.filter((t) => t.status === 'open').length})
                </button>
                <button
                  onClick={() => setTaskTab('completed')}
                  className={`pb-2 px-2 font-medium text-sm transition-colors ${
                    taskTab === 'completed'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Completed ({tasks.filter((t) => t.status === 'completed').length})
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => createQuickFollowUp(1, `Follow up with ${contact.first_name}`)}
              >
                +1 day
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => createQuickFollowUp(7, `Follow up with ${contact.first_name}`)}
              >
                +1 week
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => createQuickFollowUp(30, `Follow up with ${contact.first_name}`)}
              >
                +1 month
              </Button>
              <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Task for {contact.first_name}</DialogTitle>
                  </DialogHeader>
                  <form ref={taskFormRef} onSubmit={handleAddTask} className="space-y-4">
                    <div>
                      <Label htmlFor="task-title">Task Title</Label>
                      <Input
                        id="task-title"
                        name="title"
                        placeholder="Follow up with..."
                        defaultValue={quickFollowUpData?.title || ''}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea
                        id="task-description"
                        name="description"
                        placeholder="Any additional details"
                        defaultValue={quickFollowUpData ? `Quick follow-up with ${contact?.first_name}` : ''}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="task-priority">Priority</Label>
                        <select
                          id="task-priority"
                          name="priority"
                          defaultValue={quickFollowUpData ? '2' : '0'}
                          className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
                        >
                          <option value="0">Low</option>
                          <option value="1">Medium</option>
                          <option value="2">High</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="task-due-at">Due Date</Label>
                        <Input
                          id="task-due-at"
                          type="datetime-local"
                          name="due_at"
                          defaultValue={
                            quickFollowUpData
                              ? addDays(new Date(), quickFollowUpData.daysFromNow)
                                  .toISOString()
                                  .slice(0, 16)
                              : ''
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <Button type="submit">Create Task</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {taskTab === 'open' ? (
            tasks.filter((t) => t.status === 'open').length === 0 ? (
              <p className="text-gray-500 text-center py-8">No open tasks</p>
            ) : (
              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status === 'open')
                  .map((task) => (
                    <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          {task.due_at && (
                            <p className="text-sm text-gray-500 mt-1">
                              Due: {new Date(task.due_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 items-start">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                              task.priority === 2
                                ? 'bg-red-100 text-red-800'
                                : task.priority === 1
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {task.priority === 2 ? 'High' : task.priority === 1 ? 'Medium' : 'Low'}
                          </span>
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Mark as complete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )
          ) : (
            tasks.filter((t) => t.status === 'completed').length === 0 ? (
              <p className="text-gray-500 text-center py-8">No completed tasks</p>
            ) : (
              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status === 'completed')
                  .map((task) => (
                    <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 line-through">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-through">{task.description}</p>
                          )}
                          {task.completed_at && (
                            <p className="text-sm text-gray-500 mt-1">
                              Completed: {new Date(task.completed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                            task.priority === 2
                              ? 'bg-red-100 text-red-800'
                              : task.priority === 1
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {task.priority === 2 ? 'High' : task.priority === 1 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )
          )}
        </div>
      </main>
    </>
  );
}
