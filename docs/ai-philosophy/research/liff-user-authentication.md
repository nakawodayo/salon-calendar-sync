# LIFF SDK ユーザー認証とプロフィール取得の調査

**作成日**: 2025-11-12
**目的**: LINE LIFF SDKを使ったユーザー情報取得の実装方法確認
**関連タスク**: [Phase 1 残作業リスト](../logs/2025-11-12-phase1-remaining-tasks.md)

---

## 概要

サロン予約アプリでお客様を識別するため、LIFF SDKによるユーザー情報取得の実装方法を調査。`liff.getProfile()`の動作、認証状態管理、エラーハンドリング、セキュリティ考慮事項を整理。

---

## 1. `liff.getProfile()` の基本

### API仕様

```typescript
liff.getProfile(): Promise<Profile>

interface Profile {
  userId: string;         // LINE ユーザーID（一意識別子）
  displayName: string;    // 表示名
  pictureUrl?: string;    // プロフィール画像URL（オプション）
  statusMessage?: string; // ステータスメッセージ（オプション）
}
```

### 使用例

```typescript
try {
  const profile = await liff.getProfile();
  console.log(profile.userId);        // "U1234567890abcdef"
  console.log(profile.displayName);   // "田中 ゆき"
  console.log(profile.pictureUrl);    // "https://..."
} catch (error) {
  console.error('プロフィール取得失敗:', error);
}
```

### 前提条件

- **スコープ要件**: LINE Developers Console で `profile` スコープの選択が必須
- **タイミング**: `liff.init()` 完了後に呼び出す必要あり
- **ログイン状態**: ユーザーがログイン済み（`liff.isLoggedIn()` が `true`）である必要あり

### 制限事項

- メインプロフィールのみ取得可能（サブプロフィールは不可）
- `statusMessage` はユーザーが設定している場合のみ含まれる
- `pictureUrl` はプロフィール画像未設定の場合 undefined

---

## 2. ユーザー情報取得の3つの方法

### 方法1: `liff.getProfile()`（推奨：クライアント側表示用）

```typescript
const profile = await liff.getProfile();
const userId = profile.userId;
const displayName = profile.displayName;
```

**用途**: クライアント側でのUI表示

### 方法2: `liff.getDecodedIDToken()`（代替：IDトークン使用時）

```typescript
const idToken = liff.getDecodedIDToken();
const userId = idToken.sub;          // ユーザーID
const displayName = idToken.name;    // 表示名
const email = idToken.email;         // メールアドレス（emailスコープ必要）
```

**用途**: メールアドレスなど他のIDトークンクレームも必要な場合
**要件**: `openid` スコープ（メールには `email` スコープも必要）

### 方法3: サーバー側検証（推奨：本番環境）

```typescript
// クライアント側 - トークンをサーバーに送信
const accessToken = liff.getAccessToken();

await fetch('/api/user/verify', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

```typescript
// サーバー側 - トークン検証とプロフィール取得
// 1. アクセストークン検証
POST https://api.line.me/oauth2/v2.1/verify

// 2. プロフィール取得
GET https://api.line.me/v2/profile
  Authorization: Bearer {accessToken}
```

**用途**: 認証が必要な処理、機密性の高い操作（本番環境推奨）

---

## 3. 認証状態管理のベストプラクティス

### Next.js での実装パターン（Context Provider）

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Liff } from '@line/liff';

interface LiffContextValue {
  liff: Liff | null;
  isLoggedIn: boolean;
  isReady: boolean;
  error: Error | null;
}

const LiffContext = createContext<LiffContextValue>({
  liff: null,
  isLoggedIn: false,
  isReady: false,
  error: null,
});

export function LiffProvider({
  children,
  liffId
}: {
  children: React.ReactNode;
  liffId: string;
}) {
  const [liff, setLiff] = useState<Liff | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // SSR回避のための動的インポート
    import('@line/liff')
      .then((liffModule) => liffModule.default)
      .then((liff) => {
        setLiff(liff);
        return liff.init({ liffId });
      })
      .then(() => {
        setIsLoggedIn(liff!.isLoggedIn());
        setIsReady(true);
      })
      .catch((error) => {
        console.error('LIFF初期化失敗', error);
        setError(error);
        setIsReady(true);
      });
  }, [liffId]);

  return (
    <LiffContext.Provider value={{ liff, isLoggedIn, isReady, error }}>
      {children}
    </LiffContext.Provider>
  );
}

export function useLiff() {
  return useContext(LiffContext);
}
```

### コンポーネントでの使用

