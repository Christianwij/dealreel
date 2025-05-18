import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnswerDisplay from '../AnswerDisplay';
import type { QAResponse } from '../../types/qa';

jest.mock('@mui/icons-material', () => ({
  ThumbUp: () => <div data-testid="thumb-up">ThumbUp</div>,
  ThumbDown: () => <div data-testid="thumb-down">ThumbDown</div>,
  Flag: () => <div data-testid="flag">Flag</div>
}));

describe('AnswerDisplay', () => {
  const mockAnswer: QAResponse = {
    answer: 'This is a test answer',
    sources: ['Source 1', 'Source 2'],
    confidence: 0.95
  };

  const mockOnFeedback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders answer text and sources', () => {
    render(
      <AnswerDisplay
        answer={mockAnswer}
        onFeedback={mockOnFeedback}
      />
    );

    expect(screen.getByText(mockAnswer.answer)).toBeInTheDocument();
    mockAnswer.sources.forEach(source => {
      expect(screen.getByText(source)).toBeInTheDocument();
    });
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('handles feedback submission', () => {
    render(
      <AnswerDisplay
        answer={mockAnswer}
        onFeedback={mockOnFeedback}
      />
    );

    const likeButton = screen.getByTestId('thumb-up').parentElement;
    const dislikeButton = screen.getByTestId('thumb-down').parentElement;
    const reportButton = screen.getByTestId('flag').parentElement;

    fireEvent.click(likeButton!);
    expect(mockOnFeedback).toHaveBeenCalledWith('like');

    fireEvent.click(dislikeButton!);
    expect(mockOnFeedback).toHaveBeenCalledWith('dislike');

    fireEvent.click(reportButton!);
    expect(mockOnFeedback).toHaveBeenCalledWith('report');
  });

  it('displays loading state when answer is null', () => {
    render(
      <AnswerDisplay
        answer={null}
        onFeedback={mockOnFeedback}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error message when answer has error', () => {
    const errorAnswer = {
      ...mockAnswer,
      error: 'Something went wrong'
    };

    render(
      <AnswerDisplay
        answer={errorAnswer}
        onFeedback={mockOnFeedback}
      />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays timestamp in correct format', () => {
    const timestamp = '2024-01-20T12:34:56.789Z';
    const answer = {
      ...mockAnswer,
      timestamp
    };

    render(
      <AnswerDisplay
        answer={answer}
        onFeedback={mockOnFeedback}
      />
    );

    // Check if timestamp is displayed in local time format
    const localTime = new Date(timestamp).toLocaleTimeString();
    expect(screen.getByText(localTime)).toBeInTheDocument();
  });
}); 