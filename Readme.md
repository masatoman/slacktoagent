# ShiftWith プロジェクト - Cursorエージェントを活用した自動化

### **概要**
このプロジェクトでは、`cursor-agent` を使用して、**外部からの指示に基づいて**動画生成やプロンプト実行を自動化します。  
主に**スマホや外出先から**操作できるように、WebhookやCloudflare Tunnelを組み合わせたシステムを構築します。

---

## **基本ルールと進行フロー**

### **1. プロンプト実行フロー**
1. **スマホから指示送信**
    - 指定したプロンプト（例：「ギバー向け英語動画を作って」）をスマホから送信する。
2. **Webhookサーバーが受信**
    - `localhost:3000/run` にPOSTリクエストが送られる。
    - リクエストボディには、実行したいプロンプトが含まれる。
3. **Cursorエージェントが実行**
    - Webhookサーバーが`cursor-agent exec`コマンドを実行し、指定されたプロンプトを処理する。
    - 例：`cursor-agent exec --agent "video-generator" --prompt "ギバー向け英語動画を作って"`
4. **結果を取得**
    - プロンプトの実行結果が出力され、Slack通知またはログとして結果を確認する。

### **2. 必須の準備**
1. **Cursorエージェントのインストール**
    - `cursor-agent`をインストールし、エージェント（例：`video-generator`）が正しく設定されていることを確認する。
    - `cursor-agent exec`コマンドが動作することを事前に確認。
2. **Webhookサーバーの構築**
    - `express`を使った簡単なWebhookサーバーを作成し、外部からのリクエストを受け取れるようにする。
    - Webhookサーバーが`cursor-agent`を呼び出して実行する役割を担う。

### **3. Cloudflare Tunnelで外部公開**
1. **Cloudflare Tunnelの設定**
    - Cloudflare Tunnelを使って、ローカルで立てたWebhookサーバー（`localhost:3000`）を外部からアクセスできるようにする。
    - `cloudflared tunnel`コマンドでトンネルを立てる。
2. **URL公開**
    - `https://yourname.trycloudflare.com` というURLを取得し、スマホや他のデバイスからアクセスできるようにする。

### **4. スマホからの操作**
1. **PostmanやiOSショートカットを使用**
    - スマホからPostmanアプリまたはiOSのショートカットを使って、POSTリクエストを送信する。
    - URL: `https://yourname.trycloudflare.com/run`
    - Method: POST
    - Body: `{ "prompt": "ギバー向け英語動画を作って" }`
    
### **5. 結果の確認**
- **Slack通知**や**ローカルファイル**として、実行結果を受け取る。
- 必要に応じて、ログを保存して後で確認。

---

## **セットアップ手順**

### **1. 必要なパッケージのインストール**
```bash
npm init -y  # プロジェクトの初期化
npm install express child_process
```

### **2. Webhookサーバーの作成**
以下のコードを `webhook.js` として保存：

```js
import express from "express";
import { exec } from "child_process";

const app = express();
app.use(express.json());

app.post("/run", (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).send("No prompt provided");

  // Cursorエージェントを実行
  exec(`cursor-agent exec --agent "video-generator" --prompt "${prompt}"`, (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    return res.send(stdout);  // 成功した場合の出力
  });
});

app.listen(3000, () => console.log("Webhookサーバーが http://localhost:3000 で稼働中"));
```

### **3. サーバーの起動**
```bash
node webhook.js
```

### **4. Cloudflare Tunnelの設定**
```bash
npm install -g cloudflared
cloudflared tunnel --url http://localhost:3000
```

### **5. スマホからリクエスト送信**
PostmanやiOSショートカットを使って、上記のURLに対してPOSTリクエストを送信。

---

## **拡張/追加機能**
- **Slack通知機能**の追加：`cursor-agent` の実行後、Slackに通知が送信されるようにする。
- **実行履歴の保存**：実行したプロンプトやその結果をローカルまたはデータベースに保存する。

---

## **注意事項**
- **セキュリティ対策**：プロジェクトを公開する際は、認証やAPIキーなどを使用して、外部アクセスを制限することをお勧めします。
- **エラー処理**：エラーが発生した場合、適切なエラーメッセージや通知を行い、ユーザーにフィードバックを返すようにしてください。

---

### **今後のロードマップ**
1. プロンプトのバリエーションを増やす
2. より複雑なワークフロー（例えば、ユーザー入力のダイナミックな処理）
3. より高度なエージェント連携や自動化

---

## **まとめ**
このプロジェクトでは、Cursorエージェントを使って、スマホから簡単に操作できるシステムを構築しています。  
WebhookとCloudflare Tunnelを利用することで、外出先からも自宅PCで動作するCursorエージェントを遠隔操作できます。

## **Slackインタラクティブ機能**

### **概要**
Slackアプリを通じて、スマートフォンからエージェントを操作できる機能を提供します。
Slackの無料プランでも利用可能な機能を活用し、直感的な操作を実現します。

### **主な機能**
1. **Slashコマンド**
   - `/agent-run` - エージェントの実行
   - `/agent-status` - 実行中のエージェントの状態確認
   - `/agent-help` - 使用可能なコマンドの一覧表示

2. **インタラクティブコンポーネント**
   - エージェント選択用ドロップダウンメニュー
   - プロンプトテンプレート選択メニュー
   - 実行/キャンセルボタン
   - 実行結果への応答ボタン（再実行、修正など）

3. **通知機能の拡張**
   - 実行状態のリアルタイム更新
   - エラー発生時の対応オプション表示
   - 実行結果へのクイックアクション

