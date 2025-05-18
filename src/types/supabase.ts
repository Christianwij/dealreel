export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ProfilePreferences {
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  dashboardLayout?: {
    showDocuments?: boolean;
    showBriefings?: boolean;
    showRatings?: boolean;
  };
  [key: string]: any;
}

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          file_path: string
          file_type: string
          file_size: number
          user_id: string
          status: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          file_path: string
          file_type: string
          file_size: number
          user_id: string
          status?: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          file_path?: string
          file_type?: string
          file_size?: number
          user_id?: string
          status?: string
          metadata?: Json
        }
      }
      briefings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          document_id: string
          user_id: string
          title: string
          script: string
          video_url: string
          status: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          document_id: string
          user_id: string
          title: string
          script: string
          video_url?: string
          status?: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          document_id?: string
          user_id?: string
          title?: string
          script?: string
          video_url?: string
          status?: string
          metadata?: Json
        }
      }
      ratings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          briefing_id: string
          user_id: string
          score: number
          comments: string
          summary: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          briefing_id: string
          user_id: string
          score: number
          comments?: string
          summary?: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          briefing_id?: string
          user_id?: string
          score?: number
          comments?: string
          summary?: string
          metadata?: Json
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          full_name: string
          avatar_url: string
          preferences: ProfilePreferences
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          full_name?: string
          avatar_url?: string
          preferences?: ProfilePreferences
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          full_name?: string
          avatar_url?: string
          preferences?: ProfilePreferences
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 