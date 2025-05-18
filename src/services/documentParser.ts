import { env } from '@/config/env';

interface ParseDocumentResponse {
  status: 'processing' | 'error';
  upload_id: string;
  message: string;
}

export const initiateDocumentParsing = async (
  uploadId: string,
  filePath: string,
  fileType: string,
  userId: string
): Promise<ParseDocumentResponse> => {
  try {
    const response = await fetch(`${env.parsingService.url}/parse-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        upload_id: uploadId,
        file_path: filePath,
        file_type: fileType,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to initiate document parsing');
    }

    return await response.json();
  } catch (error) {
    console.error('Error initiating document parsing:', error);
    throw error;
  }
};

export const getParsingStatus = async (uploadId: string): Promise<string> => {
  try {
    const response = await fetch(`${env.parsingService.url}/status/${uploadId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get parsing status');
    }

    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error('Error getting parsing status:', error);
    throw error;
  }
}; 