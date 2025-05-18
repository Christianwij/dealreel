export interface Briefing {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  document_id: string;
  user_id: string;
  script: string;
  video_url: string;
  documents: {
    title: string;
    file_type: string;
  };
  metadata: {
    rating?: number;
    averageRating?: number;
  };
}

export interface BriefingCardProps {
  briefing: Briefing;
  onDelete: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  onDownload: (briefing: Briefing) => void;
  onView: (briefing: Briefing) => void;
} 