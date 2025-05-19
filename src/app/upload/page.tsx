'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/upload/FileUpload';
import { ProgressBar } from '@/components/ProgressBar';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { uploadFile } from '@/services/fileStorage';
import { getParsingStatus } from '@/services/documentParser';
import { useAuth } from '@/contexts/AuthContext';
import { formatFileSize, getFileTypeDisplay } from '@/utils/fileValidation';

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [parsingStatus, setParsingStatus] = useState<string | null>(null);

  // Poll for parsing status
  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout | undefined;

    const checkStatus = async () => {
      if (!uploadId || !mounted) return;

      try {
        const status = await getParsingStatus(uploadId);
        if (!mounted) return;

        setParsingStatus(status);

        if (status === 'completed') {
          router.push('/dashboard');
        } else if (status === 'error') {
          setError('Error parsing document');
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Error checking parsing status:', err);
        setError('Error checking parsing status');
      }
    };

    if (uploadId && parsingStatus !== 'completed' && parsingStatus !== 'error') {
      // Initial check
      checkStatus();
      // Set up polling
      interval = setInterval(checkStatus, 2000);
    }

    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [uploadId, parsingStatus, router]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const result = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      setUploadId(result.id);
      setParsingStatus('processing');
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Upload Document</h1>

      {error && (
        <ErrorDisplay
          message={error}
          className="mb-6"
          onDismiss={() => setError(null)}
        />
      )}

      <div className="space-y-8">
        <FileUpload
          onUploadComplete={handleUpload}
          maxSize={10 * 1024 * 1024} // 10MB
        />

        {(isUploading || parsingStatus === 'processing') && (
          <div className="space-y-4">
            {uploadProgress !== null && (
              <ProgressBar
                progress={uploadProgress}
                label={isUploading ? 'Uploading...' : 'Processing...'}
              />
            )}
            <p className="text-sm text-gray-600">
              {isUploading
                ? 'Uploading your document...'
                : 'Processing your document...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 