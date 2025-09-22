import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin' | 'agent';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin' | 'agent';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin' | 'agent';
          created_at?: string;
          updated_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          status: 'submitted' | 'verified' | 'assigned' | 'resolved';
          latitude: number;
          longitude: number;
          address: string | null;
          images: string[];
          thumbnail: string | null;
          user_id: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          status?: 'submitted' | 'verified' | 'assigned' | 'resolved';
          latitude: number;
          longitude: number;
          address?: string | null;
          images?: string[];
          thumbnail?: string | null;
          user_id: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'submitted' | 'verified' | 'assigned' | 'resolved';
          latitude?: number;
          longitude?: number;
          address?: string | null;
          images?: string[];
          thumbnail?: string | null;
          user_id?: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      report_comments: {
        Row: {
          id: string;
          report_id: string;
          user_id: string;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          user_id: string;
          comment: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          user_id?: string;
          comment?: string;
          created_at?: string;
        };
      };
      status_history: {
        Row: {
          id: string;
          report_id: string;
          status: 'submitted' | 'verified' | 'assigned' | 'resolved';
          changed_by: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          status: 'submitted' | 'verified' | 'assigned' | 'resolved';
          changed_by: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          status?: 'submitted' | 'verified' | 'assigned' | 'resolved';
          changed_by?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
};