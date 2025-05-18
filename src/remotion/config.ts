export const COMPOSITION_CONFIG = {
  id: 'BriefingVideo',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 30 * 60 * 5, // 5 minutes max at 30fps
} as const;

export const RENDER_CONFIG = {
  codec: 'h264',
  crf: 22, // Quality (0-51, lower is better)
  imageFormat: 'jpeg',
  pixelFormat: 'yuv420p',
  x264Preset: 'medium', // Encoding speed vs compression
} as const;

export const AUDIO_CONFIG = {
  bitrate: '192k',
  channels: 2,
  sampleRate: 48000,
} as const;

export const DESIGN_TOKENS = {
  colors: {
    background: '#141414',
    primary: '#0070f3',
    secondary: '#00b4d8',
    text: '#ffffff',
    textSecondary: '#a0aec0',
    success: '#0cce6b',
    warning: '#ffd600',
    error: '#ff4444',
  },
  typography: {
    fontFamily: {
      primary: 'Inter, system-ui, sans-serif',
      secondary: 'SF Pro Display, system-ui, sans-serif',
    },
    fontSize: {
      title: 64,
      subtitle: 48,
      heading: 36,
      subheading: 24,
      body: 18,
      caption: 14,
    },
    lineHeight: {
      title: 1.2,
      subtitle: 1.3,
      heading: 1.4,
      body: 1.6,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  animation: {
    duration: {
      fast: 15, // 0.5s at 30fps
      normal: 30, // 1s at 30fps
      slow: 60, // 2s at 30fps
    },
    easing: {
      easeInOut: [0.4, 0, 0.2, 1],
      easeOut: [0, 0, 0.2, 1],
      easeIn: [0.4, 0, 1, 1],
    },
  },
} as const; 