import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { DealSummary } from '@/types/rating';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { briefingId, rating, comment } = req.body;

    if (!briefingId || rating === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch briefing details
    const { data: briefing, error: briefingError } = await supabase
      .from('briefings')
      .select('title, description, content')
      .eq('id', briefingId)
      .single();

    if (briefingError || !briefing) {
      console.error('Error fetching briefing:', briefingError);
      return res.status(404).json({ error: 'Briefing not found' });
    }

    // Generate summary using OpenAI
    const prompt = `Please provide a concise and professional summary of this business deal:

Title: ${briefing.title}
Description: ${briefing.description}
Content: ${briefing.content}
Rating: ${rating}/10
User Comments: ${comment || 'No comments provided'}

Please include:
1. Key points and value proposition
2. Notable strengths and potential concerns
3. Overall assessment based on the rating and comments
4. Recommendations for next steps

Format the response in clear paragraphs.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a professional business analyst specializing in deal evaluation and summary generation. Provide clear, concise, and actionable summaries."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const summaryContent = completion.choices[0]?.message?.content;

    if (!summaryContent) {
      throw new Error('Failed to generate summary content');
    }

    // Save summary to database
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .insert({
        briefing_id: briefingId,
        content: summaryContent,
        rating_snapshot: rating,
        comments_snapshot: comment || null
      })
      .select()
      .single();

    if (summaryError) {
      console.error('Error saving summary:', summaryError);
      throw summaryError;
    }

    return res.status(200).json({ summary });
  } catch (error) {
    console.error('Error in generate-summary:', error);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
} 