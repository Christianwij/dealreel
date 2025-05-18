export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const VALID_FILE_TYPES = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word'
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateFile = (file: File): ValidationResult => {
  // Check file type
  if (!Object.keys(VALID_FILE_TYPES).includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported. Please upload PDF, PPTX, or DOCX.'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit.`
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty.'
    };
  }

  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const getFileTypeDisplay = (mimeType: string): string => {
  return VALID_FILE_TYPES[mimeType as keyof typeof VALID_FILE_TYPES] || 'Unknown';
} 