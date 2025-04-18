const VideoGeneratorAgent = require('./video-generator');

const agents = {
  'video-generator': VideoGeneratorAgent
};

async function executeAgent(agentName, prompt) {
  const AgentClass = agents[agentName];
  
  if (!AgentClass) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  const agent = new AgentClass();
  await agent.initialize();
  
  return await agent.generateVideo(prompt);
}

module.exports = {
  executeAgent,
  supportedAgents: Object.keys(agents)
}; 