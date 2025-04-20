import { jest } from '@jest/globals';
import { SlackNotifier } from '../src/services/SlackNotifier.js';
import axios from 'axios';

jest.mock('axios');

describe('SlackNotifier', () => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/test';
  let notifier;

  beforeEach(() => {
    notifier = new SlackNotifier(webhookUrl);
    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('成功メッセージを送信できること', async () => {
      const mockResponse = { status: 200, data: 'ok' };
      axios.post.mockResolvedValueOnce(mockResponse);

      const message = {
        type: 'success',
        command: 'test-command',
        output: 'test output'
      };

      await notifier.sendNotification(message);

      expect(axios.post).toHaveBeenCalledWith(
        webhookUrl,
        expect.objectContaining({
          text: expect.stringContaining('✅ 実行成功'),
          blocks: expect.arrayContaining([
            expect.objectContaining({
              text: expect.objectContaining({
                text: expect.stringContaining('test-command')
              })
            })
          ])
        })
      );
    });

    it('エラーメッセージを送信できること', async () => {
      const mockResponse = { status: 200, data: 'ok' };
      axios.post.mockResolvedValueOnce(mockResponse);

      const message = {
        type: 'error',
        command: 'test-command',
        error: 'test error'
      };

      await notifier.sendNotification(message);

      expect(axios.post).toHaveBeenCalledWith(
        webhookUrl,
        expect.objectContaining({
          text: expect.stringContaining('❌ 実行エラー'),
          blocks: expect.arrayContaining([
            expect.objectContaining({
              text: expect.objectContaining({
                text: expect.stringContaining('test error')
              })
            })
          ])
        })
      );
    });

    it('通知送信に失敗した場合エラーをスローすること', async () => {
      const error = new Error('Failed to send notification');
      axios.post.mockRejectedValueOnce(error);

      const message = {
        type: 'success',
        command: 'test-command',
        output: 'test output'
      };

      await expect(notifier.sendNotification(message))
        .rejects
        .toThrow('Failed to send notification');
    });
  });
}); 