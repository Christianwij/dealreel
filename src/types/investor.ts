export type Industry = 'SaaS' | 'AI/ML' | 'Fintech' | 'E-commerce' | 'Healthcare';

export type Stage = 'Seed' | 'Series A' | 'Series B' | 'Series C' | 'Growth';

export type KPI = 'ARR' | 'MRR' | 'CAC' | 'LTV' | 'Churn Rate';

export type RedFlag = 'High Burn Rate' | 'High CAC' | 'Low Margins' | 'Market Saturation';

export type Tone = 'Formal' | 'Casual' | 'Technical' | 'Friendly';

export interface InvestorProfile {
  id: string;
  name: string;
  industries: Industry[];
  stages: Stage[];
  minInvestment: number;
  maxInvestment: number;
  kpis: KPI[];
  redFlags: RedFlag[];
  communicationTone: Tone;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type InvestorProfileInput = Omit<InvestorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export type InvestorProfileUpdate = Partial<InvestorProfileInput> & { id: string }; 