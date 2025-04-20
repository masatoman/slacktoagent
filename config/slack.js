import dotenv from 'dotenv';

dotenv.config();

export default {
  webhookUrl: process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/your/webhook/url'
}; 