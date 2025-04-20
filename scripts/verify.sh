#!/bin/bash

# エラーが発生したら即座に終了
set -e

# 環境変数の読み込み
if [ -f ".env" ]; then
  source .env
fi

# デフォルト値の設定
API_KEY=${API_KEY:-"test-api-key"}
ADMIN_API_KEY=${ADMIN_API_KEY:-"test-admin-key"}
PORT=${PORT:-3456}
BASE_URL="http://localhost:${PORT}"

echo "動作確認を開始します..."

# ヘルスチェック
echo "1. ヘルスチェックの確認"
response=$(curl -s "${BASE_URL}/health")
if [[ $response == *"\"status\":\"ok\""* ]]; then
  echo "✅ ヘルスチェック成功"
else
  echo "❌ ヘルスチェック失敗"
  exit 1
fi

# APIキー認証の確認
echo "2. APIキー認証の確認"
response=$(curl -s -w "%{http_code}" -X POST "${BASE_URL}/execute" -H "X-API-Key: invalid-key")
if [[ $response == *"401"* ]]; then
  echo "✅ 無効なAPIキーで認証失敗（期待通り）"
else
  echo "❌ APIキー認証テスト失敗"
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
  exit 1
fi

# 管理者エンドポイントの確認
echo "4. 管理者エンドポイントの確認"
response=$(curl -s "${BASE_URL}/admin/status" -H "X-Admin-API-Key: ${ADMIN_API_KEY}")
if [[ $response == *"\"status\":\"ok\""* ]]; then
  echo "✅ 管理者エンドポイント成功"
else
  echo "❌ 管理者エンドポイント失敗"
  exit 1
fi

# メトリクスの確認
echo "5. メトリクスエンドポイントの確認"
response=$(curl -s "${BASE_URL}/metrics")
if [[ $response == *"cursor_agent_executions_total"* ]]; then
  echo "✅ メトリクス取得成功"
else
  echo "❌ メトリクス取得失敗"
  exit 1
fi

# ログファイルの確認
echo "6. ログファイルの確認"
if [ -f "./logs/combined.log" ]; then
  echo "✅ ログファイルが存在します"
else
  echo "❌ ログファイルが見つかりません"
  exit 1
fi

echo "すべての動作確認が完了しました！" 