```typescript
'use client';

import { useLiff } from '@/contexts/LiffContext';
import { useEffect, useState } from 'react';

export function ReservationForm() {
  const { liff, isLoggedIn, isReady, error } = useLiff();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) {
      liff?.login();
      return;
    }

    liff?.getProfile()
      .then(setProfile)
      .catch(console.error);
  }, [liff, isLoggedIn, isReady]);

  if (!isReady) return <div>LIFF読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;
  if (!isLoggedIn) return <div>ログインにリダイレクト中...</div>;
  if (!profile) return <div>プロフィール読み込み中...</div>;

  return (
    <form>
      <p>ようこそ、{profile.displayName}さん！</p>
      {/* 予約フォームのフィールド */}
    </form>
  );
}
```

### 状態管理チェックリスト

- [ ] **初期化状態**: LIFFが初期化完了したか追跡
- [ ] **ログイン状態**: ユーザーがログイン済みか追跡
- [ ] **プロフィール状態**: プロフィールデータをキャッシュ（APIの重複呼び出し回避）
- [ ] **エラー状態**: 初期化/取得エラーをハンドリング・表示
- [ ] **ローディング状態**: 非同期処理中のローディング表示

---

## 4. エラーハンドリングパターン

### 主なエラーシナリオ

#### A. LIFF初期化失敗

**エラーコード**: `INIT_FAILED`

**原因**:
- 無効なLIFF ID
- LIFF アプリの設定不備
- ネットワーク接続の問題
- 未承認ドメインからのアクセス

**対処**:
```typescript
try {
  await liff.init({ liffId: 'YOUR_LIFF_ID' });
} catch (error) {
  if (error.code === 'INIT_FAILED') {
    console.error('LIFFアプリの初期化に失敗しました');
    // ユーザーフレンドリーなエラーメッセージ表示
    // オプション: エクスポネンシャルバックオフでリトライ
    // オプション: エラーページへリダイレクト
  }
}
```

#### B. 権限拒否

**エラーコード**: `FORBIDDEN`

**原因**:
- 必要なスコープがユーザーに許可されていない
- ユーザーが権限画面で「キャンセル」をクリック
- LIFF Console でのスコープ設定漏れ

**対処**:
```typescript
try {
  const profile = await liff.getProfile();
} catch (error) {
  if (error.code === 'FORBIDDEN') {
    console.error('プロフィール権限が許可されていません');
    // ユーザーに権限付与を促す
  }
}
```

#### C. 未認証アクセス

**エラーコード**: `UNAUTHORIZED`

**原因**:
- ユーザーが未ログイン
- アクセストークンの有効期限切れ
- 無効なセッション

**対処**:
```typescript
if (!liff.isLoggedIn()) {
  liff.login({
    redirectUri: window.location.href // ログイン後に現在のページに戻る
  });
  return;
}

try {
  const profile = await liff.getProfile();
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // 再ログインを強制
    liff.login();
  }
}
```

#### D. プロフィール取得が undefined を返す

**原因**: LIFF初期化完了前に `getProfile()` を呼び出した

**対処**:
```typescript
// 間違い - これはしない
liff.init({ liffId });
const profile = await liff.getProfile(); // 失敗する可能性あり！

// 正しい - 初期化完了を待つ
await liff.init({ liffId });
const profile = await liff.getProfile(); // 安全
```

### エラーハンドリングのベストプラクティス

```typescript
interface LiffError {
  code: string;
  message?: string;
  cause?: any;
}

function handleLiffError(error: LiffError, context: string): string {
  console.error(`LIFF Error in ${context}:`, error);

  switch (error.code) {
    case 'INIT_FAILED':
      return '初期化に失敗しました。後でもう一度お試しください。';
    case 'UNAUTHORIZED':
      return '続行するにはログインしてください。';
    case 'FORBIDDEN':
      return '権限が必要です。アクセスを許可してください。';
    case 'INVALID_CONFIG':
      return '設定エラーです。サポートにお問い合わせください。';
    default:
      return '予期しないエラーが発生しました。';
  }
}

// 使用例
try {
  await liff.init({ liffId });
} catch (error) {
  const message = handleLiffError(error, 'initialization');
  setErrorMessage(message);
}
```

### エラーコード一覧

| コード | 意味 | 典型的な原因 |
|--------|------|--------------|
| `INIT_FAILED` | 初期化失敗 | 無効な設定、ネットワーク問題 |
| `UNAUTHORIZED` | 未認証 | 未ログイン、トークン有効期限切れ |
| `FORBIDDEN` | 権限拒否 | スコープ不足、ユーザーが拒否 |
| `INVALID_CONFIG` | 設定不正 | 間違ったLIFF ID、設定不備 |
| `INVALID_ARGUMENT` | 無効なパラメータ | 不正な関数引数 |

---

## 5. Next.js/React 統合の考慮事項

### セットアップ手順

