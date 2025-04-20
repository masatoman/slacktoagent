import session from 'express-session';
import { SESSION_CONFIG, initializeSessionStore } from '../config/session.js';
import logger from './logger.js';

class SessionManager {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      const storeInitialized = await initializeSessionStore();
      if (!storeInitialized) {
        throw new Error('セッションストアの初期化に失敗しました');
      }

      this.middleware = session(SESSION_CONFIG);
      this.initialized = true;
      logger.info('セッション管理を初期化しました');
      return true;
    } catch (error) {
      logger.error('セッション管理の初期化に失敗:', error);
      return false;
    }
  }

  getMiddleware() {
    if (!this.initialized) {
      throw new Error('セッション管理が初期化されていません');
    }
    return this.middleware;
  }

  // セッションの作成
  createSession(req, userData) {
    if (!req.session) {
      throw new Error('セッションが利用できません');
    }

    req.session.user = userData;
    req.session.createdAt = Date.now();
    logger.info('セッションを作成しました', { userId: userData.id });
  }

  // セッションの検証
  validateSession(req) {
    if (!req.session || !req.session.user) {
      return false;
    }

    const sessionAge = Date.now() - req.session.createdAt;
    return sessionAge < SESSION_CONFIG.cookie.maxAge;
  }

  // セッションの破棄
  destroySession(req) {
    return new Promise((resolve, reject) => {
      if (!req.session) {
        resolve();
        return;
      }

      req.session.destroy(err => {
        if (err) {
          logger.error('セッション破棄エラー:', err);
          reject(err);
          return;
        }
        logger.info('セッションを破棄しました');
        resolve();
      });
    });
  }
}

export default new SessionManager(); 