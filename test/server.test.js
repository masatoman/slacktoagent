import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';

const mockSpawn = jest.fn();

jest.mock('child_process', () => ({
  spawn: (...args) => mockSpawn(...args)
}));

describe('Server', () => {
  let server;
  
  beforeEach(() => {
    server = app.listen(0);
  });

  afterEach(() => {
    server.close();
    jest.clearAllMocks();
  });

  describe('POST /execute', () => {
    it('エージェントの実行リクエストが成功すること', async () => {
      // モックプロセスの設定
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: (event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        }
      };
      mockSpawn.mockReturnValue(mockProcess);

      const response = await request(server)
        .post('/execute')
        .send({
          agent: 'test-agent',
          prompt: 'test prompt',
          context: { key: 'value' }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('必須パラメータが不足している場合エラーを返すこと', async () => {
      const response = await request(server)
        .post('/execute')
        .send({
          prompt: 'test prompt'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /health', () => {
    it('ヘルスチェックが成功すること', async () => {
      const response = await request(server)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });
}); 