import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButton } from '../ExportButton';
import { exportSummary } from '../../../services/exportService';

jest.mock('../../../services/exportService');

describe('ExportButton', () => {
  const mockExportSummary = exportSummary as jest.Mock;

  beforeEach(() => {
    mockExportSummary.mockClear();
    mockExportSummary.mockResolvedValue(undefined);
  });

  it('renders export button', () => {
    render(<ExportButton briefingId="123" />);
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('opens dialog when clicked', () => {
    render(<ExportButton briefingId="123" />);
    fireEvent.click(screen.getByText('Export'));
    expect(screen.getByText('Export Deal Summary')).toBeInTheDocument();
  });

  it('handles format selection', () => {
    render(<ExportButton briefingId="123" />);
    fireEvent.click(screen.getByText('Export'));
    
    const pdfRadio = screen.getByLabelText('PDF Document');
    const docxRadio = screen.getByLabelText('Word Document');
    const xlsxRadio = screen.getByLabelText('Excel Spreadsheet');

    expect(pdfRadio).toBeChecked();
    
    fireEvent.click(docxRadio);
    expect(docxRadio).toBeChecked();
    expect(pdfRadio).not.toBeChecked();

    fireEvent.click(xlsxRadio);
    expect(xlsxRadio).toBeChecked();
    expect(docxRadio).not.toBeChecked();
  });

  it('handles content selection', () => {
    render(<ExportButton briefingId="123" />);
    fireEvent.click(screen.getByText('Export'));
    
    const ratingCheckbox = screen.getByLabelText('Rating');
    const feedbackCheckbox = screen.getByLabelText('Feedback');
    const historyCheckbox = screen.getByLabelText('Question History');

    expect(ratingCheckbox).toBeChecked();
    expect(feedbackCheckbox).toBeChecked();
    expect(historyCheckbox).toBeChecked();

    fireEvent.click(ratingCheckbox);
    expect(ratingCheckbox).not.toBeChecked();
    expect(feedbackCheckbox).toBeChecked();
    expect(historyCheckbox).toBeChecked();
  });

  it('disables export when no content is selected', () => {
    render(<ExportButton briefingId="123" />);
    fireEvent.click(screen.getByText('Export'));
    
    const exportButton = screen.getByRole('button', { name: 'Export' });
    const ratingCheckbox = screen.getByLabelText('Rating');
    const feedbackCheckbox = screen.getByLabelText('Feedback');
    const historyCheckbox = screen.getByLabelText('Question History');

    fireEvent.click(ratingCheckbox);
    fireEvent.click(feedbackCheckbox);
    fireEvent.click(historyCheckbox);

    expect(exportButton).toBeDisabled();
  });

  it('exports summary with selected options', async () => {
    render(<ExportButton briefingId="123" />);
    fireEvent.click(screen.getByText('Export'));

    // Select PDF format and all content types
    const pdfRadio = screen.getByLabelText('PDF Document');
    const ratingCheckbox = screen.getByLabelText('Rating');
    const feedbackCheckbox = screen.getByLabelText('Feedback');
    const historyCheckbox = screen.getByLabelText('Question History');

    fireEvent.click(pdfRadio);
    fireEvent.click(ratingCheckbox);
    fireEvent.click(feedbackCheckbox);
    fireEvent.click(historyCheckbox);

    // Click export
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    await waitFor(() => {
      expect(mockExportSummary).toHaveBeenCalledWith({
        briefingId: '123',
        format: 'pdf',
        includeRating: true,
        includeFeedback: true,
        includeHistory: true
      });
    });

    // Dialog should close after successful export
    expect(screen.queryByText('Export Deal Summary')).not.toBeInTheDocument();
  });

  it('handles export errors', async () => {
    mockExportSummary.mockRejectedValueOnce(new Error('Export failed'));

    render(<ExportButton briefingId="123" />);
    fireEvent.click(screen.getByText('Export'));
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });

    // Dialog should stay open on error
    expect(screen.getByText('Export Deal Summary')).toBeInTheDocument();
  });

  it('disables export button when disabled prop is true', () => {
    render(<ExportButton briefingId="123" disabled />);
    expect(screen.getByText('Export')).toBeDisabled();
  });
}); 