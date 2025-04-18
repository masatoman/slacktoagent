const SlackNotifier = require('../src/services/SlackNotifier');
const slackConfig = require('../config/slack');

async function testSlackNotification() {
  try {
    const notifier = new SlackNotifier(slackConfig.webhookUrl);
    
    await notifier.notifyAgentExecution({
      agentName: 'TestAgent',
      prompt: 'This is a test prompt',
      success: true,
      output: 'Test output message',
      error: null
    });
    
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// テスト実行
testSlackNotification(); 