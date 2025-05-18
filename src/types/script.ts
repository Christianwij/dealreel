import { z } from 'zod';

export const scriptSectionSchema = z.object({
  introduction: z.string(),
  businessModel: z.string(),
  tractionMetrics: z.string(),
  riskAssessment: z.string(),
  summary: z.string(),
});

export type ScriptSections = z.infer<typeof scriptSectionSchema>;

export interface ScriptGenerationRequest {
  uploadId: string;
  parsedContent: Record<string, any>;
  investorProfileId: string;
}

export interface ScriptGenerationResponse {
  script: ScriptSections;
  metadata: {
    model: string;
    generationTime: number;
    tokensUsed: number;
  };
}

export type ScriptStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface ScriptRecord {
  id: string;
  uploadId: string;
  investorProfileId: string;
  script: ScriptSections;
  status: ScriptStatus;
  metadata: {
    model: string;
    generationTime: number;
    tokensUsed: number;
    error?: string;
  };
  created_at: string;
  updated_at: string;
} 