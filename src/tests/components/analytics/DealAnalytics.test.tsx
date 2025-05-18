import { render, screen } from '@testing-library/react';
import { DealAnalytics } from '../DealAnalytics';

const mockAnalyticsData = {
  statusDistribution: [
    { name: 'Completed', value: 10 },
    { name: 'Pending', value: 5 },
    { name: 'Processing', value: 3 }
  ],
  ratingDistribution: [
    { name: '1 Star', value: 2 },
    { name: '2 Stars', value: 3 },
    { name: '3 Stars', value: 5 },
    { name: '4 Stars', value: 7 },
    { name: '5 Stars', value: 4 }
  ],
  ratingTrend: [
    { name: 'Jan', value: 3.5 },
    { name: 'Feb', value: 4.0 },
    { name: 'Mar', value: 4.2 }
  ]
};

// Mock the recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ data }: { data: any[] }) => (
    <div data-testid="pie" data-items={data.length}>
      {data.map(item => item.name).join(', ')}
    </div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ dataKey }: { dataKey: string }) => (
    <div data-testid="bar" data-key={dataKey} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />
}));

describe('DealAnalytics', () => {
  it('renders all chart components', () => {
    render(<DealAnalytics data={mockAnalyticsData} />);

    // Check for chart containers
    expect(screen.getAllByTestId('responsive-container')).toHaveLength(3);
    
    // Check for pie chart
    const pieChart = screen.getByTestId('pie-chart');
    expect(pieChart).toBeInTheDocument();
    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-items', '3'); // 3 status items

    // Check for bar charts
    const barCharts = screen.getAllByTestId('bar-chart');
    expect(barCharts).toHaveLength(2); // Rating distribution and trend

    // Check for axes and tooltips
    expect(screen.getAllByTestId('x-axis')).toHaveLength(2);
    expect(screen.getAllByTestId('y-axis')).toHaveLength(2);
    expect(screen.getAllByTestId('tooltip')).toHaveLength(3);
    expect(screen.getAllByTestId('legend')).toHaveLength(3);
  });

  it('displays chart titles', () => {
    render(<DealAnalytics data={mockAnalyticsData} />);

    expect(screen.getByText(/deal status distribution/i)).toBeInTheDocument();
    expect(screen.getByText(/rating distribution/i)).toBeInTheDocument();
    expect(screen.getByText(/average rating trend/i)).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    const emptyData = {
      statusDistribution: [],
      ratingDistribution: [],
      ratingTrend: []
    };

    render(<DealAnalytics data={emptyData} />);

    // Should still render the chart containers
    expect(screen.getAllByTestId('responsive-container')).toHaveLength(3);
  });
}); 