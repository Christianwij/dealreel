import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { scriptSectionSchema, type ScriptSections } from '@/types/script';
import type { InvestorProfile } from '@/types/investor';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
});

const SCRIPT_SCHEMA = zodToJsonSchema(scriptSectionSchema);

export class LLMService {
  private static generatePrompt(parsedContent: Record<string, any>, investorProfile: InvestorProfile): string {
    return `You are an expert investment analyst creating a video script for an investor briefing.

INVESTOR PROFILE:
- Industries: ${investorProfile.industries.join(', ')}
- Stages: ${investorProfile.stages.join(', ')}
- Key KPIs: ${investorProfile.kpis.join(', ')}
- Red Flags: ${investorProfile.redFlags.join(', ')}
- Communication Tone: ${investorProfile.communicationTone}
- Investment Range: $${investorProfile.minInvestment.toLocaleString()} - $${investorProfile.maxInvestment.toLocaleString()}

DOCUMENT CONTENT:
${JSON.stringify(parsedContent, null, 2)}

Create a 2-5 minute video script with the following sections. The response MUST be a valid JSON object matching this schema:
${JSON.stringify(SCRIPT_SCHEMA, null, 2)}

Requirements:
1. Introduction: Brief company overview and compelling value proposition
2. Business Model: Clear explanation of revenue streams and market fit
3. Traction & Metrics: Focus on KPIs relevant to this investor's preferences
4. Risk Assessment: Address potential red flags, especially those the investor watches for
5. Summary: Concise investment potential summary

The script should:
- Match the investor's preferred communication tone
- Be conversational and suitable for voice narration
- Focus on metrics and aspects most relevant to this investor's interests
- Be concise but comprehensive
- Highlight aspects that match the investor's investment criteria
- Address potential concerns proactively`;
  }

  static async generateScript(
    parsedContent: Record<string, any>,
    investorProfile: InvestorProfile
  ): Promise<{ script: ScriptSections; metadata: { model: string; generationTime: number; tokensUsed: number } }> {
    const prompt = this.generatePrompt(parsedContent, investorProfile);
    const startTime = Date.now();

    try {
      // Try Claude 3 Opus first
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const script = JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '') as ScriptSections;
      const validatedScript = scriptSectionSchema.parse(script);

      return {
        script: validatedScript,
        metadata: {
          model: 'claude-3-opus',
          generationTime: Date.now() - startTime,
          tokensUsed: response.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error('Claude API error, falling back to GPT-4:', error);

      // Fallback to GPT-4
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        });

        const script = JSON.parse(response.choices[0].message.content!) as ScriptSections;
        const validatedScript = scriptSectionSchema.parse(script);

        return {
          script: validatedScript,
          metadata: {
            model: 'gpt-4-turbo',
            generationTime: Date.now() - startTime,
            tokensUsed: response.usage?.total_tokens || 0,
          },
        };
      } catch (gptError) {
        console.error('GPT-4 API error:', gptError);
        throw new Error('Failed to generate script with both LLM providers');
      }
    }
  }
} 