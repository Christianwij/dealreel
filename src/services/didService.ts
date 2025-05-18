import type { DIDConfig, DIDServiceOptions, DIDTalkRequest, DIDTalkResponse } from '@/types/did';

const DEFAULT_CONFIG: DIDConfig = {
  apiKey: process.env.NEXT_PUBLIC_DID_API_KEY || '',
  baseUrl: 'https://api.d-id.com',
  defaultPresenter: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f_ca_straightface_v3/image.jpeg',
  defaultVoice: 'en-US-GuyNeural',
};

export class DIDService {
  private config: DIDConfig;
  private onProgress?: (progress: number) => void;
  private onError?: (error: Error) => void;

  constructor(options: DIDServiceOptions = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.onProgress = options.onProgress;
    this.onError = options.onError;

    if (!this.config.apiKey) {
      throw new Error('D-ID API key is required');
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Basic ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to make D-ID API request');
      }

      return response.json();
    } catch (error) {
      this.onError?.(error as Error);
      throw error;
    }
  }

  async createTalk(script: string): Promise<string> {
    const request: DIDTalkRequest = {
      script: {
        type: 'text',
        input: script,
        provider: {
          type: 'microsoft',
          voice_id: this.config.defaultVoice,
        },
      },
      config: {
        fluent: true,
        pad_audio: 0,
      },
      source_url: this.config.defaultPresenter,
    };

    const response = await this.makeRequest<DIDTalkResponse>('/talks', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return response.id;
  }

  async getTalkStatus(talkId: string): Promise<DIDTalkResponse> {
    return this.makeRequest<DIDTalkResponse>(`/talks/${talkId}`);
  }

  async waitForTalkCompletion(talkId: string, pollInterval = 1000): Promise<DIDTalkResponse> {
    let result: DIDTalkResponse;
    
    do {
      result = await this.getTalkStatus(talkId);
      
      if (result.status === 'error') {
        throw new Error(result.error?.message || 'Talk generation failed');
      }
      
      if (result.status !== 'done') {
        this.onProgress?.(result.status === 'started' ? 50 : 25);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    } while (result.status !== 'done');

    this.onProgress?.(100);
    return result;
  }

  async generateTalkWithProgress(script: string): Promise<string> {
    this.onProgress?.(0);
    
    const talkId = await this.createTalk(script);
    const result = await this.waitForTalkCompletion(talkId);
    
    if (!result.result_url) {
      throw new Error('No result URL in completed talk');
    }
    
    return result.result_url;
  }
} 