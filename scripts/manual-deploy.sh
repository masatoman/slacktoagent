#!/bin/bash

# エラーが発生したら即座に終了
set -e

echo "🚀 手動デプロイを開始します..."

# ローカルでDockerイメージをビルド
echo "📦 Dockerイメージをビルドしています..."
docker build -t shiftwith:latest .

# デプロイ先サーバーでの操作
echo "🔄 サーバーにデプロイしています..."
ssh your-server << 'EOF'
  cd /opt/shiftwith
  
  # 古いコンテナを停止
  docker-compose down
  
  # 新しいコンテナを起動
  docker-compose up -d
  
  # ログを表示
  docker-compose logs --tail 100
EOF

echo "✅ デプロイが完了しました！" 