import { renderMedia, RenderMediaOnProgress } from '@remotion/renderer';
import { COMPOSITION_CONFIG, RENDER_CONFIG, AUDIO_CONFIG } from '../config';
import type { ScriptSections } from '@/types/script';

interface RenderVideoOptions {
  outputPath: string;
  script: ScriptSections;
  audioSources: Record<keyof ScriptSections, string>;
  metrics: Record<string, number>;
  companyInfo: {
    name: string;
    logo?: string;
    industry: string;
  };
  onProgress?: RenderMediaOnProgress;
}

export const renderVideo = async ({
  outputPath,
  script,
  audioSources,
  metrics,
  companyInfo,
  onProgress,
}: RenderVideoOptions): Promise<void> => {
  if (!process.env.NEXT_PUBLIC_REMOTION_SERVE_URL) {
    throw new Error('NEXT_PUBLIC_REMOTION_SERVE_URL is not defined');
  }

  await renderMedia({
    composition: {
      id: COMPOSITION_CONFIG.id,
      height: COMPOSITION_CONFIG.height,
      width: COMPOSITION_CONFIG.width,
      fps: COMPOSITION_CONFIG.fps,
      durationInFrames: COMPOSITION_CONFIG.durationInFrames,
      defaultProps: {
        script,
        audioSources,
        metrics,
        companyInfo,
      },
      props: {},
      defaultCodec: RENDER_CONFIG.codec as 'h264',
      defaultOutName: 'briefing-video',
    },
    serveUrl: process.env.NEXT_PUBLIC_REMOTION_SERVE_URL,
    codec: RENDER_CONFIG.codec as 'h264',
    outputLocation: outputPath,
    inputProps: {
      script,
      audioSources,
      metrics,
      companyInfo,
    },
    imageFormat: RENDER_CONFIG.imageFormat,
    crf: RENDER_CONFIG.crf,
    pixelFormat: RENDER_CONFIG.pixelFormat,
    x264Preset: RENDER_CONFIG.x264Preset,
    audioBitrate: AUDIO_CONFIG.bitrate,
    audioChannels: AUDIO_CONFIG.channels,
    audioSampleRate: AUDIO_CONFIG.sampleRate,
    onProgress,
  });
}; 