import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import QuestionInput from '../QuestionInput';
import { VoiceService } from '@/services/voiceService';

// Define types for voice service events
type VoiceServiceEvents = {
  result: (transcript: string) => void;
  error: (error: Error) => void;
};

// Define mock voice service type
type MockVoiceService = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  on: <K extends keyof VoiceServiceEvents>(event: K, handler: VoiceServiceEvents[K]) => void;
  removeAllListeners: () => void;
};

// Mock the VoiceService
jest.mock('@/services/voiceService', () => {
  return {
    VoiceService: jest.fn().mockImplementation(() => ({
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      on: jest.fn<void, [keyof VoiceServiceEvents, VoiceServiceEvents[keyof VoiceServiceEvents]]>(),
      removeAllListeners: jest.fn(),
    })),
  };
});

describe('QuestionInput', () => {
  let mockVoiceService: jest.Mocked<MockVoiceService>;
  const mockOnSubmit = jest.fn();
  const mockOnVoiceStart = jest.fn();
  const mockOnVoiceEnd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup VoiceService mock
    mockVoiceService = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
    } as unknown as jest.Mocked<MockVoiceService>;

    (VoiceService as unknown as jest.Mock).mockImplementation(() => mockVoiceService);
  });

  it('renders input field and buttons', () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    expect(screen.getByPlaceholderText('Type your question...')).toBeInTheDocument();
    expect(screen.getByLabelText('voice')).toBeInTheDocument();
    expect(screen.getByLabelText('ask')).toBeInTheDocument();
  });

  it('handles text input and submission', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    const input = screen.getByPlaceholderText('Type your question...');
    await userEvent.type(input, 'Test question');
    
    const submitButton = screen.getByLabelText('ask');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('Test question');
    expect(input).toHaveValue('');
  });

  it('handles Enter key submission', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    const input = screen.getByPlaceholderText('Type your question...');
    await userEvent.type(input, 'Test question{enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith('Test question');
    expect(input).toHaveValue('');
  });

  it('handles voice input activation and deactivation', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    const voiceButton = screen.getByLabelText('voice');
    
    // Start voice input
    fireEvent.click(voiceButton);
    await waitFor(() => {
      expect(mockVoiceService.start).toHaveBeenCalled();
      expect(mockOnVoiceStart).toHaveBeenCalled();
    });

    // Stop voice input
    fireEvent.click(voiceButton);
    expect(mockVoiceService.stop).toHaveBeenCalled();
    expect(mockOnVoiceEnd).toHaveBeenCalled();
  });

  it('handles voice transcription', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    // Get the result callback and simulate transcription
    const onCalls = mockVoiceService.on.mock.calls;
    const resultCallback = onCalls.find(([event]) => event === 'result')?.[1] as
      | VoiceServiceEvents['result']
      | undefined;
    
    if (resultCallback) {
      resultCallback('Voice transcription');
    }

    await waitFor(() => {
      expect(screen.getByDisplayValue('Voice transcription')).toBeInTheDocument();
    });
  });

  it('handles voice input errors', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    // Simulate voice start error
    mockVoiceService.start.mockRejectedValueOnce(new Error('Microphone access denied'));

    const voiceButton = screen.getByLabelText('voice');
    fireEvent.click(voiceButton);

    await waitFor(() => {
      expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
    });

    // Simulate error during voice recognition
    const onCalls = mockVoiceService.on.mock.calls;
    const errorCallback = onCalls.find(([event]) => event === 'error')?.[1] as
      | VoiceServiceEvents['error']
      | undefined;
    
    if (errorCallback) {
      errorCallback(new Error('Recognition failed'));
    }

    await waitFor(() => {
      expect(screen.getByText('Recognition failed')).toBeInTheDocument();
    });
    expect(mockOnVoiceEnd).toHaveBeenCalled();
  });

  it('cleans up voice service on unmount', () => {
    const { unmount } = render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    unmount();

    expect(mockVoiceService.removeAllListeners).toHaveBeenCalled();
    expect(mockVoiceService.stop).toHaveBeenCalled();
  });

  it('handles empty input submission', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    const submitButton = screen.getByLabelText('ask');
    expect(submitButton).toBeDisabled();

    const input = screen.getByPlaceholderText('Type your question...');
    await userEvent.type(input, '   ');
    expect(submitButton).toBeDisabled();

    await userEvent.type(input, 'Valid question');
    expect(submitButton).not.toBeDisabled();
  });

  it('handles multiple voice transcriptions', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    const onCalls = mockVoiceService.on.mock.calls;
    const resultCallback = onCalls.find(([event]) => event === 'result')?.[1] as
      | VoiceServiceEvents['result']
      | undefined;
    
    if (resultCallback) {
      resultCallback('First part');
      resultCallback(' second part');
      resultCallback(' third part');
    }

    await waitFor(() => {
      expect(screen.getByDisplayValue('First part second part third part')).toBeInTheDocument();
    });
  });

  it('handles rapid voice button clicks', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    const voiceButton = screen.getByLabelText('voice');
    
    // Rapid clicks
    fireEvent.click(voiceButton);
    fireEvent.click(voiceButton);
    fireEvent.click(voiceButton);

    await waitFor(() => {
      expect(mockVoiceService.start).toHaveBeenCalledTimes(2);
      expect(mockVoiceService.stop).toHaveBeenCalledTimes(1);
    });
  });

  it('handles input focus and blur', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    const input = screen.getByPlaceholderText('Type your question...');
    
    fireEvent.focus(input);
    expect(input).toHaveFocus();

    fireEvent.blur(input);
    expect(input).not.toHaveFocus();
  });

  it('handles long input text', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    const input = screen.getByPlaceholderText('Type your question...');
    const longText = 'a'.repeat(1000);
    
    await userEvent.type(input, longText);
    expect(input).toHaveValue(longText);

    fireEvent.click(screen.getByLabelText('ask'));
    expect(mockOnSubmit).toHaveBeenCalledWith(longText);
  });

  it('handles concurrent voice and text input', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    const input = screen.getByPlaceholderText('Type your question...');
    await userEvent.type(input, 'Typed text');

    const voiceButton = screen.getByLabelText('voice');
    fireEvent.click(voiceButton);

    const onCalls = mockVoiceService.on.mock.calls;
    const resultCallback = onCalls.find(([event]) => event === 'result')?.[1] as
      | VoiceServiceEvents['result']
      | undefined;
    
    if (resultCallback) {
      resultCallback(' voice text');
    }

    await waitFor(() => {
      expect(screen.getByDisplayValue('Typed text voice text')).toBeInTheDocument();
    });
  });

  it('maintains input state between submissions', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        onVoiceStart={mockOnVoiceStart}
        onVoiceEnd={mockOnVoiceEnd}
      />
    );

    const input = screen.getByPlaceholderText('Type your question...');
    
    // First submission
    await userEvent.type(input, 'First question');
    fireEvent.click(screen.getByLabelText('ask'));
    expect(mockOnSubmit).toHaveBeenCalledWith('First question');
    expect(input).toHaveValue('');

    // Second submission
    await userEvent.type(input, 'Second question');
    fireEvent.click(screen.getByLabelText('ask'));
    expect(mockOnSubmit).toHaveBeenCalledWith('Second question');
    expect(input).toHaveValue('');
  });
}); 