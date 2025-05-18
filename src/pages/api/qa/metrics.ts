import { NextApiRequest, NextApiResponse } from 'next';
import { QAService } from '@/services/qaService';
import type { PerformanceMetrics } from '@/types/qa';

const qaService = new QAService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ metrics: PerformanceMetrics; errorLogs?: string[] } | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { briefingId, includeErrors } = req.query;

    if (!briefingId || typeof briefingId !== 'string') {
      return res.status(400).json({ error: 'Briefing ID is required' });
    }

    const metrics = await qaService.getMetrics(briefingId);

    if (includeErrors === 'true') {
      const errorLogs = await qaService.getErrorLogs(100); // Get last 100 errors
      return res.status(200).json({ metrics, errorLogs });
    }

    return res.status(200).json({ metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch metrics' });
  }
} 