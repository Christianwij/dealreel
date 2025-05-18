import { vi, describe, test, expect, beforeEach } from 'vitest';
import { QAService } from '../../services/qaService';
import type { QAFeedback } from '../../types/qa';

// Mock Redis client
vi.mock('redis', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    disconnect: vi.fn()
  }))
}));

describe('QAService', () => {
  let qaService: QAService;
  const mockBriefingId = 'test-briefing-id';

  beforeEach(() => {
    vi.clearAllMocks();
    qaService = new QAService();
  });

  test('askQuestion returns answer with sources and confidence', async () => {
    const mockQuestion = 'What is the revenue?';
    const mockResponse = {
      answer: 'The revenue is $1M',
      sources: ['page1.pdf', 'page2.pdf'],
      confidence: 0.85
    };

    // Mock the fetch call
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await qaService.askQuestion(mockBriefingId, mockQuestion);

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(expect.any(String), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: mockQuestion,
        briefingId: mockBriefingId
      })
    });
  });

  test('getHistory returns conversation history', async () => {
    const mockHistory = [
      {
        id: '1',
        question: 'Test question',
        answer: 'Test answer',
        timestamp: new Date().toISOString(),
        sources: ['source1'],
        confidence: 0.8
      }
    ];

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHistory)
    });

    const result = await qaService.getHistory(mockBriefingId);

    expect(result).toEqual(mockHistory);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/history/${mockBriefingId}`));
  });

  test('submitFeedback sends feedback correctly', async () => {
    const mockFeedback: QAFeedback = {
      questionId: '1',
      rating: 1,
      userId: 'test-user',
      comment: 'Great answer'
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    await qaService.submitFeedback(mockFeedback);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/feedback'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...mockFeedback,
        briefingId: mockBriefingId
      })
    });
  });

  test('getMetrics returns performance metrics', async () => {
    const mockMetrics = {
      totalQuestions: 100,
      averageResponseTime: 1.5,
      cacheHitRate: 0.75,
      averageConfidence: 0.85,
      positiveRatings: 80,
      negativeRatings: 10,
      reportedAnswers: 5
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMetrics)
    });

    const result = await qaService.getMetrics(mockBriefingId);

    expect(result).toEqual(mockMetrics);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/metrics/${mockBriefingId}`));
  });

  test('handles API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('API Error'));

    await expect(qaService.askQuestion(mockBriefingId, 'test')).rejects.toThrow('Failed to get answer');
    await expect(qaService.getHistory(mockBriefingId)).rejects.toThrow('Failed to get history');
    await expect(qaService.submitFeedback({
      questionId: '1',
      rating: 1,
      userId: 'test-user'
    })).rejects.toThrow('Failed to submit feedback');
    await expect(qaService.getMetrics(mockBriefingId)).rejects.toThrow('Failed to get metrics');
  });

  test('uses cache for repeated questions', async () => {
    const mockQuestion = 'Cached question';
    const mockResponse = {
      answer: 'Cached answer',
      sources: ['cache.pdf'],
      confidence: 0.9
    };

    const mockRedisClient = await vi.importMock('redis').createClient();
    mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockResponse));

    const result = await qaService.askQuestion(mockBriefingId, mockQuestion);

    expect(result).toEqual(mockResponse);
    expect(mockRedisClient.get).toHaveBeenCalledWith(expect.stringContaining(mockQuestion));
    expect(fetch).not.toHaveBeenCalled();
  });

  test('caches new questions', async () => {
    const mockQuestion = 'New question';
    const mockResponse = {
      answer: 'New answer',
      sources: ['new.pdf'],
      confidence: 0.95
    };

    const mockRedisClient = await vi.importMock('redis').createClient();
    mockRedisClient.get.mockResolvedValueOnce(null);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    await qaService.askQuestion(mockBriefingId, mockQuestion);

    expect(mockRedisClient.set).toHaveBeenCalledWith(
      expect.stringContaining(mockQuestion),
      JSON.stringify(mockResponse),
      expect.any(Object)
    );
  });
}); 