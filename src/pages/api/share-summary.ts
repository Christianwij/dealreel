import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ShareOptions } from '@/types/rating';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { briefingId, options } = req.body as {
      briefingId: string;
      options: ShareOptions;
    };

    if (!briefingId || !options) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch briefing and latest summary
    const { data: briefing, error: briefingError } = await supabase
      .from('briefings')
      .select(`
        id,
        title,
        rating,
        comments,
        summaries (
          id,
          content,
          created_at
        )
      `)
      .eq('id', briefingId)
      .order('summaries.created_at', { foreignTable: 'summaries', ascending: false })
      .limit(1, { foreignTable: 'summaries' })
      .single();

    if (briefingError || !briefing) {
      console.error('Error fetching briefing:', briefingError);
      return res.status(404).json({ error: 'Briefing not found' });
    }

    // Create a shareable object with selected content
    const shareableContent = {
      title: briefing.title,
      ...(options.includeRating && { rating: briefing.rating }),
      ...(options.includeComments && { comments: briefing.comments }),
      ...(options.includeSummary && briefing.summaries?.[0] && {
        summary: briefing.summaries[0].content,
        summaryDate: briefing.summaries[0].created_at
      })
    };

    // Generate a unique share ID
    const shareId = Math.random().toString(36).substring(2, 15);

    // Calculate expiration time
    const expiresAt = options.expiresIn
      ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours

    // Store shareable content in Supabase
    const { data: share, error: shareError } = await supabase
      .from('shared_summaries')
      .insert({
        id: shareId,
        briefing_id: briefingId,
        content: shareableContent,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (shareError) {
      console.error('Error creating share:', shareError);
      throw shareError;
    }

    // Generate shareable URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shared/${shareId}`;

    return res.status(200).json({ shareUrl, expiresAt });
  } catch (error) {
    console.error('Error in share-summary:', error);
    return res.status(500).json({ error: 'Failed to create share link' });
  }
} 