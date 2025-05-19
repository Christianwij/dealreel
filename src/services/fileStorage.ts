import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { validateFile, ValidationResult } from '@/utils/fileValidation';
import { initiateDocumentParsing } from './documentParser';
import { env } from '@/config/env';
import { supabase } from '@/lib/supabase';

const supabaseClient = createClient(
  env.supabase.url,
  env.supabase.anonKey
);

export interface UploadResult {
  id: string;
  error?: string;
}

export async function uploadFile(
  file: File,
  onProgress: (progress: number) => void
): Promise<UploadResult> {
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate a unique file name
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `uploads/${fileName}`;

    // Create a ReadableStream from the file
    const fileStream = file.stream();
    const reader = fileStream.getReader();
    const fileSize = file.size;
    let uploadedBytes = 0;

    // Create a new ReadableStream that will track progress
    const trackingStream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          uploadedBytes += value.length;
          const progress = (uploadedBytes / fileSize) * 100;
          onProgress(progress);
          
          controller.enqueue(value);
        }
        controller.close();
      }
    });

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, new Blob([await new Response(trackingStream).blob()]), {
        upsert: false
      });

    if (error) throw error;

    // Create database record
    const { data: dbRecord, error: dbError } = await supabase
      .from('document_uploads')
      .insert({
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: filePath,
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
        dbRecord.user_id
      );
    } catch (parseError) {
      console.error('Failed to initiate document parsing:', parseError);
      // Update upload status to error
      await supabase
        .from('document_uploads')
        .update({
          status: 'error',
          error_message: 'Failed to initiate document parsing'
        })
        .eq('id', dbRecord.id);
      throw parseError;
    }

    return {
      id: dbRecord.id,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

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