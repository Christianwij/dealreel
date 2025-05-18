import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ConversationHistory } from '../../components/ConversationHistory';
import type { QAHistoryItem } from '../../types/qa';
import { vi, describe, test, expect, beforeEach } from 'vitest';

// Mock the Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Delete: () => <div data-testid="delete-icon">Delete</div>,
  ContentCopy: () => <div data-testid="copy-icon">Copy</div>
}));

describe('ConversationHistory', () => {
  const mockHistory: QAHistoryItem[] = [
    {
      id: '1',
      question: 'First test question',
      answer: 'First test answer',
      sources: ['Source 1'],
      confidence: 0.95,
      timestamp: '2024-01-20T10:00:00.000Z'
    },
    {
      id: '2',
      question: 'Second test question',
      answer: 'Second test answer',
      sources: ['Source 2'],
      confidence: 0.85,
      timestamp: '2024-01-20T10:01:00.000Z'
    }
  ];

  const mockOnDelete = vi.fn();
  const mockOnSelect = vi.fn();
  const mockOnFeedback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when history is empty', () => {
    render(
      <ConversationHistory 
        history={[]}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/no conversation history/i)).toBeInTheDocument();
  });

  it('renders conversation history items with correct formatting', () => {
    render(
      <ConversationHistory 
        history={mockHistory}
        onDelete={mockOnDelete}
      />
    );

    // Check questions and answers
    mockHistory.forEach(item => {
      expect(screen.getByText(item.question)).toBeInTheDocument();
      expect(screen.getByText(item.answer)).toBeInTheDocument();
    });

    // Check timestamps
    mockHistory.forEach(item => {
      const formattedTime = new Date(item.timestamp).toLocaleString();
      expect(screen.getByText(formattedTime)).toBeInTheDocument();
    });

    // Check sources and confidence
    mockHistory.forEach((item, index) => {
      const confidence = Math.round(item.confidence * 100);
      expect(screen.getByText(`${item.sources[0]} (${confidence}%)`)).toBeInTheDocument();
    });
  });

  it('calls onDelete with correct item when delete button is clicked', async () => {
    render(
      <ConversationHistory 
        history={mockHistory}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByTestId('delete-icon');
    await userEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockHistory[0].id);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect with correct item when history item is clicked', async () => {
    render(
      <ConversationHistory 
        history={mockHistory}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    const firstQuestion = screen.getByText(mockHistory[0].question);
    await userEvent.click(firstQuestion);

    expect(mockOnSelect).toHaveBeenCalledWith(mockHistory[0]);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('handles feedback actions correctly', async () => {
    render(
      <ConversationHistory 
        history={mockHistory}
        onDelete={mockOnDelete}
        onFeedback={mockOnFeedback}
      />
    );

    // Test like button
    const likeButton = screen.getByText('👍');
    await userEvent.click(likeButton);
    expect(mockOnFeedback).toHaveBeenCalledWith(mockHistory[0].id, 'like');

    // Test dislike button
    const dislikeButton = screen.getByText('👎');
    await userEvent.click(dislikeButton);
    expect(mockOnFeedback).toHaveBeenCalledWith(mockHistory[0].id, 'dislike');

    // Test report button
    const reportButton = screen.getByText('⚠️');
    await userEvent.click(reportButton);
    expect(mockOnFeedback).toHaveBeenCalledWith(mockHistory[0].id, 'report');
  });

  it('sorts history items by timestamp in descending order', () => {
    const unorderedHistory = [
      {
        id: '1',
        question: 'Old question',
        answer: 'Old answer',
        sources: ['Source'],
        confidence: 0.9,
        timestamp: '2024-01-19T10:00:00.000Z'
      },
      {
        id: '2',
        question: 'New question',
        answer: 'New answer',
        sources: ['Source'],
        confidence: 0.9,
        timestamp: '2024-01-20T10:00:00.000Z'
      }
    ];

    render(
      <ConversationHistory 
        history={unorderedHistory}
        onDelete={mockOnDelete}
      />
    );

    const questions = screen.getAllByText(/question/);
    expect(questions[0]).toHaveTextContent('New question');
    expect(questions[1]).toHaveTextContent('Old question');
  });

  it('handles long questions and answers gracefully', () => {
    const longHistory = [{
      id: '1',
      question: 'a'.repeat(500),
      answer: 'b'.repeat(1000),
      sources: ['Source'],
      confidence: 0.9,
      timestamp: '2024-01-20T10:00:00.000Z'
    }];

    render(
      <ConversationHistory 
        history={longHistory}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('a'.repeat(500))).toBeInTheDocument();
    expect(screen.getByText('b'.repeat(1000))).toBeInTheDocument();
  });
}); 