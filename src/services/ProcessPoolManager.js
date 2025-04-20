import EventEmitter from 'events';
import logger from './logger.js';

class ProcessPoolManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxConcurrent = options.maxConcurrent || 5;  // 最大同時実行数
    this.maxQueueSize = options.maxQueueSize || 100;  // 最大キューサイズ
    this.queue = [];
    this.running = new Set();
    this.timeout = options.timeout || 300000;  // タイムアウト: 5分
  }

  /**
   * タスクを追加
   */
  async addTask(task) {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Queue is full');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('実行がタイムアウトしました'));
        this.queue = this.queue.filter(t => t !== wrappedTask);
      }, this.timeout);

      const wrappedTask = {
        task,
        resolve,
        reject,
        timeoutId,
        addedAt: Date.now()
      };

      this.queue.push(wrappedTask);
      this.processQueue();
    });
  }

  /**
   * キューを処理
   */
  async processQueue() {
    if (this.running.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.running.add(task);
    
    try {
      const result = await task.task();
      clearTimeout(task.timeoutId);
      task.resolve(result);
    } catch (error) {
      clearTimeout(task.timeoutId);
      task.reject(error);
    } finally {
      this.running.delete(task);
      this.processQueue();
    }
  }

  /**
   * 実行中のタスク数を取得
   */
  getRunningCount() {
    return this.running.size;
  }

  /**
   * キューのサイズを取得
   */
  getQueueSize() {
    return this.queue.length;
  }

  /**
   * 統計情報を取得
   */
  getStats() {
    return {
      running: this.getRunningCount(),
      queued: this.getQueueSize(),
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize
    };
  }
}

export default ProcessPoolManager; 