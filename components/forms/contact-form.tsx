'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ContactFormSchema, ContactInput, Contact } from '@/lib/validation/schemas';
import { createContact, updateContact, listContacts } from '@/app/actions/contacts';
import { TIMEZONES } from '@/lib/utils/timezones';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface ContactFormProps {
  contact?: Contact;
  mode: 'create' | 'edit';
}

export function ContactForm({ contact, mode }: ContactFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>(contact?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [allContacts, setAllContacts] = useState<Contact[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: contact || {
      first_name: '',
      last_name: '',
      company: '',
      role: '',
      email: '',
      phone: '',
      linkedin_url: '',
      timezone: 'UTC',
      preferred_channel: 'email',
      notes: '',
      referred_by_id: '',
    },
  });

  // Load all contacts for the referred_by dropdown (only in create mode)
  useEffect(() => {
    if (mode === 'create') {
      const loadContacts = async () => {
        try {
          const contacts = await listContacts();
          setAllContacts(contacts || []);
        } catch (error) {
          console.error('Failed to load contacts:', error);
          // Still set to empty array so field shows even if loading fails
          setAllContacts([]);
        }
      };
      loadContacts();
    }
  }, [mode]);

  const onSubmit = async (data: ContactInput) => {
    setLoading(true);

    try {
      // Convert empty strings to undefined for optional fields to avoid validation issues
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (typeof value === 'string' && value === '') {
          // Don't include empty strings - let backend handle defaults
          return acc;
        }
        return { ...acc, [key]: value };
      }, {} as Record<string, any>);

      const formData = {
        ...cleanedData,
        tags,
      };

      if (mode === 'create') {
        await createContact(formData);
        toast.success('Contact created successfully');
      } else if (contact) {
        await updateContact(contact.id, formData);
        toast.success('Contact updated successfully');
      }

      router.push('/contacts');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            placeholder="John"
            disabled={loading}
            {...register('first_name')}
            className="mt-1"
          />
          {errors.first_name && (
            <p className="text-red-600 text-sm mt-1">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            placeholder="Doe"
            disabled={loading}
            {...register('last_name')}
            className="mt-1"
          />
          {errors.last_name && (
            <p className="text-red-600 text-sm mt-1">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            placeholder="Acme Inc"
            disabled={loading}
            {...register('company')}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            placeholder="CEO"
            disabled={loading}
            {...register('role')}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            disabled={loading}
            {...register('email')}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="+1 (555) 123-4567"
            disabled={loading}
            {...register('phone')}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="linkedin_url">LinkedIn URL</Label>
        <Input
          id="linkedin_url"
          type="url"
          placeholder="https://linkedin.com/in/johndoe"
          disabled={loading}
          {...register('linkedin_url')}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            disabled={loading}
            {...register('timezone')}
            className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
          >
            <option value="">Select a timezone...</option>
            {TIMEZONES.map((tz) => (
              <option key={tz.code} value={tz.code}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="preferred_channel">Preferred Channel</Label>
          <select
            id="preferred_channel"
            disabled={loading}
            {...register('preferred_channel')}
            className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="linkedin">LinkedIn</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="in_person">In Person</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any notes about this contact..."
          disabled={loading}
          {...register('notes')}
          className="mt-1"
        />
      </div>

      {mode === 'create' && (
        <div>
          <Label htmlFor="referred_by_id">Referred By (Optional)</Label>
          <select
            id="referred_by_id"
            disabled={loading}
            {...register('referred_by_id')}
            className="w-full px-3 py-2 border border-input rounded-md bg-white mt-1"
          >
            <option value="">Select a contact...</option>
            {allContacts.length > 0 ? (
              allContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                  {c.company ? ` (${c.company})` : ''}
                </option>
              ))
            ) : (
              <option disabled>Loading contacts...</option>
            )}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            The person who referred this contact to you
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2 mt-1 mb-2">
          <Input
            id="tags"
            placeholder="Add a tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            disabled={loading}
          />
          <Button
            type="button"
            onClick={addTag}
            disabled={loading}
            variant="outline"
          >
            Add
          </Button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading
            ? mode === 'create'
              ? 'Creating...'
              : 'Updating...'
            : mode === 'create'
            ? 'Create Contact'
            : 'Update Contact'}
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
  );
}
