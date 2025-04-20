# GitHub Secrets設定手順

## 必要なシークレット一覧

### Docker関連
| シークレット名 | 説明 | 取得方法 |
|--------------|------|----------|
| `DOCKERHUB_USERNAME` | DockerHubのユーザー名 | DockerHubのアカウント名 |
| `DOCKERHUB_TOKEN` | DockerHubのアクセストークン | DockerHub > Security > New Access Token |

### SSH関連
| シークレット名 | 説明 | 取得方法 |
|--------------|------|----------|
| `SSH_HOST` | デプロイ先サーバーのホスト名 | サーバーのIPアドレスまたはドメイン |
| `SSH_USERNAME` | SSHユーザー名 | デプロイ用のユーザー名 |
| `SSH_PRIVATE_KEY` | SSHプライベートキー | `cat ~/.ssh/id_ed25519` の出力 |

### アプリケーション関連
| シークレット名 | 説明 | 取得方法 |
|--------------|------|----------|
| `SESSION_SECRET` | セッション暗号化キー | ランダムな文字列を生成 |
| `REDIS_URL` | Redisの接続URL | `redis://hostname:6379` |
| `SLACK_WEBHOOK_URL` | Slack通知用URL | Slack App設定から取得 |

## 設定手順

1. GitHubリポジトリの Settings > Secrets and variables > Actions に移動
2. "New repository secret" をクリック
3. 各シークレットを順番に追加：

### セキュリティのベストプラクティス
- シークレットは定期的にローテーション（更新）する
- 本番環境とステージング環境で異なるシークレットを使用
- アクセストークンの権限は必要最小限に設定

### トラブルシューティング
- シークレットが正しく設定されているか確認：GitHub Actionsのログを確認
- SSHキーのフォーマットが正しいか確認：改行を含めて完全なキーをコピー
- DockerHubトークンの権限が十分か確認：read/write権限が必要 