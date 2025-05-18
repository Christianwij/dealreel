import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VideoMetricsDisplay } from '../VideoMetricsDisplay';
import type { VideoMetrics, PerformanceAlert } from '@/services/videoMetricsService';

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock data
const mockMetrics: VideoMetrics[] = [
  {
    jobId: 'job-1',
    startTime: Date.now() - 60000, // 1 minute ago
    endTime: Date.now(),
    duration: 60000, // 60 seconds
    stages: {
      avatar: {
        duration: 20000,
        retries: 0,
        success: true,
      },
      composition: {
        duration: 15000,
        memoryUsage: 600,
        cpuUsage: 60,
      },
      rendering: {
        duration: 25000,
        memoryUsage: 800,
        cpuUsage: 70,
        fps: 30,
      },
    },
    quality: {
      resolution: '1080p',
      bitrate: 5000000, // 5 Mbps
      fileSize: 150000000, // 150MB
    },
    errors: [],
  },
  {
    jobId: 'job-2',
    startTime: Date.now() - 90000, // 1.5 minutes ago
    endTime: Date.now() - 30000,
    duration: 90000, // 90 seconds
    stages: {
      avatar: {
        duration: 30000,
        retries: 1,
        success: true,
      },
      composition: {
        duration: 25000,
        memoryUsage: 650,
        cpuUsage: 65,
      },
      rendering: {
        duration: 35000,
        memoryUsage: 850,
        cpuUsage: 75,
        fps: 28,
      },
    },
    quality: {
      resolution: '720p',
      bitrate: 3000000, // 3 Mbps
      fileSize: 100000000, // 100MB
    },
    errors: [
      {
        stage: 'rendering',
        error: new Error('Memory limit exceeded'),
        timestamp: Date.now() - 60000,
      },
      {
        stage: 'rendering',
        error: new Error('Frame drop detected'),
        timestamp: Date.now() - 45000,
      },
    ],
  },
];

const mockAlerts: PerformanceAlert[] = [
  {
    jobId: 'job-1',
    type: 'high-memory',
    message: 'High memory usage detected: 800MB',
    value: 800,
    threshold: 750,
    timestamp: Date.now() - 30000,
  },
  {
    jobId: 'job-2',
    type: 'high-cpu',
    message: 'CPU throttling occurred: CPU usage at 75%',
    value: 75,
    threshold: 70,
    timestamp: Date.now() - 20000,
  },
  {
    jobId: 'job-2',
    type: 'slow-rendering',
    message: 'Low FPS warning: 28 FPS',
    value: 28,
    threshold: 30,
    timestamp: Date.now() - 10000,
  },
];

const mockAggregateMetrics = {
  totalJobs: 2,
  averageDuration: 75000, // 75 seconds
  errorRate: 0.1, // 10%
  averageMemoryUsage: 700,
  averageCpuUsage: 65,
  averageFps: 29,
};

describe('VideoMetricsDisplay', () => {
  it('renders aggregate statistics correctly', () => {
    render(
      <VideoMetricsDisplay
        metrics={mockMetrics}
        alerts={mockAlerts}
        aggregateMetrics={mockAggregateMetrics}
      />
    );

    // Check processing stats
    expect(screen.getByText('Total Jobs: 2')).toBeInTheDocument();
    expect(screen.getByText('Avg Duration: 75.0s')).toBeInTheDocument();
    expect(screen.getByText('Error Rate: 10.0%')).toBeInTheDocument();

    // Check resource usage stats
    expect(screen.getByText('Avg Memory: 700 MB')).toBeInTheDocument();
    expect(screen.getByText('Avg CPU: 65.0%')).toBeInTheDocument();
    expect(screen.getByText('Avg FPS: 29.0')).toBeInTheDocument();
  });

  it('displays recent alerts', () => {
    render(
      <VideoMetricsDisplay
        metrics={mockMetrics}
        alerts={mockAlerts}
        aggregateMetrics={mockAggregateMetrics}
      />
    );

    expect(screen.getByText('High memory usage detected: 800MB')).toBeInTheDocument();
    expect(screen.getByText('CPU throttling occurred: CPU usage at 75%')).toBeInTheDocument();
    expect(screen.getByText('Low FPS warning: 28 FPS')).toBeInTheDocument();
  });

  it('renders charts with correct structure', () => {
    render(
      <VideoMetricsDisplay
        metrics={mockMetrics}
        alerts={mockAlerts}
        aggregateMetrics={mockAggregateMetrics}
      />
    );

    // Check for chart containers
    const containers = screen.getAllByTestId('responsive-container');
    expect(containers).toHaveLength(2);

    // Check for chart components
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

    // Check for chart elements
    const lines = screen.getAllByTestId('line');
    expect(lines).toHaveLength(3); // Avatar, Composition, Rendering durations

    const bars = screen.getAllByTestId('bar');
    expect(bars).toHaveLength(3); // Memory, CPU, FPS

    // Check for common chart elements
    expect(screen.getAllByTestId('x-axis')).toHaveLength(2);
    expect(screen.getAllByTestId('y-axis')).toHaveLength(3); // 1 for line chart, 2 for bar chart
    expect(screen.getAllByTestId('cartesian-grid')).toHaveLength(2);
    expect(screen.getAllByTestId('tooltip')).toHaveLength(2);
    expect(screen.getAllByTestId('legend')).toHaveLength(2);
  });

  it('renders latest jobs table correctly', () => {
    render(
      <VideoMetricsDisplay
        metrics={mockMetrics}
        alerts={mockAlerts}
        aggregateMetrics={mockAggregateMetrics}
      />
    );

    // Check table headers
    expect(screen.getByText('Job ID')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();

    // Check job data
    expect(screen.getByText('job-1')).toBeInTheDocument();
    expect(screen.getByText('job-2')).toBeInTheDocument();
    expect(screen.getByText('60.0s')).toBeInTheDocument();
    expect(screen.getByText('90.0s')).toBeInTheDocument();
    expect(screen.getByText('1080p @ 5.0Mbps')).toBeInTheDocument();
    expect(screen.getByText('720p @ 3.0Mbps')).toBeInTheDocument();
    expect(screen.getByText('2 errors')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('handles empty metrics array', () => {
    render(
      <VideoMetricsDisplay
        metrics={[]}
        alerts={[]}
        aggregateMetrics={{
          totalJobs: 0,
          averageDuration: 0,
          errorRate: 0,
          averageMemoryUsage: 0,
          averageCpuUsage: 0,
          averageFps: 0,
        }}
      />
    );

    // Check that the component renders without crashing
    expect(screen.getByText('Video Generation Metrics')).toBeInTheDocument();
    expect(screen.getByText('Total Jobs: 0')).toBeInTheDocument();
    expect(screen.getByText('Avg Duration: 0.0s')).toBeInTheDocument();
    expect(screen.getByText('Error Rate: 0.0%')).toBeInTheDocument();
  });

  it('handles in-progress jobs', () => {
    const inProgressMetrics: VideoMetrics[] = [
      {
        ...mockMetrics[0],
        endTime: undefined,
        duration: undefined,
      },
    ];

    render(
      <VideoMetricsDisplay
        metrics={inProgressMetrics}
        alerts={mockAlerts}
        aggregateMetrics={mockAggregateMetrics}
      />
    );

    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('0.0s')).toBeInTheDocument();
  });
}); 