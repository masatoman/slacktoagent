#!/bin/bash

# エラーが発生したら即座に終了
set -e

# 環境変数の読み込み
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# デプロイ先のサーバー情報
DEPLOY_USER=${DEPLOY_USER:-"deployer"}
DEPLOY_HOST=${DEPLOY_HOST:-"your-server.com"}
DEPLOY_PATH=${DEPLOY_PATH:-"/opt/shiftwith"}
DOCKER_IMAGE=${DOCKER_IMAGE:-"your-dockerhub-username/shiftwith:latest"}

echo "🚀 デプロイを開始します..."

# SSHでサーバーに接続してデプロイを実行
ssh $DEPLOY_USER@$DEPLOY_HOST << EOF
  echo "📦 アプリケーションをデプロイします..."
  
  # デプロイディレクトリに移動
  cd $DEPLOY_PATH
  
  # 古いコンテナを停止して削除
  docker-compose down
  
  # 最新のイメージをプル
  docker pull $DOCKER_IMAGE
  
  # 新しいコンテナを起動
  docker-compose up -d
  
  echo "✅ デプロイが完了しました！"
EOF 