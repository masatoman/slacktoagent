#!/usr/bin/env node

const { version } = require('../package.json');
const { executeAgent, supportedAgents } = require('../src/agents');

const args = process.argv.slice(2);

// バージョン表示
if (args.includes('--version') || args.includes('-v')) {
  console.log(version);
  process.exit(0);
}

// execコマンドの処理
if (args[0] === 'exec') {
  const agentIndex = args.indexOf('--agent');
  const promptIndex = args.indexOf('--prompt');
  
  if (agentIndex === -1 || promptIndex === -1) {
    console.error('Usage: cursor-agent exec --agent <agent-name> --prompt <prompt>');
    process.exit(1);
  }

  const agent = args[agentIndex + 1];
  const prompt = args[promptIndex + 1];

  if (!agent || !prompt) {
    console.error('Both agent and prompt must be provided');
    process.exit(1);
  }

  // エージェントの実行
  executeAgent(agent, prompt)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
} else {
  // 不明なコマンドの場合
  console.log('Unknown command. Available commands:');
  console.log('  --version, -v    Show version information');
  console.log('  exec             Execute an agent with a prompt');
  console.log('                   Usage: cursor-agent exec --agent <agent-name> --prompt <prompt>');
  console.log('\nSupported agents:');
  supportedAgents.forEach(agent => console.log(`  - ${agent}`));
  process.exit(1);
} 