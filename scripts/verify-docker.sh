#!/bin/bash

# エラーが発生したら即座に終了
set -e

echo "Docker環境の準備を開始します..."

# Docker Composeで環境を起動
docker-compose up -d

# サーバーの起動を待機
echo "サーバーの起動を待機中..."
for i in {1..30}; do
  if curl -s http://localhost:3456/health > /dev/null; then
    echo "サーバーが起動しました"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "サーバーの起動がタイムアウトしました"
    exit 1
  fi
  sleep 1
done

# デフォルト値の設定
API_KEY="test-api-key"
ADMIN_API_KEY="test-admin-key"
BASE_URL="http://localhost:3456"

echo "動作確認を開始します..."

# ヘルスチェック
echo "1. ヘルスチェックの確認"
response=$(curl -s "${BASE_URL}/health")
if [[ $response == *"\"status\":\"ok\""* ]]; then
  echo "✅ ヘルスチェック成功"
else
  echo "❌ ヘルスチェック失敗"
  docker-compose logs app
  exit 1
fi

# APIキー認証の確認
echo "2. APIキー認証の確認"
response=$(curl -s -w "%{http_code}" -X POST "${BASE_URL}/execute" -H "X-API-Key: invalid-key")
if [[ $response == *"401"* ]]; then
  echo "✅ 無効なAPIキーで認証失敗（期待通り）"
else
  echo "❌ APIキー認証テスト失敗"
  docker-compose logs app
  exit 1
fi

# エージェント実行の確認
echo "3. エージェント実行の確認"
response=$(curl -s -X POST "${BASE_URL}/execute" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"agent":"test-agent","prompt":"test"}')
if [[ $response == *"\"status\":\"success\""* ]]; then
  echo "✅ エージェント実行成功"
else
  echo "❌ エージェント実行失敗"
  docker-compose logs app
  exit 1
fi

# 管理者エンドポイントの確認
echo "4. 管理者エンドポイントの確認"
response=$(curl -s "${BASE_URL}/admin/status" -H "X-Admin-API-Key: ${ADMIN_API_KEY}")
if [[ $response == *"\"status\":\"ok\""* ]]; then
  echo "✅ 管理者エンドポイント成功"
else
  echo "❌ 管理者エンドポイント失敗"
  docker-compose logs app
  exit 1
fi

# メトリクスの確認
echo "5. メトリクスエンドポイントの確認"
response=$(curl -s "${BASE_URL}/metrics")
if [[ $response == *"cursor_agent_executions_total"* ]]; then
  echo "✅ メトリクス取得成功"
else
  echo "❌ メトリクス取得失敗"
  docker-compose logs app
  exit 1
fi

# Prometheusの確認
echo "6. Prometheusの確認"
response=$(curl -s "http://localhost:9090/api/v1/targets")
if [[ $response == *"cursor-agent"* ]]; then
  echo "✅ Prometheus設定成功"
else
  echo "❌ Prometheus設定失敗"
  docker-compose logs prometheus
  exit 1
fi

# Grafanaの確認
echo "7. Grafanaの確認"
response=$(curl -s "http://localhost:3001/api/health")
if [[ $response == *"ok"* ]]; then
  echo "✅ Grafana起動成功"
else
  echo "❌ Grafana起動失敗"
  docker-compose logs grafana
  exit 1
fi

echo "すべての動作確認が完了しました！"
echo "
使用可能なエンドポイント:
- アプリケーション: http://localhost:3456
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

環境を停止するには以下のコマンドを実行してください：
docker-compose down
" 