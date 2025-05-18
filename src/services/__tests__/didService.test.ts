import { DIDService } from '../didService';
import type { DIDTalkResponse } from '@/types/did';

// Mock fetch globally
global.fetch = jest.fn();

describe('DIDService', () => {
  const mockApiKey = 'test-api-key';
  const mockBaseUrl = 'https://test.d-id.com';
  let service: DIDService;

  beforeEach(() => {
    service = new DIDService({
      config: {
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
      },
    });
    (global.fetch as jest.Mock).mockClear();
  });

  it('should throw error if API key is not provided', () => {
    expect(() => new DIDService({ config: { apiKey: '' } })).toThrow('D-ID API key is required');
  });

  it('should create a talk successfully', async () => {
    const mockResponse: DIDTalkResponse = {
      id: 'talk-123',
      created_at: new Date().toISOString(),
      status: 'created',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const talkId = await service.createTalk('Test script');
    expect(talkId).toBe('talk-123');

    expect(global.fetch).toHaveBeenCalledWith(
      `${mockBaseUrl}/talks`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Basic ${mockApiKey}`,
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should get talk status', async () => {
    const mockResponse: DIDTalkResponse = {
      id: 'talk-123',
      created_at: new Date().toISOString(),
      status: 'done',
      result_url: 'https://example.com/video.mp4',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const status = await service.getTalkStatus('talk-123');
    expect(status).toEqual(mockResponse);

    expect(global.fetch).toHaveBeenCalledWith(
      `${mockBaseUrl}/talks/talk-123`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Basic ${mockApiKey}`,
        }),
      })
    );
  });

  it('should wait for talk completion', async () => {
    const mockResponses: DIDTalkResponse[] = [
      { id: 'talk-123', created_at: new Date().toISOString(), status: 'created' },
      { id: 'talk-123', created_at: new Date().toISOString(), status: 'started' },
      { id: 'talk-123', created_at: new Date().toISOString(), status: 'done', result_url: 'https://example.com/video.mp4' },
    ];

    const mockProgress = jest.fn();
    service = new DIDService({
      config: { apiKey: mockApiKey, baseUrl: mockBaseUrl },
      onProgress: mockProgress,
    });

    let callCount = 0;
    (global.fetch as jest.Mock).mockImplementation(() => ({
      ok: true,
      json: () => Promise.resolve(mockResponses[callCount++]),
    }));

    const result = await service.waitForTalkCompletion('talk-123', 0);
    expect(result).toEqual(mockResponses[2]);
    expect(mockProgress).toHaveBeenCalledWith(100);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'API Error' }),
    });

    const mockError = jest.fn();
    service = new DIDService({
      config: { apiKey: mockApiKey, baseUrl: mockBaseUrl },
      onError: mockError,
    });

    await expect(service.createTalk('Test script')).rejects.toThrow('API Error');
    expect(mockError).toHaveBeenCalled();
  });

  it('should generate talk with progress tracking', async () => {
    const mockProgress = jest.fn();
    service = new DIDService({
      config: { apiKey: mockApiKey, baseUrl: mockBaseUrl },
      onProgress: mockProgress,
    });

    const mockResponses = [
      { id: 'talk-123', created_at: new Date().toISOString(), status: 'created' },
      { id: 'talk-123', created_at: new Date().toISOString(), status: 'started' },
      { id: 'talk-123', created_at: new Date().toISOString(), status: 'done', result_url: 'https://example.com/video.mp4' },
    ];

    let callCount = 0;
    (global.fetch as jest.Mock).mockImplementation(() => ({
      ok: true,
      json: () => Promise.resolve(mockResponses[callCount++]),
    }));

    const resultUrl = await service.generateTalkWithProgress('Test script');
    expect(resultUrl).toBe('https://example.com/video.mp4');
    expect(mockProgress).toHaveBeenCalledWith(0);
    expect(mockProgress).toHaveBeenCalledWith(25);
    expect(mockProgress).toHaveBeenCalledWith(50);
    expect(mockProgress).toHaveBeenCalledWith(100);
  });
}); 