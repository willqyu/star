export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          company: string | null;
          role: string | null;
          email: string | null;
          phone: string | null;
          linkedin_url: string | null;
          tags: string[];
          relationship_score: number;
          met_at: string | null;
          timezone: string;
          preferred_channel: string;
          last_interaction_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          company?: string | null;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          tags?: string[];
          relationship_score?: number;
          met_at?: string | null;
          timezone?: string;
          preferred_channel?: string;
          last_interaction_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          company?: string | null;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          tags?: string[];
          relationship_score?: number;
          met_at?: string | null;
          timezone?: string;
          preferred_channel?: string;
          last_interaction_at?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      interactions: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string;
          type: string;
          timestamp: string;
          notes: string | null;
          attachments: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_id: string;
          type: string;
          timestamp?: string;
          notes?: string | null;
          attachments?: string[];
          created_at?: string;
        };
        Update: {
          type?: string;
          timestamp?: string;
          notes?: string | null;
          attachments?: string[];
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string | null;
          title: string;
          description: string | null;
          due_at: string | null;
          status: string;
          priority: number;
          auto_generated: boolean;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_id?: string | null;
          title: string;
          description?: string | null;
          due_at?: string | null;
          status?: string;
          priority?: number;
          auto_generated?: boolean;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          due_at?: string | null;
          status?: string;
          priority?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      cadences: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string;
          frequency_days: number;
          next_run_at: string;
          last_generated_at: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_id: string;
          frequency_days: number;
          next_run_at?: string;
          last_generated_at?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          frequency_days?: number;
          next_run_at?: string;
          last_generated_at?: string | null;
          active?: boolean;
          updated_at?: string;
        };
      };
      attachments: {
        Row: {
          id: string;
          contact_id: string | null;
          interaction_id: string | null;
          filename: string;
          url: string;
          content_type: string | null;
          size: number | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          contact_id?: string | null;
          interaction_id?: string | null;
          filename: string;
          url: string;
          content_type?: string | null;
          size?: number | null;
          uploaded_at?: string;
        };
        Update: {
          filename?: string;
          url?: string;
          content_type?: string | null;
          size?: number | null;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          cold_contact_threshold_days: number;
          email_reminders_enabled: boolean;
          digest_frequency: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          cold_contact_threshold_days?: number;
          email_reminders_enabled?: boolean;
          digest_frequency?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          cold_contact_threshold_days?: number;
          email_reminders_enabled?: boolean;
          digest_frequency?: string;
          timezone?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
