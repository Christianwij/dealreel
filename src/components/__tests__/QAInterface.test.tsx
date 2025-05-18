import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import QAInterface from '../QAInterface';
import { QAService } from '../../services/qaService';
import type { QAResponse, QAServiceInterface, QAFeedback } from '../../types/qa';
import { OpenAI } from 'openai';
import { Redis } from 'ioredis';
import { PerformanceMonitor } from '../../services/performanceMonitor';
import { ThumbUp, ThumbDown, Mic, Send } from '@mui/icons-material';
import { VoiceService } from '@/services/voiceService';

// Define types for voice service events
type VoiceServiceEvents = {
  result: (transcript: string) => void;
  error: (error: Error) => void;
};

// Mock voice service
jest.mock('@/services/voiceService', () => {
  return {
    VoiceService: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    }))
  };
});

// Mock QA service
const mockBriefingId = 'test-briefing-id';

const createMockService = (overrides = {}) => ({
  ask: jest.fn(),
  getHistory: jest.fn().mockResolvedValue([]),
  getStats: jest.fn().mockResolvedValue({
    hits: 0,
    misses: 0,
    totalQueries: 0
  }),
  submitFeedback: jest.fn(),
  deleteHistory: jest.fn(),
  ...overrides
});

const MockedQAService = QAService as jest.MockedClass<typeof QAService>;

jest.mock('../../services/qaService', () => ({
  QAService: jest.fn().mockImplementation(() => createMockService())
}));

describe('QAInterface', () => {
  let mockQAService: jest.Mocked<QAService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockQAService = new MockedQAService();
  });

  it('renders without crashing', () => {
    render(<QAInterface briefingId={mockBriefingId} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('submits questions and displays answers', async () => {
    const mockAnswer: QAResponse = {
      answer: 'Test answer',
      sources: ['Test source'],
      confidence: 0.95
    };

    MockedQAService.mockImplementation(() => createMockService({
      ask: jest.fn().mockResolvedValue(mockAnswer)
    }));

    render(<QAInterface briefingId={mockBriefingId} />);
    
    const input = screen.getByPlaceholderText(/type your question/i);
    const form = screen.getByRole('form');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test question' } });
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(screen.getByText(mockAnswer.answer)).toBeInTheDocument();
      expect(screen.getByText(/test source/i)).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    const errorMessage = 'Failed to get answer';
    
    MockedQAService.mockImplementation(() => createMockService({
      ask: jest.fn().mockRejectedValue(new Error(errorMessage))
    }));

    render(<QAInterface briefingId={mockBriefingId} />);
    
    const input = screen.getByPlaceholderText(/type your question/i);
    const form = screen.getByRole('form');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test question' } });
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles voice input', async () => {
    const mockTranscript = 'voice input test';
    let voiceCallback: (transcript: string) => void;
    
    const mockVoiceService = {
      start: jest.fn(),
      stop: jest.fn(),
      on: jest.fn().mockImplementation((event: keyof VoiceServiceEvents, callback: any) => {
        if (event === 'result') {
          voiceCallback = callback;
        }
      }),
      off: jest.fn()
    };

    (VoiceService as jest.Mock).mockImplementation(() => mockVoiceService);

    render(<QAInterface briefingId={mockBriefingId} />);
    
    const voiceButton = screen.getByLabelText(/voice input/i);
    fireEvent.click(voiceButton);

    expect(mockVoiceService.start).toHaveBeenCalled();
    
    act(() => {
      voiceCallback(mockTranscript);
    });

    expect(mockVoiceService.stop).toHaveBeenCalled();
    expect(screen.getByDisplayValue(mockTranscript)).toBeInTheDocument();
  });

  it('handles feedback submission', async () => {
    const mockAnswer: QAResponse = {
      answer: 'Test answer',
      sources: ['Test source'],
      confidence: 0.95
    };
    
    const mockService = createMockService({
      ask: jest.fn().mockResolvedValue(mockAnswer),
      submitFeedback: jest.fn().mockResolvedValue('success')
    });
    
    MockedQAService.mockImplementation(() => mockService);

    render(<QAInterface briefingId={mockBriefingId} />);
    
    // Submit a question first
    const input = screen.getByPlaceholderText(/type your question/i);
    const form = screen.getByRole('form');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test question' } });
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(screen.getByText(mockAnswer.answer)).toBeInTheDocument();
    });

    // Submit feedback
    const likeButton = screen.getByLabelText(/like/i);
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockService.submitFeedback).toHaveBeenCalled();
    });
  });

  it('handles very long questions and answers', async () => {
    const longQuestion = 'a'.repeat(1000);
    const longAnswer: QAResponse = {
      answer: 'b'.repeat(5000),
      sources: ['Long source'],
      confidence: 0.95
    };
    
    MockedQAService.mockImplementation(() => createMockService({
      ask: jest.fn().mockResolvedValue(longAnswer)
    }));

    render(<QAInterface briefingId={mockBriefingId} />);
    
    const input = screen.getByPlaceholderText(/type your question/i);
    const form = screen.getByRole('form');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: longQuestion } });
      fireEvent.submit(form);
    });
    
    await waitFor(() => {
      expect(screen.getByText(longAnswer.answer)).toBeInTheDocument();
    });
  }, 10000);

  it('handles rapid consecutive questions', async () => {
    const mockAnswer: QAResponse = {
      answer: 'Test answer',
      sources: ['Test source'],
      confidence: 0.95
    };
    
    const mockService = createMockService({
      ask: jest.fn().mockResolvedValue(mockAnswer)
    });
    MockedQAService.mockImplementation(() => mockService);

    render(<QAInterface briefingId={mockBriefingId} />);
    
    const input = screen.getByPlaceholderText(/type your question/i);
    const form = screen.getByRole('form');
    
    // Submit three questions rapidly
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        fireEvent.change(input, { target: { value: `question ${i + 1}` } });
        fireEvent.submit(form);
      });
    }

    await waitFor(() => {
      expect(mockService.ask).toHaveBeenCalledTimes(3);
      const answers = screen.getAllByText(mockAnswer.answer);
      expect(answers).toHaveLength(3);
    });
  });
});