import logger from './logger.js';

export class AuditLogger {
  constructor() {
    this.logs = [];
  }

  log(action, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      ip: details.ip || 'unknown',
      userId: details.userId || 'anonymous'
    };

    this.logs.push(logEntry);
    logger.info('Audit log entry created', logEntry);

    // 古いログのクリーンアップ（1000件以上の場合）
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  getRecentLogs(limit = 100) {
    return this.logs.slice(-limit);
  }

  searchLogs(criteria) {
    return this.logs.filter(log => {
      return Object.entries(criteria).every(([key, value]) => {
        return log[key] === value;
      });
    });
  }

  // APIキーをマスク処理
  maskApiKey(apiKey) {
    if (!apiKey) return 'undefined';
    if (apiKey.length < 8) return '*'.repeat(apiKey.length);
    return apiKey.slice(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.slice(-4);
  }
}

export const auditLogger = (req, res, next) => {
  // リクエスト開始時刻を記録
  const startTime = Date.now();
  
  // レスポンス送信後のログ記録
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.get('x-request-id'),
      apiKey: maskApiKey(req.get('x-api-key')),
      timestamp: new Date().toISOString()
    });
  });

  next();
};

// APIキーをマスク
const maskApiKey = (apiKey) => {
  if (!apiKey) return null;
  if (apiKey.length <= 8) return '********';
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}; 