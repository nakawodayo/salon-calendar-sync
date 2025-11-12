# Google Calendar API 認可フロー 最小動作確認計画

**調査日**: 2025-11-12
**関連**: [Phase 1 要件定義](../logs/2025-11-11-phase1-requirements.md)、[Phase 1 残作業リスト](../logs/2025-11-12-phase1-remaining-tasks.md)

---

## 調査目的

Phase 1 の技術検証として、Google Calendar API の OAuth 2.0 認可フローの実装可能性を確認する。具体的には：

- OAuth 2.0 Web Server Application フローの実装
- トークン管理（アクセストークン、リフレッシュトークン）の動作確認
- Google Calendar API への基本的なアクセス（カレンダー一覧取得、イベント作成）
- ローカル/テスト環境での動作検証
- 本番実装に向けた技術的な実現可能性の確認

---

## Google Calendar API OAuth 2.0 フロー概要

### 認可フローの全体像

```
1. アプリ → Google: 認可リクエスト（認可 URL にリダイレクト）
2. ユーザー → Google: ログイン・権限付与の同意
3. Google → アプリ: 認可コード（リダイレクト URI 経由）
4. アプリ → Google: 認可コードをアクセストークンと交換
5. Google → アプリ: アクセストークン + リフレッシュトークン
6. アプリ → Google Calendar API: アクセストークンを使って API 呼び出し
7. (トークン期限切れ時) アプリ → Google: リフレッシュトークンで新しいアクセストークンを取得
```

### Web Server Application フロー

本プロジェクトでは **Web Server Application フロー**（Authorization Code Flow）を使用します。このフローは：

- サーバー側でトークンを安全に管理できる
- リフレッシュトークンが取得可能（長期間のアクセスに適している）
- ユーザーの明示的な同意が必要（セキュリティが高い）

### スコープの選択

最小検証では以下のスコープを使用：

- `https://www.googleapis.com/auth/calendar.readonly` - カレンダー一覧取得（読み取り専用）
- `https://www.googleapis.com/auth/calendar.events` - イベントの作成・編集

本番実装では、必要最小限のスコープに絞る（最小権限の原則）。

---

## 必要な事前準備

### 1. GCP プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（例: `salon-calendar-sync-dev`）
3. プロジェクトを選択

### 2. Google Calendar API の有効化

1. 「API とサービス」→ 「ライブラリ」に移動
2. 「Google Calendar API」を検索
3. 「有効にする」をクリック

### 3. OAuth 2.0 認証情報の取得

1. 「API とサービス」→ 「認証情報」に移動
2. 「認証情報を作成」→ 「OAuth クライアント ID」を選択
3. アプリケーションの種類: **ウェブ アプリケーション**
4. 承認済みのリダイレクト URI を設定
   - ローカルテスト用: `http://localhost:3000/oauth2callback`
   - 本番用（将来）: `https://your-domain.com/oauth2callback`
5. Client ID と Client Secret をダウンロード（`credentials.json`）

### 4. OAuth 同意画面の設定

1. 「OAuth 同意画面」に移動
2. ユーザータイプ: **外部**（テスト段階）
3. アプリ情報を入力
   - アプリ名: `Salon Calendar Sync`
   - サポートメール: 開発者のメールアドレス
4. スコープを追加
   - `calendar.readonly`
   - `calendar.events`
5. テストユーザーを追加（美容師の Google アカウント）

---

## 使用ライブラリ

### googleapis

Google の公式 Node.js クライアントライブラリ。

```bash
npm install googleapis
```

**主要機能**:
- OAuth 2.0 認証
- Google Calendar API の全機能にアクセス
- トークンの自動更新（設定次第）

### @google-cloud/local-auth (開発用)

ローカル開発用の簡易認証ライブラリ（Quickstart で使用）。

```bash
npm install @google-cloud/local-auth
```

**用途**: ローカルでの動作確認・プロトタイプ作成（本番実装では使用しない）

---

## 実装手順（ステップバイステップ）

