import axios from 'axios';
import { SLACK_CONFIG } from '../config/slack.js';
import { TEMPLATES } from '../config/notificationTemplates.js';

class SlackNotifier {
  constructor() {
    this.webhookUrl = SLACK_CONFIG.webhookUrl;
    this.retryCount = SLACK_CONFIG.notifications.retryCount;
    this.retryDelay = SLACK_CONFIG.notifications.retryDelay;
  }

  async sendNotification(message, type = 'info') {
    if (!this.webhookUrl) {
      console.warn('Slack webhook URL not configured. Skipping notification.');
      return;
    }

    const template = TEMPLATES[type] || TEMPLATES.info;
    const payload = template.format(message);

    let attempts = 0;
    while (attempts < this.retryCount) {
      try {
        await axios.post(this.webhookUrl, payload);
        return; // 成功したら終了
      } catch (error) {
        attempts++;
        if (attempts === this.retryCount) {
          console.error('Failed to send Slack notification after retries:', error.message);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async sendError(error) {
    const payload = TEMPLATES.error.format(error);
    await this.sendRawNotification(payload);
  }

  async sendSystemStatus(status) {
    const payload = TEMPLATES.systemStatus.format(status);
    await this.sendRawNotification(payload);
  }

  async sendRawNotification(payload) {
    if (!this.webhookUrl) {
      console.warn('Slack webhook URL not configured. Skipping notification.');
      return;
    }

    let attempts = 0;
    while (attempts < this.retryCount) {
      try {
        await axios.post(this.webhookUrl, payload);
        return;
      } catch (error) {
        attempts++;
        if (attempts === this.retryCount) {
          console.error('Failed to send Slack notification after retries:', error.message);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  getEmojiForType(type) {
    const template = TEMPLATES[type] || TEMPLATES.info;
    return template.title.split(' ')[0];
  }
}

const slackNotifier = new SlackNotifier();
export default slackNotifier; 