import { VideoService } from '../videoService';
import { DIDService } from '../didService';
import { renderVideo } from '@/remotion/utils/render';
import type { ScriptSections } from '@/types/script';

// Mock dependencies
jest.mock('../didService');
jest.mock('@/remotion/utils/render');

describe('VideoService', () => {
  let service: VideoService;
  let mockOnProgress: jest.Mock;
  let mockOnError: jest.Mock;

  const mockScript: ScriptSections = {
    introduction: 'Test intro',
    businessModel: 'Test business model',
    tractionMetrics: 'Test metrics',
    riskAssessment: 'Test risks',
    summary: 'Test summary',
  };

  const mockMetrics = {
    revenue: 1000000,
    users: 50000,
  };

  const mockCompanyInfo = {
    name: 'Test Company',
    industry: 'Technology',
  };

  beforeEach(() => {
    mockOnProgress = jest.fn();
    mockOnError = jest.fn();
    service = new VideoService({
      onProgress: mockOnProgress,
      onError: mockOnError,
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should create avatar videos for each section and render final video', async () => {
    // Mock DID service implementation
    (DIDService as jest.Mock).mockImplementation(() => ({
      generateTalkWithProgress: jest.fn().mockResolvedValue('mock-video-url'),
    }));

    // Mock renderVideo
    (renderVideo as jest.Mock).mockResolvedValue(undefined);

    await service.generateVideo({
      script: mockScript,
      metrics: mockMetrics,
      companyInfo: mockCompanyInfo,
      outputPath: 'test-output.mp4',
    });

    // Check if DID service was called for each section
    const mockDIDInstance = (DIDService as jest.Mock).mock.instances[0];
    expect(mockDIDInstance.generateTalkWithProgress).toHaveBeenCalledTimes(5);
    expect(mockDIDInstance.generateTalkWithProgress).toHaveBeenCalledWith('Test intro');
    expect(mockDIDInstance.generateTalkWithProgress).toHaveBeenCalledWith('Test business model');
    expect(mockDIDInstance.generateTalkWithProgress).toHaveBeenCalledWith('Test metrics');
    expect(mockDIDInstance.generateTalkWithProgress).toHaveBeenCalledWith('Test risks');
    expect(mockDIDInstance.generateTalkWithProgress).toHaveBeenCalledWith('Test summary');

    // Check if renderVideo was called with correct parameters
    expect(renderVideo).toHaveBeenCalledWith({
      script: mockScript,
      audioSources: {
        introduction: 'mock-video-url',
        businessModel: 'mock-video-url',
        tractionMetrics: 'mock-video-url',
        riskAssessment: 'mock-video-url',
        summary: 'mock-video-url',
      },
      metrics: mockMetrics,
      companyInfo: mockCompanyInfo,
      outputPath: 'test-output.mp4',
      onProgress: expect.any(Function),
    });
  });

  it('should report progress correctly', async () => {
    // Mock DID service implementation with progress
    let didProgressCallback: (progress: number) => void;
    (DIDService as jest.Mock).mockImplementation(({ onProgress }) => {
      didProgressCallback = onProgress;
      return {
        generateTalkWithProgress: jest.fn().mockImplementation(async () => {
          didProgressCallback(50); // Simulate 50% DID progress
          return 'mock-video-url';
        }),
      };
    });

    // Mock renderVideo with progress
    (renderVideo as jest.Mock).mockImplementation(async ({ onProgress }) => {
      onProgress({ progress: 50 }); // Simulate 50% Remotion progress
    });

    await service.generateVideo({
      script: mockScript,
      metrics: mockMetrics,
      companyInfo: mockCompanyInfo,
      outputPath: 'test-output.mp4',
    });

    // Verify progress reporting for the first section (introduction)
    expect(mockOnProgress).toHaveBeenCalledWith('introduction', 0); // Initial progress
    expect(mockOnProgress).toHaveBeenCalledWith('introduction', 30); // DID progress (50 * 0.6)
    expect(mockOnProgress).toHaveBeenCalledWith('introduction', 80); // Remotion progress (60 + 50 * 0.4)
    expect(mockOnProgress).toHaveBeenCalledWith('introduction', 100); // Final progress
  });

  it('should handle errors correctly', async () => {
    const testError = new Error('Test error');
    
    // Mock DID service to throw an error
    (DIDService as jest.Mock).mockImplementation(() => ({
      generateTalkWithProgress: jest.fn().mockRejectedValue(testError),
    }));

    await expect(
      service.generateVideo({
        script: mockScript,
        metrics: mockMetrics,
        companyInfo: mockCompanyInfo,
        outputPath: 'test-output.mp4',
      })
    ).rejects.toThrow(testError);

    expect(mockOnError).toHaveBeenCalledWith(testError);
  });
}); 