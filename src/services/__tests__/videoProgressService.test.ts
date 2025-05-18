import { VideoProgressService, type ProgressUpdate, type ErrorDetails } from '../videoProgressService';

describe('VideoProgressService', () => {
  let service: VideoProgressService;
  const testJobId = 'test-job-1';

  beforeEach(() => {
    service = new VideoProgressService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start tracking a job', () => {
    const eventSpy = jest.spyOn(service, 'emit');
    service.startTracking(testJobId);

    const progress = service.getProgress(testJobId);
    expect(progress).toMatchObject({
      jobId: testJobId,
      section: 'introduction',
      percent: 0,
      stage: 'avatar',
      overallProgress: 0,
    });

    expect(eventSpy).toHaveBeenCalledWith('trackingStarted', { jobId: testJobId });
  });

  it('should update progress with time estimation', () => {
    const eventSpy = jest.spyOn(service, 'emit');
    service.startTracking(testJobId);

    // Simulate time passing
    jest.advanceTimersByTime(30000); // 30 seconds

    service.updateProgress(testJobId, {
      percent: 50,
      stage: 'composition',
    });

    const progress = service.getProgress(testJobId);
    expect(progress).toMatchObject({
      jobId: testJobId,
      percent: 50,
      stage: 'composition',
      overallProgress: 20, // 50% of 40% weight for composition stage
      timeRemaining: expect.any(Number),
    });

    expect(eventSpy).toHaveBeenCalledWith('progressUpdated', expect.objectContaining({
      jobId: testJobId,
      percent: 50,
    }));
  });

  it('should calculate overall progress based on stage weights', () => {
    service.startTracking(testJobId);

    // Test avatar stage (30% weight)
    service.updateProgress(testJobId, {
      stage: 'avatar',
      percent: 100,
    });
    expect(service.getProgress(testJobId)?.overallProgress).toBe(30);

    // Test composition stage (40% weight)
    service.updateProgress(testJobId, {
      stage: 'composition',
      percent: 50,
    });
    expect(service.getProgress(testJobId)?.overallProgress).toBe(20);

    // Test rendering stage (30% weight)
    service.updateProgress(testJobId, {
      stage: 'rendering',
      percent: 100,
    });
    expect(service.getProgress(testJobId)?.overallProgress).toBe(30);
  });

  it('should handle errors with retry tracking', () => {
    const eventSpy = jest.spyOn(service, 'emit');
    const testError = new Error('Test error');

    service.startTracking(testJobId);

    // First error - should be recoverable
    const firstAttempt = service.handleError(testJobId, testError, {
      stage: 'avatar',
      section: 'introduction',
    });

    expect(firstAttempt).toBe(true);
    expect(eventSpy).toHaveBeenCalledWith('error', expect.objectContaining({
      jobId: testJobId,
      error: testError,
      recoverable: true,
      retryCount: 0,
    }));

    // Simulate max retries
    for (let i = 0; i < 3; i++) {
      service.handleError(testJobId, testError, {
        stage: 'avatar',
        section: 'introduction',
      });
    }

    const error = service.getError(testJobId);
    expect(error).toMatchObject({
      jobId: testJobId,
      error: testError,
      recoverable: false,
      retryCount: 3,
    });
  });

  it('should complete tracking and cleanup', () => {
    const eventSpy = jest.spyOn(service, 'emit');
    service.startTracking(testJobId);

    // Add some progress and errors
    service.updateProgress(testJobId, {
      percent: 50,
      stage: 'composition',
    });
    service.handleError(testJobId, new Error('Test error'), {
      stage: 'composition',
    });

    service.completeTracking(testJobId);

    // Verify final progress event
    expect(eventSpy).toHaveBeenCalledWith('trackingCompleted', expect.objectContaining({
      jobId: testJobId,
      percent: 100,
      overallProgress: 100,
      timeRemaining: 0,
    }));

    // Verify cleanup
    expect(service.getProgress(testJobId)).toBeUndefined();
    expect(service.getError(testJobId)).toBeUndefined();
  });

  it('should get all progress', () => {
    service.startTracking(testJobId);
    service.startTracking('test-job-2');

    const allProgress = service.getAllProgress();
    expect(allProgress).toHaveLength(2);
    expect(allProgress[0].jobId).toBe(testJobId);
    expect(allProgress[1].jobId).toBe('test-job-2');
  });

  it('should ignore updates for non-existent jobs', () => {
    const eventSpy = jest.spyOn(service, 'emit');
    
    service.updateProgress('non-existent', {
      percent: 50,
      stage: 'avatar',
    });

    expect(eventSpy).not.toHaveBeenCalled();
  });

  it('should calculate time remaining accurately', () => {
    service.startTracking(testJobId);
    
    // Simulate 1 minute passing with 25% progress
    jest.advanceTimersByTime(60000);
    service.updateProgress(testJobId, {
      percent: 25,
      stage: 'avatar',
    });

    const progress = service.getProgress(testJobId);
    // Expect remaining time to be around 3 minutes (as 25% took 1 minute)
    expect(progress?.timeRemaining).toBe(180);
  });
}); 