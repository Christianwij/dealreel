-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create investor_profiles table
CREATE TABLE IF NOT EXISTS public.investor_profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  industry_focus TEXT[] DEFAULT '{}',
  stage_preference TEXT[] DEFAULT '{}',
  important_kpis TEXT[] DEFAULT '{}',
  red_flags TEXT[] DEFAULT '{}',
  preferred_tone TEXT DEFAULT 'concise',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploads table
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create briefings table
CREATE TABLE IF NOT EXISTS public.briefings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  upload_id UUID REFERENCES uploads NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  video_url TEXT,
  script JSON,
  status TEXT DEFAULT 'processing',
  rating INTEGER,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create summaries table
CREATE TABLE IF NOT EXISTS public.summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  briefing_id UUID REFERENCES briefings NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create qna_sessions table
CREATE TABLE IF NOT EXISTS public.qna_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  briefing_id UUID REFERENCES briefings NOT NULL,
  questions JSON DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 