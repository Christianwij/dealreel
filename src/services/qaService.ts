import type { QAResponse, QAHistoryItem, CacheStats, QAFeedback, PerformanceMetrics } from '../types/qa';

export class QAService {
  private baseUrl: string;

  constructor(baseUrl = '/api/qa') {
    this.baseUrl = baseUrl;
  }

  private async fetchWithError<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Alias for ask method to maintain backward compatibility
  async askQuestion(briefingId: string, question: string): Promise<QAResponse> {
    return this.ask(briefingId, question);
  }

  async ask(briefingId: string, question: string): Promise<QAResponse> {
    try {
      return await this.fetchWithError<QAResponse>(`${this.baseUrl}/${briefingId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
    } catch (error) {
      throw new Error(`Failed to get answer: ${(error as Error).message}`);
    }
  }

  async getHistory(briefingId: string): Promise<QAHistoryItem[]> {
    try {
      return await this.fetchWithError<QAHistoryItem[]>(`${this.baseUrl}/${briefingId}/history`);
    } catch (error) {
      throw new Error(`Failed to load history: ${(error as Error).message}`);
    }
  }

  async deleteHistory(briefingId: string): Promise<void> {
    try {
      await this.fetchWithError<void>(`${this.baseUrl}/${briefingId}/history`, {
        method: 'DELETE'
      });
    } catch (error) {
      throw new Error(`Failed to delete history: ${(error as Error).message}`);
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      return await this.fetchWithError<CacheStats>(`${this.baseUrl}/stats`);
    } catch (error) {
      throw new Error(`Failed to load stats: ${(error as Error).message}`);
    }
  }

  async submitFeedback(feedback: QAFeedback): Promise<void> {
    try {
      await this.fetchWithError<void>(`${this.baseUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
    } catch (error) {
      throw new Error(`Failed to submit feedback: ${(error as Error).message}`);
    }
  }

  async getMetrics(briefingId: string): Promise<PerformanceMetrics> {
    try {
      return await this.fetchWithError<PerformanceMetrics>(`${this.baseUrl}/${briefingId}/metrics`);
    } catch (error) {
      throw new Error(`Failed to get metrics: ${(error as Error).message}`);
    }
  }

  async getErrorLogs(limit: number = 100): Promise<string[]> {
    try {
      return await this.fetchWithError<string[]>(`${this.baseUrl}/errors`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit })
      });
    } catch (error) {
      throw new Error(`Failed to get error logs: ${(error as Error).message}`);
    }
  }

  async getCachedAnswer(question: string): Promise<QAResponse | null> {
    try {
      const response = await this.fetchWithError<QAResponse | null>(`${this.baseUrl}/cache`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      return response;
    } catch (error) {
      console.error('Cache lookup failed:', error);
      return null;
    }
  }

  async cacheAnswer(question: string, answer: QAResponse): Promise<void> {
    try {
      await this.fetchWithError<void>(`${this.baseUrl}/cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer })
      });
    } catch (error) {
      console.error('Failed to cache answer:', error);
    }
  }
}