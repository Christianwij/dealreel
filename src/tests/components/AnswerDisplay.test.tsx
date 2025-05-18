import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { AnswerDisplay } from '../../components/AnswerDisplay';
import type { QAResponse } from '../../types/qa';

describe('AnswerDisplay', () => {
  const mockAnswer: QAResponse = {
    answer: 'Test answer',
    sources: ['source1', 'source2'],
    confidence: 0.9
  };

  const mockOnFeedback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders answer and sources', () => {
    render(
      <AnswerDisplay
        answer={mockAnswer}
        onFeedback={mockOnFeedback}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText(mockAnswer.answer)).toBeInTheDocument();
    mockAnswer.sources.forEach(source => {
      expect(screen.getByText(source)).toBeInTheDocument();
    });
    expect(screen.getByText(`${(mockAnswer.confidence * 100).toFixed(1)}%`)).toBeInTheDocument();
  });

  test('renders loading state', () => {
    render(
      <AnswerDisplay
        answer={null}
        onFeedback={mockOnFeedback}
        isLoading={true}
        error={null}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders error state', () => {
    const errorMessage = 'Test error';
    render(
      <AnswerDisplay
        answer={null}
        onFeedback={mockOnFeedback}
        isLoading={false}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('handles like feedback', async () => {
    render(
      <AnswerDisplay
        answer={mockAnswer}
        onFeedback={mockOnFeedback}
        isLoading={false}
        error={null}
      />
    );

    const likeButton = screen.getByRole('button', { name: /like/i });
    await userEvent.click(likeButton);

    expect(mockOnFeedback).toHaveBeenCalledWith('like');
    expect(likeButton).toBeDisabled();
  });

  test('handles dislike feedback', async () => {
    render(
      <AnswerDisplay
        answer={mockAnswer}
        onFeedback={mockOnFeedback}
        isLoading={false}
        error={null}
      />
    );

    const dislikeButton = screen.getByRole('button', { name: /dislike/i });
    await userEvent.click(dislikeButton);

    expect(mockOnFeedback).toHaveBeenCalledWith('dislike');
    expect(dislikeButton).toBeDisabled();
  });

  test('disables feedback buttons after submission', async () => {
    render(
      <AnswerDisplay
        answer={mockAnswer}
        onFeedback={mockOnFeedback}
        isLoading={false}
        error={null}
      />
    );

    const likeButton = screen.getByRole('button', { name: /like/i });
    const dislikeButton = screen.getByRole('button', { name: /dislike/i });

    await userEvent.click(likeButton);

    expect(likeButton).toBeDisabled();
    expect(dislikeButton).toBeDisabled();
  });

  test('handles feedback error', async () => {
    const mockErrorFeedback = vi.fn().mockRejectedValue(new Error('Feedback error'));
    render(
      <AnswerDisplay
        answer={mockAnswer}
        onFeedback={mockErrorFeedback}
        isLoading={false}
        error={null}
      />
    );

    const likeButton = screen.getByRole('button', { name: /like/i });
    await userEvent.click(likeButton);

    await waitFor(() => {
      expect(screen.getByText(/feedback error/i)).toBeInTheDocument();
    });
    expect(likeButton).not.toBeDisabled();
  });

  test('shows no feedback buttons when answer is null', () => {
    render(
      <AnswerDisplay
        answer={null}
        onFeedback={mockOnFeedback}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.queryByRole('button', { name: /like/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dislike/i })).not.toBeInTheDocument();
  });

  test('shows confidence indicator only for high confidence answers', () => {
    const lowConfidenceAnswer = { ...mockAnswer, confidence: 0.3 };
    render(
      <AnswerDisplay
        answer={lowConfidenceAnswer}
        onFeedback={mockOnFeedback}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText(/low confidence/i)).toBeInTheDocument();
  });

  test('handles empty sources array', () => {
    const answerWithoutSources = { ...mockAnswer, sources: [] };
    render(
      <AnswerDisplay
        answer={answerWithoutSources}
        onFeedback={mockOnFeedback}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText(/no sources available/i)).toBeInTheDocument();
  });

  test('truncates long answers with show more/less functionality', async () => {
    const longAnswer = {
      ...mockAnswer,
      answer: 'A'.repeat(500) // Create a long answer
    };

    render(
      <AnswerDisplay
        answer={longAnswer}
        onFeedback={mockOnFeedback}
        isLoading={false}
        error={null}
      />
    );

    const showMoreButton = screen.getByRole('button', { name: /show more/i });
    expect(showMoreButton).toBeInTheDocument();

    await userEvent.click(showMoreButton);
    expect(screen.getByText(longAnswer.answer)).toBeInTheDocument();

    const showLessButton = screen.getByRole('button', { name: /show less/i });
    await userEvent.click(showLessButton);
    expect(screen.queryByText(longAnswer.answer)).not.toBeInTheDocument();
  });

  test('maintains feedback state between answer updates', () => {
    const { rerender } = render(
      <AnswerDisplay
        answer={mockAnswer}
        onFeedback={mockOnFeedback}
        isLoading={false}
        error={null}
      />
    );

    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);

    const newAnswer = { ...mockAnswer, answer: 'New answer' };
    rerender(
      <AnswerDisplay
        answer={newAnswer}
        onFeedback={mockOnFeedback}
        isLoading={false}
        error={null}
      />
    );

    expect(likeButton).toBeDisabled();
  });
}); 