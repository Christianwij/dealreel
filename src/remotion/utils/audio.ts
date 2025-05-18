import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { COMPOSITION_CONFIG } from '../config';

export const calculateDurationInFrames = async (audioUrl: string): Promise<number> => {
  try {
    const durationInSeconds = await getAudioDurationInSeconds(audioUrl);
    return Math.ceil(durationInSeconds * COMPOSITION_CONFIG.fps);
  } catch (error) {
    console.error('Failed to calculate audio duration:', error);
    return 0;
  }
};

export const calculateSequenceStart = (durations: number[]): number => {
  return durations.reduce((sum, duration) => sum + duration, 0);
}; 