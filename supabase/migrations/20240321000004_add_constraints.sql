-- Add constraints to uploads table
ALTER TABLE public.uploads
  ADD CONSTRAINT check_file_size_positive CHECK (file_size > 0),
  ADD CONSTRAINT check_upload_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  ALTER COLUMN filename SET NOT NULL,
  ALTER COLUMN file_type SET NOT NULL,
  ALTER COLUMN storage_path SET NOT NULL;

-- Add constraints to briefings table
ALTER TABLE public.briefings
  ADD CONSTRAINT check_briefing_status CHECK (status IN ('processing', 'completed', 'failed')),
  ADD CONSTRAINT check_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Add constraints to investor_profiles table
ALTER TABLE public.investor_profiles
  ADD CONSTRAINT check_preferred_tone CHECK (preferred_tone IN ('concise', 'detailed', 'technical', 'simple')),
  ALTER COLUMN industry_focus SET DEFAULT '{}',
  ALTER COLUMN stage_preference SET DEFAULT '{}',
  ALTER COLUMN important_kpis SET DEFAULT '{}',
  ALTER COLUMN red_flags SET DEFAULT '{}';

-- Add constraints to summaries table
ALTER TABLE public.summaries
  ALTER COLUMN content SET NOT NULL,
  ADD CONSTRAINT check_content_not_empty CHECK (content != '');

-- Add constraints to qna_sessions table
ALTER TABLE public.qna_sessions
  ADD CONSTRAINT check_questions_json CHECK (
    jsonb_typeof(questions::jsonb) = 'array'
  ); 