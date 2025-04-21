import os from 'os';
import logger from '../utils/logger.js';

/**
 * モニタリングサービス
 * リクエストメトリクスの収集と集計を行います
 */
class MonitoringService {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalDuration: 0,
      pathMetrics: new Map(),
      statusCodeCounts: new Map()
    };
  }

  /**
   * メトリクスを記録します
   * @param {string} path - リクエストパス
   * @param {number} duration - 処理時間(ms)
   * @param {number} statusCode - HTTPステータスコード
   * @param {Error} error - エラーオブジェクト(オプション)
   */
  recordMetrics(path, duration, statusCode, error = null) {
    // 全体のメトリクスを更新
    this.metrics.requestCount++;
    this.metrics.totalDuration += duration;
    if (error) {
      this.metrics.errorCount++;
    }

    // パスごとのメトリクスを更新
    if (!this.metrics.pathMetrics.has(path)) {
      this.metrics.pathMetrics.set(path, {
        count: 0,
        totalDuration: 0,
        errorCount: 0
      });
    }
    const pathMetric = this.metrics.pathMetrics.get(path);
    pathMetric.count++;
    pathMetric.totalDuration += duration;
    if (error) {
      pathMetric.errorCount++;
    }

    // ステータスコードの集計
    const currentCount = this.metrics.statusCodeCounts.get(statusCode) || 0;
    this.metrics.statusCodeCounts.set(statusCode, currentCount + 1);
  }

  /**
   * 現在のメトリクスを取得します
   * @returns {Object} メトリクス情報
   */
  getMetrics() {
    const avgDuration = this.metrics.requestCount > 0
      ? this.metrics.totalDuration / this.metrics.requestCount
      : 0;

    return {
      summary: {
        totalRequests: this.metrics.requestCount,
        totalErrors: this.metrics.errorCount,
        averageDuration: avgDuration
      },
      pathMetrics: Object.fromEntries(this.metrics.pathMetrics),
      statusCodes: Object.fromEntries(this.metrics.statusCodeCounts)
    };
  }

  /**
   * メトリクスをリセットします
   */
  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalDuration: 0,
      pathMetrics: new Map(),
      statusCodeCounts: new Map()
    };
  }

  getSystemMetrics() {
    return {
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: process.memoryUsage()
      },
      cpu: {
        load: os.loadavg(),
        cores: os.cpus().length
      },
      uptime: {
        system: os.uptime(),
        process: (Date.now() - this.startTime) / 1000
      }
    };
  }

  getApplicationMetrics() {
    return {
      requests: this.metrics.requestCount,
      errors: this.metrics.errorCount,
      errorRate: this.metrics.errorCount > 0
        ? (this.metrics.errorCount / this.metrics.requestCount) * 100
        : 0,
      averageExecutionTime: this.metrics.totalDuration / this.metrics.requestCount
    };
  }

  getAllMetrics() {
    return {
      timestamp: new Date().toISOString(),
      system: this.getSystemMetrics(),
      application: this.getApplicationMetrics()
    };
  }

  logMetrics() {
    const metrics = this.getAllMetrics();
    logger.info('System metrics', metrics);
    return metrics;
  }

  reset() {
    this.resetMetrics();
  }
}

export default new MonitoringService(); 