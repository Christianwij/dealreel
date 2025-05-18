import { QAService } from '../qaService';
import type { QAResponse, QAHistoryItem, CacheStats, QAFeedback } from '../../types/qa';

describe('QAService', () => {
  let qaService: QAService;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    qaService = new QAService('/api/qa');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('ask', () => {
    const mockResponse: QAResponse = {
      answer: 'Test answer',
      sources: ['source1', 'source2'],
      confidence: 0.95
    };

    it('should successfully get an answer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await qaService.ask('brief-123', 'test question');
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/qa/brief-123/ask',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ question: 'test question' })
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(qaService.ask('brief-123', 'test question'))
        .rejects
        .toThrow('Failed to get answer: API request failed: Not Found');
    });
  });

  describe('getHistory', () => {
    const mockHistory: QAHistoryItem[] = [{
      id: '1',
      question: 'test question',
      answer: 'test answer',
      timestamp: '2024-01-01T00:00:00Z',
      sources: ['source1'],
      confidence: 0.9
    }];

    it('should successfully get history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistory)
      });

      const result = await qaService.getHistory('brief-123');
      expect(result).toEqual(mockHistory);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/qa/brief-123/history',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error'
      });

      await expect(qaService.getHistory('brief-123'))
        .rejects
        .toThrow('Failed to load history: API request failed: Server Error');
    });
  });

  describe('deleteHistory', () => {
    it('should successfully delete history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      await qaService.deleteHistory('brief-123');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/qa/brief-123/history',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error'
      });

      await expect(qaService.deleteHistory('brief-123'))
        .rejects
        .toThrow('Failed to delete history: API request failed: Server Error');
    });
  });

  describe('getStats', () => {
    const mockStats: CacheStats = {
      totalQuestions: 100,
      cacheHits: 60,
      cacheMisses: 40,
      averageResponseTime: 0.5
    };

    it('should successfully get stats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats)
      });

      const result = await qaService.getStats();
      expect(result).toEqual(mockStats);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/qa/stats',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error'
      });

      await expect(qaService.getStats())
        .rejects
        .toThrow('Failed to load stats: API request failed: Server Error');
    });
  });

  describe('submitFeedback', () => {
    const mockFeedback: QAFeedback = {
      questionId: '123',
      rating: 5,
      comment: 'Great answer!',
      userId: 'user-123'
    };

    it('should successfully submit feedback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      await qaService.submitFeedback(mockFeedback);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/qa/feedback',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockFeedback)
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error'
      });

      await expect(qaService.submitFeedback(mockFeedback))
        .rejects
        .toThrow('Failed to submit feedback: API request failed: Server Error');
    });
  });
});