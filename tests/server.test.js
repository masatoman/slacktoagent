import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';

describe('Server API', () => {
  const API_KEY = process.env.API_KEY || 'test-api-key';
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'test-admin-key';
  let server;

  beforeAll(() => {
    process.env.PORT = '3456';
    server = app.listen(process.env.PORT);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /health', () => {
    it('ヘルスチェックが成功すること', async () => {
      const response = await request(app)
        .get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('POST /execute', () => {
    it('APIキーなしでアクセスすると401エラーを返すこと', async () => {
      const response = await request(app)
        .post('/execute')
        .send({ command: 'echo', args: ['test'] });
      
      expect(response.status).toBe(401);
    });

    it('有効なAPIキーで実行が成功すること', async () => {
      const response = await request(app)
        .post('/execute')
        .set('X-API-Key', API_KEY)
        .send({ 
          command: 'echo',
          args: ['test']
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /admin/status', () => {
    it('管理者APIキーなしでアクセスすると401エラーを返すこと', async () => {
      const response = await request(app)
        .get('/admin/status');
      
      expect(response.status).toBe(401);
    });

    it('有効な管理者APIキーでステータスを取得できること', async () => {
      const response = await request(app)
        .get('/admin/status')
        .set('X-Admin-API-Key', ADMIN_API_KEY);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
    });
  });
}); 