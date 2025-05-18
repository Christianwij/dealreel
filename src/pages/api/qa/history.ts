import { NextApiRequest, NextApiResponse } from 'next';
import { QAService } from '@/services/qaService';
import type { QAHistoryItem } from '@/types/qa';

const qaService = new QAService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QAHistoryItem[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const briefingId = req.query.briefingId as string;
    if (!briefingId) {
      return res.status(400).json({ error: 'Briefing ID is required' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const history = await qaService.getHistory(briefingId);
    
    return res.status(200).json(history.slice(0, limit));
  } catch (error) {
    console.error('Error fetching question history:', error);
    return res.status(500).json({ error: 'Failed to fetch question history' });
  }
} 