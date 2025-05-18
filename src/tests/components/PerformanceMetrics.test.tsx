import React from 'react';
import { render, screen, act, waitFor, within } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PerformanceMetrics from '../../components/PerformanceMetrics';
import { QAService } from '../../services/qaService';
import { MockQAService } from '../mocks/qaService';
import type { PerformanceMetrics as Metrics } from '../../types/qa';

// Mock QAService
vi.mock('../../services/qaService', () => ({
  QAService: vi.fn().mockImplementation(() => MockQAService.createMockService())
}));

describe('PerformanceMetrics', () => {
  const mockMetrics = MockQAService.getMockMetrics();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('displays loading state initially', async () => {
    render(<PerformanceMetrics briefingId="test-123" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays metrics after loading', async () => {
    render(<PerformanceMetrics briefingId="test-123" />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check all metrics are displayed
    expect(screen.getByText('1.2s')).toBeInTheDocument(); // Response Time
    expect(screen.getByText('5,000')).toBeInTheDocument(); // Token Count
    expect(screen.getByText('75%')).toBeInTheDocument(); // Cache Hit Rate
    expect(screen.getByText('2%')).toBeInTheDocument(); // Error Rate
    expect(screen.getByText('150')).toBeInTheDocument(); // Question Count
    expect(screen.getByText('1.5s')).toBeInTheDocument(); // Average Response Time
    expect(screen.getByText('100')).toBeInTheDocument(); // Total Queries
    expect(screen.getByText('25')).toBeInTheDocument(); // Last Hour Queries
  });

  test('handles error state', async () => {
    const mockService = MockQAService.createMockService({
      getMetrics: vi.fn().mockRejectedValue(new Error('Failed to fetch metrics'))
    });
    vi.mocked(QAService).mockImplementation(() => mockService);

    render(<PerformanceMetrics briefingId="test-123" />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/error loading metrics/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('retries loading metrics on button click', async () => {
    const getMetricsMock = vi.fn()
      .mockRejectedValueOnce(new Error('Failed to fetch metrics'))
      .mockResolvedValueOnce(mockMetrics);

    const mockService = MockQAService.createMockService({
      getMetrics: getMetricsMock
    });
    vi.mocked(QAService).mockImplementation(() => mockService);

    render(<PerformanceMetrics briefingId="test-123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByText('1.2s')).toBeInTheDocument();
    });

    expect(getMetricsMock).toHaveBeenCalledTimes(2);
  });

  test('maintains accessibility standards', async () => {
    render(<PerformanceMetrics briefingId="test-123" />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check heading hierarchy
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);

    // Check metric grid accessibility
    const grid = screen.getByRole('grid', { name: /performance metrics/i });
    expect(grid).toBeInTheDocument();

    // Check individual metric cells
    const cells = within(grid).getAllByRole('gridcell');
    cells.forEach((cell: HTMLElement) => {
      expect(cell).toHaveAttribute('aria-label');
    });
  });

  test('updates metrics when briefingId changes', async () => {
    const getMetricsMock = vi.fn()
      .mockResolvedValueOnce(mockMetrics)
      .mockResolvedValueOnce({
        ...mockMetrics,
        responseTime: 2.0,
        questionCount: 200
      });

    const mockService = MockQAService.createMockService({
      getMetrics: getMetricsMock
    });
    vi.mocked(QAService).mockImplementation(() => mockService);

    const { rerender } = render(<PerformanceMetrics briefingId="test-123" />);

    await waitFor(() => {
      expect(screen.getByText('1.2s')).toBeInTheDocument();
    });

    rerender(<PerformanceMetrics briefingId="test-456" />);

    await waitFor(() => {
      expect(screen.getByText('2.0s')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    expect(getMetricsMock).toHaveBeenCalledWith('test-123');
    expect(getMetricsMock).toHaveBeenCalledWith('test-456');
  });

  test('respects custom refresh interval', async () => {
    const getMetricsMock = vi.fn()
      .mockResolvedValueOnce(mockMetrics)
      .mockResolvedValueOnce({
        ...mockMetrics,
        responseTime: 2.0,
        questionCount: 200
      });

    const mockService = MockQAService.createMockService({
      getMetrics: getMetricsMock
    });
    vi.mocked(QAService).mockImplementation(() => mockService);

    vi.useFakeTimers();
    render(<PerformanceMetrics briefingId="test-123" refreshInterval={5000} />);

    await waitFor(() => {
      expect(screen.getByText('1.2s')).toBeInTheDocument();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByText('2.0s')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  test('cleans up interval on unmount', async () => {
    const getMetricsMock = vi.fn().mockResolvedValue(mockMetrics);
    const mockService = MockQAService.createMockService({
      getMetrics: getMetricsMock
    });
    vi.mocked(QAService).mockImplementation(() => mockService);

    vi.useFakeTimers();
    const { unmount } = render(<PerformanceMetrics briefingId="test-123" refreshInterval={5000} />);

    await waitFor(() => {
      expect(screen.getByText('1.2s')).toBeInTheDocument();
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(getMetricsMock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  test('formats large numbers correctly', async () => {
    const largeNumberMetrics = {
      ...mockMetrics,
      tokenCount: 1000000,
      totalQueries: 1000000,
      lastHourQueries: 1000
    };

    const mockService = MockQAService.createMockService({
      getMetrics: vi.fn().mockResolvedValue(largeNumberMetrics)
    });
    vi.mocked(QAService).mockImplementation(() => mockService);

    render(<PerformanceMetrics briefingId="test-123" />);

    await waitFor(() => {
      expect(screen.getByText('1,000,000')).toBeInTheDocument(); // Token Count
      expect(screen.getByText('1,000,000')).toBeInTheDocument(); // Total Queries
      expect(screen.getByText('1,000')).toBeInTheDocument(); // Last Hour Queries
    });
  });

  test('handles zero values correctly', async () => {
    const zeroMetrics = {
      ...mockMetrics,
      responseTime: 0,
      tokenCount: 0,
      cacheHitRate: 0,
      errorRate: 0,
      questionCount: 0,
      averageResponseTime: 0,
      totalQueries: 0,
      lastHourQueries: 0
    };

    const mockService = MockQAService.createMockService({
      getMetrics: vi.fn().mockResolvedValue(zeroMetrics)
    });
    vi.mocked(QAService).mockImplementation(() => mockService);

    render(<PerformanceMetrics briefingId="test-123" />);

    await waitFor(() => {
      expect(screen.getByText('0s')).toBeInTheDocument(); // Response Time
      expect(screen.getByText('0')).toBeInTheDocument(); // Token Count
      expect(screen.getByText('0%')).toBeInTheDocument(); // Cache Hit Rate
      expect(screen.getByText('0%')).toBeInTheDocument(); // Error Rate
      expect(screen.getByText('0')).toBeInTheDocument(); // Question Count
      expect(screen.getByText('0s')).toBeInTheDocument(); // Average Response Time
    });
  });
}); 