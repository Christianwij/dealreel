import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { QAService } from '../services/qaService';
import type { PerformanceMetrics as Metrics } from '../types/qa';

interface Props {
  briefingId: string;
  refreshInterval?: number;
}

const PerformanceMetrics: React.FC<Props> = ({ briefingId, refreshInterval = 30000 }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const qaService = new QAService();

  const fetchMetrics = async () => {
    try {
      const data = await qaService.getMetrics(briefingId);
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load metrics');
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [briefingId, refreshInterval]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, color: 'error.main' }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No metrics available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="h6">Response Time</Typography>
          <Typography>{metrics.averageResponseTime.toFixed(2)}ms avg</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="h6">Cache Performance</Typography>
          <Typography>{(metrics.cacheHitRate * 100).toFixed(1)}% hit rate</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="h6">Error Rate</Typography>
          <Typography>{(metrics.errorRate * 100).toFixed(1)}%</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="h6">Total Queries</Typography>
          <Typography>{metrics.totalQueries}</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="h6">Last Hour</Typography>
          <Typography>{metrics.lastHourQueries} queries</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="h6">Token Usage</Typography>
          <Typography>{metrics.tokenCount} tokens</Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceMetrics; 