export const SERVER_CONFIG = {
  port: process.env.PORT || 3456,
  timeout: {
    request: 30000,  // リクエストタイムアウト: 30秒
    execution: 300000  // 実行タイムアウト: 5分
  },
  auth: {
    apiKeyHeader: 'X-API-Key'
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ['Content-Type', 'X-API-Key']
  }
};

export const RESPONSE_MESSAGES = {
  HEALTH_CHECK: { 
    status: 'ok', 
    message: 'Service is healthy',
    details: {
      ja: 'サービスは正常に動作しています',
      en: 'Service is operating normally'
    }
  },
  VALIDATION_ERROR: { 
    status: 'error', 
    code: 'VALIDATION_ERROR',
    details: {
      ja: 'リクエストパラメータが不正です',
      en: 'Invalid request parameters'
    },
    help: 'Please check the API documentation for correct request format'
  },
  AUTH_ERROR: { 
    status: 'error', 
    code: 'AUTH_ERROR',
    details: {
      ja: '認証に失敗しました',
      en: 'Authentication failed'
    },
    help: 'Please verify your API key and permissions'
  },
  EXECUTION_ERROR: { 
    status: 'error', 
    code: 'EXECUTION_ERROR',
    details: {
      ja: 'エージェントの実行に失敗しました',
      en: 'Agent execution failed'
    },
    help: 'Check agent name and prompt format, or try again later'
  },
  TIMEOUT_ERROR: { 
    status: 'error', 
    code: 'TIMEOUT_ERROR',
    details: {
      ja: '処理がタイムアウトしました',
      en: 'Operation timed out'
    },
    help: 'Consider simplifying your request or increasing timeout limits'
  },
  INTERNAL_ERROR: { 
    status: 'error', 
    code: 'INTERNAL_ERROR',
    details: {
      ja: 'サーバー内部でエラーが発生しました',
      en: 'Internal server error occurred'
    },
    help: 'Please contact support if the issue persists'
  }
}; 