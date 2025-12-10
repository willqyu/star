'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCtrlEnter } from '@/lib/hooks/useCtrlEnter';
import {
  createRelationship,
  deleteRelationship,
  updateRelationship,
} from '@/app/actions/relationships';
import { Contact, ContactRelationship } from '@/lib/validation/schemas';

interface RelationshipManagerProps {
  contactId: string;
  allContacts: Contact[];
  relationships?: Array<ContactRelationship & { from_contact?: Contact; to_contact?: Contact }>;
  onRelationshipAdded?: () => void;
  onRelationshipDeleted?: () => void;
}

export function RelationshipManager({
  contactId,
  allContacts,
  relationships = [],
  onRelationshipAdded,
  onRelationshipDeleted,
}: RelationshipManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    relatedContactId: '',
    type: 'knows' as const,
    notes: '',
    direction: 'outgoing' as 'incoming' | 'outgoing',
  });
  const formRef = useRef<HTMLFormElement>(null);

  useCtrlEnter(formRef);

  // Filter out current contact from available contacts
  const availableContacts = allContacts.filter((c) => c.id !== contactId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.relatedContactId) {
      toast.error('Please select a contact');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateRelationship(editingId, {
          relationship_type: formData.type,
          notes: formData.notes || undefined,
        });
        toast.success('Relationship updated');
      } else {
        await createRelationship({
          from_contact_id:
            formData.direction === 'outgoing' ? contactId : formData.relatedContactId,
          to_contact_id:
            formData.direction === 'outgoing' ? formData.relatedContactId : contactId,
          relationship_type: formData.type,
          notes: formData.notes || undefined,
        });
        toast.success('Relationship added');
      }

      setIsOpen(false);
      resetForm();
      onRelationshipAdded?.();
    } catch (error) {
      console.error('Error saving relationship:', error);
      toast.error('Failed to save relationship');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (relationshipId: string) => {
    if (!confirm('Are you sure you want to delete this relationship?')) {
      return;
    }

    try {
      await deleteRelationship(relationshipId);
      toast.success('Relationship deleted');
      onRelationshipDeleted?.();
    } catch (error) {
      console.error('Error deleting relationship:', error);
      toast.error('Failed to delete relationship');
    }
  };

  const resetForm = () => {
    setFormData({
      relatedContactId: '',
      type: 'knows',
      notes: '',
      direction: 'outgoing',
    });
    setEditingId(null);
  };

  const handleEdit = (rel: ContactRelationship & { from_contact?: Contact; to_contact?: Contact }) => {
    const isOutgoing = rel.from_contact_id === contactId;

    setFormData({
      relatedContactId: isOutgoing ? rel.to_contact_id : rel.from_contact_id,
      type: rel.relationship_type as any,
      notes: rel.notes || '',
      direction: isOutgoing ? 'outgoing' : 'incoming',
    });
    setEditingId(rel.id);
    setIsOpen(true);
  };

  const relationshipTypeLabels: Record<string, string> = {
    referred_by: 'Referred by',
    knows: 'Knows',
    works_with: 'Works with',
    friend: 'Friend',
  };

  // Group relationships by incoming/outgoing
  const incomingRels = relationships.filter((r) => r.to_contact_id === contactId);
  const outgoingRels = relationships.filter((r) => r.from_contact_id === contactId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Network Connections</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Connection' : 'Add New Connection'}
              </DialogTitle>
              <DialogDescription>
                Define how this contact connects to or knows other people in your network.
              </DialogDescription>
            </DialogHeader>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="direction">Connection Direction</Label>
                <select
                  id="direction"
                  value={formData.direction}
                  onChange={(e: any) =>
                    setFormData({ ...formData, direction: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
                >
                  <option value="outgoing">This person knows...</option>
                  <option value="incoming">This person was referred by...</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="related-contact">Select Contact</Label>
                <select
                  id="related-contact"
                  value={formData.relatedContactId}
                  onChange={(e) =>
                    setFormData({ ...formData, relatedContactId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
                >
                  <option value="">Choose a contact...</option>
                  {availableContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                      {contact.company ? ` (${contact.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Relationship Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e: any) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
                >
                  <option value="knows">Knows</option>
                  <option value="works_with">Works with</option>
                  <option value="friend">Friend</option>
                  <option value="referred_by">Referred by</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional details about this connection..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="h-20"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add'} Connection
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Incoming Relationships */}
      {incomingRels.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Who referred them</h4>
          <div className="space-y-2">
            {incomingRels.map((rel) => (
              <Card key={rel.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {rel.from_contact?.first_name} {rel.from_contact?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {relationshipTypeLabels[rel.relationship_type]}
                      {rel.from_contact?.company ? ` • ${rel.from_contact.company}` : ''}
                    </p>
                    {rel.notes && <p className="text-xs text-gray-600 mt-1">{rel.notes}</p>}
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(rel)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(rel.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Relationships */}
      {outgoingRels.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Who they know</h4>
          <div className="space-y-2">
            {outgoingRels.map((rel) => (
              <Card key={rel.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {rel.to_contact?.first_name} {rel.to_contact?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {relationshipTypeLabels[rel.relationship_type]}
                      {rel.to_contact?.company ? ` • ${rel.to_contact.company}` : ''}
                    </p>
                    {rel.notes && <p className="text-xs text-gray-600 mt-1">{rel.notes}</p>}
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(rel)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(rel.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {relationships.length === 0 && (
        <Card className="p-6 bg-gray-50 text-center">
          <p className="text-sm text-gray-500">
            No connections yet. Click "Add Connection" to get started.
          </p>
        </Card>
      )}
    </div>
  );
}
