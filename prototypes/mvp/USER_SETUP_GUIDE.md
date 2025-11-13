# MVP セットアップ手順書（ユーザー作業）

**作成日**: 2025-11-13
**関連**: [MVP 実装計画](../../docs/ai-philosophy/logs/2025-11-13-mvp-implementation-plan.md)

---

## 概要

この手順書では、MVP プロトタイプを動作させるために**ユーザー自身が行う必要がある設定作業**を説明します。

**所要時間**: 約 30-60 分

---

## 前提条件

- Google アカウントを持っている
- LINE Developers アカウントを持っている（または作成可能）
- Firebase プロジェクトを作成できる

---

## ステップ 1: Firebase プロジェクトの作成

### 1.1 Firebase Console にアクセス

1. https://console.firebase.google.com/ にアクセス
2. Google アカウントでログイン

### 1.2 新しいプロジェクトを作成

1. 「プロジェクトを追加」をクリック
2. プロジェクト名を入力（例: `salon-calendar-sync-dev`）
3. Google アナリティクスは**無効**でOK（今回は不要）
4. 「プロジェクトを作成」をクリック

### 1.3 Firestore Database を作成

1. 左メニューから「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. ロケーションを選択（推奨: `asia-northeast1`（東京））
4. **「テストモードで開始」を選択**（開発用）
   - ⚠ 本番環境では使用しないでください
5. 「有効にする」をクリック

### 1.4 Web アプリを追加

1. プロジェクトの概要ページに戻る
2. 「ウェブアプリに Firebase を追加」（`</>`アイコン）をクリック
3. アプリのニックネームを入力（例: `salon-calendar-sync-mvp`）
4. 「Firebase Hosting を設定」は**チェックしない**
5. 「アプリを登録」をクリック
6. **Firebase SDK の設定情報をコピー**（後で使用）
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
7. この情報を**安全な場所に保存**（後で `.env.local` に使用）

---

## ステップ 2: LINE Developers でLIFF アプリを作成

### 2.1 LINE Developers Console にアクセス

1. https://developers.line.biz/console/ にアクセス
2. LINE アカウントでログイン

### 2.2 新しいプロバイダーを作成（初回のみ）

1. 「Create」ボタンをクリック
2. プロバイダー名を入力（例: `SalonCalendarSync`）
3. 「Create」をクリック

### 2.3 新しいチャネルを作成

1. 作成したプロバイダーをクリック
2. 「Create a new channel」をクリック
3. チャネルタイプは **「LINE Login」** を選択
4. 必要事項を入力:
   - Channel name: `Salon Calendar Sync MVP`
   - Channel description: `美容室予約管理アプリ（開発用）`
   - App types: **「Web app」** にチェック
5. 利用規約に同意してチェック
6. 「Create」をクリック

### 2.4 LIFF アプリを追加

1. 作成したチャネルの設定画面に移動
2. 「LIFF」タブを選択
3. 「Add」ボタンをクリック
4. LIFF アプリの情報を入力:
   - **LIFF app name**: `Salon Calendar Sync MVP`
   - **Size**: `Full`
   - **Endpoint URL**: 一旦ダミーURL `https://example.com` を入力（後で更新）
   - **Scopes**: `profile` にチェック（`openid` は自動選択）
   - **Bot link feature**: `Off` (Aggressive) を選択
5. 「Add」をクリック
6. **LIFF ID をコピー**（例: `1234567890-abcdefgh`）
7. この情報を**安全な場所に保存**（後で `.env.local` に使用）

### 2.5 LIFF の Endpoint URL を更新（プロジェクト起動後）

⚠ この手順は、Next.js プロジェクトが起動した後に実行してください。

1. Next.js プロジェクトを起動（`npm run dev`）
2. ローカル開発サーバーの URL を確認（例: `http://localhost:3000`）
3. LIFF の設定画面に戻る
4. 「Edit」をクリック
5. **Endpoint URL** を `http://localhost:3000` に変更
6. 「Update」をクリック

**重要**: 本番デプロイ時には、本番URLに変更する必要があります。

---

## ステップ 3: Google Cloud Console で OAuth 2.0 クライアントを作成

### 3.1 Google Cloud Console にアクセス

1. https://console.cloud.google.com/ にアクセス
2. Google アカウントでログイン

### 3.2 新しいプロジェクトを作成（または既存のFirebaseプロジェクトを使用）

1. 画面上部のプロジェクト選択ドロップダウンをクリック
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を入力（例: `salon-calendar-sync-dev`）
   - Firebase プロジェクトと同じ名前にすると管理しやすい
4. 「作成」をクリック

### 3.3 Google Calendar API を有効化

1. 左メニューから「APIとサービス」→「ライブラリ」を選択
2. 検索バーで「Google Calendar API」を検索
3. 「Google Calendar API」をクリック
4. 「有効にする」をクリック

### 3.4 OAuth 2.0 クライアント ID を作成

1. 左メニューから「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「OAuth クライアント ID」をクリック
3. 「OAuth 同意画面」の設定を求められた場合:
   - User Type: **「外部」** を選択
   - 「作成」をクリック
   - アプリ名: `Salon Calendar Sync MVP`
   - ユーザーサポートメール: 自分のメールアドレス
   - デベロッパーの連絡先: 自分のメールアドレス
   - 「保存して次へ」を繰り返し、設定を完了
