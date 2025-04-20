import logger from './logger.js';

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