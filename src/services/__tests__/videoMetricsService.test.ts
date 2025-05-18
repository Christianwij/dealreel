import { VideoMetricsService, type VideoMetrics, type PerformanceAlert } from '../videoMetricsService';

describe('VideoMetricsService', () => {
  let metricsService: VideoMetricsService;
  const testJobId = 'test-job-123';

  beforeEach(() => {
    metricsService = new VideoMetricsService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startTracking', () => {
    it('should initialize metrics for a new job', () => {
      const startTime = Date.now();
      metricsService.startTracking(testJobId);
      const metrics = metricsService.getMetrics(testJobId);

      expect(metrics).toBeDefined();
      expect(metrics?.jobId).toBe(testJobId);
      expect(metrics?.startTime).toBe(startTime);
      expect(metrics?.stages).toEqual({
        avatar: { duration: 0, retries: 0, success: false },
        composition: { duration: 0, memoryUsage: 0, cpuUsage: 0 },
        rendering: { duration: 0, fps: 0, memoryUsage: 0, cpuUsage: 0 },
      });
    });

    it('should emit trackingStarted event', done => {
      metricsService.on('trackingStarted', ({ jobId }) => {
        expect(jobId).toBe(testJobId);
        done();
      });

      metricsService.startTracking(testJobId);
    });
  });

  describe('updateStageMetrics', () => {
    beforeEach(() => {
      metricsService.startTracking(testJobId);
    });

    it('should update avatar stage metrics', () => {
      metricsService.updateStageMetrics(testJobId, 'avatar', {
        duration: 1000,
        retries: 1,
        success: true,
      });

      const metrics = metricsService.getMetrics(testJobId);
      expect(metrics?.stages.avatar).toEqual({
        duration: 1000,
        retries: 1,
        success: true,
      });
    });

    it('should emit alert for high memory usage', done => {
      metricsService.on('alert', (alert: PerformanceAlert) => {
        expect(alert.type).toBe('high-memory');
        expect(alert.jobId).toBe(testJobId);
        done();
      });

      metricsService.updateStageMetrics(testJobId, 'rendering', {
        memoryUsage: 3000, // Above 2048MB threshold
      });
    });

    it('should emit alert for high CPU usage', done => {
      metricsService.on('alert', (alert: PerformanceAlert) => {
        expect(alert.type).toBe('high-cpu');
        expect(alert.jobId).toBe(testJobId);
        done();
      });

      metricsService.updateStageMetrics(testJobId, 'rendering', {
        cpuUsage: 90, // Above 80% threshold
      });
    });

    it('should emit alert for low FPS', done => {
      metricsService.on('alert', (alert: PerformanceAlert) => {
        expect(alert.type).toBe('slow-rendering');
        expect(alert.jobId).toBe(testJobId);
        done();
      });

      metricsService.updateStageMetrics(testJobId, 'rendering', {
        fps: 15, // Below 20 FPS threshold
      });
    });
  });

  describe('updateQualityMetrics', () => {
    beforeEach(() => {
      metricsService.startTracking(testJobId);
    });

    it('should update quality metrics', () => {
      const quality = {
        resolution: '1920x1080',
        bitrate: 5000000,
        fileSize: 15000000,
      };

      metricsService.updateQualityMetrics(testJobId, quality);
      const metrics = metricsService.getMetrics(testJobId);

      expect(metrics?.quality).toEqual(quality);
    });

    it('should emit metricsUpdated event', done => {
      metricsService.on('metricsUpdated', ({ jobId, metrics }) => {
        expect(jobId).toBe(testJobId);
        expect(metrics.quality.resolution).toBe('1920x1080');
        done();
      });

      metricsService.updateQualityMetrics(testJobId, {
        resolution: '1920x1080',
      });
    });
  });

  describe('recordError', () => {
    beforeEach(() => {
      metricsService.startTracking(testJobId);
    });

    it('should record error with timestamp', () => {
      const error = new Error('Test error');
      const timestamp = Date.now();

      metricsService.recordError(testJobId, 'avatar', error);
      const metrics = metricsService.getMetrics(testJobId);

      expect(metrics?.errors).toHaveLength(1);
      expect(metrics?.errors[0]).toEqual({
        stage: 'avatar',
        error,
        timestamp,
      });
    });

    it('should emit errorRecorded event', done => {
      const error = new Error('Test error');

      metricsService.on('errorRecorded', ({ jobId, stage, error: recordedError }) => {
        expect(jobId).toBe(testJobId);
        expect(stage).toBe('avatar');
        expect(recordedError).toBe(error);
        done();
      });

      metricsService.recordError(testJobId, 'avatar', error);
    });
  });

  describe('completeTracking', () => {
    beforeEach(() => {
      metricsService.startTracking(testJobId);
    });

    it('should complete tracking and calculate duration', () => {
      const startTime = Date.now();
      jest.advanceTimersByTime(5000); // Advance 5 seconds
      const endTime = Date.now();

      const finalMetrics = metricsService.completeTracking(testJobId);

      expect(finalMetrics?.endTime).toBe(endTime);
      expect(finalMetrics?.duration).toBe(5000);
    });

    it('should emit trackingCompleted event', done => {
      metricsService.on('trackingCompleted', ({ jobId, metrics }) => {
        expect(jobId).toBe(testJobId);
        expect(metrics.endTime).toBeDefined();
        expect(metrics.duration).toBeDefined();
        done();
      });

      metricsService.completeTracking(testJobId);
    });

    it('should remove metrics from internal storage', () => {
      metricsService.completeTracking(testJobId);
      expect(metricsService.getMetrics(testJobId)).toBeUndefined();
    });
  });

  describe('getAggregateMetrics', () => {
    beforeEach(() => {
      // Create two test jobs with different metrics
      ['job-1', 'job-2'].forEach(jobId => {
        metricsService.startTracking(jobId);
        metricsService.updateStageMetrics(jobId, 'rendering', {
          duration: 1000,
          memoryUsage: 1000,
          cpuUsage: 50,
          fps: 30,
        });
        metricsService.recordError(jobId, 'rendering', new Error('Test error'));
        metricsService.completeTracking(jobId);
      });
    });

    it('should calculate correct aggregate metrics', () => {
      const aggregateMetrics = metricsService.getAggregateMetrics();

      expect(aggregateMetrics).toEqual({
        totalJobs: 2,
        averageDuration: 0, // Because we're using fake timers
        errorRate: 1, // 1 error per job
        averageMemoryUsage: 1000,
        averageCpuUsage: 50,
        averageFps: 30,
      });
    });

    it('should handle empty metrics', () => {
      const emptyMetricsService = new VideoMetricsService();
      const aggregateMetrics = emptyMetricsService.getAggregateMetrics();

      expect(aggregateMetrics).toEqual({
        totalJobs: 0,
        averageDuration: 0,
        errorRate: 0,
        averageMemoryUsage: 0,
        averageCpuUsage: 0,
        averageFps: 0,
      });
    });
  });
}); 