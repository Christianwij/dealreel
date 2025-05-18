import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareDialog } from '../ShareDialog';
import { SummaryService } from '@/services/summaryService';

jest.mock('@/services/summaryService');

describe('ShareDialog', () => {
  const mockBriefingId = 'test-briefing-id';
  const mockShareUrl = 'https://example.com/share/123';
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn()
      }
    });
  });

  it('renders correctly when open', () => {
    render(
      <ShareDialog
        open={true}
        onClose={mockOnClose}
        briefingId={mockBriefingId}
      />
    );

    expect(screen.getByText('Share Summary')).toBeInTheDocument();
    expect(screen.getByText('Choose what to include:')).toBeInTheDocument();
    expect(screen.getByLabelText('Rating')).toBeChecked();
    expect(screen.getByLabelText('Comments')).toBeChecked();
    expect(screen.getByLabelText('Summary')).toBeChecked();
  });

  it('handles option changes correctly', () => {
    render(
      <ShareDialog
        open={true}
        onClose={mockOnClose}
        briefingId={mockBriefingId}
      />
    );

    const ratingCheckbox = screen.getByLabelText('Rating');
    fireEvent.click(ratingCheckbox);
    expect(ratingCheckbox).not.toBeChecked();
  });

  it('handles expiry time changes', () => {
    render(
      <ShareDialog
        open={true}
        onClose={mockOnClose}
        briefingId={mockBriefingId}
      />
    );

    const expiryInput = screen.getByLabelText('Link expires in (hours)');
    fireEvent.change(expiryInput, { target: { value: '48' } });
    expect(expiryInput).toHaveValue(48);
  });

  it('generates share link successfully', async () => {
    const mockShareSummary = jest.fn().mockResolvedValue({
      shareUrl: mockShareUrl,
      expiresAt: '2024-03-22T00:00:00Z'
    });

    (SummaryService as jest.Mock).mockImplementation(() => ({
      shareSummary: mockShareSummary
    }));

    render(
      <ShareDialog
        open={true}
        onClose={mockOnClose}
        briefingId={mockBriefingId}
      />
    );

    const generateButton = screen.getByText('Generate Link');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Share Link:')).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockShareUrl)).toBeInTheDocument();
    });

    expect(mockShareSummary).toHaveBeenCalledWith(
      mockBriefingId,
      expect.objectContaining({
        includeRating: true,
        includeComments: true,
        includeSummary: true,
        expiresIn: 24
      })
    );
  });

  it('handles share link generation error', async () => {
    const mockError = 'Failed to create share link';
    const mockShareSummary = jest.fn().mockRejectedValue(new Error(mockError));

    (SummaryService as jest.Mock).mockImplementation(() => ({
      shareSummary: mockShareSummary
    }));

    render(
      <ShareDialog
        open={true}
        onClose={mockOnClose}
        briefingId={mockBriefingId}
      />
    );

    const generateButton = screen.getByText('Generate Link');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(mockError)).toBeInTheDocument();
    });
  });

  it('copies share link to clipboard', async () => {
    const mockShareSummary = jest.fn().mockResolvedValue({
      shareUrl: mockShareUrl,
      expiresAt: '2024-03-22T00:00:00Z'
    });

    (SummaryService as jest.Mock).mockImplementation(() => ({
      shareSummary: mockShareSummary
    }));

    render(
      <ShareDialog
        open={true}
        onClose={mockOnClose}
        briefingId={mockBriefingId}
      />
    );

    // Generate the share link
    const generateButton = screen.getByText('Generate Link');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue(mockShareUrl)).toBeInTheDocument();
    });

    // Click the copy button
    const copyButton = screen.getByLabelText('Copy link');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockShareUrl);
    await waitFor(() => {
      expect(screen.getByText('Link copied to clipboard')).toBeInTheDocument();
    });
  });

  it('disables generate button when no options are selected', () => {
    render(
      <ShareDialog
        open={true}
        onClose={mockOnClose}
        briefingId={mockBriefingId}
      />
    );

    // Uncheck all options
    fireEvent.click(screen.getByLabelText('Rating'));
    fireEvent.click(screen.getByLabelText('Comments'));
    fireEvent.click(screen.getByLabelText('Summary'));

    const generateButton = screen.getByText('Generate Link');
    expect(generateButton).toBeDisabled();
  });
}); 