### **セットアップ手順**
1. **Slack App の設定**
   ```bash
   # 必要なパッケージのインストール
   npm install @slack/bolt
   ```

2. **アプリの初期設定**
   - Slack APIダッシュボードでアプリを作成
   - インタラクティブコンポーネントの有効化
   - Slash コマンドの登録
   - OAuth & Permissions の設定

3. **環境変数の設定**
   ```env
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_APP_TOKEN=xapp-your-app-token
   ```

### **使用例**
1. **エージェント実行**
   ```
   /agent-run
   > エージェントを選択してください
   > [ドロップダウンメニュー]
   > プロンプトを入力してください
   > [テキスト入力]
   > [実行] [キャンセル]
   ```

2. **実行結果の表示**
   ```
   エージェント実行結果
   ステータス: 成功 ✅
   実行時間: 2024/03/21 15:30
   [再実行] [修正] [詳細]
   ```

### **セキュリティ考慮事項**
- Slack ワークスペースメンバーのみがアクセス可能
- コマンド実行権限の制御
- センシティブな情報の保護

### **今後の拡張予定**
1. カスタムプロンプトテンプレートの保存機能
2. 定期実行のスケジュール設定
3. 実行履歴の検索・フィルタリング機能

### **ドキュメント表示機能**
1. **Markdownプレビュー**
   - 生成されたドキュメントをSlackメッセージとして整形して表示
   - コードブロックやテーブルも適切にフォーマット
   - 長文の場合は自動的に分割して表示

2. **ファイル共有オプション**
   - Google Docsへの自動エクスポート
   - Notionへの自動同期
   - PDFファイルとしての共有

3. **閲覧性向上機能**
   - 目次の自動生成
   - セクションごとの展開/折りたたみ
   - スマートフォンに最適化されたビュー

4. **インタラクション**
   - セクションごとの編集リクエスト
   - コメント追加機能
   - 変更履歴の表示

### **使用例（ドキュメント操作）**
```
/agent-doc-view README.md
> 📄 README.md の内容：
> [目次を表示]
> [セクション1を表示]
> [セクション2を表示]
> ...
> [Google Docsで開く] [PDFでエクスポート]

/agent-doc-edit README.md
> 編集したいセクションを選択してください：
> [セクション1]
> [セクション2]
> ...
> [新しいセクションを追加]
```

## **エラーハンドリング設計**

### **1. タイムアウト制御**
1. **実行時間制限**
   - デフォルトタイムアウト：5分
   - カスタムタイムアウト設定可能
   - タイムアウト時の強制終了機能

2. **進捗モニタリング**
   - 30秒ごとの進捗状況確認
   - メモリ使用量の監視
   - CPU使用率の監視

3. **インタラプト機能**
   ```
   /agent-stop
   > 実行中のエージェントを停止します
   > [即時停止] [グレースフル停止]
   ```

### **2. エラーパターンと対応**
1. **無限ループ検知**
   - CPU使用率の継続的な高負荷を検知
   - メモリ使用量の急激な増加を検知
   - 同一パターンの処理の繰り返しを検知

2. **応答なし状態の処理**
   - Cursorプロセスの状態確認
   - 子プロセスの強制終了
   - クリーンアップ処理の実行

3. **リカバリー機能**
   - 最後の安定状態への復帰
   - 一時ファイルのクリーンアップ
   - セッション情報の保存

### **3. ユーザー通知**
1. **エラー通知フォーマット**
   ```
   🚨 エラー発生
   タイプ: 実行タイムアウト
   エージェント: video-generator
   経過時間: 5分
   状態: 応答なし
   
   [プロセス終了] [延長] [詳細]
   ```

2. **アクションオプション**
   - プロセス強制終了
   - タイムアウト時間の延長
   - デバッグ情報の表示
   - ログの保存

### **4. 実装例**
```javascript
class AgentExecutor {
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs || 5 * 60 * 1000; // 5分
    this.checkIntervalMs = options.checkIntervalMs || 30 * 1000; // 30秒
    this.maxMemoryMB = options.maxMemoryMB || 1024; // 1GB
  }

  async executeWithTimeout(command) {
    const process = spawn('cursor-agent', [...command.split(' ')]);
    const timer = setTimeout(() => {
      this.handleTimeout(process);
    }, this.timeoutMs);

    const monitor = setInterval(() => {
      this.checkProcessHealth(process);
    }, this.checkIntervalMs);

    try {
      return await this.waitForCompletion(process);
    } finally {
      clearTimeout(timer);
      clearInterval(monitor);
    }
  }

  handleTimeout(process) {
    this.notifyTimeout();
    this.gracefulShutdown(process);
  }

  async gracefulShutdown(process) {
    // SIGTERM送信後、一定時間待機してもプロセスが終了しない場合はSIGKILL
    process.kill('SIGTERM');
    await sleep(5000);
    if (this.isProcessRunning(process)) {
      process.kill('SIGKILL');
    }
  }
}
```

### **5. 監視メトリクス**
1. **基本メトリクス**
   - 実行時間
   - メモリ使用量
   - CPU使用率
   - ディスク使用量

2. **アラート条件**
   - 実行時間 > タイムアウト設定
   - メモリ使用量 > 設定上限の80%
   - CPU使用率 > 90%が1分以上継続
   - ディスク空き容量 < 1GB

### **6. リカバリープロセス**
1. エラー発生時の自動保存
2. バックアップからの復元
3. エラーレポートの生成
4. 再実行オプションの提供
