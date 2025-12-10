'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createInteraction } from '@/app/actions/interactions';
import { Contact } from '@/lib/validation/schemas';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface QuickInteractionLoggerProps {
  contacts: Contact[];
  onInteractionCreated?: () => void;
}

export function QuickInteractionLogger({ contacts, onInteractionCreated }: QuickInteractionLoggerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const contactId = formData.get('contact_id') as string;
      if (!contactId) {
        toast.error('Please select a contact');
        setLoading(false);
        return;
      }

      await createInteraction({
        contact_id: contactId,
        type: formData.get('type') as string,
        location: formData.get('location') as string | undefined,
        notes: formData.get('notes') as string,
      });

      toast.success('Interaction logged');
      setOpen(false);
      e.currentTarget.reset();
      onInteractionCreated?.();
    } catch (error) {
      console.error('Failed to log interaction:', error);
      toast.error('Failed to log interaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Log Interaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Log Interaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contact">Contact *</Label>
            <select
              id="contact"
              name="contact_id"
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
            >
              <option value="">Select a contact...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name}
                  {contact.company ? ` - ${contact.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="quick-type">Interaction Type *</Label>
            <select
              id="quick-type"
              name="type"
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
            >
              <option value="">Select type...</option>
              <option value="email">Email</option>
              <option value="call">Call</option>
              <option value="meeting">Meeting</option>
              <option value="message">Message</option>
              <option value="linkedin">LinkedIn</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="quick-location">Location (Optional)</Label>
            <Input
              id="quick-location"
              name="location"
              placeholder="e.g., Coffee shop, Google Meet, Zoom, or full address"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="quick-notes">Discussion Contents *</Label>
            <Textarea
              id="quick-notes"
              name="notes"
              placeholder="What did you discuss?"
              required
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Logging...' : 'Log Interaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
