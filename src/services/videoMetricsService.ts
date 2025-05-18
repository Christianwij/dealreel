import { EventEmitter } from 'events';
import type { RenderJob } from './renderPipelineService';

export interface VideoMetrics {
  jobId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  stages: {
    avatar: {
      duration: number;
      retries: number;
      success: boolean;
    };
    composition: {
      duration: number;
      memoryUsage: number;
      cpuUsage: number;
    };
    rendering: {
      duration: number;
      fps: number;
      memoryUsage: number;
      cpuUsage: number;
    };
  };
  quality: {
    resolution: string;
    bitrate: number;
    fileSize: number;
  };
  errors: Array<{
    stage: 'avatar' | 'composition' | 'rendering';
    error: Error;
    timestamp: number;
  }>;
}

export interface PerformanceAlert {
  jobId: string;
  type: 'high-memory' | 'high-cpu' | 'slow-rendering' | 'error-rate';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export class VideoMetricsService extends EventEmitter {
  private metrics: Map<string, VideoMetrics> = new Map();
  private readonly thresholds = {
    memoryUsageMB: 2048, // 2GB
    cpuUsagePercent: 80,
    renderingFPS: 20,
    errorRate: 0.1, // 10% error rate threshold
  };

  constructor() {
    super();
  }

  startTracking(jobId: string): void {
    const initialMetrics: VideoMetrics = {
      jobId,
      startTime: Date.now(),
      stages: {
        avatar: {
          duration: 0,
          retries: 0,
          success: false,
        },
        composition: {
          duration: 0,
          memoryUsage: 0,
          cpuUsage: 0,
        },
        rendering: {
          duration: 0,
          fps: 0,
          memoryUsage: 0,
          cpuUsage: 0,
        },
      },
      quality: {
        resolution: '',
        bitrate: 0,
        fileSize: 0,
      },
      errors: [],
    };

    this.metrics.set(jobId, initialMetrics);
    this.emit('trackingStarted', { jobId });
  }

  updateStageMetrics(
    jobId: string,
    stage: 'avatar' | 'composition' | 'rendering',
    update: Partial<VideoMetrics['stages'][typeof stage]>
  ): void {
    const metrics = this.metrics.get(jobId);
    if (!metrics) return;

    Object.assign(metrics.stages[stage], update);

    // Check for performance alerts
    if ('memoryUsage' in update && update.memoryUsage && update.memoryUsage > this.thresholds.memoryUsageMB) {
      this.emitAlert(jobId, 'high-memory', update.memoryUsage);
    }

    if ('cpuUsage' in update && update.cpuUsage && update.cpuUsage > this.thresholds.cpuUsagePercent) {
      this.emitAlert(jobId, 'high-cpu', update.cpuUsage);
    }

    if ('fps' in update && update.fps && update.fps < this.thresholds.renderingFPS) {
      this.emitAlert(jobId, 'slow-rendering', update.fps);
    }

    this.emit('metricsUpdated', { jobId, metrics: { ...metrics } });
  }

  updateQualityMetrics(
    jobId: string,
    quality: Partial<VideoMetrics['quality']>
  ): void {
    const metrics = this.metrics.get(jobId);
    if (!metrics) return;

    Object.assign(metrics.quality, quality);
    this.emit('metricsUpdated', { jobId, metrics: { ...metrics } });
  }

  recordError(
    jobId: string,
    stage: 'avatar' | 'composition' | 'rendering',
    error: Error
  ): void {
    const metrics = this.metrics.get(jobId);
    if (!metrics) return;

    metrics.errors.push({
      stage,
      error,
      timestamp: Date.now(),
    });

    // Calculate error rate
    const errorRate = metrics.errors.length / (metrics.stages[stage].duration / 1000);
    if (errorRate > this.thresholds.errorRate) {
      this.emitAlert(jobId, 'error-rate', errorRate);
    }

    this.emit('errorRecorded', {
      jobId,
      stage,
      error,
      metrics: { ...metrics },
    });
  }

  private emitAlert(
    jobId: string,
    type: PerformanceAlert['type'],
    value: number
  ): void {
    const alert: PerformanceAlert = {
      jobId,
      type,
      message: this.getAlertMessage(type, value),
      value,
      threshold: this.getThresholdForType(type),
      timestamp: Date.now(),
    };

    this.emit('alert', alert);
  }

  private getAlertMessage(type: PerformanceAlert['type'], value: number): string {
    switch (type) {
      case 'high-memory':
        return `High memory usage detected: ${value}MB (threshold: ${this.thresholds.memoryUsageMB}MB)`;
      case 'high-cpu':
        return `High CPU usage detected: ${value}% (threshold: ${this.thresholds.cpuUsagePercent}%)`;
      case 'slow-rendering':
        return `Low rendering FPS detected: ${value} FPS (threshold: ${this.thresholds.renderingFPS} FPS)`;
      case 'error-rate':
        return `High error rate detected: ${(value * 100).toFixed(1)}% (threshold: ${(this.thresholds.errorRate * 100).toFixed(1)}%)`;
      default:
        return `Performance alert: ${type}`;
    }
  }

  private getThresholdForType(type: PerformanceAlert['type']): number {
    switch (type) {
      case 'high-memory':
        return this.thresholds.memoryUsageMB;
      case 'high-cpu':
        return this.thresholds.cpuUsagePercent;
      case 'slow-rendering':
        return this.thresholds.renderingFPS;
      case 'error-rate':
        return this.thresholds.errorRate;
      default:
        return 0;
    }
  }

  completeTracking(jobId: string): VideoMetrics | undefined {
    const metrics = this.metrics.get(jobId);
    if (!metrics) return;

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;

    this.emit('trackingCompleted', { jobId, metrics: { ...metrics } });
    this.metrics.delete(jobId);

    return { ...metrics };
  }

  getMetrics(jobId: string): VideoMetrics | undefined {
    const metrics = this.metrics.get(jobId);
    return metrics ? { ...metrics } : undefined;
  }

  getAllMetrics(): VideoMetrics[] {
    return Array.from(this.metrics.values()).map(metrics => ({ ...metrics }));
  }

  getAggregateMetrics(): {
    totalJobs: number;
    averageDuration: number;
    errorRate: number;
    averageMemoryUsage: number;
    averageCpuUsage: number;
    averageFps: number;
  } {
    const completedMetrics = Array.from(this.metrics.values()).filter(m => m.endTime);
    const totalJobs = completedMetrics.length;

    if (totalJobs === 0) {
      return {
        totalJobs: 0,
        averageDuration: 0,
        errorRate: 0,
        averageMemoryUsage: 0,
        averageCpuUsage: 0,
        averageFps: 0,
      };
    }

    const totalErrors = completedMetrics.reduce((sum, m) => sum + m.errors.length, 0);
    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const totalMemoryUsage = completedMetrics.reduce(
      (sum, m) => sum + m.stages.rendering.memoryUsage,
      0
    );
    const totalCpuUsage = completedMetrics.reduce(
      (sum, m) => sum + m.stages.rendering.cpuUsage,
      0
    );
    const totalFps = completedMetrics.reduce(
      (sum, m) => sum + m.stages.rendering.fps,
      0
    );

    return {
      totalJobs,
      averageDuration: totalDuration / totalJobs,
      errorRate: totalErrors / totalJobs,
      averageMemoryUsage: totalMemoryUsage / totalJobs,
      averageCpuUsage: totalCpuUsage / totalJobs,
      averageFps: totalFps / totalJobs,
    };
  }
} 