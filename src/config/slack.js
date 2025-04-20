export const SLACK_CONFIG = {
  webhookUrl: process.env.SLACK_WEBHOOK_URL,
  notifications: {
    enabled: true,
    retryCount: 3,
    retryDelay: 1000 // 1秒
  }
}; 