4. OAuth クライアント ID の作成に戻る
5. アプリケーションの種類: **「ウェブ アプリケーション」** を選択
6. 名前: `Salon Calendar Sync MVP`
7. 承認済みのリダイレクト URI に追加:
   - `http://localhost:3000/api/auth/google/callback`
8. 「作成」をクリック
9. **クライアント ID** と**クライアント シークレット**をコピー
10. この情報を**安全な場所に保存**（後で `.env.local` に使用）

---

## ステップ 4: 環境変数ファイルの作成

### 4.1 `.env.local` ファイルを作成

1. プロジェクトのルートディレクトリ（`prototypes/mvp/frontend/`）に移動
2. `.env.local` ファイルを作成
3. 以下の内容をコピーし、値を**実際の値に置き換え**:

```env
# LIFF Configuration
NEXT_PUBLIC_LIFF_ID=1234567890-abcdefgh

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-XXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### 4.2 値の置き換え方法

#### LIFF Configuration
- `NEXT_PUBLIC_LIFF_ID`: ステップ2.4でコピーしたLIFF ID

#### Firebase Configuration
- ステップ1.4でコピーしたFirebase SDKの設定情報を使用:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`: `apiKey` の値
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `authDomain` の値
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `projectId` の値
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `storageBucket` の値
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: `messagingSenderId` の値
  - `NEXT_PUBLIC_FIREBASE_APP_ID`: `appId` の値

#### Google OAuth Configuration
- ステップ3.4でコピーした値を使用:
  - `GOOGLE_CLIENT_ID`: クライアント ID
  - `GOOGLE_CLIENT_SECRET`: クライアント シークレット
  - `GOOGLE_REDIRECT_URI`: `http://localhost:3000/api/auth/google/callback`（そのまま）

### 4.3 ファイルの保存

1. ファイルを保存
2. ⚠ **セキュリティ注意**: `.env.local` は `.gitignore` に含まれているため、Git にコミットされません
3. この情報を**他人と共有しない**でください

---

## ステップ 5: 動作確認

### 5.1 Next.js プロジェクトを起動

```bash
cd prototypes/mvp/frontend
npm run dev
```

### 5.2 LIFF ブラウザで開く

1. LINE アプリを開く
2. 任意のトークルームで以下のURLを送信:
   ```
   https://liff.line.me/<your-liff-id>
   ```
   （`<your-liff-id>` は実際のLIFF IDに置き換え）
3. URLをタップして開く
4. LIFF アプリが開けばOK

### 5.3 エラーが出た場合

#### LIFF の初期化エラー
- LIFF ID が正しいか確認
- Endpoint URL が正しいか確認（`http://localhost:3000`）
- Next.js プロジェクトが起動しているか確認

#### Firebase の接続エラー
- `.env.local` の値が正しいか確認
- Firestore がテストモードで有効化されているか確認

#### Google 認証エラー
- OAuth クライアント ID とシークレットが正しいか確認
- リダイレクト URI が正しいか確認
- Google Calendar API が有効化されているか確認

---

## 次のステップ

環境設定が完了したら、MVP の実装を進めることができます。

---

## トラブルシューティング

### LIFF が開けない

**原因**: Endpoint URL が間違っている

**対処法**:
1. LINE Developers Console で LIFF の設定を確認
2. Endpoint URL が `http://localhost:3000` になっているか確認
3. Next.js プロジェクトが `http://localhost:3000` で起動しているか確認

### Firestore に接続できない

**原因**: Firebase の設定が間違っている

**対処法**:
1. `.env.local` の値を再確認
2. Firebase Console でプロジェクト ID を確認
3. Firestore がテストモードで有効化されているか確認

### Google Calendar API が動かない

**原因**: OAuth 2.0 の設定が間違っている

**対処法**:
1. Google Cloud Console で OAuth クライアント ID の設定を確認
2. リダイレクト URI が正しいか確認
3. Google Calendar API が有効化されているか確認

---

## セキュリティに関する注意事項

⚠ **重要**: この設定は開発用です。本番環境では以下の対応が必要です:

1. **Firestore のセキュリティルール**
   - テストモードから本番用のルールに変更
   - 最小権限の原則に従う

2. **環境変数の管理**
   - `.env.local` を Git にコミットしない
   - 本番環境では環境変数を安全に管理（Vercel の環境変数設定など）

3. **OAuth 2.0 の設定**
   - 本番環境では適切なリダイレクト URI を設定
   - OAuth 同意画面を本番用に設定

---

## 参考資料

- [Firebase ドキュメント](https://firebase.google.com/docs)
- [LINE Developers ドキュメント](https://developers.line.biz/ja/docs/)
- [Google Calendar API ドキュメント](https://developers.google.com/calendar/api/guides/overview)
- [Next.js ドキュメント](https://nextjs.org/docs)

---

## 更新履歴

- **2025-11-13**: 初版作成（ユーザーセットアップ手順書）