#### ステップ1: LIFF SDK インストール
```bash
npm install @line/liff
```

#### ステップ2: LIFF Context 作成（上記セクション3参照）

#### ステップ3: App Layout に Provider 追加
```typescript
// app/layout.tsx (Next.js App Router)
import { LiffProvider } from '@/contexts/LiffContext';

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <LiffProvider liffId={process.env.NEXT_PUBLIC_LIFF_ID!}>
          {children}
        </LiffProvider>
      </body>
    </html>
  );
}
```

### Next.js 特有の注意点

#### SSR/SSG の問題
- LIFF SDK は `window` オブジェクトを必要とする（ブラウザ専用）
- 動的インポートを使用: `import('@line/liff').then(...)`
- LIFF を使うコンポーネントは `'use client'` とマーク
- サーバーサイドレンダリング中は LIFF の使用を避ける

#### 環境変数
```env
# .env.local
NEXT_PUBLIC_LIFF_ID=1234567890-abcdefgh
```

#### ルーティングの考慮事項
- **History API**: Next.js の組み込みルーティングを使用（推奨）
- **ログインリダイレクト**: `liff.login()` の `redirectUri` パラメータを使用

```typescript
liff.login({
  redirectUri: `${window.location.origin}/reservation/new`
});
```

### カスタムフックパターン

```typescript
// hooks/useProfile.ts
import { useEffect, useState } from 'react';
import { useLiff } from '@/contexts/LiffContext';
import type { Profile } from '@line/liff';

export function useProfile() {
  const { liff, isLoggedIn, isReady } = useLiff();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isReady || !isLoggedIn) {
      setLoading(false);
      return;
    }

    liff?.getProfile()
      .then(setProfile)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [liff, isLoggedIn, isReady]);

  return { profile, loading, error };
}
```

---

## 6. セキュリティ考慮事項

### 重要なセキュリティルール

#### ルール1: プロフィールデータを直接サーバーに送信しない

**やってはいけない（スプーフィング脆弱性）**:
```typescript
// 間違い - クライアント側
const profile = await liff.getProfile();
await fetch('/api/reservations', {
  method: 'POST',
  body: JSON.stringify({
    userId: profile.userId,        // 偽装可能！
    displayName: profile.displayName // 偽装可能！
  })
});
```

**正しい方法（セキュア）**:
```typescript
// 正しい - クライアント側
const accessToken = liff.getAccessToken();
await fetch('/api/reservations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}` // サーバーで検証
  },
  body: JSON.stringify({
    // 予約データのみ、ユーザー情報は含めない
  })
});
```

```typescript
// 正しい - サーバー側
async function handler(req, res) {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');

  // LINE プラットフォームでトークン検証
  const verifyResponse = await fetch(
    'https://api.line.me/oauth2/v2.1/verify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `access_token=${accessToken}`
    }
  );

  if (!verifyResponse.ok) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // 検証済みプロフィール取得
  const profileResponse = await fetch(
    'https://api.line.me/v2/profile',
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );

  const profile = await profileResponse.json();
  const userId = profile.userId; // この値は信頼できる！

  // 検証済み userId で予約を保存
}
```

#### ルール2: トークンベース認証フロー

**クライアント側**:
1. LIFF初期化: `await liff.init({ liffId })`
2. ログイン確認: `liff.isLoggedIn()`
3. トークン取得: `liff.getAccessToken()` または `liff.getIDToken()`
4. Authorization ヘッダーでサーバーにトークン送信

**サーバー側**:
1. Authorization ヘッダーからトークン抽出
2. LINE Platform API でトークン検証
3. LINE Platform から検証済みユーザープロフィール取得
4. 検証済みデータをビジネスロジックで使用

#### ルール3: HTTPS 必須

- すべての LIFF エンドポイント URL は HTTPS を使用する必要あり
- HTTP URL でも表示されるが LIFF 機能が失われる
- 本番環境では適切な SSL 証明書を設定

#### ルール4: アクセストークンのライフサイクル

**重要な特性**:
- 発行後12時間有効
- **LIFF アプリを閉じると自動的に無効化される**（有効期限内でも）
- トークン有効期限切れを適切にハンドリングする必要あり

```typescript
// トークン有効期限切れのハンドリング
async function makeAuthenticatedRequest() {
  if (!liff.isLoggedIn()) {
    liff.login();
    return;
  }

  const accessToken = liff.getAccessToken();

  try {
    const response = await fetch('/api/endpoint', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.status === 401) {
      // トークン有効期限切れまたは無効化
      liff.login();
      return;
    }

    return await response.json();
  } catch (error) {
    console.error('リクエスト失敗:', error);
  }
}
```

#### ルール5: ユーザー同意とプライバシー

**ストレージ制限**:
- 同意なしに cookie/localStorage/sessionStorage でユーザー追跡しない
- 許可なしに LINE ユーザーデータを外部セッションとリンクしない
- ユーザーが登録解除したときの動作をドキュメント化

**スコープ権限**:
サロンアプリに必要なスコープ:
- `profile` - ユーザー名とIDの取得
- `openid` - IDトークン（トークンベース認証使用時）
- `email` - メールアドレスが必要な場合のみ

### サロンアプリのセキュリティチェックリスト

- [ ] トークンベース認証を使用（アクセストークンまたはIDトークン）
- [ ] `liff.getProfile()` のデータを直接サーバーに送信しない
- [ ] サーバー側で LINE Platform API によるトークン検証
- [ ] すべてのエンドポイントで HTTPS を使用
- [ ] 最小限のスコープのみリクエスト（`profile` と `openid` のみ）
- [ ] トークン有効期限切れと無効化をハンドリング
- [ ] トークンを含む機密 URL をログに記録しない
- [ ] データ追跡/リンク前にユーザー同意を取得
- [ ] プライバシーポリシーとデータ取り扱いをドキュメント化
- [ ] 適切な登録解除フローを実装
- [ ] サーバー側のすべての入力を検証（クライアントデータを信頼しない）

---

## 7. サロンアプリ実装の推奨アプローチ

### Phase 1: 基本的なユーザー識別（プロトタイプ）

プロトタイプ（Phase 1）では、シンプルなクライアント側アプローチで十分:

```typescript
// prototypes/mvp/liff-auth-test/simple-auth.ts
import liff from '@line/liff';

