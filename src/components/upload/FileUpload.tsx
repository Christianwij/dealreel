'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useDocuments } from '@/hooks/useDocuments';
import * as Sentry from '@sentry/nextjs';
import { toast } from 'react-hot-toast';

interface FileUploadProps {
  onUploadComplete?: (documentId: string) => void;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

export function FileUpload({ 
  onUploadComplete, 
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast: useToastToast } = useToast();
  const { addDocument } = useDocuments();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setIsUploading(true);

      // Start Sentry transaction
      const transaction = Sentry.startTransaction({
        name: 'file_upload',
        op: 'upload'
      });

      // Add file metadata to transaction
      transaction.setData('fileCount', acceptedFiles.length);
      transaction.setData('totalSize', acceptedFiles.reduce((acc, file) => acc + file.size, 0));
      transaction.setData('fileTypes', acceptedFiles.map(file => file.type));

      // Perform upload
      const startTime = performance.now();
      for (const file of acceptedFiles) {
        setSelectedFile(file);
        setUploadProgress(0);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 95) {
              clearInterval(progressInterval);
              return 95;
            }
            return prev + 5;
          });
        }, 100);

        // TODO: Replace with actual file upload to storage service
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Add document record to database
        const document = await addDocument({
          title: file.name,
          file_path: `/uploads/${file.name}`, // This will be replaced with actual storage path
          file_type: file.type,
          file_size: file.size,
          user_id: '', // This will be filled by RLS policy
          status: 'processing',
          metadata: {
            originalName: file.name,
            lastModified: file.lastModified,
          },
        });

        clearInterval(progressInterval);
        setUploadProgress(100);
        
        useToastToast({
          title: 'Upload Complete',
          description: `Successfully uploaded ${file.name}`,
        });

        if (onUploadComplete && document) {
          onUploadComplete(document.id);
        }
      }

      const duration = performance.now() - startTime;

      // Add performance data
      transaction.setData('duration', duration);
      transaction.finish();

      toast.success('Files uploaded successfully');
    } catch (error) {
      // Capture error with context
      Sentry.withScope(scope => {
        scope.setExtra('files', acceptedFiles.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        })));
        Sentry.captureException(error);
      });

      toast.error('Failed to upload files');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setUploadProgress(0);
    }
  }, [addDocument, onUploadComplete, useToastToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    multiple: true,
    disabled: isUploading
  });

  const cancelUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          {isDragActive
            ? 'Drop the files here'
            : 'Drag and drop files here, or click to select'}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Supported formats: PDF, DOCX, PPTX (Max size: {maxSize / (1024 * 1024)}MB)
        </p>
      </div>

      {(isUploading || selectedFile) && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{selectedFile?.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={cancelUpload}
                disabled={uploadProgress === 100}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              {uploadProgress}%
            </span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  );
} 