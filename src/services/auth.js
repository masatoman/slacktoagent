import { SERVER_CONFIG, RESPONSE_MESSAGES } from '../config/server.js';
import logger from './logger.js';

// 権限レベルの定義
export const PERMISSION_LEVELS = {
  READ: 'read',
  EXECUTE: 'execute',
  ADMIN: 'admin'
};

// APIキーと権限のマッピング
const API_KEY_PERMISSIONS = new Map([
  [process.env.API_KEY, [PERMISSION_LEVELS.READ, PERMISSION_LEVELS.EXECUTE]],
  [process.env.ADMIN_API_KEY, [PERMISSION_LEVELS.READ, PERMISSION_LEVELS.EXECUTE, PERMISSION_LEVELS.ADMIN]]
]);

// APIキーの検証
export const validateApiKey = (req, res, next) => {
  const apiKey = req.header(SERVER_CONFIG.auth.apiKeyHeader);

  if (!apiKey || !API_KEY_PERMISSIONS.has(apiKey)) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      path: req.path
    });

    return res.status(401).json({
      ...RESPONSE_MESSAGES.AUTH_ERROR,
      message: 'Invalid API key'
    });
  }

  // APIキーに関連付けられた権限をリクエストオブジェクトに追加
  req.permissions = API_KEY_PERMISSIONS.get(apiKey);
  next();
};

// 特定の権限が必要なエンドポイントの保護
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.permissions || !req.permissions.includes(permission)) {
      logger.warn('Insufficient permissions', {
        ip: req.ip,
        path: req.path,
        requiredPermission: permission
      });

      return res.status(403).json({
        ...RESPONSE_MESSAGES.AUTH_ERROR,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
}; 