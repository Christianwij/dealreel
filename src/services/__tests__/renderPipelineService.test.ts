import { RenderPipelineService, type RenderJob } from '../renderPipelineService';
import { VideoService } from '../videoService';
import type { ScriptSections } from '@/types/script';

// Mock VideoService
jest.mock('../videoService');

describe('RenderPipelineService', () => {
  let service: RenderPipelineService;
  let mockVideoService: jest.Mocked<VideoService>;

  const mockJobParams = {
    script: {
      introduction: 'Test intro',
      businessModel: 'Test business model',
      tractionMetrics: 'Test metrics',
      riskAssessment: 'Test risks',
      summary: 'Test summary',
    } as ScriptSections,
    metrics: {
      revenue: 1000000,
      users: 50000,
    },
    companyInfo: {
      name: 'Test Company',
      industry: 'Technology',
    },
    outputPath: 'test-output.mp4',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RenderPipelineService();
  });

  it('should enqueue a render job and start processing', () => {
    const eventSpy = jest.spyOn(service, 'emit');
    const job = service.enqueueRender(mockJobParams);

    expect(job).toMatchObject({
      ...mockJobParams,
      id: expect.any(String),
      status: 'queued',
      progress: {
        section: 'introduction',
        percent: 0,
      },
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    expect(eventSpy).toHaveBeenCalledWith('jobQueued', expect.objectContaining({
      id: job.id,
      status: 'queued',
    }));
  });

  it('should process jobs in order', async () => {
    const eventSpy = jest.spyOn(service, 'emit');

    // Mock VideoService to resolve immediately
    (VideoService as jest.Mock).mockImplementation(() => ({
      generateVideo: jest.fn().mockResolvedValue(undefined),
    }));

    // Enqueue two jobs
    const job1 = service.enqueueRender({ ...mockJobParams, outputPath: 'job1.mp4' });
    const job2 = service.enqueueRender({ ...mockJobParams, outputPath: 'job2.mp4' });

    // Wait for jobs to process
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify events were emitted in correct order
    const emittedEvents = eventSpy.mock.calls.map(call => ({ event: call[0], id: call[1].id }));
    expect(emittedEvents).toEqual([
      { event: 'jobQueued', id: job1.id },
      { event: 'jobQueued', id: job2.id },
      { event: 'jobStarted', id: job1.id },
      { event: 'jobCompleted', id: job1.id },
      { event: 'jobStarted', id: job2.id },
      { event: 'jobCompleted', id: job2.id },
    ]);
  });

  it('should handle progress updates', async () => {
    const eventSpy = jest.spyOn(service, 'emit');
    let progressCallback: (section: keyof ScriptSections, percent: number) => void;

    // Mock VideoService to emit progress
    (VideoService as jest.Mock).mockImplementation(({ onProgress }) => {
      progressCallback = onProgress;
      return {
        generateVideo: jest.fn().mockImplementation(async () => {
          progressCallback('introduction', 50);
          return undefined;
        }),
      };
    });

    const job = service.enqueueRender(mockJobParams);

    // Wait for job to process
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify progress event was emitted
    const progressEvent = eventSpy.mock.calls.find(call => call[0] === 'progress');
    expect(progressEvent).toBeTruthy();
    expect(progressEvent![1]).toMatchObject({
      id: job.id,
      progress: {
        section: 'introduction',
        percent: 50,
      },
    });
  });

  it('should handle errors', async () => {
    const eventSpy = jest.spyOn(service, 'emit');
    const testError = new Error('Test error');
    let errorCallback: (error: Error) => void;

    // Mock VideoService to throw error
    (VideoService as jest.Mock).mockImplementation(({ onError }) => {
      errorCallback = onError;
      return {
        generateVideo: jest.fn().mockImplementation(async () => {
          errorCallback(testError);
          throw testError;
        }),
      };
    });

    const job = service.enqueueRender(mockJobParams);

    // Wait for job to process
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify error event was emitted
    const failedEvent = eventSpy.mock.calls.find(call => call[0] === 'jobFailed');
    expect(failedEvent).toBeTruthy();
    expect(failedEvent![1]).toMatchObject({
      id: job.id,
      status: 'failed',
      error: testError,
    });
  });

  it('should get job status', () => {
    const job = service.enqueueRender(mockJobParams);
    const status = service.getJobStatus(job.id);

    expect(status).toMatchObject({
      id: job.id,
      status: 'queued',
    });
  });

  it('should get all jobs', () => {
    const job1 = service.enqueueRender({ ...mockJobParams, outputPath: 'job1.mp4' });
    const job2 = service.enqueueRender({ ...mockJobParams, outputPath: 'job2.mp4' });

    const jobs = service.getAllJobs();

    expect(jobs).toHaveLength(2);
    expect(jobs[0].id).toBe(job1.id);
    expect(jobs[1].id).toBe(job2.id);
  });

  it('should cancel a queued job', () => {
    const eventSpy = jest.spyOn(service, 'emit');
    const job = service.enqueueRender(mockJobParams);

    const cancelled = service.cancelJob(job.id);

    expect(cancelled).toBe(true);
    expect(eventSpy).toHaveBeenCalledWith('jobCancelled', expect.objectContaining({
      id: job.id,
      status: 'failed',
      error: expect.any(Error),
    }));
  });

  it('should return false when cancelling non-existent job', () => {
    const cancelled = service.cancelJob('non-existent-id');
    expect(cancelled).toBe(false);
  });
}); 