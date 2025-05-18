import type { Industry, Stage, KPI, RedFlag, Tone } from '@/types/investor';

interface Option<T extends string> {
  value: T;
  label: string;
}

export const INDUSTRY_OPTIONS: Option<Industry>[] = [
  { value: 'saas', label: 'SaaS' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'biotech', label: 'Biotech' },
  { value: 'climate', label: 'Climate Tech' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'ai_ml', label: 'AI/ML' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'enterprise', label: 'Enterprise Software' },
  { value: 'consumer', label: 'Consumer Tech' },
];

export const STAGE_OPTIONS: Option<Stage>[] = [
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'series_c', label: 'Series C' },
  { value: 'growth', label: 'Growth' },
  { value: 'pe', label: 'Private Equity' },
  { value: 'pre_ipo', label: 'Pre-IPO' },
];

export const KPI_OPTIONS: Option<KPI>[] = [
  { value: 'cac_ltv', label: 'CAC/LTV Ratio' },
  { value: 'burn_rate', label: 'Burn Rate' },
  { value: 'revenue_retention', label: 'Revenue Retention' },
  { value: 'exit_potential', label: 'Exit Potential' },
  { value: 'gmv', label: 'Gross Merchandise Value' },
  { value: 'arr', label: 'Annual Recurring Revenue' },
  { value: 'gross_margin', label: 'Gross Margin' },
  { value: 'user_growth', label: 'User Growth' },
  { value: 'market_size', label: 'Market Size' },
  { value: 'unit_economics', label: 'Unit Economics' },
];

export const RED_FLAG_OPTIONS: Option<RedFlag>[] = [
  { value: 'high_churn', label: 'High Churn Rate' },
  { value: 'no_moat', label: 'No Competitive Moat' },
  { value: 'team_gaps', label: 'Team Gaps' },
  { value: 'regulatory_risk', label: 'Regulatory Risk' },
  { value: 'market_saturation', label: 'Market Saturation' },
  { value: 'cash_burn', label: 'High Cash Burn' },
  { value: 'tech_debt', label: 'Technical Debt' },
  { value: 'customer_concentration', label: 'Customer Concentration' },
];

export const TONE_OPTIONS: Option<Tone>[] = [
  { value: 'concise', label: 'Concise' },
  { value: 'deep_dive', label: 'Deep Dive' },
  { value: 'casual', label: 'Casual' },
  { value: 'institutional', label: 'Institutional' },
]; 