import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger.js';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

class MetricsService {
  constructor() {
    this.metricsBuffer = [];
    this.flushInterval = 5000; // 5 seconds
    this.startPeriodicFlush();
  }

  startPeriodicFlush() {
    setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);
  }

  async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      await this.persistMetrics(metrics);
    } catch (error) {
      logger.error('Error flushing metrics:', error);
      // Re-add metrics to buffer on failure
      this.metricsBuffer.unshift(...metrics);
    }
  }

  async persistMetrics(metrics) {
    const grouped = this.groupMetricsByType(metrics);
    
    for (const [type, data] of Object.entries(grouped)) {
      await this.processMetricType(type, data);
    }
  }

  groupMetricsByType(metrics) {
    return metrics.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = [];
      }
      acc[metric.type].push(metric);
      return acc;
    }, {});
  }

  async processMetricType(type, metrics) {
    switch (type) {
      case 'lead_response':
        await this.processLeadResponseMetrics(metrics);
        break;
      case 'conversion':
        await this.processConversionMetrics(metrics);
        break;
      case 'api_performance':
        await this.processApiMetrics(metrics);
        break;
      case 'queue_performance':
        await this.processQueueMetrics(metrics);
        break;
      default:
        logger.warn(`Unknown metric type: ${type}`);
    }
  }

  // Track lead response time
  async trackLeadResponse(leadId, responseTime) {
    this.metricsBuffer.push({
      type: 'lead_response',
      leadId,
      responseTime,
      timestamp: new Date()
    });

    // Update real-time average
    await this.updateRealTimeAverage('response_time', responseTime);
  }

  // Track conversion events
  async trackConversion(leadId, stage, success = true) {
    this.metricsBuffer.push({
      type: 'conversion',
      leadId,
      stage,
      success,
      timestamp: new Date()
    });

    // Update conversion funnel
    await this.updateConversionFunnel(stage, success);
  }

  // Track API performance
  async trackApiCall(endpoint, method, responseTime, statusCode) {
    this.metricsBuffer.push({
      type: 'api_performance',
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: new Date()
    });

    // Update endpoint statistics
    const key = `api:${method}:${endpoint}`;
    await redis.hincrby(key, 'count', 1);
    await redis.hincrby(key, 'total_time', responseTime);
    
    if (statusCode >= 400) {
      await redis.hincrby(key, 'errors', 1);
    }
  }

  // Track queue performance
  async trackQueueJob(queueName, jobType, processingTime, success = true) {
    this.metricsBuffer.push({
      type: 'queue_performance',
      queueName,
      jobType,
      processingTime,
      success,
      timestamp: new Date()
    });
  }

  // Process lead response metrics
  async processLeadResponseMetrics(metrics) {
    for (const metric of metrics) {
      await prisma.leadMetric.create({
        data: {
          leadId: metric.leadId,
          metricType: 'RESPONSE_TIME',
          value: metric.responseTime,
          timestamp: metric.timestamp
        }
      });
    }

    // Update aggregated stats
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    await this.updateDashboardMetric('avg_response_time', avgResponseTime);
  }

  // Process conversion metrics
  async processConversionMetrics(metrics) {
    const conversionsByStage = {};
    
    for (const metric of metrics) {
      if (!conversionsByStage[metric.stage]) {
        conversionsByStage[metric.stage] = { success: 0, total: 0 };
      }
      
      conversionsByStage[metric.stage].total++;
      if (metric.success) {
        conversionsByStage[metric.stage].success++;
      }
    }

    // Store conversion rates
    for (const [stage, data] of Object.entries(conversionsByStage)) {
      const rate = (data.success / data.total) * 100;
      await this.updateDashboardMetric(`conversion_rate_${stage}`, rate);
    }
  }

  // Process API metrics
  async processApiMetrics(metrics) {
    const endpointStats = {};
    
    for (const metric of metrics) {
      const key = `${metric.method}:${metric.endpoint}`;
      if (!endpointStats[key]) {
        endpointStats[key] = {
          count: 0,
          totalTime: 0,
          errors: 0,
          p95: [],
          p99: []
        };
      }
      
      endpointStats[key].count++;
      endpointStats[key].totalTime += metric.responseTime;
      endpointStats[key].p95.push(metric.responseTime);
      endpointStats[key].p99.push(metric.responseTime);
      
      if (metric.statusCode >= 400) {
        endpointStats[key].errors++;
      }
    }

    // Calculate and store percentiles
    for (const [endpoint, stats] of Object.entries(endpointStats)) {
      const avgTime = stats.totalTime / stats.count;
      const errorRate = (stats.errors / stats.count) * 100;
      const p95 = this.calculatePercentile(stats.p95, 95);
      const p99 = this.calculatePercentile(stats.p99, 99);
      
      await prisma.apiMetric.create({
        data: {
          endpoint,
          avgResponseTime: avgTime,
          p95ResponseTime: p95,
          p99ResponseTime: p99,
          errorRate,
          requestCount: stats.count,
          timestamp: new Date()
        }
      });
    }
  }

  // Process queue metrics
  async processQueueMetrics(metrics) {
    const queueStats = {};
    
    for (const metric of metrics) {
      const key = `${metric.queueName}:${metric.jobType}`;
      if (!queueStats[key]) {
        queueStats[key] = {
          count: 0,
          totalTime: 0,
          failures: 0
        };
      }
      
      queueStats[key].count++;
      queueStats[key].totalTime += metric.processingTime;
      if (!metric.success) {
        queueStats[key].failures++;
      }
    }

    // Store queue performance data
    for (const [key, stats] of Object.entries(queueStats)) {
      const [queueName, jobType] = key.split(':');
      const avgProcessingTime = stats.totalTime / stats.count;
      const failureRate = (stats.failures / stats.count) * 100;
      
      await redis.hset(`queue:stats:${queueName}`, {
        [`${jobType}:avg_time`]: avgProcessingTime,
        [`${jobType}:failure_rate`]: failureRate,
        [`${jobType}:processed`]: stats.count
      });
    }
  }

  // Real-time metrics
  async updateRealTimeAverage(metric, value) {
    const key = `realtime:${metric}`;
    const timestamp = Date.now();
    
    // Add to sorted set with timestamp as score
    await redis.zadd(key, timestamp, `${value}:${timestamp}`);
    
    // Remove old entries (keep last hour)
    const oneHourAgo = timestamp - (60 * 60 * 1000);
    await redis.zremrangebyscore(key, '-inf', oneHourAgo);
    
    // Calculate current average
    const values = await redis.zrange(key, 0, -1);
    const sum = values.reduce((acc, val) => {
      const [value] = val.split(':');
      return acc + parseFloat(value);
    }, 0);
    
    const average = values.length > 0 ? sum / values.length : 0;
    await redis.set(`${key}:avg`, average);
  }

  // Conversion funnel tracking
  async updateConversionFunnel(stage, success) {
    const date = new Date().toISOString().split('T')[0];
    const key = `funnel:${date}:${stage}`;
    
    await redis.hincrby(key, 'total', 1);
    if (success) {
      await redis.hincrby(key, 'converted', 1);
    }
    
    await redis.expire(key, 7 * 24 * 60 * 60); // 7 days
  }

  // Dashboard metrics
  async updateDashboardMetric(metric, value) {
    await redis.hset('dashboard:metrics', metric, value);
    await redis.hset('dashboard:metrics:updated', metric, Date.now());
  }

  // Get current metrics
  async getCurrentMetrics() {
    const metrics = await redis.hgetall('dashboard:metrics');
    const updated = await redis.hgetall('dashboard:metrics:updated');
    
    return Object.entries(metrics).map(([key, value]) => ({
      metric: key,
      value: parseFloat(value),
      lastUpdated: updated[key] ? new Date(parseInt(updated[key])) : null
    }));
  }

  // Calculate percentile
  calculatePercentile(values, percentile) {
    values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[index];
  }

  // Health check metrics
  async getHealthMetrics() {
    const [dbHealth, redisHealth, queueHealth] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkQueueHealth()
    ]);

    return {
      database: dbHealth,
      redis: redisHealth,
      queue: queueHealth,
      timestamp: new Date()
    };
  }

  async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkRedisHealth() {
    try {
      const start = Date.now();
      await redis.ping();
      const latency = Date.now() - start;
      
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkQueueHealth() {
    try {
      const queues = ['lead-queue', 'email-queue', 'notification-queue'];
      const health = {};
      
      for (const queue of queues) {
        const waiting = await redis.llen(`bull:${queue}:wait`);
        const active = await redis.llen(`bull:${queue}:active`);
        const failed = await redis.llen(`bull:${queue}:failed`);
        
        health[queue] = { waiting, active, failed };
      }
      
      return { status: 'healthy', queues: health };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default new MetricsService();