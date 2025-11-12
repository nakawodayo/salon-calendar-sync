# LIFF 認証テスト - 最小動作確認プロトタイプ

**作成日**: 2025-11-12
**目的**: LIFF SDK によるユーザー情報取得の実装方法確認
**Phase**: Phase 1（プロトタイピング）

---

## 概要

LINE LIFF SDK の基本機能を検証するための最小プロトタイプ。以下の動作を確認：

1. ✅ LIFF 初期化（`liff.init()`）
2. ✅ ログイン状態確認（`liff.isLoggedIn()`）
3. ✅ ユーザープロフィール取得（`liff.getProfile()`）
4. ✅ アクセストークン取得（`liff.getAccessToken()`）
5. ✅ エラーハンドリング（初期化失敗、権限拒否等）

---

## セットアップ手順

### 1. LINE Developers Console で LIFF アプリを作成

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダーとチャネルを作成（または既存のものを使用）
3. LIFF アプリを追加:
   - **LIFF app name**: `Salon Calendar Sync - Auth Test`
   - **Size**: `Full`
   - **Endpoint URL**: ローカルテスト用の URL（例: `https://your-domain.com/prototypes/mvp/liff-auth-test/index.html`）
   - **Scopes**: `profile` にチェック
   - **Bot link feature**: `On (Aggressive)` または `On (Normal)`
4. 発行された **LIFF ID** をコピー

### 2. LIFF ID を設定

`index.html` ファイルを開き、以下の行を編集：

```javascript
const LIFF_ID = 'YOUR_LIFF_ID_HERE';
```

↓

```javascript
const LIFF_ID = '1234567890-abcdefgh';  // 実際の LIFF ID に置き換え
```

### 3. HTTPS でホスティング

LIFF アプリは HTTPS 環境で動作する必要があります。以下のいずれかの方法でホスティング：

#### オプション1: Vercel（推奨）

```bash
# Vercel CLI をインストール（初回のみ）
npm install -g vercel

# プロジェクトルートから実行
cd /path/to/salon-calendar-sync
vercel --prod
```

#### オプション2: ngrok（ローカル開発用）

```bash
# ローカルサーバーを起動
cd prototypes/mvp/liff-auth-test
python -m http.server 8000

# 別ターミナルで ngrok を起動
ngrok http 8000
```

ngrok が表示する HTTPS URL を LINE Developers Console の Endpoint URL に設定。

#### オプション3: GitHub Pages

1. GitHub リポジトリにプッシュ
2. Settings > Pages で公開設定
3. 生成された URL を Endpoint URL に設定

### 4. LINE で開く

1. テスト用の LINE グループまたは個人チャットにリンクを送信
2. LIFF URL を開く: `https://liff.line.me/{LIFF_ID}`
3. または、LINE Developers Console の「LIFF URL」をクリック

---

## 動作確認項目

プロトタイプを開くと、以下の確認が自動的に実行されます：

### ✅ チェックリスト

- [ ] **LIFF 初期化成功**: エラーなく初期化が完了する
- [ ] **ログイン状態確認**: ログイン済み状態を検出できる
- [ ] **プロフィール取得成功**: ユーザー名とIDを取得できる
- [ ] **プロフィール画像表示**: 画像URLがある場合は表示される
- [ ] **アクセストークン取得**: 有効なトークンが取得できる
- [ ] **LIFF情報表示**: LIFF ID、環境、OSが表示される
- [ ] **エラーハンドリング**: 適切なエラーメッセージが表示される

### 確認方法

1. **UI確認**: 画面に表示される動作確認結果（✅/❌）をチェック
2. **コンソール確認**: ブラウザの開発者ツールでコンソールログを確認
3. **プロフィール確認**: 表示名、ユーザーIDが正しく表示されるか確認

---

## 期待される出力

### 成功時の画面

```
✅ すべての動作確認が完了しました

[プロフィールカード]
- 名前: 田中 ゆき
- ユーザーID: U1234567890abcdef

[LIFF情報]
- LIFF ID: 1234567890-abcdefgh
- ログイン状態: ログイン済み ✅
- 環境: utou
- OS: ios

[動作確認結果]
✅ LIFF 初期化
✅ ログイン状態確認
✅ プロフィール取得
✅ アクセストークン取得
```

### コンソール出力

```
=== LIFF 認証テスト結果 ===
LIFF初期化: OK
ログイン状態: OK
プロフィール取得: OK
ユーザーID: U1234567890abcdef
表示名: 田中 ゆき
アクセストークン: OK
```

---

## エラーハンドリングのテスト

