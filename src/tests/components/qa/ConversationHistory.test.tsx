import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationHistory } from '../../qa/ConversationHistory';
import type { QAResponse } from '../../../types/qa';

// Mock the Material-UI icons
jest.mock('@mui/icons-material', () => ({
  Delete: () => <div data-testid="delete-icon">Delete</div>,
  ContentCopy: () => <div data-testid="copy-icon">Copy</div>
}));

// Mock the AnswerDisplay component
jest.mock('../../qa/AnswerDisplay', () => ({
  AnswerDisplay: ({ answer, onFeedback }: { answer: QAResponse; onFeedback: (type: string) => void }) => (
    <div data-testid="answer-display">
      <div>{answer.answer}</div>
      {answer.sources.map((source: string, index: number) => (
        <div key={index}>{source} ({Math.round(answer.confidence * 100)}%)</div>
      ))}
      <button onClick={() => onFeedback('like')}>Like</button>
      <button onClick={() => onFeedback('dislike')}>Dislike</button>
      <button onClick={() => onFeedback('report')}>Report</button>
    </div>
  )
}));

describe('ConversationHistory', () => {
  const mockQuestions = [
    {
      id: '1',
      text: 'First test question',
      timestamp: '2024-01-20T10:00:00.000Z',
      answer: {
        text: 'First test answer',
        sources: [{ text: 'Source 1', confidence: 0.95 }],
        timestamp: '2024-01-20T10:00:00.000Z'
      }
    },
    {
      id: '2',
      text: 'Second test question',
      timestamp: '2024-01-20T11:00:00.000Z',
      answer: {
        text: 'Second test answer',
        sources: [{ text: 'Source 2', confidence: 0.85 }],
        timestamp: '2024-01-20T11:00:00.000Z'
      }
    }
  ];

  const mockOnDelete = jest.fn();
  const mockOnCopy = jest.fn();
  const mockOnFeedback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no questions', () => {
    render(
      <ConversationHistory
        questions={[]}
        onDelete={mockOnDelete}
        onCopy={mockOnCopy}
        onFeedback={mockOnFeedback}
      />
    );

    expect(screen.getByText(/no questions asked yet/i)).toBeInTheDocument();
  });

  it('renders questions and answers', () => {
    render(
      <ConversationHistory
        questions={mockQuestions}
        onDelete={mockOnDelete}
        onCopy={mockOnCopy}
        onFeedback={mockOnFeedback}
      />
    );

    expect(screen.getByText('First test question')).toBeInTheDocument();
    expect(screen.getByText('First test answer')).toBeInTheDocument();
    expect(screen.getByText('Second test question')).toBeInTheDocument();
    expect(screen.getByText('Second test answer')).toBeInTheDocument();
  });

  it('handles delete action', () => {
    render(
      <ConversationHistory
        questions={mockQuestions}
        onDelete={mockOnDelete}
        onCopy={mockOnCopy}
        onFeedback={mockOnFeedback}
      />
    );

    const deleteButtons = screen.getAllByTestId('delete-icon');
    fireEvent.click(deleteButtons[0].parentElement!);

    expect(mockOnDelete).toHaveBeenCalledWith(mockQuestions[0].id);
  });

  it('handles copy action', () => {
    render(
      <ConversationHistory
        questions={mockQuestions}
        onDelete={mockOnDelete}
        onCopy={mockOnCopy}
        onFeedback={mockOnFeedback}
      />
    );

    const copyButtons = screen.getAllByTestId('copy-icon');
    fireEvent.click(copyButtons[0].parentElement!);

    expect(mockOnCopy).toHaveBeenCalledWith(mockQuestions[0].text);
  });

  it('handles feedback actions', () => {
    render(
      <ConversationHistory
        questions={mockQuestions}
        onDelete={mockOnDelete}
        onCopy={mockOnCopy}
        onFeedback={mockOnFeedback}
      />
    );

    const answerDisplays = screen.getAllByTestId('answer-display');
    
    // Find and click the Like button
    const likeButton = answerDisplays[0].querySelector('button:nth-child(1)');
    fireEvent.click(likeButton!);
    expect(mockOnFeedback).toHaveBeenCalledWith(mockQuestions[0].id, 'like');

    // Find and click the Dislike button
    const dislikeButton = answerDisplays[0].querySelector('button:nth-child(2)');
    fireEvent.click(dislikeButton!);
    expect(mockOnFeedback).toHaveBeenCalledWith(mockQuestions[0].id, 'dislike');

    // Find and click the Report button
    const reportButton = answerDisplays[0].querySelector('button:nth-child(3)');
    fireEvent.click(reportButton!);
    expect(mockOnFeedback).toHaveBeenCalledWith(mockQuestions[0].id, 'report');
  });

  it('displays timestamps in correct format', () => {
    render(
      <ConversationHistory
        questions={mockQuestions}
        onDelete={mockOnDelete}
        onCopy={mockOnCopy}
        onFeedback={mockOnFeedback}
      />
    );

    const timestamp1 = new Date('2024-01-20T10:00:00.000Z').toLocaleString();
    const timestamp2 = new Date('2024-01-20T11:00:00.000Z').toLocaleString();

    expect(screen.getByText(timestamp1)).toBeInTheDocument();
    expect(screen.getByText(timestamp2)).toBeInTheDocument();
  });

  it('displays source confidence percentages', () => {
    render(
      <ConversationHistory
        questions={mockQuestions}
        onDelete={mockOnDelete}
        onCopy={mockOnCopy}
        onFeedback={mockOnFeedback}
      />
    );

    expect(screen.getByText('Source 1 (95%)')).toBeInTheDocument();
    expect(screen.getByText('Source 2 (85%)')).toBeInTheDocument();
  });
}); 