import { z } from 'zod';

// Contact Schemas
export const ContactFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(255),
  last_name: z.string().min(1, 'Last name is required').max(255),
  company: z.string().optional(),
  role: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  linkedin_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  preferred_channel: z.enum(['email', 'phone', 'linkedin', 'in_person', 'whatsapp']).optional(),
  notes: z.string().optional(),
  referred_by_id: z.string().uuid().optional().or(z.literal('')),
});

export const ContactSchema = ContactFormSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  relationship_score: z.number().min(0).max(100),
  met_at: z.date().nullable().optional(),
  last_interaction_at: z.date().nullable().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Contact = z.infer<typeof ContactSchema>;
export type ContactInput = z.infer<typeof ContactFormSchema>;

// Interaction Schemas
export const InteractionFormSchema = z.object({
  contact_id: z.string().uuid('Contact is required'),
  type: z.enum(['email', 'call', 'meeting', 'message', 'linkedin', 'other']),
  notes: z.string().optional(),
  location: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export const InteractionSchema = InteractionFormSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  timestamp: z.date(),
  created_at: z.date(),
});

export type Interaction = z.infer<typeof InteractionSchema>;
export type InteractionInput = z.infer<typeof InteractionFormSchema>;

// Task Schemas
export const TaskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional(),
  contact_id: z.string().uuid().optional(),
  due_at: z.date().optional(),
  priority: z.number().min(0).max(2).optional(),
  status: z.enum(['open', 'completed', 'snoozed', 'cancelled']).optional(),
});

export const TaskSchema = TaskFormSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  auto_generated: z.boolean(),
  status: z.enum(['open', 'completed', 'snoozed', 'cancelled']),
  priority: z.number().min(0).max(2),
  created_at: z.date(),
  updated_at: z.date(),
  completed_at: z.date().nullable().optional(),
});

export type Task = z.infer<typeof TaskSchema>;
export type TaskInput = z.infer<typeof TaskFormSchema>;

// Cadence Schemas
export const CadenceFormSchema = z.object({
  contact_id: z.string().uuid('Contact is required'),
  frequency_days: z.number().min(1, 'Frequency must be at least 1 day'),
  active: z.boolean().optional(),
});

export const CadenceSchema = CadenceFormSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  next_run_at: z.date(),
  last_generated_at: z.date().nullable().optional(),
  active: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Cadence = z.infer<typeof CadenceSchema>;
export type CadenceInput = z.infer<typeof CadenceFormSchema>;

// Attachment Schemas
export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  contact_id: z.string().uuid().nullable().optional(),
  interaction_id: z.string().uuid().nullable().optional(),
  filename: z.string(),
  url: z.string().url(),
  content_type: z.string().optional(),
  size: z.number().optional(),
  uploaded_at: z.date(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

// User Settings Schemas
export const UserSettingsSchema = z.object({
  user_id: z.string().uuid(),
  cold_contact_threshold_days: z.number().min(1),
  email_reminders_enabled: z.boolean(),
  digest_frequency: z.enum(['daily', 'weekly', 'monthly', 'never']),
  timezone: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const UserSettingsUpdateSchema = z.object({
  cold_contact_threshold_days: z.number().min(1).optional(),
  email_reminders_enabled: z.boolean().optional(),
  digest_frequency: z.enum(['daily', 'weekly', 'monthly', 'never']).optional(),
  timezone: z.string().optional(),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type UserSettingsInput = z.infer<typeof UserSettingsUpdateSchema>;

// Contact Relationship Schemas
export const ContactRelationshipFormSchema = z.object({
  from_contact_id: z.string().uuid('From contact is required'),
  to_contact_id: z.string().uuid('To contact is required'),
  relationship_type: z.enum(['referred_by', 'knows', 'works_with', 'friend']),
  notes: z.string().optional(),
});

export const ContactRelationshipSchema = ContactRelationshipFormSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type ContactRelationship = z.infer<typeof ContactRelationshipSchema>;
export type ContactRelationshipInput = z.infer<typeof ContactRelationshipFormSchema>;

