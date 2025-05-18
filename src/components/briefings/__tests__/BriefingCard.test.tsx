import { render, screen, fireEvent } from '@testing-library/react';
import { BriefingCard } from '../BriefingCard';
import type { Briefing } from '@/types/briefing';

const mockBriefing: Briefing = {
  id: '1',
  title: 'Test Briefing',
  status: 'completed',
  created_at: '2024-05-17T10:00:00Z',
  updated_at: '2024-05-17T11:00:00Z',
  document_id: 'doc-1',
  user_id: 'user-1',
  script: 'Test script content',
  video_url: 'https://example.com/video.mp4',
  documents: {
    title: 'Test Document',
    file_type: 'pdf'
  },
  metadata: {
    rating: 4,
    averageRating: 4
  }
};

describe('BriefingCard', () => {
  const mockOnView = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnRate = jest.fn();
  const mockOnDownload = jest.fn();

  beforeEach(() => {
    mockOnView.mockClear();
    mockOnDelete.mockClear();
    mockOnRate.mockClear();
    mockOnDownload.mockClear();
  });

  it('renders briefing information correctly', () => {
    render(
      <BriefingCard
        briefing={mockBriefing}
        onView={mockOnView}
        onDelete={mockOnDelete}
        onRate={mockOnRate}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('Test Briefing')).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText(/Average Rating:/i)).toBeInTheDocument();
    expect(screen.getByText('Test script content')).toBeInTheDocument();
  });

  it('calls onView when watch briefing button is clicked', () => {
    render(
      <BriefingCard
        briefing={mockBriefing}
        onView={mockOnView}
        onDelete={mockOnDelete}
        onRate={mockOnRate}
        onDownload={mockOnDownload}
      />
    );

    fireEvent.click(screen.getByText(/Watch Briefing/i));
    expect(mockOnView).toHaveBeenCalledWith(mockBriefing);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <BriefingCard
        briefing={mockBriefing}
        onView={mockOnView}
        onDelete={mockOnDelete}
        onRate={mockOnRate}
        onDownload={mockOnDownload}
      />
    );

    fireEvent.click(screen.getByText(/Delete/i));
    expect(mockOnDelete).toHaveBeenCalledWith(mockBriefing.id);
  });

  it('calls onDownload when download button is clicked', () => {
    render(
      <BriefingCard
        briefing={mockBriefing}
        onView={mockOnView}
        onDelete={mockOnDelete}
        onRate={mockOnRate}
        onDownload={mockOnDownload}
      />
    );

    fireEvent.click(screen.getByText(/Download/i));
    expect(mockOnDownload).toHaveBeenCalledWith(mockBriefing);
  });

  it('displays different status badges with correct colors', () => {
    const statuses = ['pending', 'processing', 'completed', 'failed'];
    
    statuses.forEach(status => {
      const briefing = { ...mockBriefing, status };
      const { rerender } = render(
        <BriefingCard
          briefing={briefing}
          onView={mockOnView}
          onDelete={mockOnDelete}
          onRate={mockOnRate}
          onDownload={mockOnDownload}
        />
      );

      const badge = screen.getByText(new RegExp(status, 'i'));
      expect(badge).toBeInTheDocument();
      
      // Clean up before next render
      rerender(<></>);
    });
  });

  it('formats dates correctly', () => {
    const briefing = {
      ...mockBriefing,
      created_at: '2024-01-01T12:00:00Z',
      updated_at: '2024-01-02T12:00:00Z',
    };

    render(
      <BriefingCard
        briefing={briefing}
        onView={mockOnView}
        onDelete={mockOnDelete}
        onRate={mockOnRate}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/January 1, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/Last updated: January 2, 2024/i)).toBeInTheDocument();
  });
}); 