### Step 1: GCP Console 設定

上記「必要な事前準備」を完了させる。

### Step 2: プロジェクト構造の作成

```
prototypes/mvp/calendar-auth-test/
├── package.json
├── credentials.json          # GCP からダウンロード（Git 管理外）
├── token.json               # 認証後に生成（Git 管理外）
├── .gitignore
├── auth.js                  # 認証フロー実装
├── test-list-calendars.js   # カレンダー一覧取得テスト
└── test-create-event.js     # イベント作成テスト
```

`.gitignore` に以下を追加:
```
credentials.json
token.json
node_modules/
```

### Step 3: OAuth 2.0 クライアントの初期化

`auth.js` の実装例:

```javascript
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const url = require('url');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

/**
 * OAuth 2.0 クライアントを作成
 */
async function createOAuth2Client() {
  const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH));
  const { client_id, client_secret } = credentials.web || credentials.installed;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    REDIRECT_URI
  );

  return oauth2Client;
}

/**
 * 認可 URL を生成
 */
function getAuthUrl(oauth2Client) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',  // リフレッシュトークンを取得
    scope: SCOPES,
    prompt: 'consent'        // 毎回同意画面を表示（テスト用）
  });
}

/**
 * 認可コードをトークンと交換
 */
async function getTokenFromCode(oauth2Client, code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  return tokens;
}

/**
 * 保存されたトークンを読み込み
 */
async function loadSavedToken(oauth2Client) {
  try {
    const token = JSON.parse(await fs.readFile(TOKEN_PATH));
    oauth2Client.setCredentials(token);
    return oauth2Client;
  } catch (err) {
    return null;
  }
}

/**
 * 認証フローを実行（初回のみ）
 */
async function authenticate() {
  const oauth2Client = await createOAuth2Client();

  // 既存のトークンがあれば使用
  const savedClient = await loadSavedToken(oauth2Client);
  if (savedClient) {
    console.log('既存のトークンを使用します');
    return savedClient;
  }

  // 認証フローを開始
  const authUrl = getAuthUrl(oauth2Client);
  console.log('以下の URL にアクセスして認証してください:');
  console.log(authUrl);

  // ローカルサーバーでコールバックを受け取る
  const code = await getAuthorizationCode();
  await getTokenFromCode(oauth2Client, code);

  console.log('認証が完了しました。トークンを保存しました。');
  return oauth2Client;
}

/**
 * ローカルサーバーで認可コードを受け取る
 */
function getAuthorizationCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
        const code = qs.get('code');

        res.end('認証が完了しました。このウィンドウを閉じてください。');
        server.close();
        resolve(code);
      } catch (err) {
        reject(err);
      }
    }).listen(3000, () => {
      console.log('ローカルサーバーがポート 3000 で起動しました');
    });
  });
}

module.exports = { authenticate };
```

### Step 4: カレンダー一覧取得のテスト

`test-list-calendars.js` の実装例:

```javascript
const { google } = require('googleapis');
const { authenticate } = require('./auth');

async function listCalendars() {
  const auth = await authenticate();
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.calendarList.list();
  const calendars = res.data.items;

  if (!calendars || calendars.length === 0) {
    console.log('カレンダーが見つかりませんでした。');
    return;
  }

  console.log('カレンダー一覧:');
  calendars.forEach((cal) => {
    console.log(`- ${cal.summary} (${cal.id})`);
  });
}

listCalendars().catch(console.error);
```

### Step 5: イベント作成のテスト

`test-create-event.js` の実装例:

```javascript
const { google } = require('googleapis');
const { authenticate } = require('./auth');

async function createTestEvent() {
  const auth = await authenticate();
  const calendar = google.calendar({ version: 'v3', auth });

  // テストイベント
  const event = {
    summary: 'テスト予約（アプリから作成）',
    description: '【Salon Calendar Sync】\nメニュー: カット\nお客様: テストユーザー',
    start: {
      dateTime: '2025-11-20T10:00:00+09:00',
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: '2025-11-20T11:00:00+09:00',
      timeZone: 'Asia/Tokyo',
    },
  };

  // カレンダー ID（'primary' = メインカレンダー）
  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  console.log('イベントが作成されました:');
  console.log(`- イベント ID: ${res.data.id}`);
  console.log(`- リンク: ${res.data.htmlLink}`);
}

createTestEvent().catch(console.error);
```

