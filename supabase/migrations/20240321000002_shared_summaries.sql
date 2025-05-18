-- Create shared_summaries table
CREATE TABLE shared_summaries (
  id TEXT PRIMARY KEY,
  briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster expiration checks
CREATE INDEX idx_shared_summaries_expires_at ON shared_summaries(expires_at);

-- Create RLS policies
ALTER TABLE shared_summaries ENABLE ROW LEVEL SECURITY;

-- Anyone can view a shared summary if they have the ID and it hasn't expired
CREATE POLICY "Anyone can view non-expired shared summaries" ON shared_summaries
  FOR SELECT
  USING (expires_at > NOW());

-- Only authenticated users can create shared summaries
CREATE POLICY "Authenticated users can create shared summaries" ON shared_summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only the creator can delete their shared summaries
CREATE POLICY "Users can delete their shared summaries" ON shared_summaries
  FOR DELETE
  USING (
    briefing_id IN (
      SELECT id FROM briefings WHERE user_id = auth.uid()
    )
  ); 