import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { SERVER_CONFIG, RESPONSE_MESSAGES } from './config/server.js';
import { SLACK_CONFIG } from './config/slack.js';
import { validateApiKey, requirePermission, PERMISSION_LEVELS } from './services/auth.js';
import logger from './services/logger.js';
import { auditLogger } from './services/auditLogger.js';
import SlackNotifier from './services/SlackNotifier.js';
import AgentExecutor from './services/AgentExecutor.js';
import sessionManager from './services/sessionManager.js';
import { ALLOWED_ORIGINS } from './config/cors.js';
import { specs } from './config/swagger.js';

const app = express();
const port = SERVER_CONFIG.port;

// Swagger UIの設定
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Slack通知の設定
let slackNotifier;
try {
  slackNotifier = new SlackNotifier(process.env.SLACK_WEBHOOK_URL);
} catch (error) {
  console.warn('Slack通知が無効です:', error.message);
}

const agentExecutor = new AgentExecutor({
  timeoutMs: SERVER_CONFIG.timeout.execution,
  maxMemoryMB: 1024
});

// ミドルウェアの設定
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(auditLogger);  // 監査ログの追加

// セッション管理の初期化と統合
async function initializeServer() {
  try {
    const sessionInitialized = await sessionManager.initialize();
    if (!sessionInitialized) {
      throw new Error('セッション管理の初期化に失敗しました');
    }
    app.use(sessionManager.getMiddleware());
    logger.info('サーバーの初期化が完了しました');
  } catch (error) {
    logger.error('サーバーの初期化に失敗:', error);
    process.exit(1);
  }
}

// リクエストタイムアウトの設定
app.use((req, res, next) => {
  req.setTimeout(SERVER_CONFIG.timeout.request, () => {
    logger.error('Request timeout', { path: req.path });
    res.status(408).json({
      ...RESPONSE_MESSAGES.TIMEOUT_ERROR,
      message: 'Request timeout'
    });
  });
  next();
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: ヘルスチェック
 *     description: サービスの状態を確認します
 *     responses:
 *       200:
 *         description: サービスが正常に動作している
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 */
app.get('/health', (req, res) => {
  res.json(RESPONSE_MESSAGES.HEALTH_CHECK);
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: ログイン
 *     description: ユーザー認証を行います
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: ログイン成功
 *       400:
 *         description: 認証情報が不足
 *       500:
 *         description: サーバーエラー
 */
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 認証処理（実際の実装はauth.jsに移動することを推奨）
    if (!username || !password) {
      return res.status(400).json({ error: '認証情報が不足しています' });
    }
    
    // セッションの作成
    const sessionData = { username, loginTime: new Date() };
    await sessionManager.createSession(req, sessionData);
    
    logger.info(`ユーザー ${username} がログインしました`);
    res.json({ message: 'ログイン成功' });
  } catch (error) {
    logger.error('ログイン処理でエラーが発生:', error);
    res.status(500).json({ error: '認証処理に失敗しました' });
  }
});

app.post('/auth/logout', async (req, res) => {
  try {
    if (!req.session) {
      return res.status(401).json({ error: 'セッションが存在しません' });
    }
    
    const username = req.session.username;
    await sessionManager.destroySession(req);
    
    logger.info(`ユーザー ${username} がログアウトしました`);
    res.json({ message: 'ログアウト成功' });
  } catch (error) {
    logger.error('ログアウト処理でエラーが発生:', error);
    res.status(500).json({ error: 'ログアウト処理に失敗しました' });
  }
});

// セッション検証ミドルウェア
const requireAuth = async (req, res, next) => {
  try {
    if (!req.session) {
      return res.status(401).json({ error: '認証が必要です' });
    }
    
    const isValid = await sessionManager.validateSession(req.session);
    if (!isValid) {
      await sessionManager.destroySession(req);
      return res.status(401).json({ error: 'セッションが無効です' });
    }
    
    next();
  } catch (error) {
    logger.error('セッション検証でエラーが発生:', error);
    res.status(500).json({ error: 'セッション検証に失敗しました' });
  }
};

// 保護されたエンドポイントにセッション検証を適用
app.use('/execute', requireAuth);
app.use('/admin/status', requireAuth);

/**
 * @swagger
 * /execute:
 *   post:
 *     summary: エージェント実行
 *     description: 指定されたエージェントを実行します
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agent
 *               - prompt
 *             properties:
 *               agent:
 *                 type: string
 *               prompt:
 *                 type: string
 *               context:
 *                 type: object
 *     responses:
 *       200:
 *         description: 実行成功
 *       400:
 *         description: パラメータ不正
 *       401:
 *         description: 認証エラー
 *       500:
 *         description: 実行エラー
 */
app.post('/execute', 
  validateApiKey,
  requirePermission(PERMISSION_LEVELS.EXECUTE),
  async (req, res) => {
    const { agent, prompt, context } = req.body;
    const startTime = Date.now();

    if (!agent || !prompt) {
      logger.warn('Invalid request parameters', { body: req.body });
      return res.status(400).json({
        ...RESPONSE_MESSAGES.VALIDATION_ERROR,
        message: 'Both agent and prompt are required',
        timestamp: new Date().toISOString()
      });
    }

    try {
      logger.info('Starting agent execution', { agent, prompt });

      // AgentExecutorを使用してエージェントを実行
      const output = await agentExecutor.execute(agent, prompt, context);
      const executionTime = Date.now() - startTime;

      logger.info('Agent execution completed', { agent, executionTime });

      // 成功時のSlack通知
      if (slackNotifier) {
        await slackNotifier.send(`実行が完了しました: ${JSON.stringify({
          status: 'success',
          output: output.trim(),
          metadata: {
            executionTime,
            timestamp: new Date().toISOString(),
            agent,
            memoryUsage: process.memoryUsage().heapUsed
          }
        })}`);
      }

      res.json({
        status: 'success',
        output: output.trim(),
        metadata: {
          executionTime,
          timestamp: new Date().toISOString(),
          agent,
          memoryUsage: process.memoryUsage().heapUsed
        }
      });
    } catch (err) {
      const executionTime = Date.now() - startTime;
      logger.error('Agent execution failed', { error: err.message, executionTime });

      // エラー時のSlack通知
      if (slackNotifier) {
        await slackNotifier.send(`エラーが発生しました: ${err.message}`);
      }

      res.status(500).json({
        ...RESPONSE_MESSAGES.EXECUTION_ERROR,
        message: 'Agent execution failed',
        details: err.message,
        metadata: {
          executionTime,
          timestamp: new Date().toISOString(),
          agent,
          memoryUsage: process.memoryUsage().heapUsed
        }
      });
    }
});

/**
 * @swagger
 * /admin/status:
 *   get:
 *     summary: サーバーステータス
 *     description: サーバーの状態を確認します
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: ステータス情報
 *       401:
 *         description: 認証エラー
 */
app.get('/admin/status',
  validateApiKey,
  requirePermission(PERMISSION_LEVELS.ADMIN),
  (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    });
});

// エラーハンドリング
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({
    ...RESPONSE_MESSAGES.INTERNAL_ERROR,
    message: 'Internal server error',
    details: err.message
  });
});

// サーバーの起動
initializeServer().then(() => {
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`, { timestamp: new Date().toISOString() });
  });
}).catch(error => {
  logger.error('サーバーの起動に失敗:', error);
  process.exit(1);
});

export default app; 