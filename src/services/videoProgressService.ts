import type { RenderJob } from './renderPipelineService';
import type { ScriptSections } from '@/types/script';
import EventEmitter from 'events';

export interface ProgressUpdate {
  jobId: string;
  section: keyof ScriptSections;
  percent: number;
  stage: 'avatar' | 'composition' | 'rendering';
  overallProgress: number;
  timeRemaining?: number;
  error?: Error;
}

export interface ErrorDetails {
  jobId: string;
  error: Error;
  section?: keyof ScriptSections;
  stage?: 'avatar' | 'composition' | 'rendering';
  recoverable: boolean;
  retryCount: number;
}

export class VideoProgressService extends EventEmitter {
  private static readonly MAX_RETRIES = 3;
  private jobProgress: Map<string, ProgressUpdate> = new Map();
  private jobErrors: Map<string, ErrorDetails> = new Map();
  private startTimes: Map<string, number> = new Map();

  constructor() {
    super();
  }

  private calculateTimeRemaining(jobId: string, currentProgress: number): number | undefined {
    const startTime = this.startTimes.get(jobId);
    if (!startTime || currentProgress === 0) {
      return undefined;
    }

    const elapsedTime = Date.now() - startTime;
    const remainingProgress = 100 - currentProgress;
    const timePerPercent = elapsedTime / currentProgress;
    
    return Math.round(remainingProgress * timePerPercent / 1000); // Convert to seconds
  }

  private calculateOverallProgress(stage: 'avatar' | 'composition' | 'rendering', percent: number): number {
    // Weight each stage differently
    const weights = {
      avatar: 0.3, // 30% of total progress
      composition: 0.4, // 40% of total progress
      rendering: 0.3, // 30% of total progress
    };

    const stageWeight = weights[stage];
    return Math.round(percent * stageWeight);
  }

  startTracking(jobId: string) {
    this.startTimes.set(jobId, Date.now());
    this.jobProgress.set(jobId, {
      jobId,
      section: 'introduction',
      percent: 0,
      stage: 'avatar',
      overallProgress: 0,
    });
    this.emit('trackingStarted', { jobId });
  }

  updateProgress(jobId: string, update: Partial<ProgressUpdate>) {
    const currentProgress = this.jobProgress.get(jobId);
    if (!currentProgress) {
      return;
    }

    const newProgress: ProgressUpdate = {
      ...currentProgress,
      ...update,
      overallProgress: update.stage ? 
        this.calculateOverallProgress(update.stage, update.percent || currentProgress.percent) :
        currentProgress.overallProgress,
      timeRemaining: this.calculateTimeRemaining(jobId, update.percent || currentProgress.percent),
    };

    this.jobProgress.set(jobId, newProgress);
    this.emit('progressUpdated', newProgress);
  }

  handleError(jobId: string, error: Error, context: {
    section?: keyof ScriptSections;
    stage?: 'avatar' | 'composition' | 'rendering';
  }): boolean {
    const currentError = this.jobErrors.get(jobId);
    const retryCount = currentError ? currentError.retryCount + 1 : 0;
    const recoverable = retryCount < VideoProgressService.MAX_RETRIES;

    const errorDetails: ErrorDetails = {
      jobId,
      error,
      ...context,
      recoverable,
      retryCount,
    };

    this.jobErrors.set(jobId, errorDetails);
    this.emit('error', errorDetails);

    if (recoverable) {
      this.emit('retrying', {
        jobId,
        retryCount,
        error,
        ...context,
      });
    }

    return recoverable;
  }

  completeTracking(jobId: string) {
    const finalProgress = this.jobProgress.get(jobId);
    if (finalProgress) {
      finalProgress.percent = 100;
      finalProgress.overallProgress = 100;
      finalProgress.timeRemaining = 0;
      this.emit('trackingCompleted', finalProgress);
    }

    // Cleanup
    this.jobProgress.delete(jobId);
    this.jobErrors.delete(jobId);
    this.startTimes.delete(jobId);
  }

  getProgress(jobId: string): ProgressUpdate | undefined {
    return this.jobProgress.get(jobId);
  }

  getError(jobId: string): ErrorDetails | undefined {
    return this.jobErrors.get(jobId);
  }

  getAllProgress(): ProgressUpdate[] {
    return Array.from(this.jobProgress.values());
  }
} 