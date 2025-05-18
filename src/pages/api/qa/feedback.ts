import { NextApiRequest, NextApiResponse } from 'next';
import { QAService } from '@/services/qaService';
import type { QAFeedback } from '@/types/qa';

const qaService = new QAService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean } | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const feedback = req.body as QAFeedback;

    if (!feedback.questionId || !feedback.rating) {
      return res.status(400).json({ error: 'Invalid feedback data' });
    }

    await qaService.submitFeedback(feedback);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in Q&A feedback endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 