import { OpenAI } from 'openai';
import { SummaryService } from '../summaryService';

interface SummaryRequest {
  briefingId: string;
  content: string;
  preferences: {
    style: 'concise' | 'detailed';
    focusAreas: string[];
  };
}

interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  timestamp: string;
}

jest.mock('openai');

describe('SummaryService', () => {
  let summaryService: SummaryService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockRequest: SummaryRequest = {
    briefingId: 'brief-123',
    content: 'Test content',
    preferences: {
      style: 'concise',
      focusAreas: ['financials', 'risks']
    }
  };

  const mockResponse: SummaryResponse = {
    summary: 'Test summary',
    keyPoints: ['Point 1', 'Point 2'],
    timestamp: new Date().toISOString()
  };

  beforeEach(() => {
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify(mockResponse),
                role: 'assistant'
              }
            }]
          })
        }
      }
    } as unknown as jest.Mocked<OpenAI>;

    // Setup service
    summaryService = new SummaryService();
    (summaryService as any).openai = mockOpenAI;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('generates a summary successfully', async () => {
    const result = await summaryService.generateSummary(mockRequest);
    expect(result).toEqual(mockResponse);
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining(mockRequest.content)
          })
        ])
      })
    );
  });

  it('handles OpenAI errors gracefully', async () => {
    const error = new Error('API Error');
    (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValueOnce(error);
    await expect(summaryService.generateSummary(mockRequest))
      .rejects.toThrow('Failed to generate summary');
  });

  it('validates input parameters', async () => {
    const invalidRequest = { ...mockRequest, content: '' };
    await expect(summaryService.generateSummary(invalidRequest))
      .rejects.toThrow('Invalid request parameters');
  });
}); 