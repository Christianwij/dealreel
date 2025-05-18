import { OpenAI } from 'openai';
import type { DealSummary, ShareOptions } from '@/types/rating';

export type ExportFormat = 'pdf' | 'csv' | 'json';

interface ExportOptions {
  format: ExportFormat;
  includeRating?: boolean;
  includeComments?: boolean;
  includeSummary?: boolean;
}

interface SummaryRequest {
  briefingId: string;
  content: string;
  preferences: {
    style: 'concise' | 'detailed';
    focusAreas: string[];
  };
}

interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  timestamp: string;
}

export class SummaryService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
    });
  }

  async generateSummary(request: SummaryRequest): Promise<SummaryResponse> {
    if (!request.content) {
      throw new Error('Invalid request parameters');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Generate a ${request.preferences.style} summary focusing on: ${request.preferences.focusAreas.join(', ')}`
          },
          {
            role: 'user',
            content: `Briefing ID: ${request.briefingId}\nContent: ${request.content}`
          }
        ]
      });

      return JSON.parse(completion.choices[0].message.content) as SummaryResponse;
    } catch (error) {
      throw new Error('Failed to generate summary');
    }
  }

  async getLatestSummary(briefingId: string): Promise<DealSummary | null> {
    try {
      const { data, error } = await this.supabase
        .from('summaries')
        .select('*')
        .eq('briefing_id', briefingId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getLatestSummary:', error);
      throw error;
    }
  }

  async getSummaryHistory(briefingId: string): Promise<DealSummary[]> {
    try {
      const { data, error } = await this.supabase
        .from('summaries')
        .select('*')
        .eq('briefing_id', briefingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getSummaryHistory:', error);
      throw error;
    }
  }

  async shareSummary(briefingId: string, options: ShareOptions): Promise<{ shareUrl: string; expiresAt: string }> {
    try {
      const response = await fetch('/api/share-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          briefingId,
          options
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to share summary');
      }

      return response.json();
    } catch (error) {
      console.error('Error in shareSummary:', error);
      throw error;
    }
  }

  async exportSummary(briefingId: string, options: ExportOptions): Promise<Blob> {
    try {
      // Fetch the briefing data
      const { data: briefing, error: briefingError } = await this.supabase
        .from('briefings')
        .select('*, summaries(*)')
        .eq('id', briefingId)
        .single();

      if (briefingError) throw briefingError;
      if (!briefing) throw new Error('Briefing not found');

      const exportData = {
        ...(options.includeRating && { rating: briefing.rating }),
        ...(options.includeComments && { comments: briefing.comments }),
        ...(options.includeSummary && briefing.summaries?.[0]?.content && {
          summary: briefing.summaries[0].content
        }),
        exportedAt: new Date().toISOString()
      };

      switch (options.format) {
        case 'json':
          return new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
          });

        case 'csv': {
          const rows = [
            ['Field', 'Value'],
            ...(options.includeRating ? [['Rating', briefing.rating]] : []),
            ...(options.includeComments ? [['Comments', briefing.comments]] : []),
            ...(options.includeSummary && briefing.summaries?.[0]?.content
              ? [['Summary', briefing.summaries[0].content]]
              : []),
            ['Exported At', exportData.exportedAt]
          ];
          const csv = rows.map(row => row.map(cell => 
            typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
          ).join(',')).join('\n');
          return new Blob([csv], { type: 'text/csv' });
        }

        case 'pdf': {
          const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exportData)
          });

          if (!response.ok) {
            throw new Error('Failed to generate PDF');
          }

          return await response.blob();
        }

        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error in exportSummary:', error);
      throw error;
    }
  }

  async batchExportSummaries(briefingIds: string[], options: ExportOptions): Promise<Blob> {
    try {
      const { data: briefings, error: briefingsError } = await this.supabase
        .from('briefings')
        .select('*, summaries(*)')
        .in('id', briefingIds);

      if (briefingsError) throw briefingsError;
      if (!briefings?.length) throw new Error('No briefings found');

      const exportData = briefings.map(briefing => ({
        briefingId: briefing.id,
        ...(options.includeRating && { rating: briefing.rating }),
        ...(options.includeComments && { comments: briefing.comments }),
        ...(options.includeSummary && briefing.summaries?.[0]?.content && {
          summary: briefing.summaries[0].content
        })
      }));

      switch (options.format) {
        case 'json':
          return new Blob([JSON.stringify({
            briefings: exportData,
            exportedAt: new Date().toISOString()
          }, null, 2)], { type: 'application/json' });

        case 'csv': {
          const headers = ['Briefing ID'];
          if (options.includeRating) headers.push('Rating');
          if (options.includeComments) headers.push('Comments');
          if (options.includeSummary) headers.push('Summary');
          headers.push('Exported At');

          const rows = [
            headers,
            ...exportData.map(data => {
              const row = [data.briefingId];
              if (options.includeRating) row.push(data.rating);
              if (options.includeComments) row.push(data.comments);
              if (options.includeSummary) row.push(data.summary);
              row.push(new Date().toISOString());
              return row;
            })
          ];

          const csv = rows.map(row => row.map(cell => 
            typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
          ).join(',')).join('\n');
          return new Blob([csv], { type: 'text/csv' });
        }

        case 'pdf': {
          const response = await fetch('/api/generate-batch-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              briefings: exportData,
              exportedAt: new Date().toISOString()
            })
          });

          if (!response.ok) {
            throw new Error('Failed to generate batch PDF');
          }

          return await response.blob();
        }

        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error in batchExportSummaries:', error);
      throw error;
    }
  }
} 