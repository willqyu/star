'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContactFormSchema, ContactInput } from '@/lib/validation/schemas';
import { createContact, updateContact } from '@/app/actions/contacts';
import { toast } from 'sonner';
import { Contact } from '@/lib/validation/schemas';
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
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
    },
  });

  const onSubmit = async (data: ContactInput) => {
    setLoading(true);

    try {
      const formData = {
        ...data,
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
            <option>UTC</option>
            <option>America/New_York</option>
            <option>America/Chicago</option>
            <option>America/Denver</option>
            <option>America/Los_Angeles</option>
            <option>Europe/London</option>
            <option>Europe/Paris</option>
            <option>Asia/Tokyo</option>
            <option>Asia/Hong_Kong</option>
            <option>Australia/Sydney</option>
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
