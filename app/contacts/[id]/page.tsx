'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { getContact, deleteContact, listContacts } from '@/app/actions/contacts';
import { listInteractions, createInteraction } from '@/app/actions/interactions';
import { listTasks, createTask } from '@/app/actions/tasks';
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

interface ContactDetailPageProps {
  params: {
    id: string;
  };
}

export default function ContactDetailPage({ params }: ContactDetailPageProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [relationships, setRelationships] = useState<
    Array<ContactRelationship & { from_contact?: Contact; to_contact?: Contact }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

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
          getContact(params.id),
          listInteractions(params.id),
          listTasks(),
          listContacts(),
          getAllRelationships(params.id),
        ]);

        setContact(contactData);
        setInteractions(interactionData || []);
        setTasks(taskData?.filter((t) => t.contact_id === params.id) || []);
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
  }, [params.id]);

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
      await createInteraction({
        contact_id: contact.id,
        type: formData.get('type') as string,
        notes: formData.get('notes') as string,
        location: formData.get('location') as string | undefined,
      });

      // Reload interactions
      const updated = await listInteractions(contact.id);
      setInteractions(updated || []);

      setShowInteractionDialog(false);
      toast.success('Interaction logged');
      e.currentTarget.reset();
    } catch (error) {
      console.error('Failed to add interaction:', error);
      toast.error('Failed to log interaction');
    }
  };

  const handleRelationshipChange = async () => {
    try {
      const relationshipsData = await getAllRelationships(params.id);
      const graphData = await getNetworkGraphData(params.id);
      const statsData = await getNetworkStats(params.id);

      setRelationships(relationshipsData || []);
      setNetworkGraphData(graphData);
      setNetworkStats(statsData);
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
      await createTask({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        contact_id: contact.id,
        due_at: formData.get('due_at') ? new Date(formData.get('due_at') as string) : undefined,
        priority: formData.get('priority') ? parseInt(formData.get('priority') as string) : 0,
      });

      // Reload tasks
      const updated = await listTasks();
      setTasks(updated?.filter((t) => t.contact_id === contact.id) || []);

      setShowTaskDialog(false);
      toast.success('Task created');
      e.currentTarget.reset();
    } catch (error) {
      console.error('Failed to add task:', error);
      toast.error('Failed to create task');
    }
  };

  const createQuickFollowUp = async (daysFromNow: number, title: string) => {
    if (!contact) return;

    try {
      const dueDate = addDays(new Date(), daysFromNow);
      await createTask({
        title,
        description: `Quick follow-up with ${contact.first_name}`,
        contact_id: contact.id,
        due_at: dueDate,
        priority: 2, // High priority
      });

      // Reload tasks
      const updated = await listTasks();
      setTasks(updated?.filter((t) => t.contact_id === contact.id) || []);

      toast.success(`Follow-up task created for ${daysFromNow === 1 ? '1 day' : daysFromNow === 7 ? '1 week' : '1 month'} from now`);
    } catch (error) {
      console.error('Failed to create quick follow-up:', error);
      toast.error('Failed to create follow-up task');
    }
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
            <p className="text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
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
            <Dialog open={showInteractionDialog} onOpenChange={setShowInteractionDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Interaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log New Interaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddInteraction} className="space-y-4">
                  <div>
                    <Label htmlFor="type">Interaction Type</Label>
                    <select
                      id="type"
                      name="type"
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
                    >
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
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="What did you discuss?"
                      className="mt-1"
                    />
                  </div>

                  <Button type="submit">Log Interaction</Button>
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
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true })}
                    </span>
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
            <h2 className="text-lg font-bold text-gray-900">Related Tasks</h2>
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
                  <form onSubmit={handleAddTask} className="space-y-4">
                    <div>
                      <Label htmlFor="task-title">Task Title</Label>
                      <Input
                        id="task-title"
                        name="title"
                        placeholder="Follow up with..."
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
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="task-priority">Priority</Label>
                        <select
                          id="task-priority"
                          name="priority"
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

          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks yet</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      {task.due_at && (
                        <p className="text-sm text-gray-500 mt-1">
                          Due: {new Date(task.due_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
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
          )}
        </div>
      </main>
    </>
  );
}
