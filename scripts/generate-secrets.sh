#!/bin/bash

# セッションシークレットの生成
SESSION_SECRET=$(openssl rand -base64 32)
echo "SESSION_SECRET=${SESSION_SECRET}"

# Redisパスワードの生成（必要な場合）
REDIS_PASSWORD=$(openssl rand -base64 24)
echo "REDIS_PASSWORD=${REDIS_PASSWORD}"

echo "生成されたシークレットをGitHub Secretsに設定してください。"
echo "注意: これらの値は安全な場所に保管し、GitHubにコミットしないでください。" 