const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 3456;

// JSONボディのパース
app.use(bodyParser.json());

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Webhookエンドポイント
app.post('/run', async (req, res) => {
  const { agent, prompt } = req.body;

  if (!agent || !prompt) {
    return res.status(400).json({
      error: 'Both agent and prompt are required'
    });
  }

  try {
    // cursor-agentを実行
    const cursorAgent = spawn('cursor-agent', ['exec', '--agent', agent, '--prompt', prompt]);
    
    let output = '';
    let error = '';

    cursorAgent.stdout.on('data', (data) => {
      output += data.toString();
    });

    cursorAgent.stderr.on('data', (data) => {
      error += data.toString();
    });

    cursorAgent.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({
          error: 'Agent execution failed',
          details: error
        });
      }

      res.json({
        status: 'success',
        output: output.trim()
      });
    });
  } catch (err) {
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// サーバー起動
app.listen(port, () => {
  console.log(`Webhook server is running on port ${port}`);
}); 