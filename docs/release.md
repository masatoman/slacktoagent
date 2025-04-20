# リリース手順書

## 前提条件
- Node.js v20.15.0以上
- npm v10.0.0以上
- PM2（グローバルインストール）
- Cloudflare CLI

## 環境設定
1. 環境変数の設定
   ```bash
   cp .env.example .env
   # .envファイルを編集して必要な値を設定
   ```

2. 必要な環境変数
   - `API_KEY`: APIキー
   - `ADMIN_API_KEY`: 管理者用APIキー
   - `SLACK_WEBHOOK_URL`: Slack Webhook URL
   - `PORT`: サーバーポート（デフォルト: 3456）
   - `LOG_LEVEL`: ログレベル（production/development）

## デプロイ手順
1. コードの取得
   ```bash
   git clone https://github.com/your-org/cursor-agent.git
   cd cursor-agent
   git checkout main
   ```

2. デプロイスクリプトの実行
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

3. 動作確認
   - ヘルスチェック: `curl http://localhost:3456/health`
   - メトリクス確認: `curl http://localhost:3456/metrics`

## 監視設定
1. Prometheusの設定
   ```yaml
   scrape_configs:
     - job_name: 'cursor-agent'
       static_configs:
         - targets: ['localhost:3456']
   ```

2. Grafanaダッシュボードのインポート
   - `dashboards/cursor-agent.json`をインポート

## ロールバック手順
1. 前バージョンへの切り替え
   ```bash
   git checkout <previous-tag>
   ./scripts/deploy.sh
   ```

2. ログの確認
   ```bash
   pm2 logs cursor-agent
   ```

## トラブルシューティング
1. アプリケーションが起動しない
   - ログを確認: `tail -f logs/error.log`
   - 環境変数の確認: `cat .env`
   - プロセス状態の確認: `pm2 status`

2. Slack通知が届かない
   - Webhook URLの確認
   - ネットワーク接続の確認
   - Slackワークスペースの設定確認

3. メモリ使用量が高い
   - `pm2 monit`でリアルタイムモニタリング
   - 必要に応じてPM2の`max_memory_restart`を調整

## 連絡先
- 技術担当: tech-lead@example.com
- 運用担当: ops-team@example.com 