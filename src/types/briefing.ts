import { Database } from './supabase';

export interface BriefingMetadata {
  averageRating?: number;
  totalRatings?: number;
  lastRatedAt?: string;
  processingStatus?: {
    stage: 'queued' | 'processing' | 'completed' | 'failed';
    progress?: number;
    error?: string;
  };
  videoGeneration?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    duration?: number;
    format?: string;
    error?: string;
  };
  [key: string]: unknown;
}

export type BriefingStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface Briefing extends Omit<Database['public']['Tables']['briefings']['Row'], 'metadata' | 'status'> {
  metadata: BriefingMetadata;
  status: BriefingStatus;
  document?: Database['public']['Tables']['documents']['Row'];
}

export interface BriefingWithDocument extends Briefing {
  document: Database['public']['Tables']['documents']['Row'];
}

export interface BriefingInput extends Omit<Database['public']['Tables']['briefings']['Insert'], 'metadata' | 'status'> {
  metadata?: BriefingMetadata;
  status?: BriefingStatus;
}

export interface BriefingCardProps {
  briefing: Briefing;
  onDelete: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  onDownload: (briefing: Briefing) => void;
  onView: (briefing: Briefing) => void;
} 