import { EventEmitter } from 'events';

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface VoiceServiceEvents {
  start: () => void;
  end: () => void;
  result: (transcript: string) => void;
  error: (error: Error) => void;
  soundLevel: (level: number) => void;
}

interface SpeechRecognitionResult {
  [index: number]: {
    transcript: string;
  };
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  addEventListener(type: 'start' | 'end', listener: (event: Event) => void): void;
  addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
  addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export class VoiceService extends EventEmitter {
  private recognition: SpeechRecognition | null = null;
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isListening: boolean = false;
  private soundMonitorInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    super();
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.isInitialized = true;
      }
    }
  }

  async isSupported(): Promise<boolean> {
    return this.isInitialized;
  }

  async startRecording(): Promise<string> {
    if (!this.recognition) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      this.recognition!.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.recognition!.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition!.start();
    });
  }

  stopRecording(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  private setupRecognitionHandlers() {
    this.recognition!.addEventListener('start', () => {
      this.isListening = true;
      this.emit('start');
    });

    this.recognition!.addEventListener('end', () => {
      this.isListening = false;
      this.emit('end');
    });

    this.recognition!.addEventListener('result', (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const transcript = result[0].transcript.trim();
        this.emit('result', transcript);
      }
    });

    this.recognition!.addEventListener('error', (event: SpeechRecognitionErrorEvent) => {
      this.emit('error', new Error(`Speech recognition error: ${event.error} - ${event.message}`));
    });
  }

  private async setupAudioMonitoring() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyzer = this.audioContext.createAnalyser();
      this.analyzer.fftSize = 256;
      source.connect(this.analyzer);

      const dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
      
      this.soundMonitorInterval = setInterval(() => {
        if (this.analyzer && this.isListening) {
          this.analyzer.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const normalizedLevel = average / 255; // Normalize to 0-1 range
          this.emit('soundLevel', normalizedLevel);
        }
      }, 100);
    } catch (error) {
      this.emit('error', new Error(`Failed to initialize audio monitoring: ${error}`));
    }
  }

  async start() {
    try {
      await this.setupAudioMonitoring();
      this.recognition!.start();
    } catch (error) {
      this.emit('error', new Error(`Failed to start voice service: ${error}`));
    }
  }

  stop() {
    this.recognition!.stop();
    
    if (this.soundMonitorInterval) {
      clearInterval(this.soundMonitorInterval);
      this.soundMonitorInterval = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyzer = null;
    this.isListening = false;
  }

  isActive(): boolean {
    return this.isListening;
  }

  // Type declaration for EventEmitter methods
  emit<K extends keyof VoiceServiceEvents>(event: K, ...args: Parameters<VoiceServiceEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof VoiceServiceEvents>(event: K, listener: VoiceServiceEvents[K]): this {
    return super.on(event, listener);
  }

  once<K extends keyof VoiceServiceEvents>(event: K, listener: VoiceServiceEvents[K]): this {
    return super.once(event, listener);
  }

  off<K extends keyof VoiceServiceEvents>(event: K, listener: VoiceServiceEvents[K]): this {
    return super.off(event, listener);
  }
} 