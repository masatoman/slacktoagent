# プロジェクト状態管理

## 現在の作業フェーズ
- 実装フェーズ: Phase 1
- 作業項目: タイムアウト制御の実装
- 進捗状況: 未着手

## 重要な設定・情報
### リポジトリ情報
- リポジトリURL: git@github.com:masatoman/slacktoagent.git
- ブランチ: main

### 環境設定
- Node.js version: v20.15.0
- OS: darwin 24.3.0
- ワークスペースパス: /Volumes/Samsung/Works/remoteCursor

### Slack設定
- Webhook URL: 設定済み（.envファイルに記載）
- 通知チャンネル: 未設定

## 実装済み機能
1. 基本設定
   - .env設定
   - .gitignore設定
   - 基本ドキュメント作成

## 次のタスク
1. AgentExecutorクラスの作成
2. タイムアウト制御の実装
3. プロセス監視の実装

## 注意事項
- 実装はTODO.mdに従って進める
- 懸念点はTODO2.mdに記録
- 各フェーズでテストを実施

## コミュニケーション履歴
- Slackインタラクティブ機能の計画を策定
- エラーハンドリング設計の追加
- フェーズ分けによる実装計画の作成

## プロジェクトルール
### 1. ブランチ管理
- 機能実装は`feature/`ブランチで作業
- バグ修正は`fix/`ブランチで作業
- リリースは`release/`ブランチで管理
- 本番環境は`main`ブランチで管理

### 2. コミットルール
- プレフィックス規則
  - `feat:` 新機能
  - `fix:` バグ修正
  - `docs:` ドキュメント
  - `test:` テストコード
  - `refactor:` リファクタリング
  - `chore:` その他

### 3. ファイル管理
- `src/`: ソースコード
- `tests/`: テストコード
- `docs/`: ドキュメント
- `config/`: 設定ファイル
- `scripts/`: スクリプト

### 4. エラーハンドリング
- すべての非同期処理は適切なtry-catch
- エラーは必ずログに記録
- ユーザーへの通知は日本語で分かりやすく

### 5. テストルール
- 新機能は必ずテストを作成
- テストカバレッジ80%以上を維持
- E2Eテストは重要な機能のみ

### 6. レビュールール
- PRは機能単位で作成
- レビュー前にセルフレビュー実施
- TODO/TODO2の更新を確認

### 7. ドキュメント管理
- コードの変更は必ずドキュメントに反映
- 重要な決定は`DECISIONS.md`に記録
- APIの変更は`API.md`に記録

### 8. 環境変数
- 機密情報は必ず`.env`で管理
- 開発環境用の値は`.env.example`に記載
- 本番環境の値は別途安全に管理

### 9. 作業開始時のチェックリスト
1. `PROJECT_STATE.md`の確認
2. `git pull`で最新化
3. 適切なブランチの作成
4. 環境変数の確認
5. 依存パッケージの確認

### 10. 作業終了時のチェックリスト
1. テストの実行
2. リンター/フォーマッターの実行
3. ドキュメントの更新
4. `PROJECT_STATE.md`の更新
5. コミット前の変更確認

## Cursorエージェント固有の設定
### 1. エージェントコンテキスト
```json
{
  "current_context": {
    "task": "エラーハンドリング実装",
    "phase": "Phase 1",
    "files_in_context": [
      "src/services/AgentExecutor.js",
      "tests/agentExecutor.test.js",
      "src/config/agentConfig.js"
    ],
    "recent_changes": [
      "タイムアウト制御の追加",
      "プロセス監視の実装"
    ]
  }
}
```

### 2. エージェントメモリ管理
- 各セッションの開始時に以下を提供
  ```
  <context>
  前回のセッション終了時の状態：
  - 作業中のファイル: src/services/AgentExecutor.js
  - 実装中の機能: タイムアウト制御
  - 直近の変更: プロセス監視機能の追加
  - 未解決の課題: メモリリーク検出の閾値設定
  </context>
  ```

### 3. エージェントコマンド規則
- コマンド実行時の標準フォーマット
  ```bash
  cursor-agent exec \
    --agent "error-handler" \
    --context "phase1-timeout" \
    --memory-file "./agent_memory.json" \
    --prompt "タイムアウト制御を実装して"
  ```

### 4. エージェント設定ファイル
```yaml
agent_config:
  name: error-handler
  timeout: 300
  memory_file: ./agent_memory.json
  context_file: ./agent_context.json
  templates:
    - timeout_control
    - process_monitor
    - error_handler
```

### 5. エージェント間の引き継ぎ
- 必要な情報を`<additional_data>`タグで提供
  ```xml
  <additional_data>
  <current_task>
    タイムアウト制御の実装
  </current_task>
  <progress>
    - AgentExecutorクラスの基本実装完了
    - タイムアウト機能を実装中
  </progress>
  <next_steps>
    - プロセス監視の追加
    - エラーハンドリングの実装
  </next_steps>
  </additional_data>
  ```

### 6. エージェントの制約事項
- 最大実行時間: 5分
- メモリ使用制限: 1GB
- 同時実行数: 1
- ファイル変更の制限: src/配下のみ

### 7. エージェント実行環境
- Node.js version: v20.15.0
- Cursor version: latest
- 必要な依存関係:
  ```json
  {
    "@slack/bolt": "^3.17.0",
    "node-ps": "^0.1.6",
    "winston": "^3.11.0"
  }
  ```

### 8. デバッグ情報
- ログレベル: DEBUG
- ログ出力先: ./logs/agent.log
- メトリクス収集: 有効
- プロファイリング: 無効

### 9. エージェント通信プロトコル
- 標準入出力を使用
- JSONフォーマットでデータ交換
- エラーは stderr に出力
- 状態更新は5秒ごと

### 10. 作業記録
- 各セッションの開始時にコンテキストを記録
- 重要な決定事項は`DECISIONS.md`に記録
- エラーパターンは`ERROR_PATTERNS.md`に記録
- 解決策は`SOLUTIONS.md`に記録

## 最終更新
- 日時: 2024-03-21
- 更新者: Claude
- 更新内容: Cursorエージェント固有の情報を追加 