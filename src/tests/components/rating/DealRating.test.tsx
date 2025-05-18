import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DealRating } from '../DealRating';
import { useSupabase } from '@/hooks/useSupabase';

// Mock the useSupabase hook
jest.mock('@/hooks/useSupabase', () => ({
  useSupabase: () => ({
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { rating: 4, comments: 'Test comment' },
              error: null
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    }
  })
}));

// Mock fetch for summary generation
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ summary: { content: 'Test summary' } })
  })
) as jest.Mock;

describe('DealRating', () => {
  const mockBriefingId = 'test-briefing-id';
  const mockOnRatingSubmit = jest.fn();
  const mockOnSummaryGenerate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the rating component with all controls', () => {
    render(
      <DealRating
        briefingId={mockBriefingId}
        onRatingSubmit={mockOnRatingSubmit}
        onSummaryGenerate={mockOnSummaryGenerate}
      />
    );

    expect(screen.getByText('Rate This Deal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share summary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export summary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view history/i })).toBeInTheDocument();
  });

  it('opens share dialog when share button is clicked', () => {
    render(
      <DealRating
        briefingId={mockBriefingId}
        onRatingSubmit={mockOnRatingSubmit}
        onSummaryGenerate={mockOnSummaryGenerate}
      />
    );

    const shareButton = screen.getByRole('button', { name: /share summary/i });
    fireEvent.click(shareButton);

    expect(screen.getByText('Share Summary')).toBeInTheDocument();
    expect(screen.getByText('Choose what information to include in the shared summary:')).toBeInTheDocument();
  });

  it('loads existing rating and summary data on mount', async () => {
    render(
      <DealRating
        briefingId={mockBriefingId}
        onRatingSubmit={mockOnRatingSubmit}
        onSummaryGenerate={mockOnSummaryGenerate}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test comment')).toBeInTheDocument();
    });
  });

  it('disables export button when no summary is available', () => {
    render(
      <DealRating
        briefingId={mockBriefingId}
        onRatingSubmit={mockOnRatingSubmit}
        onSummaryGenerate={mockOnSummaryGenerate}
      />
    );

    const exportButton = screen.getByRole('button', { name: /export summary/i });
    expect(exportButton).toBeDisabled();
  });

  it('enables export button when summary is available', async () => {
    render(
      <DealRating
        briefingId={mockBriefingId}
        onRatingSubmit={mockOnRatingSubmit}
        onSummaryGenerate={mockOnSummaryGenerate}
      />
    );

    // Generate summary
    const generateButton = screen.getByRole('button', { name: /generate summary/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export summary/i });
      expect(exportButton).not.toBeDisabled();
    });
  });
}); 