export type InvestorType = 'individual' | 'institutional' | 'agent'

export interface InvestmentPreferences {
  propertyTypes?: string[]
  locations?: string[]
  priceRange?: {
    min?: number
    max?: number
  }
  investmentStrategy?: string[]
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  investor_type?: InvestorType
  investment_preferences?: InvestmentPreferences
  created_at: string
  updated_at: string
} 