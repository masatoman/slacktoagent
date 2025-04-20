import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import winston from 'winston';
import CacheManager from './CacheManager.js';
import ProcessPoolManager from './ProcessPoolManager.js';

// ロガーの設定
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: './logs/agent.log' }),
    new winston.transports.Console()
  ]
});

class AgentExecutor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxMemoryMB = options.maxMemoryMB || 100;
    this.timeout = options.timeout || 5000;
    this.process = null;
    this.timer = null;
    this.monitor = null;
    this.startTime = null;
    this.cache = new CacheManager(options.cache);
    this.pool = new ProcessPoolManager({
      maxConcurrent: options.maxConcurrent || 5,
      maxQueueSize: options.maxQueueSize || 100,
      timeout: this.timeout
    });
  }

  /**
   * Cursorエージェントを実行する
   * @param {string} agent エージェント名
   * @param {string} prompt プロンプト
   * @param {Object} context コンテキスト情報
   * @returns {Promise<string>} 実行結果
   */
  async execute(agent, prompt, context = {}) {
    try {
      // キャッシュをチェック
      const cachedResult = this.cache.get(agent, prompt, context);
      if (cachedResult) {
        logger.info('キャッシュから結果を返却', { agent, prompt });
        return cachedResult;
      }

      logger.info('エージェント実行開始', { agent, prompt });
      this.startTime = Date.now();

      // コマンドの構築
      const command = this.buildCommand(agent, prompt, context);
      
      // プロセスプールを使用して実行
      const result = await this.pool.addTask(async () => {
        return this.executeWithTimeout(command);
      });
      
      // 結果をキャッシュに保存
      this.cache.set(agent, prompt, context, result);
      
      logger.info('エージェント実行完了', { 
        agent, 
        executionTime: Date.now() - this.startTime,
        poolStats: this.pool.getStats()
      });
      
      return result;
    } catch (error) {
      logger.error('エージェント実行エラー', { 
        agent, 
        error: error.message,
        stack: error.stack,
        poolStats: this.pool.getStats()
      });
      throw error;
    }
  }

  /**
   * タイムアウト制御付きでコマンドを実行
   * @param {string} command 実行するコマンド
   * @returns {Promise<string>} 実行結果
   */
  async executeWithTimeout(command) {
    let output = '';
    let errorOutput = '';

    return new Promise((resolve, reject) => {
      this.process = spawn('cursor-agent', ['--agent', command.split(' ')[1], '--prompt', command.split(' ')[3]]);

      // タイムアウトタイマーの設定
      const timeoutId = setTimeout(() => {
        this.process.kill('SIGTERM');
        reject(new Error('実行がタイムアウトしました'));
      }, this.timeout);

      this.process.stdout.on('data', (data) => {
        output += data.toString();
        this.emit('output', data.toString());
      });

      this.process.stderr.on('data', (data) => {
        errorOutput += data.toString();
        this.emit('error', data.toString());
      });

      // メモリ使用量の監視
      const memoryCheckInterval = setInterval(() => {
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        if (memoryUsage > this.maxMemoryMB) {
          clearInterval(memoryCheckInterval);
          clearTimeout(timeoutId);
          this.process.kill('SIGTERM');
          reject(new Error(`メモリ使用量が制限(${this.maxMemoryMB}MB)を超過しました`));
        }
      }, 100);

      this.process.on('close', (code) => {
        clearInterval(memoryCheckInterval);
        clearTimeout(timeoutId);
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`プロセスが終了コード ${code} で終了しました。${errorOutput ? '\nエラー: ' + errorOutput : ''}`));
        }
      });
    });
  }

  /**
   * プロセスの状態を確認
   */
  async checkProcessHealth() {
    if (!this.process) return;

    try {
      // プロセスの状態を確認
      const usage = process.memoryUsage();
      const memoryMB = usage.heapUsed / 1024 / 1024;
      const executionTime = Date.now() - this.startTime;

      logger.debug('プロセス状態', {
        memoryMB,
        executionTime,
        pid: this.process.pid
      });

      // メモリ使用量のチェック
      if (memoryMB > this.maxMemoryMB) {
        logger.warn('メモリ使用量が制限を超過', { memoryMB, limit: this.maxMemoryMB });
        this.emit('memory-exceeded', { used: memoryMB, limit: this.maxMemoryMB });
        await this.gracefulShutdown();
      }
    } catch (error) {
      logger.error('プロセス監視エラー', { error: error.message });
    }
  }

  /**
   * タイムアウト時の処理
   */
  async handleTimeout() {
    logger.warn('実行がタイムアウト', { 
      executionTime: Date.now() - this.startTime 
    });
    this.emit('timeout');
    await this.gracefulShutdown();
  }

  /**
   * プロセスの正常終了を試みる
   */
  async gracefulShutdown() {
    if (!this.process) return;

    try {
      // SIGTERMを送信
      this.process.kill('SIGTERM');
      
      // 5秒待機
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // プロセスが終了していない場合はSIGKILL
      if (this.isProcessRunning()) {
        logger.warn('プロセスが応答しないためSIGKILLを送信');
        this.process.kill('SIGKILL');
      }
    } catch (error) {
      logger.error('プロセス終了エラー', { error: error.message });
    }
  }

  /**
   * プロセスが実行中かどうかを確認
   */
  isProcessRunning() {
    return this.process && !this.process.killed;
  }

  /**
   * リソースのクリーンアップ
   */
  cleanup() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.monitor) {
      clearInterval(this.monitor);
      this.monitor = null;
    }
    this.process = null;
  }

  /**
   * コマンドを構築
   */
  buildCommand(agent, prompt, context) {
    const contextArg = context ? `--context '${JSON.stringify(context)}'` : '';
    return `exec --agent "${agent}" ${contextArg} --prompt "${prompt}"`;
  }

  kill() {
    if (this.process) {
      this.process.kill('SIGTERM');
    }
  }
}

export default AgentExecutor; 