import { supabase } from '@/lib/supabaseClient';
import type { InvestorProfile, InvestorProfileInput } from '@/types/investor';

export class InvestorProfileService {
  static async listProfiles(userId: string): Promise<InvestorProfile[]> {
    const { data, error } = await supabase
      .from('investor_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async getProfile(id: string, userId: string): Promise<InvestorProfile> {
    const { data, error } = await supabase
      .from('investor_profiles')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async createProfile(userId: string, profile: InvestorProfileInput): Promise<InvestorProfile> {
    const { data, error } = await supabase
      .from('investor_profiles')
      .insert([{ ...profile, user_id: userId }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async updateProfile(id: string, userId: string, profile: Partial<InvestorProfileInput>): Promise<InvestorProfile> {
    const { data, error } = await supabase
      .from('investor_profiles')
      .update(profile)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async deleteProfile(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('investor_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  }
} 