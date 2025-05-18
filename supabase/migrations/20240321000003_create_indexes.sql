-- Create indexes for uploads table
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON public.uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON public.uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON public.uploads(created_at DESC);

-- Create indexes for briefings table
CREATE INDEX IF NOT EXISTS idx_briefings_user_id ON public.briefings(user_id);
CREATE INDEX IF NOT EXISTS idx_briefings_upload_id ON public.briefings(upload_id);
CREATE INDEX IF NOT EXISTS idx_briefings_status ON public.briefings(status);
CREATE INDEX IF NOT EXISTS idx_briefings_created_at ON public.briefings(created_at DESC);

-- Create indexes for summaries table
CREATE INDEX IF NOT EXISTS idx_summaries_briefing_id ON public.summaries(briefing_id);
CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON public.summaries(created_at DESC);

-- Create indexes for qna_sessions table
CREATE INDEX IF NOT EXISTS idx_qna_sessions_briefing_id ON public.qna_sessions(briefing_id);
CREATE INDEX IF NOT EXISTS idx_qna_sessions_created_at ON public.qna_sessions(created_at DESC);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_briefings_user_status ON public.briefings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_uploads_user_status ON public.uploads(user_id, status); 