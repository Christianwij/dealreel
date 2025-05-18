import { supabase } from '@/lib/supabase'
import type { UserProfile, InvestmentPreferences, InvestorType } from '@/types/user'

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }

  return data
}

export async function updateUserProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  return data
}

export async function updateInvestorType(
  userId: string,
  investorType: InvestorType
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({
      investor_type: investorType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating investor type:', error)
    throw error
  }
}

export async function updateInvestmentPreferences(
  userId: string,
  preferences: InvestmentPreferences
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({
      investment_preferences: preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating investment preferences:', error)
    throw error
  }
} 