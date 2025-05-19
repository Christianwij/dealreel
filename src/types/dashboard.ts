import { Database } from './supabase';

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  created_at: string;
  file_path: string;
  status: 'processing' | 'completed' | 'error';
}

export interface Briefing {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  content: string;
  document_id: string;
  status: 'draft' | 'published';
}

export interface Rating {
  id: string;
  user_id: string;
  deal_name: string;
  created_at: string;
  score: number;
  feedback: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface DashboardData {
  recentUploads: Document[];
  briefings: Briefing[];
  ratings: Rating[];
  profiles: Profile[];
} 