-- Create enum types
CREATE TYPE industry AS ENUM ('SaaS', 'AI/ML', 'Fintech', 'E-commerce', 'Healthcare');
CREATE TYPE investment_stage AS ENUM ('Seed', 'Series A', 'Series B', 'Series C', 'Growth');
CREATE TYPE kpi AS ENUM ('ARR', 'MRR', 'CAC', 'LTV', 'Churn Rate');
CREATE TYPE red_flag AS ENUM ('High Burn Rate', 'High CAC', 'Low Margins', 'Market Saturation');
CREATE TYPE communication_tone AS ENUM ('Formal', 'Casual', 'Technical', 'Friendly');

-- Create investor_profiles table
CREATE TABLE investor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industries industry[] NOT NULL,
  stages investment_stage[] NOT NULL,
  min_investment INTEGER NOT NULL CHECK (min_investment >= 0),
  max_investment INTEGER NOT NULL CHECK (max_investment >= min_investment),
  kpis kpi[] NOT NULL,
  red_flags red_flag[] NOT NULL,
  communication_tone communication_tone NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_investor_profiles_updated_at
  BEFORE UPDATE ON investor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 