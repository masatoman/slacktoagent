import { IncomingWebhook } from '@slack/webhook';

class SlackNotifier {
  constructor(webhookUrl) {
    if (!webhookUrl) {
      throw new Error('Slack webhook URL is required');
    }
    this.webhook = new IncomingWebhook(webhookUrl);
  }

  /**
   * Slackにメッセージを送信
   * @param {string} message 送信するメッセージ
   */
  async send(message) {
    try {
      await this.webhook.send({ text: message });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async notifyAgentExecution({ agentName, prompt, success, output, error }) {
    const color = success ? '#36a64f' : '#ff0000';
    const message = {
      attachments: [{
        color,
        title: `Agent Execution: ${agentName}`,
        fields: [
          {
            title: 'Prompt',
            value: prompt,
            short: false
          },
          {
            title: 'Status',
            value: success ? 'Success' : 'Failed',
            short: true
          }
        ]
      }]
    };

    if (success && output) {
      message.attachments[0].fields.push({
        title: 'Output',
        value: output,
        short: false
      });
    }

    if (!success && error) {
      message.attachments[0].fields.push({
        title: 'Error',
        value: error,
        short: false
      });
    }

    await this.send(message);
  }
}

export default SlackNotifier; 