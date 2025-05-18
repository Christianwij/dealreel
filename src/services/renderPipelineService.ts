import { VideoService } from './videoService';
import type { ScriptSections } from '@/types/script';
import EventEmitter from 'events';

export interface RenderJob {
  id: string;
  script: ScriptSections;
  metrics: Record<string, number>;
  companyInfo: {
    name: string;
    logo?: string;
    industry: string;
  };
  outputPath: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: {
    section: keyof ScriptSections;
    percent: number;
  };
  error?: Error;
  createdAt: Date;
  updatedAt: Date;
}

export class RenderPipelineService extends EventEmitter {
  private queue: RenderJob[] = [];
  private processing: boolean = false;
  private videoService: VideoService;

  constructor() {
    super();
    this.videoService = new VideoService({
      onProgress: this.handleProgress.bind(this),
      onError: this.handleError.bind(this),
    });
  }

  private currentJob?: RenderJob;

  private handleProgress(section: keyof ScriptSections, percent: number) {
    if (this.currentJob) {
      this.currentJob.progress = { section, percent };
      this.currentJob.updatedAt = new Date();
      this.emit('progress', { ...this.currentJob });
    }
  }

  private handleError(error: Error) {
    if (this.currentJob) {
      this.currentJob.status = 'failed';
      this.currentJob.error = error;
      this.currentJob.updatedAt = new Date();
      this.emit('jobFailed', { ...this.currentJob });
    }
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    this.currentJob = this.queue[0];
    this.currentJob.status = 'processing';
    this.currentJob.updatedAt = new Date();
    this.emit('jobStarted', { ...this.currentJob });

    try {
      await this.videoService.generateVideo({
        script: this.currentJob.script,
        metrics: this.currentJob.metrics,
        companyInfo: this.currentJob.companyInfo,
        outputPath: this.currentJob.outputPath,
      });

      this.currentJob.status = 'completed';
      this.currentJob.updatedAt = new Date();
      this.emit('jobCompleted', { ...this.currentJob });
    } catch (error) {
      // Error is handled by handleError
    } finally {
      this.queue.shift(); // Remove completed/failed job
      this.processing = false;
      this.currentJob = undefined;
      
      // Process next job if available
      if (this.queue.length > 0) {
        setImmediate(() => this.processQueue());
      }
    }
  }

  enqueueRender(params: Omit<RenderJob, 'id' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>): RenderJob {
    const job: RenderJob = {
      ...params,
      id: Math.random().toString(36).substring(2, 15),
      status: 'queued',
      progress: {
        section: 'introduction',
        percent: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.push(job);
    this.emit('jobQueued', { ...job });

    // Start processing if not already processing
    if (!this.processing) {
      setImmediate(() => this.processQueue());
    }

    return job;
  }

  getJobStatus(id: string): RenderJob | undefined {
    if (this.currentJob?.id === id) {
      return { ...this.currentJob };
    }
    return this.queue.find(job => job.id === id);
  }

  getAllJobs(): RenderJob[] {
    return [
      ...(this.currentJob ? [this.currentJob] : []),
      ...this.queue
    ].map(job => ({ ...job }));
  }

  cancelJob(id: string): boolean {
    const index = this.queue.findIndex(job => job.id === id);
    if (index === -1) {
      return false;
    }

    const job = this.queue[index];
    this.queue.splice(index, 1);
    job.status = 'failed';
    job.error = new Error('Job cancelled');
    job.updatedAt = new Date();
    this.emit('jobCancelled', { ...job });
    return true;
  }
} 