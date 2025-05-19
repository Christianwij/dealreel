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
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private soundLevelInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setupRecognition();
  }

  private setupRecognition() {
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    this.recognition = new SpeechRecognitionImpl();
    if (!this.recognition) {
      throw new Error('Failed to initialize speech recognition');
    }

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.addEventListener('start', () => {
      this.emit('start');
    });

    this.recognition.addEventListener('end', () => {
      this.emit('end');
      this.stopAudioMonitoring();
    });

    this.recognition.addEventListener('result', (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        this.emit('result', result[0].transcript);
      }
    });

    this.recognition.addEventListener('error', (event: SpeechRecognitionErrorEvent) => {
      this.emit('error', new Error(`Speech recognition error: ${event.error} - ${event.message}`));
    });
  }

  private async setupAudioMonitoring() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!this.mediaStream) {
        throw new Error('Failed to get audio stream');
      }

      this.audioContext = new AudioContext();
      if (!this.audioContext) {
        throw new Error('Failed to create audio context');
      }

      this.analyser = this.audioContext.createAnalyser();
      if (!this.analyser) {
        throw new Error('Failed to create audio analyser');
      }
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);
      
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      this.soundLevelInterval = setInterval(() => {
        if (this.analyser) {
          this.analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          this.emit('soundLevel', average / 255); // Normalize to 0-1
        }
      }, 100);
    } catch (error) {
      this.emit('error', new Error(`Failed to setup audio monitoring: ${error}`));
    }
  }

  private stopAudioMonitoring() {
    if (this.soundLevelInterval) {
      clearInterval(this.soundLevelInterval);
      this.soundLevelInterval = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
  }

  async isSupported(): Promise<boolean> {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  async startRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition is not initialized'));
        return;
      }

      const handleResult = (transcript: string) => {
        cleanup();
        resolve(transcript);
      };

      const handleError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        this.removeListener('result', handleResult);
        this.removeListener('error', handleError);
        this.stop();
      };

      this.once('result', handleResult);
      this.once('error', handleError);

      this.start();
    });
  }

  async start() {
    try {
      await this.setupAudioMonitoring();
      if (!this.recognition) {
        throw new Error('Speech recognition is not initialized');
      }
      this.recognition.start();
    } catch (error) {
      this.emit('error', new Error(`Failed to start voice service: ${error}`));
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.stopAudioMonitoring();
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

  removeListener<K extends keyof VoiceServiceEvents>(event: K, listener: VoiceServiceEvents[K]): this {
    return super.removeListener(event, listener);
  }
} 