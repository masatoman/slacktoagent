export const supportedAgents = [
  'test-agent',
  'code-agent',
  'chat-agent'
];

export async function executeAgent(agent, prompt, context = {}) {
  // テスト用のモック実装
  return {
    success: true,
    output: 'Test output'
  };
} 