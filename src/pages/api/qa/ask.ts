import { NextApiRequest, NextApiResponse } from 'next';
import { QAService } from '@/services/qaService';
import type { QAResponse } from '@/types/qa';

const qaService = new QAService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QAResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { briefingId, question } = req.body;

  if (!briefingId || !question) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Check cache first
    const cached = await qaService.getCachedAnswer(question);
    if (cached) {
      return res.status(200).json({
        answer: cached.answer,
        sources: cached.sources,
        confidence: cached.confidence
      });
    }

    // If not in cache, get new answer
    const answer = await qaService.askQuestion(briefingId, question);
    
    // Cache the new answer
    await qaService.cacheAnswer(question, answer);

    return res.status(200).json(answer);
  } catch (error) {
    console.error('Error answering question:', error);
    return res.status(500).json({ error: 'Failed to answer question' });
  }
} 