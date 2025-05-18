import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { validateFile, ValidationResult } from '@/utils/fileValidation';
import { initiateDocumentParsing } from './documentParser';
import { env } from '@/config/env';

const supabase = createClient(
  env.supabase.url,
  env.supabase.anonKey
);

export interface UploadResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    path: string;
    size: number;
    type: string;
  };
}

export const uploadFile = async (file: File, userId: string): Promise<UploadResult> => {
  // Validate file first
  const validation: ValidationResult = validateFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  try {
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Create database record
    const { data: dbRecord, error: dbError } = await supabase
      .from('uploads')
      .insert({
        user_id: userId,
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: filePath,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      // If database insert fails, delete the uploaded file
      await supabase.storage
        .from('documents')
        .remove([filePath]);
      throw dbError;
    }

    // Initiate document parsing
    try {
      await initiateDocumentParsing(
        dbRecord.id,
        filePath,
        file.type,
        userId
      );
    } catch (parseError) {
      console.error('Failed to initiate document parsing:', parseError);
      // Update upload status to error
      await supabase
        .from('uploads')
        .update({
          status: 'error',
          error_message: 'Failed to initiate document parsing'
        })
        .eq('id', dbRecord.id);
      throw parseError;
    }

    return {
      success: true,
      data: {
        id: dbRecord.id,
        path: publicUrl,
        size: file.size,
        type: file.type
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };
  }
};

export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('documents')
      .remove([filePath]);

    return !error;
  } catch {
    return false;
  }
}; 