import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import type { VideoMetrics, PerformanceAlert } from '../services/videoMetricsService';

interface Props {
  metrics: VideoMetrics[];
  alerts: PerformanceAlert[];
  aggregateMetrics: {
    totalJobs: number;
    averageDuration: number;
    errorRate: number;
    averageMemoryUsage: number;
    averageCpuUsage: number;
    averageFps: number;
  };
}

export const VideoMetricsDisplay: React.FC<Props> = ({
  metrics,
  alerts,
  aggregateMetrics,
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [resourceData, setResourceData] = useState<any[]>([]);

  useEffect(() => {
    // Transform metrics for timeline chart
    const timelineData = metrics.map(m => ({
      jobId: m.jobId,
      timestamp: new Date(m.startTime).toLocaleTimeString(),
      avatarDuration: m.stages.avatar.duration / 1000, // Convert to seconds
      compositionDuration: m.stages.composition.duration / 1000,
      renderingDuration: m.stages.rendering.duration / 1000,
      totalDuration: (m.duration || 0) / 1000,
    }));
    setChartData(timelineData);

    // Transform metrics for resource usage chart
    const resourceUsageData = metrics.map(m => ({
      jobId: m.jobId,
      memoryUsage: m.stages.rendering.memoryUsage,
      cpuUsage: m.stages.rendering.cpuUsage,
      fps: m.stages.rendering.fps,
    }));
    setResourceData(resourceUsageData);
  }, [metrics]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Video Generation Metrics</h2>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Processing Stats</h3>
          <p>Total Jobs: {aggregateMetrics.totalJobs}</p>
          <p>Avg Duration: {(aggregateMetrics.averageDuration / 1000).toFixed(1)}s</p>
          <p>Error Rate: {(aggregateMetrics.errorRate * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Resource Usage</h3>
          <p>Avg Memory: {aggregateMetrics.averageMemoryUsage.toFixed(0)} MB</p>
          <p>Avg CPU: {aggregateMetrics.averageCpuUsage.toFixed(1)}%</p>
          <p>Avg FPS: {aggregateMetrics.averageFps.toFixed(1)}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Recent Alerts</h3>
          <div className="max-h-24 overflow-y-auto">
            {alerts.slice(-3).map((alert, i) => (
              <div key={i} className="text-sm mb-1 text-yellow-700">
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Processing Timeline Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Processing Timeline</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis label={{ value: 'Duration (s)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avatarDuration"
                name="Avatar Generation"
                stroke="#8884d8"
              />
              <Line
                type="monotone"
                dataKey="compositionDuration"
                name="Composition"
                stroke="#82ca9d"
              />
              <Line
                type="monotone"
                dataKey="renderingDuration"
                name="Rendering"
                stroke="#ffc658"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resource Usage Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Resource Usage by Job</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resourceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="jobId" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="memoryUsage"
                name="Memory Usage (MB)"
                fill="#8884d8"
              />
              <Bar
                yAxisId="left"
                dataKey="cpuUsage"
                name="CPU Usage (%)"
                fill="#82ca9d"
              />
              <Bar
                yAxisId="right"
                dataKey="fps"
                name="FPS"
                fill="#ffc658"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latest Jobs Table */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Latest Jobs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Job ID</th>
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">Duration</th>
                <th className="px-4 py-2 border-b">Quality</th>
                <th className="px-4 py-2 border-b">Errors</th>
              </tr>
            </thead>
            <tbody>
              {metrics.slice(-5).map(m => (
                <tr key={m.jobId}>
                  <td className="px-4 py-2 border-b">{m.jobId}</td>
                  <td className="px-4 py-2 border-b">
                    {m.endTime ? 'Completed' : 'In Progress'}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {((m.duration || 0) / 1000).toFixed(1)}s
                  </td>
                  <td className="px-4 py-2 border-b">
                    {m.quality.resolution} @ {(m.quality.bitrate / 1000000).toFixed(1)}Mbps
                  </td>
                  <td className="px-4 py-2 border-b">
                    {m.errors.length > 0 ? (
                      <span className="text-red-500">{m.errors.length} errors</span>
                    ) : (
                      <span className="text-green-500">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 