export async function initializeLiff(liffId: string) {
  await liff.init({ liffId });

  if (!liff.isLoggedIn()) {
    liff.login();
    return null;
  }

  const profile = await liff.getProfile();
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl
  };
}
```

### Phase 2: 本番実装（src/への移行時）

本番環境（Phase 2）では、セキュアなサーバー側検証を実装:

#### バックエンドアーキテクチャ

```
src/backend/
├── infrastructure/
│   └── adapters/
│       └── LineAdapter.ts          # LINE API クライアント
├── application/
│   └── usecases/
│       └── AuthenticateUserUseCase.ts
└── presentation/
    └── middleware/
        └── authMiddleware.ts       # トークン検証
```

#### Line Adapter（Infrastructure Layer）
```typescript
// src/backend/infrastructure/adapters/LineAdapter.ts
export class LineAdapter {
  async verifyAccessToken(accessToken: string): Promise<{
    client_id: string;
    expires_in: number;
  }> {
    const response = await fetch(
      'https://api.line.me/oauth2/v2.1/verify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `access_token=${accessToken}`
      }
    );

    if (!response.ok) {
      throw new Error('Invalid access token');
    }

    return response.json();
  }

  async getUserProfile(accessToken: string): Promise<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  }> {
    const response = await fetch(
      'https://api.line.me/v2/profile',
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    return response.json();
  }
}
```

### データフロー

```
お客様が予約リクエストを送信
→ フロントエンド: LIFF からアクセストークン取得
→ フロントエンド: 予約データ + トークンをバックエンドに送信
→ バックエンド: LINE Platform でトークン検証
→ バックエンド: 検証済みユーザープロフィール取得
→ バックエンド: 検証済み userId で予約を保存
→ バックエンド: Google Calendar イベント作成
→ バックエンド: 成功レスポンスを返す
```

---

## 8. 次のステップ

### Phase 1（現在 - プロトタイピング）での実施事項

1. ✅ **調査完了**: LIFF SDK の仕様とベストプラクティスを理解
2. 🔄 **プロトタイプ作成**: `prototypes/mvp/liff-auth-test/` に最小動作確認実装
3. ⏳ **動作確認**: LIFF 初期化、ログイン、プロフィール取得のフロー検証
4. ⏳ **統合計画**: 予約リクエスト作成フローとの統合方法を文書化

### Phase 2（本番実装）での実施事項

1. トークンベース認証の実装
2. サーバー側検証ミドルウェアの追加
3. Infrastructure レイヤーに LineAdapter 作成
4. Clean Architecture パターンの適用（CLAUDE.md に従う）

---

## 参考資料

- [LINE Developers - LIFF ドキュメント](https://developers.line.biz/ja/docs/liff/)
- [LINE Developers - LIFF API リファレンス](https://developers.line.biz/ja/reference/liff/)
- [Phase 1 残作業リスト](../logs/2025-11-12-phase1-remaining-tasks.md)
- [MVP 作成プラン](../design/mvp-plan.md)

---

## 更新履歴

- **2025-11-12**: 初版作成（LIFF SDK ユーザー認証調査結果を文書化）
