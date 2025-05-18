export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  parsingService: {
    url: process.env.NEXT_PUBLIC_PARSING_SERVICE_URL || 'http://localhost:8000',
  },
} as const;

// Type-safe environment variable validation
Object.entries(env).forEach(([key, value]) => {
  if (!value || (typeof value === 'object' && Object.values(value).some(v => !v))) {
    throw new Error(`Missing environment variable for ${key}`);
  }
}); 