import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ConversationHistory } from '../ConversationHistory';
import type { QAHistoryItem, QAResponse } from '../../types/qa';

// Mock the Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Delete: () => <div data-testid="delete-icon">Delete</div>,
  ContentCopy: () => <div data-testid="copy-icon">Copy</div>
}));

// Mock the AnswerDisplay component
vi.mock('../qa/AnswerDisplay', () => ({
  default: ({ answer, onFeedback }: { answer: QAResponse; onFeedback: (type: 'like' | 'dislike' | 'report') => void }) => (
    <div data-testid="answer-display">
      <div>{answer.answer}</div>
      {answer.sources.map((source: string, index: number) => (
        <div key={index} data-testid="source-item">
          {source} ({Math.round(answer.confidence * 100)}%)
        </div>
      ))}
      <button onClick={() => onFeedback('like')} data-testid="like-button">Like</button>
      <button onClick={() => onFeedback('dislike')} data-testid="dislike-button">Dislike</button>
      <button onClick={() => onFeedback('report')} data-testid="report-button">Report</button>
    </div>
  )
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when history is empty', () => {
    render(
      <ConversationHistory 
        history={[]}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/no conversation history/i)).toBeInTheDocument();
  });

  it('renders conversation history items with correct formatting', () => {
    render(
      <ConversationHistory 
        history={mockHistory}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
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
    const sourceItems = screen.getAllByTestId('source-item');
    expect(sourceItems).toHaveLength(mockHistory.length);
    sourceItems.forEach((item, index) => {
      const confidence = Math.round(mockHistory[index].confidence * 100);
      expect(item).toHaveTextContent(`${mockHistory[index].sources[0]} (${confidence}%)`);
    });
  });

  it('calls onDelete with correct item when delete button is clicked', async () => {
    render(
      <ConversationHistory 
        history={mockHistory}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
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
    const mockOnFeedback = vi.fn();
    
    render(
      <ConversationHistory 
        history={mockHistory}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onFeedback={mockOnFeedback}
      />
    );

    // Test like button
    const likeButton = screen.getAllByTestId('like-button')[0];
    await userEvent.click(likeButton);
    expect(mockOnFeedback).toHaveBeenCalledWith(mockHistory[0].id, 'like');

    // Test dislike button
    const dislikeButton = screen.getAllByTestId('dislike-button')[0];
    await userEvent.click(dislikeButton);
    expect(mockOnFeedback).toHaveBeenCalledWith(mockHistory[0].id, 'dislike');

    // Test report button
    const reportButton = screen.getAllByTestId('report-button')[0];
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
        onSelect={mockOnSelect}
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
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('a'.repeat(500))).toBeInTheDocument();
    expect(screen.getByText('b'.repeat(1000))).toBeInTheDocument();
  });
}); 