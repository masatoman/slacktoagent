import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import winston from 'winston';
import CacheManager from './CacheManager.mjs';
import ProcessPoolManager from './ProcessPoolManager.mjs';
import { logger } from './logger.mjs';
import { RESPONSE_MESSAGES } from '../config/server.mjs';

// ロガーの設定
const agentLogger = winston.createLogger({
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

export default class AgentExecutor extends EventEmitter {
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
    this.currentProcess = null;
  }

  /**
   * Cursorエージェントを実行する
   * @param {string} agent エージェント名
   * @param {string} prompt プロンプト
   * @param {Object} context コンテキスト情報
   * @returns {Promise<string>} 実行結果
   */
  async execute(agent, prompt, context = {}) {
    if (this.currentProcess) {
      throw new Error('Another task is currently running');
    }

    try {
      // キャッシュをチェック
      const cachedResult = this.cache.get(agent, prompt, context);
      if (cachedResult) {
        agentLogger.info('キャッシュから結果を返却', { agent, prompt });
        return cachedResult;
      }

      agentLogger.info('エージェント実行開始', { agent, prompt });
      this.startTime = Date.now();

      // コマンドの構築
      const command = this.buildCommand(agent, prompt, context);
      
      // プロセスプールを使用して実行
      const result = await this.pool.addTask(async () => {
        return this.executeWithTimeout(command);
      });
      
      // 結果をキャッシュに保存
      this.cache.set(agent, prompt, context, result);
      
      agentLogger.info('エージェント実行完了', { 
        agent, 
        executionTime: Date.now() - this.startTime,
        poolStats: this.pool.getStats()
      });
      
      return result;
    } catch (error) {
      agentLogger.error('エージェント実行エラー', { 
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
      this.currentProcess = spawn('cursor-agent', [command], {
        shell: true
      });

      // タイムアウトタイマーの設定
      const timeoutId = setTimeout(() => {
        this.currentProcess.kill('SIGTERM');
        reject(new Error('実行がタイムアウトしました'));
      }, this.timeout);

      this.currentProcess.stdout.on('data', (data) => {
        output += data.toString();
        this.emit('output', data.toString());
        agentLogger.debug('Agent output:', { data: data.toString() });
      });

      this.currentProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        this.emit('error', data.toString());
        agentLogger.error('Agent error:', { error: data.toString() });
      });

      // メモリ使用量の監視
      const memoryCheckInterval = setInterval(() => {
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        if (memoryUsage > this.maxMemoryMB) {
          clearInterval(memoryCheckInterval);
          clearTimeout(timeoutId);
          this.currentProcess.kill('SIGTERM');
          reject(new Error(`メモリ使用量が制限(${this.maxMemoryMB}MB)を超過しました`));
        }
      }, 100);

      this.currentProcess.on('close', (code) => {
        clearInterval(memoryCheckInterval);
        clearTimeout(timeoutId);
        this.currentProcess = null;
        if (code === 0) {
          resolve(output);
        } else {
          reject({
            ...RESPONSE_MESSAGES.EXECUTION_ERROR,
            error: errorOutput
          });
        }
      });

      this.currentProcess.on('error', (error) => {
        this.currentProcess = null;
        reject({
          ...RESPONSE_MESSAGES.EXECUTION_ERROR,
          error: error.message
        });
      });
    });
  }

  /**
   * プロセスの状態を確認
   */
  async checkProcessHealth() {
    if (!this.currentProcess) return;

    try {
      // プロセスの状態を確認
      const usage = process.memoryUsage();
      const memoryMB = usage.heapUsed / 1024 / 1024;
      const executionTime = Date.now() - this.startTime;

      agentLogger.debug('プロセス状態', {
        memoryMB,
        executionTime,
        pid: this.currentProcess.pid
      });

      // メモリ使用量のチェック
      if (memoryMB > this.maxMemoryMB) {
        agentLogger.warn('メモリ使用量が制限を超過', { memoryMB, limit: this.maxMemoryMB });
        this.emit('memory-exceeded', { used: memoryMB, limit: this.maxMemoryMB });
        await this.gracefulShutdown();
      }
    } catch (error) {
      agentLogger.error('プロセス監視エラー', { error: error.message });
    }
  }

  /**
   * タイムアウト時の処理
   */
  async handleTimeout() {
    agentLogger.warn('実行がタイムアウト', { 
      executionTime: Date.now() - this.startTime 
    });
    this.emit('timeout');
    await this.gracefulShutdown();
  }

  /**
   * プロセスの正常終了を試みる
   */
  async gracefulShutdown() {
    if (!this.currentProcess) return;

    try {
      // SIGTERMを送信
      this.currentProcess.kill('SIGTERM');
      
      // 5秒待機
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // プロセスが終了していない場合はSIGKILL
      if (this.isProcessRunning()) {
        agentLogger.warn('プロセスが応答しないためSIGKILLを送信');
        this.currentProcess.kill('SIGKILL');
      }
    } catch (error) {
      agentLogger.error('プロセス終了エラー', { error: error.message });
    }
  }

  /**
   * プロセスが実行中かどうかを確認
   */
  isProcessRunning() {
    return this.currentProcess && !this.currentProcess.killed;
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

    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');
      this.currentProcess = null;
    }
  }

  /**
   * コマンドを構築する
   */
  buildCommand(agent, prompt, context) {
    return `${agent} "${prompt}" ${JSON.stringify(context)}`;
  }

  /**
   * プロセスを強制終了する
   */
  kill() {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGKILL');
      this.currentProcess = null;
    }
  }

  /**
   * プロセスが実行中かどうかを返す
   */
  isRunning() {
    return !!this.currentProcess;
  }

  /**
   * プロセスを停止する
   */
  async stop() {
    await this.gracefulShutdown();
    this.cleanup();
  }
} 