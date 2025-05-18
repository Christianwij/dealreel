import { Composition } from 'remotion';
import { BriefingComposition } from './compositions/BriefingComposition';
import { COMPOSITION_CONFIG } from './config';

const defaultProps = {
  script: {
    introduction: '',
    businessModel: '',
    tractionMetrics: '',
    riskAssessment: '',
    summary: '',
  },
  audioSources: {
    introduction: '',
    businessModel: '',
    tractionMetrics: '',
    riskAssessment: '',
    summary: '',
  },
  metrics: {},
  companyInfo: {
    name: 'Company Name',
    industry: 'Technology',
  },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMPOSITION_CONFIG.id}
        component={BriefingComposition}
        durationInFrames={COMPOSITION_CONFIG.durationInFrames}
        fps={COMPOSITION_CONFIG.fps}
        width={COMPOSITION_CONFIG.width}
        height={COMPOSITION_CONFIG.height}
        defaultProps={defaultProps}
      />
    </>
  );
}; 