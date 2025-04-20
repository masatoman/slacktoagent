import { createClient } from 'redis';
import session from 'express-session';
import { RedisStore } from 'connect-redis';

export const SESSION_CONFIG = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  name: 'shiftwith.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24時間
  },
  store: null // 初期化時に設定
};

// Redisクライアントの設定
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  legacyMode: false
});

redisClient.on('error', (err) => console.error('Redisエラー:', err));
redisClient.on('connect', () => console.log('Redisに接続しました'));

// Redisストアの設定
export const initializeSessionStore = async () => {
  try {
    await redisClient.connect();
    SESSION_CONFIG.store = new RedisStore({
      client: redisClient,
      prefix: 'shiftwith:sess:'
    });
    return true;
  } catch (error) {
    console.error('Redisストアの初期化に失敗:', error);
    return false;
  }
}; 