### Step 6: 実行とテスト

```bash
# ディレクトリに移動
cd prototypes/mvp/calendar-auth-test

# 依存関係インストール
npm install googleapis

# 認証 & カレンダー一覧取得
node test-list-calendars.js

# イベント作成
node test-create-event.js
```

初回実行時:
1. コンソールに認証 URL が表示される
2. ブラウザで URL を開く
3. Google アカウントでログイン
4. 権限付与に同意
5. リダイレクトされ、認可コードが取得される
6. トークンが `token.json` に保存される

2回目以降は、保存されたトークンを使用して自動的に API 呼び出しが可能。

---

## トークン管理戦略

### アクセストークン

- **有効期限**: 約 1 時間
- **用途**: API 呼び出しに使用
- **更新**: リフレッシュトークンで自動更新可能

### リフレッシュトークン

- **取得条件**: `access_type: 'offline'` を指定
- **有効期限**: 基本的に無期限（ユーザーが取り消すまで）
- **用途**: アクセストークンの更新

### トークンの自動更新

`googleapis` ライブラリは、リフレッシュトークンがあれば自動的にアクセストークンを更新します。

```javascript
// トークンの自動更新を有効化
oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    // リフレッシュトークンを保存
    console.log('新しいリフレッシュトークンを取得しました');
    // token.json を更新
  }
  console.log('アクセストークンを更新しました');
});
```

### 本番実装での考慮事項

- **トークンの安全な保存**: Firestore の暗号化フィールドまたは Secret Manager
- **トークンの有効期限管理**: 期限切れ時の再認証フロー
- **エラーハンドリング**: 認証エラー時の適切なユーザー通知

---

## テスト方法

### 1. ローカル環境でのテスト

上記 Step 6 の手順で実行。

### 2. テストカレンダーの使用

本番のカレンダーを汚さないため、テスト用のカレンダーを作成：

1. Google Calendar でテスト用カレンダーを作成（例: `Salon Test Calendar`）
2. カレンダー ID を取得（カレンダー設定 → 「カレンダーの統合」）
3. テストコードで `calendarId` を指定

```javascript
const res = await calendar.events.insert({
  calendarId: 'your-test-calendar-id@group.calendar.google.com',
  resource: event,
});
```

### 3. 動作確認項目

- [ ] OAuth 2.0 認可フローが完了する
- [ ] `token.json` が生成される
- [ ] リフレッシュトークンが含まれている（`refresh_token` フィールド）
- [ ] カレンダー一覧が取得できる
- [ ] テストイベントが作成できる
- [ ] Google Calendar UI で作成されたイベントが確認できる
- [ ] 2回目以降の実行で認証なしで API 呼び出しができる

---

## 成功基準

以下の条件を満たせば、技術検証は成功と判断：

1. **OAuth 2.0 認可が完了すること**
   - 認証 URL からのリダイレクトが成功
   - 認可コードが取得できる

2. **リフレッシュトークンが取得できること**
   - `token.json` に `refresh_token` フィールドが存在
   - `access_type: 'offline'` の設定が有効

3. **カレンダー一覧が取得できること**
   - `calendar.calendarList.list()` が成功
   - カレンダー名と ID が表示される

4. **テストイベントが作成できること**
   - `calendar.events.insert()` が成功
   - Google Calendar UI でイベントが確認できる

5. **トークンの永続化が機能すること**
   - 2回目以降の実行で認証なしで API 呼び出し可能
   - アクセストークン期限切れ時に自動更新される

---

## リスクと対策

### 1. 認証情報の安全な管理

**リスク**: `credentials.json` や `token.json` が Git にコミットされる

