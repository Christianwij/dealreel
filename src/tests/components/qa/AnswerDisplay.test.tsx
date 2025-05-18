import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnswerDisplay } from '../../qa/AnswerDisplay';
import type { QAResponse } from '../../../types/qa';

jest.mock('@mui/icons-material', () => ({
  ThumbUp: () => <div data-testid="thumb-up">ThumbUp</div>,
  ThumbDown: () => <div data-testid="thumb-down">ThumbDown</div>,
  Flag: () => <div data-testid="flag">Flag</div>
}));

describe('AnswerDisplay', () => {
  const mockAnswer: QAResponse = {
    answer: 'This is a test answer',
    sources: ['Source 1', 'Source 2'],
    confidence: 0.95,
    timestamp: new Date().toISOString()
  };

  const mockOnFeedback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders answer text and sources', () => {
    render(<AnswerDisplay answer={mockAnswer} onFeedback={mockOnFeedback} />);
    
    expect(screen.getByText(mockAnswer.answer)).toBeInTheDocument();
    mockAnswer.sources.forEach(source => {
      expect(screen.getByText(source)).toBeInTheDocument();
    });
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('renders feedback buttons', () => {
    render(<AnswerDisplay answer={mockAnswer} onFeedback={mockOnFeedback} />);
    
    expect(screen.getByTestId('thumb-up')).toBeInTheDocument();
    expect(screen.getByTestId('thumb-down')).toBeInTheDocument();
    expect(screen.getByTestId('flag')).toBeInTheDocument();
  });

  it('calls onFeedback with "like" when thumbs up is clicked', () => {
    render(<AnswerDisplay answer={mockAnswer} onFeedback={mockOnFeedback} />);
    
    const thumbUpButton = screen.getByTestId('thumb-up').closest('button');
    fireEvent.click(thumbUpButton!);
    
    expect(mockOnFeedback).toHaveBeenCalledWith('like');
  });

  it('calls onFeedback with "dislike" when thumbs down is clicked', () => {
    render(<AnswerDisplay answer={mockAnswer} onFeedback={mockOnFeedback} />);
    
    const thumbDownButton = screen.getByTestId('thumb-down').closest('button');
    fireEvent.click(thumbDownButton!);
    
    expect(mockOnFeedback).toHaveBeenCalledWith('dislike');
  });

  it('calls onFeedback with "report" when flag is clicked', () => {
    render(<AnswerDisplay answer={mockAnswer} onFeedback={mockOnFeedback} />);
    
    const flagButton = screen.getByTestId('flag').closest('button');
    fireEvent.click(flagButton!);
    
    expect(mockOnFeedback).toHaveBeenCalledWith('report');
  });

  it('disables feedback buttons after feedback is given', () => {
    render(<AnswerDisplay answer={mockAnswer} onFeedback={mockOnFeedback} />);
    
    const thumbUpButton = screen.getByTestId('thumb-up').closest('button');
    fireEvent.click(thumbUpButton!);
    
    expect(thumbUpButton).toBeDisabled();
    expect(screen.getByTestId('thumb-down').closest('button')).toBeDisabled();
    expect(screen.getByTestId('flag').closest('button')).toBeDisabled();
  });

  it('displays confidence scores as percentages', () => {
    render(<AnswerDisplay answer={mockAnswer} onFeedback={mockOnFeedback} />);
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('displays error message when answer has error', () => {
    const errorAnswer: QAResponse = {
      ...mockAnswer,
      error: 'Something went wrong'
    };

    render(<AnswerDisplay answer={errorAnswer} onFeedback={mockOnFeedback} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
}); 