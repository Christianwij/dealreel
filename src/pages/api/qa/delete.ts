import { NextApiRequest, NextApiResponse } from 'next';
import { QAService } from '../../../services/qaService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { questionId } = req.query;

    if (!questionId || Array.isArray(questionId)) {
      return res.status(400).json({ error: 'Invalid questionId' });
    }

    const qaService = new QAService();
    await qaService.deleteQuestion(questionId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in Q&A delete endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 