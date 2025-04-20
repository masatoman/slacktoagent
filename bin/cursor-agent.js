#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supportedAgents, executeAgent } from '../src/agents.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  console.log(`
Usage: cursor-agent <command> [options]

Commands:
  exec <agent> <prompt>  Execute an agent with the given prompt
  list                   List available agents
  --version, -v         Show version
  --help, -h           Show this help message

Examples:
  cursor-agent exec code-agent "Write a hello world program"
  cursor-agent list
`);
  process.exit(0);
}

if (command === '--version' || command === '-v') {
  console.log(packageJson.version);
  process.exit(0);
}

if (command === 'list') {
  console.log('Available agents:');
  supportedAgents.forEach(agent => console.log(`  - ${agent}`));
  process.exit(0);
}

if (command === 'exec') {
  const agent = args[1];
  const prompt = args[2];

  if (!agent || !prompt) {
    console.error('Error: Both agent and prompt are required for exec command');
    process.exit(1);
  }

  if (!supportedAgents.includes(agent)) {
    console.error(`Error: Unknown agent "${agent}". Use 'cursor-agent list' to see available agents.`);
    process.exit(1);
  }

  try {
    const result = await executeAgent(agent, prompt);
    console.log(result.output);
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Error executing agent:', error.message);
    process.exit(1);
  }
} else {
  console.error(`Error: Unknown command "${command}". Use --help for usage information.`);
  process.exit(1);
} 