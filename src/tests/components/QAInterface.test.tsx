import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { QAInterface } from '../../components/QAInterface';
import { QAService } from '../../services/qaService';
import { VoiceService } from '../../services/voiceService';
import type { QAServiceType } from '../../types/qa';
import type { VoiceServiceType } from '../../types/voice';

// Mock the services
vi.mock('../../services/qaService', () => ({
  QAService: vi.fn().mockImplementation(() => ({
    askQuestion: vi.fn().mockResolvedValue({
      answer: 'Test answer',
      sources: ['source1'],
      confidence: 0.9
    }),
    getHistory: vi.fn().mockResolvedValue([]),
    submitFeedback: vi.fn().mockResolvedValue({}),
    getMetrics: vi.fn().mockResolvedValue({
      totalQuestions: 100,
      averageConfidence: 0.85,
      positiveRatings: 75,
      negativeRatings: 25
    })
  }))
}));

vi.mock('../../services/voiceService', () => ({
  VoiceService: vi.fn().mockImplementation(() => ({
    isSupported: vi.fn().mockResolvedValue(true),
    startRecording: vi.fn().mockResolvedValue('Voice input'),
    stopRecording: vi.fn()
  }))
}));

describe('QAInterface', () => {
  const mockBriefingId = 'test-briefing-id';
  let mockQAService: QAServiceType;
  let mockVoiceService: VoiceServiceType;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockQAService = {
      askQuestion: vi.fn().mockResolvedValue({
        answer: 'Test answer',
        sources: ['source1'],
        confidence: 0.9
      }),
      getHistory: vi.fn().mockResolvedValue([]),
      submitFeedback: vi.fn().mockResolvedValue({}),
      getMetrics: vi.fn().mockResolvedValue({
        totalQuestions: 100,
        averageConfidence: 0.85,
        positiveRatings: 75,
        negativeRatings: 25
      })
    };
    mockVoiceService = new VoiceService() as VoiceServiceType;
  });

  test('renders all tabs and defaults to Ask tab', () => {
    render(<QAInterface briefingId={mockBriefingId} />);
    const tabs = screen.getByRole('tablist');
    
    expect(within(tabs).getByRole('tab', { name: 'Ask' })).toHaveAttribute('aria-selected', 'true');
    expect(within(tabs).getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'false');
    expect(within(tabs).getByRole('tab', { name: 'Metrics' })).toHaveAttribute('aria-selected', 'false');
  });

  test('switches between tabs correctly', async () => {
    render(<QAInterface briefingId={mockBriefingId} />);
    
    const historyTab = screen.getByRole('tab', { name: 'History' });
    await userEvent.click(historyTab);
    expect(historyTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Ask' })).toHaveAttribute('aria-selected', 'false');
    
    const metricsTab = screen.getByRole('tab', { name: 'Metrics' });
    await userEvent.click(metricsTab);
    expect(metricsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('handles question submission with loading state', async () => {
    const mockAskQuestion = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        answer: 'Test answer',
        sources: ['source1'],
        confidence: 0.9
      }), 100))
    );

    mockQAService.askQuestion = mockAskQuestion;
    
    render(<QAInterface briefingId={mockBriefingId} />);
    
    const input = screen.getByPlaceholderText('Ask a question...');
    const testQuestion = 'Test question';
    
    await userEvent.type(input, testQuestion);
    expect(input).toHaveValue(testQuestion);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).not.toBeDisabled();
    
    await userEvent.click(submitButton);
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Test answer')).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    expect(mockAskQuestion).toHaveBeenCalledWith(testQuestion);
  });

  test('handles voice input with recording states', async () => {
    const mockStartRecording = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('Voice input'), 100))
    );
    
    mockVoiceService.startRecording = mockStartRecording;
    
    render(<QAInterface briefingId={mockBriefingId} />);
    
    const voiceButton = screen.getByRole('button', { name: /voice/i });
    await userEvent.click(voiceButton);
    
    expect(screen.getByText('Recording...')).toBeInTheDocument();
    expect(voiceButton).toHaveAttribute('aria-pressed', 'true');
    
    await waitFor(() => {
      expect(screen.queryByText('Recording...')).not.toBeInTheDocument();
      expect(voiceButton).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByDisplayValue('Voice input')).toBeInTheDocument();
    });
  });

  test('displays error message on API failure with retry option', async () => {
    const mockError = new Error('API Error');
    mockQAService.askQuestion = vi.fn().mockRejectedValue(mockError);

    render(<QAInterface briefingId={mockBriefingId} />);
    
    const input = screen.getByPlaceholderText('Ask a question...');
    await userEvent.type(input, 'Test question');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to get answer. Please try again.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
    
    // Test retry functionality
    mockQAService.askQuestion = vi.fn().mockResolvedValue({
      answer: 'Retry answer',
      sources: ['source1'],
      confidence: 0.9
    });
    
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Retry answer')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  test('handles feedback submission with loading and success states', async () => {
    const mockSubmitFeedback = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({}), 100))
    );
    
    mockQAService.submitFeedback = mockSubmitFeedback;
    mockQAService.askQuestion = vi.fn().mockResolvedValue({
      answer: 'Test answer',
      sources: ['source1'],
      confidence: 0.9
    });

    render(<QAInterface briefingId={mockBriefingId} />);
    
    // Submit a question first
    await userEvent.type(screen.getByPlaceholderText('Ask a question...'), 'Test question');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Test answer')).toBeInTheDocument();
    });
    
    // Test like button
    const likeButton = screen.getByRole('button', { name: /like/i });
    await userEvent.click(likeButton);
    
    expect(likeButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(likeButton).not.toBeDisabled();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByText('Feedback submitted')).toBeInTheDocument();
    });
    
    expect(mockSubmitFeedback).toHaveBeenCalledWith(expect.objectContaining({
      rating: 1,
      userId: 'anonymous',
      briefingId: mockBriefingId
    }));
  });

  test('handles feedback submission failure', async () => {
    mockQAService.submitFeedback = vi.fn().mockRejectedValue(new Error('Feedback failed'));
    mockQAService.askQuestion = vi.fn().mockResolvedValue({
      answer: 'Test answer',
      sources: ['source1'],
      confidence: 0.9
    });

    render(<QAInterface briefingId={mockBriefingId} />);
    
    // Submit a question first
    await userEvent.type(screen.getByPlaceholderText('Ask a question...'), 'Test question');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Test answer')).toBeInTheDocument();
    });
    
    // Test dislike button with error
    const dislikeButton = screen.getByRole('button', { name: /dislike/i });
    await userEvent.click(dislikeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to submit feedback')).toBeInTheDocument();
      expect(dislikeButton).not.toBeDisabled();
    });
  });

  test('handles voice service not supported gracefully', async () => {
    mockVoiceService.isSupported = vi.fn().mockResolvedValue(false);

    render(<QAInterface briefingId={mockBriefingId} />);
    
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /voice/i })).not.toBeInTheDocument();
      expect(screen.getByText('Voice input not supported')).toBeInTheDocument();
    });
  });

  test('preserves question input when switching tabs', async () => {
    render(<QAInterface briefingId={mockBriefingId} />);
    
    const input = screen.getByPlaceholderText('Ask a question...');
    await userEvent.type(input, 'Test question');
    
    // Switch to History tab and back
    await userEvent.click(screen.getByRole('tab', { name: 'History' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Ask' }));
    
    expect(screen.getByDisplayValue('Test question')).toBeInTheDocument();
  });

  test('clears input after successful submission', async () => {
    render(<QAInterface briefingId={mockBriefingId} />);
    
    const input = screen.getByPlaceholderText('Ask a question...');
    await userEvent.type(input, 'Test question');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });
}); 