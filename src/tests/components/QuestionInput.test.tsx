import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { QuestionInput } from '../../components/QuestionInput';
import { VoiceService } from '../../services/voiceService';
import type { VoiceServiceType } from '../../types/voice';

// Mock the VoiceService
vi.mock('../../services/voiceService', () => ({
  VoiceService: vi.fn().mockImplementation(() => ({
    isSupported: vi.fn().mockResolvedValue(true),
    startRecording: vi.fn().mockResolvedValue('Voice input'),
    stopRecording: vi.fn()
  }))
}));

describe('QuestionInput', () => {
  const mockOnSubmit = vi.fn();
  const mockOnChange = vi.fn();
  const mockOnVoiceInput = vi.fn();
  let mockVoiceService: VoiceServiceType;
  
  const defaultProps = {
    question: '',
    onChange: mockOnChange,
    onSubmit: mockOnSubmit,
    onVoiceInput: mockOnVoiceInput,
    isLoading: false,
    isVoiceSupported: true,
    isListening: false
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockVoiceService = new VoiceService() as VoiceServiceType;
  });

  test('renders input field and submit button', () => {
    render(<QuestionInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    expect(input).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  test('handles text input submission', async () => {
    render(<QuestionInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const testQuestion = 'Test question';
    
    await userEvent.type(input, testQuestion);
    expect(mockOnChange).toHaveBeenCalledWith(testQuestion);
    
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(mockOnSubmit).toHaveBeenCalledWith(testQuestion);
  });

  test('handles Enter key submission', async () => {
    render(<QuestionInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const testQuestion = 'Test question';
    
    await userEvent.type(input, testQuestion);
    await userEvent.keyboard('{Enter}');
    
    expect(mockOnSubmit).toHaveBeenCalledWith(testQuestion);
  });

  test('prevents empty question submission', async () => {
    render(<QuestionInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    await userEvent.click(submitButton);
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/please enter a question/i)).toBeInTheDocument();
    
    await userEvent.type(input, '   ');
    await userEvent.click(submitButton);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('handles voice input with recording states', async () => {
    const mockStartRecording = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('Voice input'), 100))
    );
    
    mockVoiceService.startRecording = mockStartRecording;
    
    render(<QuestionInput {...defaultProps} isListening={true} />);
    
    const voiceButton = screen.getByRole('button', { name: /voice/i });
    await userEvent.click(voiceButton);
    
    expect(screen.getByText(/recording/i)).toBeInTheDocument();
    expect(voiceButton).toHaveAttribute('aria-pressed', 'true');
    
    await waitFor(() => {
      expect(screen.queryByText(/recording/i)).not.toBeInTheDocument();
      expect(voiceButton).toHaveAttribute('aria-pressed', 'false');
    });
    
    expect(mockOnVoiceInput).toHaveBeenCalledWith('Voice input');
  });

  test('handles voice recording cancellation', async () => {
    const mockStartRecording = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(''), 100))
    );
    
    mockVoiceService.startRecording = mockStartRecording;
    
    render(<QuestionInput {...defaultProps} isListening={true} />);
    
    const voiceButton = screen.getByRole('button', { name: /voice/i });
    await userEvent.click(voiceButton);
    
    expect(screen.getByText(/recording/i)).toBeInTheDocument();
    
    await userEvent.click(voiceButton);
    expect(mockVoiceService.stopRecording).toHaveBeenCalled();
    expect(mockOnVoiceInput).not.toHaveBeenCalled();
  });

  test('handles voice service not supported', async () => {
    render(<QuestionInput {...defaultProps} isVoiceSupported={false} />);
    
    expect(screen.queryByRole('button', { name: /voice/i })).not.toBeInTheDocument();
    expect(screen.getByText(/voice input not supported/i)).toBeInTheDocument();
  });

  test('handles voice recording error', async () => {
    const errorMessage = 'Recording failed';
    mockVoiceService.startRecording = vi.fn().mockRejectedValue(new Error(errorMessage));
    
    render(<QuestionInput {...defaultProps} isListening={true} />);
    
    const voiceButton = screen.getByRole('button', { name: /voice/i });
    await userEvent.click(voiceButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(voiceButton).not.toBeDisabled();
      expect(voiceButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  test('displays loading state', async () => {
    render(<QuestionInput {...defaultProps} isLoading={true} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('maintains input value on error', async () => {
    const mockErrorSubmit = vi.fn().mockRejectedValue(new Error('Submission error'));
    render(<QuestionInput {...defaultProps} onSubmit={mockErrorSubmit} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const testQuestion = 'Test question';
    
    await userEvent.type(input, testQuestion);
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenLastCalledWith(testQuestion);
    });
  });

  test('trims whitespace from input', async () => {
    render(<QuestionInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    await userEvent.type(input, '  Test question  ');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Test question');
  });

  test('prevents multiple simultaneous submissions', async () => {
    render(<QuestionInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    await userEvent.type(input, 'Test question');
    await userEvent.click(submitButton);
    await userEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  test('handles input length limit', async () => {
    render(<QuestionInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    const longQuestion = 'A'.repeat(1000);
    await userEvent.type(input, longQuestion);
    
    expect(mockOnChange).toHaveBeenLastCalledWith(longQuestion.slice(0, 500));
  });

  test('shows input length', async () => {
    render(<QuestionInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask a question/i);
    await userEvent.type(input, 'Test');
    
    expect(mockOnChange).toHaveBeenLastCalledWith('Test');
    expect(screen.getByText('4/500')).toBeInTheDocument();
  });
}); 