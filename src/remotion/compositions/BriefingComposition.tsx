import { AbsoluteFill } from 'remotion';
import { useEffect, useState } from 'react';
import { DESIGN_TOKENS } from '../config';
import type { ScriptSections } from '@/types/script';
import { OverviewSection } from './sections/Overview';
import { HighlightsSection } from './sections/Highlights';
import { BusinessModelSection } from './sections/BusinessModel';
import { RiskAssessmentSection } from './sections/RiskAssessment';
import { SummarySection } from './sections/Summary';
import { calculateDurationInFrames } from '../utils/audio';

interface BriefingCompositionProps {
  script: ScriptSections;
  audioSources: Record<keyof ScriptSections, string>;
  metrics: Record<string, number>;
  companyInfo: {
    name: string;
    logo?: string;
    industry: string;
  };
}

export const BriefingComposition: React.FC<BriefingCompositionProps> = ({
  script,
  audioSources,
  metrics,
  companyInfo,
}) => {
  const [sectionDurations, setSectionDurations] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all(
      Object.entries(audioSources).map(async ([key, url]) => {
        const duration = await calculateDurationInFrames(url);
        return [key, duration] as [string, number];
      })
    ).then(durations => {
      setSectionDurations(Object.fromEntries(durations));
    });
  }, [audioSources]);

  const getStartFrame = (section: keyof ScriptSections) => {
    const sections = Object.keys(script) as (keyof ScriptSections)[];
    const index = sections.indexOf(section);
    if (index === 0) return 0;

    return sections
      .slice(0, index)
      .reduce((total, key) => total + (sectionDurations[key] || 0), 0);
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DESIGN_TOKENS.colors.background,
        fontFamily: DESIGN_TOKENS.typography.fontFamily.primary,
      }}
    >
      <OverviewSection
        text={script.introduction}
        audioUrl={audioSources.introduction}
        startFrame={getStartFrame('introduction')}
      />
      <BusinessModelSection
        text={script.businessModel}
        audioUrl={audioSources.businessModel}
        startFrame={getStartFrame('businessModel')}
      />
      <HighlightsSection
        text={script.tractionMetrics}
        audioUrl={audioSources.tractionMetrics}
        metrics={metrics}
        startFrame={getStartFrame('tractionMetrics')}
      />
      <RiskAssessmentSection
        text={script.riskAssessment}
        audioUrl={audioSources.riskAssessment}
        startFrame={getStartFrame('riskAssessment')}
      />
      <SummarySection
        text={script.summary}
        audioUrl={audioSources.summary}
        companyInfo={companyInfo}
        startFrame={getStartFrame('summary')}
      />
    </AbsoluteFill>
  );
}; 