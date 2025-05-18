import { Redis } from 'ioredis';

export interface PerformanceMetrics {
  responseTime: number;
  tokenCount: number;
  cacheHitRate: number;
  errorRate: number;
  questionCount: number;
  averageResponseTime: number;
  totalQueries: number;
  lastHourQueries: number;
}

export interface ErrorLog {
  timestamp: string;
  error: string;
  context: Record<string, any>;
}

export class PerformanceMonitor {
  private redis: Redis;
  private readonly METRICS_PREFIX = 'perf:';
  private readonly METRICS_TTL = 60 * 60 * 24 * 7; // 7 days
  private readonly ERROR_PREFIX = 'error:';
  private readonly MAX_ERROR_LOGS = 1000;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async recordResponseTime(briefingId: string, time: number): Promise<void> {
    const key = `${this.METRICS_PREFIX}response_times:${briefingId}`;
    await this.redis.lpush(key, time.toString());
    await this.redis.ltrim(key, 0, 999); // Keep last 1000 response times
    await this.redis.expire(key, this.METRICS_TTL);

    // Update average
    const avgKey = `${this.METRICS_PREFIX}avg_response_time:${briefingId}`;
    const times = await this.redis.lrange(key, 0, -1);
    const avg = times.reduce((sum, t) => sum + parseFloat(t), 0) / times.length;
    await this.redis.set(avgKey, avg.toString());
  }

  async recordTokenUsage(briefingId: string, count: number): Promise<void> {
    const key = `${this.METRICS_PREFIX}token_usage:${briefingId}`;
    const date = new Date().toISOString().split('T')[0];
    await this.redis.hincrby(key, date, count);
    await this.redis.expire(key, this.METRICS_TTL);
  }

  async recordQueryTime(duration: number): Promise<void> {
    const timestamp = Date.now();
    await this.redis.zadd(`${this.METRICS_PREFIX}query_times`, timestamp, duration.toString());
    // Keep only last 24 hours of data
    const cutoff = timestamp - (24 * 60 * 60 * 1000);
    await this.redis.zremrangebyscore(`${this.METRICS_PREFIX}query_times`, '-inf', cutoff);
  }

  async getMetrics(briefingId: string): Promise<PerformanceMetrics> {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    const [
      responseTimes,
      tokenUsage,
      cacheStats,
      errorLogs,
      questionCount,
      avgResponseTime,
      queryTimes
    ] = await Promise.all([
      this.redis.lrange(`${this.METRICS_PREFIX}response_times:${briefingId}`, 0, -1),
      this.getTokenUsage(briefingId),
      this.getCacheStats(),
      this.getErrorRate(),
      this.getQuestionCount(briefingId),
      this.redis.get(`${this.METRICS_PREFIX}avg_response_time:${briefingId}`),
      this.redis.zrangebyscore(
        `${this.METRICS_PREFIX}query_times`,
        hourAgo,
        now,
        'WITHSCORES'
      )
    ]);

    const times = queryTimes.filter((_, i) => i % 2 === 1).map(Number);
    const averageQueryTime = times.length > 0 
      ? times.reduce((a, b) => a + b, 0) / times.length 
      : 0;

    return {
      responseTime: responseTimes.length > 0 ? parseFloat(responseTimes[0]) : 0,
      tokenCount: tokenUsage,
      cacheHitRate: cacheStats,
      errorRate: errorLogs,
      questionCount: questionCount,
      averageResponseTime: avgResponseTime ? parseFloat(avgResponseTime) : 0,
      totalQueries: await this.redis.zcard(`${this.METRICS_PREFIX}query_times`),
      lastHourQueries: times.length
    };
  }

  private async getTokenUsage(briefingId: string): Promise<number> {
    const usage = await this.redis.get(`${this.METRICS_PREFIX}token_usage:${briefingId}`);
    return usage ? parseInt(usage, 10) : 0;
  }

  private async getCacheStats(): Promise<number> {
    const statsStr = await this.redis.get('qa:stats');
    if (statsStr) {
      const stats = JSON.parse(statsStr);
      return stats.ratio || 0;
    }
    return 0;
  }

  private async getErrorRate(): Promise<number> {
    const totalErrors = await this.redis.llen(`${this.ERROR_PREFIX}logs`);
    const totalQueries = await this.redis.zcard(`${this.METRICS_PREFIX}query_times`);
    return totalQueries > 0 ? totalErrors / totalQueries : 0;
  }

  private async getTotalRequests(): Promise<number> {
    const keys = await this.redis.keys(`${this.METRICS_PREFIX}response_times:*`);
    let total = 0;
    for (const key of keys) {
      total += await this.redis.llen(key);
    }
    return total;
  }

  private async getQuestionCount(briefingId: string): Promise<number> {
    const key = `qa:history:${briefingId}`;
    return await this.redis.llen(key);
  }

  async cleanup(): Promise<void> {
    const keys = await this.redis.keys(`${this.METRICS_PREFIX}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async getErrorLogs(limit = 100): Promise<Array<{
    message: string;
    timestamp: number;
  }>> {
    const logs = await this.redis.lrange(`${this.ERROR_PREFIX}logs`, 0, limit - 1);
    return logs.map(log => JSON.parse(log));
  }

  async logError(error: Error): Promise<void> {
    const errorLog = {
      message: error.message,
      timestamp: Date.now()
    };

    await this.redis.lpush(`${this.ERROR_PREFIX}logs`, JSON.stringify(errorLog));
    await this.redis.ltrim(`${this.ERROR_PREFIX}logs`, 0, this.MAX_ERROR_LOGS - 1);
  }
} 