import { SERVER_CONFIG, RESPONSE_MESSAGES } from '../config/server.js';
import logger from './logger.js';
import { PERMISSION_LEVELS, API_KEY_PERMISSIONS } from '../config/permissions.js';

// APIキーの検証
export const validateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');

  if (!apiKey || !API_KEY_PERMISSIONS.has(apiKey)) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      path: req.path
    });

    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }

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
        success: false,
        error: 'Insufficient permissions'
      });
    }
    next();
  };
}; 