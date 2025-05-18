export interface DealRatingData {
  rating: number;
  comments: string;
  updated_at: string;
}

export interface DealSummary {
  id: string;
  briefing_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  rating_snapshot: number;
  comments_snapshot: string;
}

export interface RatingHistory {
  id: string;
  briefing_id: string;
  rating: number;
  comments: string;
  created_at: string;
}

export interface SummaryExport {
  briefingTitle: string;
  rating: number;
  comments: string;
  summary: string;
  generatedAt: string;
  exportedAt: string;
}

export interface ShareOptions {
  includeRating: boolean;
  includeComments: boolean;
  includeSummary: boolean;
  expiresIn?: number; // hours
} 