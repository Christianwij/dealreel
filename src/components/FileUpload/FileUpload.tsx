'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud } from 'react-icons/fi';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, className = '' }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false)
  });

  return (
    <div
      {...getRootProps()}
      className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg transition-colors duration-200 cursor-pointer
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
        ${isDragReject ? 'border-red-500 bg-red-50' : ''}
        ${className}`}
    >
      <input {...getInputProps()} />
      <FiUploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
      <p className="mb-2 text-sm text-gray-600">
        {isDragReject ? (
          'File type not supported'
        ) : isDragActive ? (
          'Drop the file here'
        ) : (
          'Drag & drop a file here, or click to select'
        )}
      </p>
      <p className="text-xs text-gray-500">
        Supported formats: PDF, PPTX, DOCX (Max 50MB)
      </p>
    </div>
  );
}; 