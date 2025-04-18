const { IncomingWebhook } = require('@slack/webhook');

class SlackNotifier {
  constructor(webhookUrl) {
    if (!webhookUrl) {
      throw new Error('Slack webhook URL is required');
    }
    this.webhook = new IncomingWebhook(webhookUrl);
  }

  async notifyAgentExecution({ agentName, prompt, success, output, error }) {
    const color = success ? '#36a64f' : '#ff0000';
    const status = success ? '成功 ✅' : '失敗 ❌';

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*エージェント実行結果*\n*エージェント名:* ${agentName}\n*ステータス:* ${status}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*プロンプト:*\n\`\`\`${prompt}\`\`\``
        }
      }
    ];

    if (output) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*出力結果:*\n\`\`\`${output}\`\`\``
        }
      });
    }

    if (error) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*エラー情報:*\n\`\`\`${error}\`\`\``
        }
      });
    }

    await this.webhook.send({
      blocks,
      attachments: [{
        color: color,
        footer: `実行日時: ${new Date().toLocaleString('ja-JP')}`
      }]
    });
  }
}

module.exports = SlackNotifier; 