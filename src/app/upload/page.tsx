'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/FileUpload';
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
    let interval: NodeJS.Timeout;

    if (uploadId && parsingStatus !== 'completed' && parsingStatus !== 'error') {
      interval = setInterval(async () => {
        try {
          const status = await getParsingStatus(uploadId);
          setParsingStatus(status);

          if (status === 'completed' || status === 'error') {
            clearInterval(interval);
            if (status === 'completed') {
              router.push('/dashboard');
            }
          }
        } catch (err) {
          console.error('Error checking parsing status:', err);
          clearInterval(interval);
        }
      }, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [uploadId, parsingStatus, router]);

  const handleFileSelect = async (file: File) => {
    if (!user) {
      setError('Please sign in to upload files');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setParsingStatus(null);

    try {
      const result = await uploadFile(file, user.id);

      if (!result.success) {
        throw new Error(result.error);
      }

      setUploadId(result.data?.id || null);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null || prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);

      // Clear interval and set to 100% when upload is complete
      clearInterval(interval);
      setUploadProgress(100);
      setParsingStatus('processing');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setParsingStatus(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Upload Document</h1>
      
      {error && (
        <ErrorDisplay
          message={error}
          className="mb-4"
          onDismiss={() => setError(null)}
        />
      )}

      <div className="max-w-2xl mx-auto">
        <FileUpload
          onFileSelect={handleFileSelect}
          className={isUploading || parsingStatus === 'processing' ? 'opacity-50 pointer-events-none' : ''}
        />

        {(isUploading || parsingStatus === 'processing') && (
          <div className="mt-4">
            <ProgressBar
              progress={uploadProgress || 0}
              showPercentage
            />
            <p className="text-sm text-gray-600 mt-2 text-center">
              {isUploading ? 'Uploading file...' : 'Processing document...'}
            </p>
          </div>
        )}

        {parsingStatus === 'error' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              Failed to process document. Please try uploading again.
            </p>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Upload Guidelines</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Maximum file size: {formatFileSize(50 * 1024 * 1024)}</li>
            <li>Supported formats: PDF, PowerPoint (PPTX), Word (DOCX)</li>
            <li>Files should be clear and legible</li>
            <li>Avoid uploading files with sensitive personal information</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 