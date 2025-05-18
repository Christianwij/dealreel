import { vi } from 'vitest';
import { QAService } from '../../services/qaService';
import type { PerformanceMetrics } from '../../types/qa';

export class MockQAService extends QAService {
  constructor() {
    super('/api/qa');
    this.askQuestion = vi.fn().mockResolvedValue({ answer: '', sources: [], confidence: 0 });
    this.ask = vi.fn().mockResolvedValue({ answer: '', sources: [], confidence: 0 });
    this.getHistory = vi.fn().mockResolvedValue([]);
    this.deleteHistory = vi.fn().mockResolvedValue(undefined);
    this.getStats = vi.fn().mockResolvedValue({
      totalQuestions: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0
    });
    this.submitFeedback = vi.fn().mockResolvedValue(undefined);
    this.getMetrics = vi.fn().mockResolvedValue({
      responseTime: 1.2,
      tokenCount: 5000,
      cacheHitRate: 0.75,
      errorRate: 0.02,
      questionCount: 150,
      averageResponseTime: 1.5,
      totalQueries: 100,
      lastHourQueries: 25
    });
    this.getErrorLogs = vi.fn().mockResolvedValue([]);
    this.getCachedAnswer = vi.fn().mockResolvedValue(null);
    this.cacheAnswer = vi.fn().mockResolvedValue(undefined);
  }

  static createMockService(overrides: Partial<MockQAService> = {}) {
    const service = new MockQAService();
    Object.assign(service, overrides);
    return service;
  }

  static getMockMetrics(): PerformanceMetrics {
    return {
      responseTime: 1.2,
      tokenCount: 5000,
      cacheHitRate: 0.75,
      errorRate: 0.02,
      questionCount: 150,
      averageResponseTime: 1.5,
      totalQueries: 100,
      lastHourQueries: 25
    };
  }
} 