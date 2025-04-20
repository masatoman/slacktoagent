import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/server';

// 環境変数の設定
process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';

// @slack/webhookのモック
jest.mock('@slack/webhook', () => ({
  IncomingWebhook: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue(undefined)
  }))
}));

// SLACK_CONFIGのモック
const mockWebhookUrl = 'https://hooks.slack.com/test';
jest.mock('../src/config/slack.js', () => ({
  SLACK_CONFIG: {
    webhookUrl: mockWebhookUrl,
    notifications: {
      enabled: true,
      retryCount: 3,
      retryDelay: 1000
    }
  }
}));

// SlackNotifierのモック
const mockSend = jest.fn().mockResolvedValue(undefined);
const mockNotifyAgentExecution = jest.fn().mockResolvedValue(undefined);

jest.mock('../src/services/SlackNotifier', () => {
  return jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue()
  }));
});

// AgentExecutorのモック
jest.mock('../src/services/AgentExecutor', () => {
  return jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue('Test execution result')
  }));
});

describe('Load Tests', () => {
  let server;
  
  beforeEach(() => {
    server = app.listen(0);
    // モックをリセット
    mockSend.mockClear();
    mockNotifyAgentExecution.mockClear();
  });

  afterEach(() => {
    server.close();
    jest.clearAllMocks();
  });

  // 同時リクエストのテスト
  it('should handle concurrent requests and notify Slack', async () => {
    const concurrentRequests = 10;
    const requests = Array(concurrentRequests).fill().map(() => 
      request(server)
        .post('/execute')
        .send({
          agent: 'test-agent',
          prompt: 'test prompt',
          context: { key: 'value' }
        })
    );

    const responses = await Promise.all(requests);
    responses.forEach(response => {
      expect(response.status).toBeLessThan(500);
    });

    // Slack通知の検証
    expect(mockNotifyAgentExecution).toHaveBeenCalledTimes(concurrentRequests);
    expect(mockSend).toHaveBeenCalledTimes(concurrentRequests);
  });

  // 連続リクエストのテスト
  it('should handle sequential requests', async () => {
    const requestCount = 5;
    for (let i = 0; i < requestCount; i++) {
      const response = await request(server)
        .post('/execute')
        .send({
          agent: 'test-agent',
          prompt: `test prompt ${i}`,
          context: { key: 'value' }
        });
      
      expect(response.status).toBeLessThan(500);
      // 各リクエスト間で1秒待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });

  // メモリリーク検出テスト
  it('should not have memory leaks during extended operation', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    const requestCount = 10;

    for (let i = 0; i < requestCount; i++) {
      await request(server)
        .post('/execute')
        .send({
          agent: 'test-agent',
          prompt: `test prompt ${i}`,
          context: { key: 'value' }
        });
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // メモリ増加が50MB未満であることを確認
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  // レスポンスタイム検証
  it('should respond within acceptable time limits', async () => {
    const startTime = Date.now();
    
    const response = await request(server)
      .post('/execute')
      .send({
        agent: 'test-agent',
        prompt: 'test prompt',
        context: { key: 'value' }
      });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status).toBe(200);
    // レスポンスタイムが3秒未満であることを確認
    expect(responseTime).toBeLessThan(3000);
  });

  it('サーバーが正常に応答すること', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('同時実行制限が機能すること', async () => {
    const requests = Array(10).fill().map(() =>
      request(app)
        .post('/execute')
        .send({
          agent: 'test-agent',
          prompt: 'test prompt'
        })
    );

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 200).length;
    const queuedCount = responses.filter(r => r.status === 429).length;

    expect(successCount + queuedCount).toBe(10);
    expect(successCount).toBeLessThanOrEqual(5); // 最大同時実行数
  });
}); 