import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QuestionInput } from '../../qa/QuestionInput';

describe('QuestionInput', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input field and submit button', () => {
    render(<QuestionInput onSubmit={mockOnSubmit} isLoading={false} />);
    
    expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('disables submit button when input is empty', () => {
    render(<QuestionInput onSubmit={mockOnSubmit} isLoading={false} />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when input has text', async () => {
    render(<QuestionInput onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Ask a question...');
    await userEvent.type(input, 'test question');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onSubmit with input text when submitted', async () => {
    render(<QuestionInput onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Ask a question...');
    await userEvent.type(input, 'test question');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('test question');
  });

  it('clears input after successful submission', async () => {
    render(<QuestionInput onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Ask a question...') as HTMLInputElement;
    await userEvent.type(input, 'test question');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(input.value).toBe('');
  });

  it('disables input and button while loading', () => {
    render(<QuestionInput onSubmit={mockOnSubmit} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Ask a question...');
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('handles form submission on enter key', async () => {
    render(<QuestionInput onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Ask a question...');
    await userEvent.type(input, 'test question{enter}');
    
    expect(mockOnSubmit).toHaveBeenCalledWith('test question');
  });

  it('trims whitespace from input before submission', async () => {
    render(<QuestionInput onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Ask a question...');
    await userEvent.type(input, '  test question  ');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('test question');
  });
}); 