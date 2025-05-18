import { useCurrentFrame, useVideoConfig, Audio, Sequence } from 'remotion';
import { AbsoluteFill } from 'remotion';
import { DESIGN_TOKENS } from '../../config';
import { calculateDurationInFrames } from '../../utils/audio';
import { useEffect, useState } from 'react';

interface HighlightsSectionProps {
  text: string;
  audioUrl: string;
  metrics: Record<string, number>;
  startFrame?: number;
}

export const HighlightsSection: React.FC<HighlightsSectionProps> = ({
  text,
  audioUrl,
  metrics,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    calculateDurationInFrames(audioUrl).then(setDuration);
  }, [audioUrl]);

  const metricsEntries = Object.entries(metrics);

  return (
    <Sequence from={startFrame} durationInFrames={duration}>
      <AbsoluteFill
        style={{
          backgroundColor: DESIGN_TOKENS.colors.background,
          padding: DESIGN_TOKENS.spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}
      >
        <Audio src={audioUrl} />
        <h1
          style={{
            color: DESIGN_TOKENS.colors.text,
            fontSize: DESIGN_TOKENS.typography.fontSize.title,
            lineHeight: DESIGN_TOKENS.typography.lineHeight.title,
            marginBottom: DESIGN_TOKENS.spacing.xl,
            opacity: frame < 30 ? frame / 30 : 1,
            transform: `translateY(${frame < 30 ? (30 - frame) : 0}px)`,
          }}
        >
          Key Highlights
        </h1>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: DESIGN_TOKENS.spacing.lg,
            marginBottom: DESIGN_TOKENS.spacing.xl,
          }}
        >
          {metricsEntries.map(([key, value], index) => (
            <div
              key={key}
              style={{
                backgroundColor: DESIGN_TOKENS.colors.primary + '1A',
                padding: DESIGN_TOKENS.spacing.lg,
                borderRadius: 8,
                opacity: frame < 45 + index * 10 ? (frame - (30 + index * 10)) / 15 : 1,
                transform: `translateY(${frame < 45 + index * 10 ? (15 - (frame - (30 + index * 10))) : 0}px)`,
              }}
            >
              <h3
                style={{
                  color: DESIGN_TOKENS.colors.primary,
                  fontSize: DESIGN_TOKENS.typography.fontSize.heading,
                  marginBottom: DESIGN_TOKENS.spacing.xs,
                }}
              >
                {value}
              </h3>
              <p
                style={{
                  color: DESIGN_TOKENS.colors.textSecondary,
                  fontSize: DESIGN_TOKENS.typography.fontSize.caption,
                }}
              >
                {key}
              </p>
            </div>
          ))}
        </div>
        <p
          style={{
            color: DESIGN_TOKENS.colors.textSecondary,
            fontSize: DESIGN_TOKENS.typography.fontSize.body,
            lineHeight: DESIGN_TOKENS.typography.lineHeight.body,
            opacity: frame < 60 ? (frame - 45) / 15 : 1,
            transform: `translateY(${frame < 60 ? (15 - (frame - 45)) : 0}px)`,
          }}
        >
          {text}
        </p>
      </AbsoluteFill>
    </Sequence>
  );
}; 