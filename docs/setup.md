# ローカル環境セットアップガイド

## 前提条件
- Docker Desktop がインストールされていること
- Node.js 18.x 以上
- Git

## 1. リポジトリのクローン
```bash
git clone https://github.com/yourusername/shiftwith.git
cd shiftwith
```

## 2. 環境変数の設定
`.env`ファイルを作成し、必要な環境変数を設定：

```env
# API設定
API_KEY=test-api-key
ADMIN_API_KEY=test-admin-key

# Slack設定
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your-webhook-url

# サーバー設定
PORT=3456
NODE_ENV=development
LOG_LEVEL=debug

# CORS設定
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3456
```

## 3. Dockerコンテナの起動
```bash
# イメージのビルドと起動
docker-compose up -d

# ログの確認
docker-compose logs -f
```

## 4. 動作確認
以下のスクリプトを実行して、各機能が正常に動作することを確認：

```bash
# 実行権限を付与
chmod +x scripts/verify-docker.sh

# 動作確認を実行
./scripts/verify-docker.sh
```

正常に動作すると以下のエンドポイントにアクセスできます：
- アプリケーション: http://localhost:3456
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

## 5. 手動での動作確認

### ヘルスチェック
```bash
curl http://localhost:3456/health
```

### タスク実行テスト
```bash
curl -X POST http://localhost:3456/execute \
  -H "X-API-Key: test-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "test",
    "parameters": {
      "type": "health-check"
    }
  }'
```

### 管理者エンドポイントの確認
```bash
curl http://localhost:3456/admin/status \
  -H "X-Admin-API-Key: test-admin-key"
```

## 6. トラブルシューティング

### コンテナが起動しない場合
```bash
# ログの確認
docker-compose logs app

# コンテナの状態確認
docker-compose ps

# コンテナの再起動
docker-compose restart app
```

### ポートの競合がある場合
1. `docker-compose.yml`で使用ポートを変更
2. `.env`ファイルの`PORT`を変更
3. コンテナを再起動

### データベースの初期化が必要な場合
```bash
# コンテナとボリュームを削除
docker-compose down -v

# 再度起動
docker-compose up -d
```

## 7. 開発用コマンド

### コンテナの管理
```bash
# 全コンテナの停止
docker-compose stop

# 全コンテナの削除
docker-compose down

# キャッシュを使わずに再ビルド
docker-compose build --no-cache
```

### ログの確認
```bash
# 全コンテナのログ
docker-compose logs -f

# 特定のサービスのログ
docker-compose logs -f app
docker-compose logs -f prometheus
docker-compose logs -f grafana
```

### シェルアクセス
```bash
# アプリケーションコンテナにシェルアクセス
docker-compose exec app sh
```

## 8. 開発のヒント

### ホットリロード
開発中は`nodemon`によるホットリロードが有効になっています。
ソースコードの変更は自動的に反映されます。

### デバッグモード
```bash
# デバッグログの有効化
docker-compose exec app sh -c "export DEBUG=app:*"
```

### メトリクス確認
1. Prometheusダッシュボード（http://localhost:9090）にアクセス
2. Grafanaダッシュボード（http://localhost:3001）にアクセス
   - デフォルトの認証情報: admin/admin
   - 初回ログイン時にパスワードの変更を推奨

## 9. 次のステップ
1. Slackアプリの設定
2. GitHubとの連携設定
3. CI/CDパイプラインの構築

各設定の詳細は、それぞれのドキュメントを参照してください：
- [Slack連携ガイド](./slack-integration.md)
- [GitHub連携ガイド](./github-integration.md)
- [CI/CD設定ガイド](./cicd-setup.md) 