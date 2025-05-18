export interface DIDTalkRequest {
  script: {
    type: 'text';
    input: string;
    provider: {
      type: 'microsoft';
      voice_id: string;
    };
  };
  config: {
    fluent: boolean;
    pad_audio: number;
  };
  source_url: string;
}

export interface DIDTalkResponse {
  id: string;
  created_at: string;
  status: 'created' | 'started' | 'done' | 'error';
  result_url?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface DIDConfig {
  apiKey: string;
  baseUrl: string;
  defaultPresenter: string;
  defaultVoice: string;
}

export interface DIDServiceOptions {
  config?: Partial<DIDConfig>;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
} 