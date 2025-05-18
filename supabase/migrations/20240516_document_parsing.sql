-- Create enum for document types
CREATE TYPE document_type AS ENUM (
    'pdf',
    'docx',
    'pptx'
);

-- Create enum for parsing status
CREATE TYPE parsing_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

-- Create table for document uploads
CREATE TABLE document_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type document_type NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create table for parsing jobs
CREATE TABLE document_parses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    upload_id UUID REFERENCES document_uploads(id) ON DELETE CASCADE,
    status parsing_status DEFAULT 'pending',
    parsed_content_path TEXT,
    error TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for extracted content
CREATE TABLE document_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parse_id UUID REFERENCES document_parses(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content JSONB NOT NULL,
    page_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_document_uploads_user_id ON document_uploads(user_id);
CREATE INDEX idx_document_parses_upload_id ON document_parses(upload_id);
CREATE INDEX idx_document_content_parse_id ON document_content(parse_id);

-- Add RLS policies
ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_parses ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;

-- Policy for document uploads
CREATE POLICY "Users can view their own uploads"
    ON document_uploads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
    ON document_uploads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for parsing jobs
CREATE POLICY "Users can view parsing jobs for their uploads"
    ON document_parses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM document_uploads
            WHERE document_uploads.id = document_parses.upload_id
            AND document_uploads.user_id = auth.uid()
        )
    );

-- Policy for document content
CREATE POLICY "Users can view content from their documents"
    ON document_content FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM document_parses
            JOIN document_uploads ON document_uploads.id = document_parses.upload_id
            WHERE document_parses.id = document_content.parse_id
            AND document_uploads.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_document_uploads_updated_at
    BEFORE UPDATE ON document_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_parses_updated_at
    BEFORE UPDATE ON document_parses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create buckets for document storage
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('documents', 'documents', false),
    ('parsed_documents', 'parsed_documents', false);

-- Set up storage policies
CREATE POLICY "Users can upload their own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can read their own documents"
    ON storage.objects FOR SELECT
    USING (
        (bucket_id = 'documents' OR bucket_id = 'parsed_documents') AND
        auth.uid()::text = (storage.foldername(name))[1]
    ); 