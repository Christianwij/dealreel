export interface VoiceServiceType {
  isSupported: () => Promise<boolean>;
  startRecording: () => Promise<string>;
  stopRecording: () => void;
} 