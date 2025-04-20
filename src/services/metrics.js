import client from 'prom-client';

// メトリクスの初期化
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// カスタムメトリクスの定義
const executionCounter = new client.Counter({
  name: 'cursor_agent_executions_total',
  help: 'Total number of agent executions',
  labelNames: ['status']
});

const executionDuration = new client.Histogram({
  name: 'cursor_agent_execution_duration_seconds',
  help: 'Duration of agent executions in seconds',
  buckets: [0.1, 0.5, 1, 2, 5]
});

const memoryUsage = new client.Gauge({
  name: 'cursor_agent_memory_usage_bytes',
  help: 'Memory usage of the agent process'
});

register.registerMetric(executionCounter);
register.registerMetric(executionDuration);
register.registerMetric(memoryUsage);

export {
  register,
  executionCounter,
  executionDuration,
  memoryUsage
}; 