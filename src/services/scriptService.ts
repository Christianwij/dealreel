import { createClient } from '@/lib/supabase/client';
import type { ScriptGenerationRequest, ScriptGenerationResponse, ScriptRecord, ScriptStatus } from '@/types/script';
import { LLMService } from './llmService';
import { InvestorProfileService } from './investorProfileService';

export class ScriptService {
  private static supabase = createClient();

  static async createScript(userId: string, request: ScriptGenerationRequest): Promise<ScriptRecord> {
    // First, verify the investor profile belongs to the user
    const profile = await InvestorProfileService.getProfile(request.investorProfileId, userId);
    if (!profile) {
      throw new Error('Investor profile not found or access denied');
    }

    // Create initial record
    const { data: script, error: insertError } = await this.supabase
      .from('scripts')
      .insert({
        upload_id: request.uploadId,
        investor_profile_id: request.investorProfileId,
        status: 'generating' as ScriptStatus,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError || !script) {
      throw new Error(`Failed to create script record: ${insertError?.message}`);
    }

    try {
      // Generate the script
      const result = await LLMService.generateScript(request.parsedContent, profile);

      // Update the record with the generated script
      const { data: updatedScript, error: updateError } = await this.supabase
        .from('scripts')
        .update({
          script: result.script,
          status: 'completed' as ScriptStatus,
          metadata: result.metadata,
        })
        .eq('id', script.id)
        .select()
        .single();

      if (updateError || !updatedScript) {
        throw new Error(`Failed to update script record: ${updateError?.message}`);
      }

      return this.mapScriptRecord(updatedScript);
    } catch (error) {
      // Update the record with error status
      await this.supabase
        .from('scripts')
        .update({
          status: 'failed' as ScriptStatus,
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
        })
        .eq('id', script.id);

      throw error;
    }
  }

  static async getScript(scriptId: string, userId: string): Promise<ScriptRecord> {
    const { data: script, error } = await this.supabase
      .from('scripts')
      .select('*, investor_profiles(*)')
      .eq('id', scriptId)
      .eq('user_id', userId)
      .single();

    if (error || !script) {
      throw new Error(`Failed to fetch script: ${error?.message}`);
    }

    return this.mapScriptRecord(script);
  }

  static async listScripts(userId: string): Promise<ScriptRecord[]> {
    const { data: scripts, error } = await this.supabase
      .from('scripts')
      .select('*, investor_profiles(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch scripts: ${error.message}`);
    }

    return scripts.map(this.mapScriptRecord);
  }

  static async deleteScript(scriptId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('scripts')
      .delete()
      .eq('id', scriptId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete script: ${error.message}`);
    }
  }

  private static mapScriptRecord(record: any): ScriptRecord {
    return {
      id: record.id,
      uploadId: record.upload_id,
      investorProfileId: record.investor_profile_id,
      script: record.script,
      status: record.status,
      metadata: record.metadata,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }
} 