-- Add rating and comments columns to briefings table
ALTER TABLE briefings
ADD COLUMN rating INTEGER CHECK (rating >= 0 AND rating <= 10),
ADD COLUMN comments TEXT,
ADD COLUMN rating_updated_at TIMESTAMP WITH TIME ZONE;

-- Create summaries table
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating_snapshot INTEGER CHECK (rating_snapshot >= 0 AND rating_snapshot <= 10),
  comments_snapshot TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rating_history table for tracking changes
CREATE TABLE rating_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 0 AND rating <= 10) NOT NULL,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_summaries_briefing_id ON summaries(briefing_id);
CREATE INDEX idx_rating_history_briefing_id ON rating_history(briefing_id);

-- Create function to record rating history
CREATE OR REPLACE FUNCTION record_rating_history()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.rating IS NULL AND NEW.rating IS NOT NULL) OR
     (OLD.rating IS NOT NULL AND NEW.rating != OLD.rating) OR
     (OLD.comments IS NULL AND NEW.comments IS NOT NULL) OR
     (OLD.comments IS NOT NULL AND NEW.comments != OLD.comments) THEN
    INSERT INTO rating_history (briefing_id, rating, comments)
    VALUES (NEW.id, NEW.rating, NEW.comments);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically record rating history
CREATE TRIGGER record_rating_history_trigger
AFTER UPDATE OF rating, comments ON briefings
FOR EACH ROW
EXECUTE FUNCTION record_rating_history();

-- Create function to update rating_updated_at
CREATE OR REPLACE FUNCTION update_rating_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rating_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update rating_updated_at
CREATE TRIGGER update_rating_timestamp_trigger
BEFORE UPDATE OF rating, comments ON briefings
FOR EACH ROW
EXECUTE FUNCTION update_rating_timestamp(); 