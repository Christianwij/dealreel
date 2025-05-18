import { supabase } from '@/lib/supabaseClient';
import { InvestorProfile, InvestorProfileInput, InvestorProfileUpdate } from '@/types/investor';

export async function getInvestorProfiles(): Promise<InvestorProfile[]> {
  const { data, error } = await supabase
    .from('investor_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getInvestorProfile(id: string): Promise<InvestorProfile> {
  const { data, error } = await supabase
    .from('investor_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createInvestorProfile(profile: InvestorProfileInput): Promise<InvestorProfile> {
  const { data, error } = await supabase
    .from('investor_profiles')
    .insert([profile])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateInvestorProfile(id: string, profile: InvestorProfileUpdate): Promise<InvestorProfile> {
  const { data, error } = await supabase
    .from('investor_profiles')
    .update(profile)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteInvestorProfile(id: string): Promise<void> {
  const { error } = await supabase
    .from('investor_profiles')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
} 