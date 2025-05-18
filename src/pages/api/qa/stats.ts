import { NextApiRequest, NextApiResponse } from 'next';
import { QAService } from '@/services/qaService';
import type { CacheStats } from '@/types/qa';

const qaService = new QAService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CacheStats | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = await qaService.getStats();
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return res.status(500).json({ error: 'Failed to fetch cache statistics' });
  }
} 