**対策**:
- `.gitignore` に必ず追加
- 本番環境では環境変数または Secret Manager を使用
- トークンはデータベースに暗号化して保存

### 2. トークン期限切れの処理

**リスク**: リフレッシュトークンが取得できない、またはリフレッシュに失敗

**対策**:
- `access_type: 'offline'` を必ず指定
- `prompt: 'consent'` でテスト時は毎回同意画面を表示
- トークン更新失敗時は再認証フローに誘導

### 3. リダイレクト URI の設定ミス

**リスク**: OAuth 認可後のリダイレクトが失敗

**対策**:
- GCP Console の設定と実装の URI を一致させる
- ローカル: `http://localhost:3000/oauth2callback`
- 本番: `https://your-domain.com/oauth2callback`

### 4. スコープの過剰な権限

**リスク**: 必要以上のスコープを要求し、ユーザーが拒否する

**対策**:
- 最小限のスコープのみ要求（最小権限の原則）
- 必要に応じて段階的に権限を追加

### 5. 同時アクセスとレート制限

**リスク**: Google Calendar API のレート制限に達する

**対策**:
- リトライロジックの実装（Exponential Backoff）
- キャッシュの活用（カレンダー情報など）
- 参照: [エラーハンドリングとリトライロジック方針](../design/2025-11-11-error-handling-retry.md)

---

## 次のステップ

### 1. 本番実装への反映事項

- [ ] バックエンド（Cloud Functions）への統合
  - OAuth 2.0 フローを API エンドポイントとして実装
  - `/auth/google` - 認可 URL へリダイレクト
  - `/auth/google/callback` - 認可コード受け取り
  - `/auth/google/status` - 認証状態確認

- [ ] トークンの永続化
  - Firestore に美容師の認証情報を保存
  - トークンの暗号化（必須）
  - リフレッシュトークンの自動更新

- [ ] エラーハンドリング
  - 認証失敗時の処理
  - トークン期限切れ時の再認証フロー
  - API エラー時のリトライロジック

### 2. セキュリティ考慮事項

- [ ] **認証情報の保護**
  - `credentials.json` を環境変数または Secret Manager に移行
  - トークンの暗号化保存

- [ ] **HTTPS の使用**
  - 本番環境では必ず HTTPS を使用
  - リダイレクト URI も HTTPS に変更

- [ ] **CSRF 対策**
  - `state` パラメータの使用（OAuth 2.0 のベストプラクティス）

- [ ] **ログ記録**
  - 認証試行のログ
  - API 呼び出しのログ
  - エラーのログ
  - 参照: [ログとモニタリング方針](../design/2025-11-11-logging-monitoring.md)

### 3. Phase 2 への移行判断材料

技術検証が成功したら、以下を確認して Phase 2（本実装）への移行を判断：

- [ ] OAuth 2.0 フローが期待通り動作した
- [ ] トークン管理の仕組みが理解できた
- [ ] Google Calendar API の基本操作が確認できた
- [ ] セキュリティリスクが洗い出され、対策が明確になった
- [ ] 本番実装に向けた技術的な不明点がない

---

## 参考リンク

### 公式ドキュメント

- [Google Calendar API - Node.js Quickstart](https://developers.google.com/calendar/api/quickstart/nodejs)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [googleapis - Node.js Client Library](https://github.com/googleapis/google-api-nodejs-client)

### 関連ドキュメント

- [Phase 1 要件定義](../logs/2025-11-11-phase1-requirements.md)
- [Phase 1 残作業リスト](../logs/2025-11-12-phase1-remaining-tasks.md)
- [システム設計](../design/2025-11-11-system-design.md)
- [エラーハンドリングとリトライロジック方針](../design/2025-11-11-error-handling-retry.md)
- [ログとモニタリング方針](../design/2025-11-11-logging-monitoring.md)

---

## 更新履歴

- **2025-11-12**: 初版作成（Google Calendar API 認可フローの技術調査と検証計画）
