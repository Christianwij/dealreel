import { useCurrentFrame, useVideoConfig, Audio, Sequence } from 'remotion';
import { AbsoluteFill } from 'remotion';
import { DESIGN_TOKENS } from '../../config';
import { calculateDurationInFrames } from '../../utils/audio';
import { useEffect, useState } from 'react';

interface SummarySectionProps {
  text: string;
  audioUrl: string;
  companyInfo: {
    name: string;
    logo?: string;
    industry: string;
  };
  startFrame?: number;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  text,
  audioUrl,
  companyInfo,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    calculateDurationInFrames(audioUrl).then(setDuration);
  }, [audioUrl]);

  return (
    <Sequence from={startFrame} durationInFrames={duration}>
      <AbsoluteFill
        style={{
          backgroundColor: DESIGN_TOKENS.colors.background,
          padding: DESIGN_TOKENS.spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Audio src={audioUrl} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: DESIGN_TOKENS.spacing.xl,
            opacity: frame < 30 ? frame / 30 : 1,
            transform: `translateY(${frame < 30 ? (30 - frame) : 0}px)`,
          }}
        >
          {companyInfo.logo && (
            <img
              src={companyInfo.logo}
              alt={`${companyInfo.name} logo`}
              style={{
                width: 60,
                height: 60,
                marginRight: DESIGN_TOKENS.spacing.lg,
                objectFit: 'contain',
              }}
            />
          )}
          <div>
            <h1
              style={{
                color: DESIGN_TOKENS.colors.text,
                fontSize: DESIGN_TOKENS.typography.fontSize.title,
                lineHeight: DESIGN_TOKENS.typography.lineHeight.title,
                marginBottom: DESIGN_TOKENS.spacing.xs,
              }}
            >
              {companyInfo.name}
            </h1>
            <p
              style={{
                color: DESIGN_TOKENS.colors.textSecondary,
                fontSize: DESIGN_TOKENS.typography.fontSize.caption,
              }}
            >
              {companyInfo.industry}
            </p>
          </div>
        </div>
        <div
          style={{
            backgroundColor: DESIGN_TOKENS.colors.success + '0A',
            padding: DESIGN_TOKENS.spacing.xl,
            borderRadius: 12,
            border: `1px solid ${DESIGN_TOKENS.colors.success}33`,
            opacity: frame < 45 ? (frame - 15) / 30 : 1,
            transform: `translateY(${frame < 45 ? (45 - frame) : 0}px)`,
          }}
        >
          <p
            style={{
              color: DESIGN_TOKENS.colors.textSecondary,
              fontSize: DESIGN_TOKENS.typography.fontSize.body,
              lineHeight: DESIGN_TOKENS.typography.lineHeight.body,
            }}
          >
            {text}
          </p>
        </div>
      </AbsoluteFill>
    </Sequence>
  );
}; 