以下のエラーシナリオを意図的に発生させて、適切なエラーメッセージが表示されることを確認：

### 1. 無効な LIFF ID

```javascript
const LIFF_ID = 'invalid-liff-id';
```

**期待される結果**: `LIFF の初期化に失敗しました`

### 2. スコープ不足

LINE Developers Console で `profile` スコープのチェックを外す。

**期待される結果**: `プロフィール権限が必要です`

### 3. 未ログイン状態

初期化後に `liff.logout()` を呼び出す（コードに追加）。

**期待される結果**: `未ログインです。ログインしてください。`

---

## 実装の学び

### 成功パターン

```typescript
// ✅ 正しい実装
await liff.init({ liffId: LIFF_ID });

if (!liff.isLoggedIn()) {
  liff.login();
  return;
}

const profile = await liff.getProfile();
// profile.userId, profile.displayName を使用
```

### 失敗パターン（避けるべき）

```typescript
// ❌ 初期化完了を待たない
liff.init({ liffId: LIFF_ID });  // await なし
const profile = await liff.getProfile();  // 失敗する可能性

// ❌ ログイン状態を確認しない
const profile = await liff.getProfile();  // 未ログイン時エラー

// ❌ エラーハンドリングなし
const profile = await liff.getProfile();  // エラー時にアプリがクラッシュ
```

### 重要なポイント

1. **初期化は必ず `await` で待つ**: 初期化が完了してから他の LIFF API を呼び出す
2. **ログイン状態を常に確認**: `liff.isLoggedIn()` で確認してから `getProfile()` を呼ぶ
3. **try-catch でエラーハンドリング**: すべての LIFF API 呼び出しをエラーハンドリング
4. **エラーコードで適切な対処**: `error.code` に基づいて適切なメッセージを表示

---

## 次のステップ

### Phase 1 完了確認

- [x] LIFF SDK の動作確認完了
- [x] エラーハンドリングパターンの理解
- [x] セキュリティ考慮事項の調査完了
- [ ] 予約リクエスト作成フローとの統合計画

### Phase 2 への移行準備

Phase 2（本番実装）では以下を実装：

1. **Context Provider パターン**: React Context で LIFF 状態を管理
2. **カスタムフック**: `useLiff()`, `useProfile()` の実装
3. **トークンベース認証**: サーバー側でアクセストークンを検証
4. **LineAdapter**: Infrastructure レイヤーに LINE API クライアントを実装
5. **認証ミドルウェア**: Express ミドルウェアでトークン検証

---

## トラブルシューティング

### LIFF SDK が読み込まれない

**症状**: `LIFF SDK の読み込みに失敗しました`

**解決策**:
- インターネット接続を確認
- ブラウザのコンソールで `liff` オブジェクトが存在するか確認
- CDN URL が正しいか確認: `https://static.line-scdn.net/liff/edge/2/sdk.js`

### LIFF 初期化に失敗する

**症状**: `LIFF の初期化に失敗しました`

**解決策**:
- LIFF ID が正しいか確認
- Endpoint URL が HTTPS か確認
- Endpoint URL が実際のホスティング先と一致するか確認
- LINE Developers Console で LIFF アプリが有効化されているか確認

### プロフィールが取得できない

**症状**: `プロフィール権限が必要です`

**解決策**:
- LINE Developers Console で `profile` スコープが選択されているか確認
- LIFF アプリを一度削除して再作成（スコープ変更が反映されない場合）
- ユーザーが権限を拒否していないか確認

### ログインできない

**症状**: `未ログインです。ログインしてください。`

**解決策**:
- LINE アプリから LIFF URL を開いているか確認（外部ブラウザでは自動ログインされない）
- `liff.login()` を呼び出してログインを促す
- LINE アカウントがブロックされていないか確認

---

## 参考資料

- [調査ドキュメント](../../../docs/ai-philosophy/research/liff-user-authentication.md)
- [Phase 1 残作業リスト](../../../docs/ai-philosophy/logs/2025-11-12-phase1-remaining-tasks.md)
- [LINE LIFF ドキュメント](https://developers.line.biz/ja/docs/liff/)
- [LIFF API リファレンス](https://developers.line.biz/ja/reference/liff/)

---

## ファイル構成

```
prototypes/mvp/liff-auth-test/
├── index.html          # メインのHTMLファイル（LIFF SDKの動作確認UI）
└── README.md           # このファイル（セットアップと使い方）
```

---

## 更新履歴

- **2025-11-12**: 初版作成（LIFF SDK 最小動作確認プロトタイプ）
