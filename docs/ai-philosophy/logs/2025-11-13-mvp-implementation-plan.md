# 最小 MVP 実装・検証計画

**作成日**: 2025-11-13
**関連**: [Phase 1 残作業リスト](./2025-11-12-phase1-remaining-tasks.md)、[MVP プラン](../design/mvp-plan.md)

---

## 目的

Phase 1 の最終段階として、技術スタック全体の実装可能性を確認するための最小 MVP を `prototypes/mvp/` に実装する。

**検証対象**:
- LIFF 認証の動作確認
- 予約リクエストの作成・保存（Firestore）
- Google Calendar API との統合
- エンドツーエンドのフロー確認

**重要**: この MVP は本実装ではなく、技術検証のための **プロトタイプ** です。速度と探索を優先し、コードの品質は問いません。

---

## スコープ

### 含める機能

#### お客さん側
1. **LIFF 認証**
   - LINE ユーザー ID と表示名の取得
   - 簡易的な認証状態管理

2. **予約リクエスト作成**
   - 日時入力（シンプルな入力フォーム）
   - メニュー選択（固定メニュー 2-3 個）
   - 顧客名（LIFF から自動入力）
   - Firestore への保存

3. **予約リクエスト一覧表示**
   - 自分のリクエスト一覧
   - 簡易的な状態表示

#### 美容師側
1. **Google 認証**
   - OAuth 2.0 認可フロー
   - カレンダー選択（1つ選択）
   - トークンの保存

2. **予約リクエスト一覧表示**
   - 全リクエスト一覧
   - 簡易的なリスト表示

3. **予約承認・確定**
   - 承認ボタン → Google Calendar に予定作成
   - 状態を `fixed` に更新
   - 拒否ボタン → 状態を `rejected` に更新

### 含めない機能

- 調整機能（`adjusting` 状態）
- 空き枠判定（重複チェックなし）
- エラーハンドリング（基本のみ）
- リトライロジック
- 複雑な UI/UX
- バリデーション（最小限）
- セキュリティルール（開発モード）
- テスト
- Clean Architecture の適用

---

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14+ (App Router) + TypeScript
- **スタイリング**: Tailwind CSS（または素の CSS）
- **LIFF SDK**: `@line/liff`

### バックエンド
- **ランタイム**: Node.js 18+ + TypeScript
- **フレームワーク**: Express.js（または Next.js API Routes）
- **データベース**: Firebase Firestore
- **外部 API**:
  - Google Calendar API
  - LINE API (LIFF SDK)

### インフラ
- **開発環境**: ローカル開発
- **データベース**: Firestore（開発モード）
- **LIFF**: テスト LIFF アプリ
- **Google Calendar**: テストカレンダー

---

## ディレクトリ構造

```
prototypes/mvp/
├── README.md                      # MVP の概要と動作確認手順
├── frontend/                      # Next.js アプリ
│   ├── app/
│   │   ├── page.tsx               # ホーム画面（お客さん側）
│   │   ├── create-request/
│   │   │   └── page.tsx           # 予約リクエスト作成
│   │   ├── my-requests/
│   │   │   └── page.tsx           # 自分のリクエスト一覧
│   │   └── stylist/
│   │       ├── auth/
│   │       │   └── page.tsx       # Google 認証
│   │       ├── requests/
│   │       │   └── page.tsx       # リクエスト一覧（美容師側）
│   │       └── requests/[id]/
│   │           └── page.tsx       # リクエスト詳細（承認・拒否）
│   ├── lib/
│   │   ├── liff.ts                # LIFF SDK 初期化
│   │   └── firebase.ts            # Firebase 初期化
│   └── package.json
├── backend/                       # バックエンド（オプション: Next.js API Routes でも可）
│   ├── src/
│   │   ├── index.ts               # Express.js エントリーポイント
│   │   ├── routes/
│   │   │   ├── reservations.ts   # 予約リクエスト API
│   │   │   └── calendar.ts       # カレンダー API
│   │   ├── services/
│   │   │   ├── firestore.ts      # Firestore クライアント
│   │   │   └── googleCalendar.ts # Google Calendar クライアント
│   │   └── types.ts               # 型定義
│   ├── package.json
│   └── tsconfig.json
└── .env.example                   # 環境変数のサンプル
```

**注**: バックエンドは Next.js API Routes でも可。分離する場合は Express.js を使用。

---

## 実装ステップ

### ステップ 1: プロジェクトセットアップ（1-2 時間）

**タスク**:
1. `prototypes/mvp/frontend/` ディレクトリを作成
2. Next.js プロジェクトの初期化
   ```bash
   cd prototypes/mvp
   npx create-next-app@latest frontend --typescript --tailwind --app
   ```
3. 必要なパッケージのインストール
   ```bash
   cd frontend
   npm install @line/liff firebase
   npm install -D @types/node
   ```
4. Firebase プロジェクトの作成（開発用）
5. LIFF アプリの作成（テスト用）
6. `.env.local` の設定
   ```
   NEXT_PUBLIC_LIFF_ID=<your-liff-id>
   NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
   NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   ```

**成果物**:
- Next.js プロジェクトが起動する状態
- Firebase、LIFF の設定完了

---

### ステップ 2: LIFF 認証の実装（2-3 時間）

**タスク**:
1. LIFF SDK の初期化（`lib/liff.ts`）
   ```typescript
   import liff from '@line/liff';

   export const initializeLiff = async (liffId: string) => {
     await liff.init({ liffId });
     if (!liff.isLoggedIn()) {
       liff.login();
     }
   };

   export const getUserProfile = async () => {
     const profile = await liff.getProfile();
     return {
       userId: profile.userId,
       displayName: profile.displayName,
     };
   };
   ```

2. ホーム画面の実装（`app/page.tsx`）
   - LIFF の初期化
   - ユーザー情報の取得・表示
   - 予約リクエスト作成画面へのリンク

3. 動作確認
   - LIFF ブラウザで開く
   - ユーザー情報が表示されることを確認

**成果物**:
- LIFF 認証が動作する状態
- ユーザー情報が取得できる状態

---

### ステップ 3: Firestore の初期化とデータモデル（1-2 時間）

**タスク**:
1. Firestore クライアントの初期化（`lib/firebase.ts`）
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getFirestore } from 'firebase/firestore';

   const firebaseConfig = {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
     storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
     appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
   };

   const app = initializeApp(firebaseConfig);
   export const db = getFirestore(app);
   ```

2. データモデルの定義（簡易版）
   ```typescript
   // types/reservation.ts
   export interface ReservationRequest {
     id: string;
     customerId: string;        // LINE ユーザー ID
     customerName: string;       // LINE 表示名
     requestedDateTime: string;  // ISO 8601 形式
     menu: string;               // メニュー名
     status: 'requested' | 'fixed' | 'rejected';
     createdAt: string;
     updatedAt: string;
   }
   ```

3. Firestore のセキュリティルール（開発モード）
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;  // 開発モードのみ
       }
     }
   }
   ```

**成果物**:
- Firestore に接続できる状態
- データモデルが定義された状態

---

### ステップ 4: 予約リクエスト作成機能（2-3 時間）

**タスク**:
1. 予約リクエスト作成画面の実装（`app/create-request/page.tsx`）
   - 日時入力（`<input type="datetime-local">`）
   - メニュー選択（`<select>` で 2-3 個）
   - 顧客名表示（LIFF から取得、編集不可）
   - 送信ボタン

2. API Route の実装（`app/api/reservations/route.ts`）
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { collection, addDoc } from 'firebase/firestore';
   import { db } from '@/lib/firebase';

   export async function POST(request: NextRequest) {
     const body = await request.json();
     const { customerId, customerName, requestedDateTime, menu } = body;

     const docRef = await addDoc(collection(db, 'reservationRequests'), {
       customerId,
       customerName,
       requestedDateTime,
       menu,
       status: 'requested',
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
     });

     return NextResponse.json({ id: docRef.id }, { status: 201 });
   }
   ```

3. フォーム送信処理
   - Firestore に保存
   - 成功メッセージ表示

4. 動作確認
   - フォーム入力 → 送信
   - Firestore にドキュメントが作成されることを確認

**成果物**:
- 予約リクエストが作成できる状態
- Firestore に保存される状態

---

### ステップ 5: 予約リクエスト一覧表示（お客さん側）（1-2 時間）

**タスク**:
1. 自分のリクエスト一覧画面の実装（`app/my-requests/page.tsx`）
   - Firestore からデータ取得（`customerId` でフィルタ）
   - 簡易的なリスト表示（日時、メニュー、状態）

2. API Route の実装（`app/api/reservations/my/route.ts`）
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { collection, query, where, getDocs } from 'firebase/firestore';
   import { db } from '@/lib/firebase';

   export async function GET(request: NextRequest) {
     const customerId = request.nextUrl.searchParams.get('customerId');

     const q = query(
       collection(db, 'reservationRequests'),
       where('customerId', '==', customerId)
     );

     const snapshot = await getDocs(q);
     const requests = snapshot.docs.map(doc => ({
       id: doc.id,
       ...doc.data()
     }));

     return NextResponse.json({ requests });
   }
   ```

3. 動作確認
   - 自分のリクエストが表示されることを確認

**成果物**:
- 自分のリクエスト一覧が表示される状態

---

### ステップ 6: Google 認証の実装（2-3 時間）

**タスク**:
1. Google Cloud Console での設定
   - OAuth 2.0 クライアント ID の作成
   - Google Calendar API の有効化
   - リダイレクト URI の設定

2. 認証画面の実装（`app/stylist/auth/page.tsx`）
   - Google OAuth 2.0 認可フローの開始
   - 認可コードの取得
   - アクセストークン・リフレッシュトークンの取得

3. API Route の実装（`app/api/auth/google/route.ts`）
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { google } from 'googleapis';

   const oauth2Client = new google.auth.OAuth2(
     process.env.GOOGLE_CLIENT_ID,
     process.env.GOOGLE_CLIENT_SECRET,
     process.env.GOOGLE_REDIRECT_URI
   );

   export async function GET(request: NextRequest) {
     const code = request.nextUrl.searchParams.get('code');

     if (!code) {
       // 認可 URL の生成
       const authUrl = oauth2Client.generateAuthUrl({
         access_type: 'offline',
         scope: ['https://www.googleapis.com/auth/calendar'],
       });
       return NextResponse.redirect(authUrl);
     }

     // トークンの取得
     const { tokens } = await oauth2Client.getToken(code);

     // Firestore に保存（簡易版: 美容師 ID を固定）
     await setDoc(doc(db, 'stylistAuth', 'default'), {
       accessToken: tokens.access_token,
       refreshToken: tokens.refresh_token,
       expiryDate: tokens.expiry_date,
     });

     return NextResponse.redirect('/stylist/requests');
   }
   ```

4. カレンダー一覧取得（オプション: 固定カレンダー ID でも可）
   ```typescript
   const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
   const calendarList = await calendar.calendarList.list();
   ```

5. 動作確認
   - Google 認証が成功することを確認
   - トークンが Firestore に保存されることを確認

**成果物**:
- Google 認証が動作する状態
- トークンが保存される状態

---

### ステップ 7: 予約リクエスト一覧表示（美容師側）（1-2 時間）

**タスク**:
1. リクエスト一覧画面の実装（`app/stylist/requests/page.tsx`）
   - Firestore から全リクエスト取得
   - 簡易的なリスト表示（日時、顧客名、メニュー、状態）
   - 詳細ページへのリンク

2. API Route の実装（`app/api/stylist/requests/route.ts`）
   ```typescript
   import { NextResponse } from 'next/server';
   import { collection, getDocs, orderBy, query } from 'firebase/firestore';
   import { db } from '@/lib/firebase';

   export async function GET() {
     const q = query(
       collection(db, 'reservationRequests'),
       orderBy('requestedDateTime', 'asc')
     );

     const snapshot = await getDocs(q);
     const requests = snapshot.docs.map(doc => ({
       id: doc.id,
       ...doc.data()
     }));

     return NextResponse.json({ requests });
   }
   ```

3. 動作確認
   - 全リクエストが表示されることを確認

**成果物**:
- 美容師側でリクエスト一覧が表示される状態

---

### ステップ 8: 予約承認・確定機能（3-4 時間）

**タスク**:
1. リクエスト詳細画面の実装（`app/stylist/requests/[id]/page.tsx`）
   - リクエストの詳細表示
   - 承認ボタン
   - 拒否ボタン

2. 承認 API の実装（`app/api/stylist/requests/[id]/approve/route.ts`）
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { doc, updateDoc, getDoc } from 'firebase/firestore';
   import { google } from 'googleapis';
   import { db } from '@/lib/firebase';

   export async function POST(
     request: NextRequest,
     { params }: { params: { id: string } }
   ) {
     const requestId = params.id;

     // 1. リクエストを取得
     const requestDoc = await getDoc(doc(db, 'reservationRequests', requestId));
     const requestData = requestDoc.data();

     // 2. Google Calendar に予定作成
     const authDoc = await getDoc(doc(db, 'stylistAuth', 'default'));
     const authData = authDoc.data();

     const oauth2Client = new google.auth.OAuth2();
     oauth2Client.setCredentials({
       access_token: authData?.accessToken,
       refresh_token: authData?.refreshToken,
     });

     const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

     const event = {
       summary: `${requestData?.menu} - ${requestData?.customerName}`,
       start: {
         dateTime: requestData?.requestedDateTime,
         timeZone: 'Asia/Tokyo',
       },
       end: {
         // 仮で1時間後
         dateTime: new Date(new Date(requestData?.requestedDateTime).getTime() + 60 * 60 * 1000).toISOString(),
         timeZone: 'Asia/Tokyo',
       },
       description: `アプリから作成\nメニュー: ${requestData?.menu}\n顧客: ${requestData?.customerName}`,
       extendedProperties: {
         private: {
           source: 'salon-calendar-sync',
           reservationId: requestId,
         },
       },
     };

     const createdEvent = await calendar.events.insert({
       calendarId: 'primary',
       requestBody: event,
     });

     // 3. リクエストの状態を更新
     await updateDoc(doc(db, 'reservationRequests', requestId), {
       status: 'fixed',
       googleCalendarEventId: createdEvent.data.id,
       updatedAt: new Date().toISOString(),
     });

     return NextResponse.json({ success: true });
   }
   ```

3. 拒否 API の実装（`app/api/stylist/requests/[id]/reject/route.ts`）
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { doc, updateDoc } from 'firebase/firestore';
   import { db } from '@/lib/firebase';

   export async function POST(
     request: NextRequest,
     { params }: { params: { id: string } }
   ) {
     const requestId = params.id;

     await updateDoc(doc(db, 'reservationRequests', requestId), {
       status: 'rejected',
       updatedAt: new Date().toISOString(),
     });

     return NextResponse.json({ success: true });
   }
   ```

4. 動作確認
   - 承認ボタン → Google Calendar に予定が作成されることを確認
   - 状態が `fixed` に更新されることを確認
   - 拒否ボタン → 状態が `rejected` に更新されることを確認

**成果物**:
- 予約承認・確定が動作する状態
- Google Calendar に予定が作成される状態

---

### ステップ 9: エンドツーエンドの動作確認（1-2 時間）

**タスク**:
1. お客さん側のフロー確認
   - LIFF ブラウザで開く
   - 予約リクエスト作成
   - 自分のリクエスト一覧を確認

2. 美容師側のフロー確認
   - Google 認証
   - リクエスト一覧を確認
   - 承認 → Google Calendar を確認
   - 拒否 → 状態を確認

3. 問題の記録
   - 動作しなかった箇所
   - エラーメッセージ
   - 改善点

**成果物**:
- エンドツーエンドで動作することを確認
- 問題点のリスト

---

## 動作確認チェックリスト

### お客さん側
- [ ] LIFF ブラウザで開ける
- [ ] ユーザー情報が表示される
- [ ] 予約リクエストを作成できる
- [ ] Firestore に保存される
- [ ] 自分のリクエスト一覧が表示される

### 美容師側
- [ ] Google 認証が成功する
- [ ] トークンが保存される
- [ ] リクエスト一覧が表示される
- [ ] 承認ボタンをクリックできる
- [ ] Google Calendar に予定が作成される
- [ ] 状態が `fixed` に更新される
- [ ] 拒否ボタンをクリックできる
- [ ] 状態が `rejected` に更新される

### エンドツーエンド
- [ ] お客さん → 美容師 → Google Calendar の一連のフローが動作する

---

## 想定される問題と対処法

### 1. LIFF の初期化エラー
**問題**: LIFF SDK の初期化に失敗する

**対処法**:
- LIFF ID が正しいか確認
- LIFF の Endpoint URL が正しいか確認
- `liff.init()` のエラーメッセージを確認

### 2. Firestore への接続エラー
**問題**: Firestore に接続できない

**対処法**:
- Firebase の設定が正しいか確認
- セキュリティルールが開発モードになっているか確認
- ネットワーク接続を確認

### 3. Google Calendar API のエラー
**問題**: カレンダーに予定を作成できない

**対処法**:
- Google Calendar API が有効化されているか確認
- OAuth 2.0 の認可スコープが正しいか確認
- トークンの有効期限を確認
- API のエラーレスポンスを確認

### 4. トークンの期限切れ
**問題**: アクセストークンの期限が切れている

**対処法**:
- リフレッシュトークンを使用して新しいトークンを取得
- トークンの自動更新ロジックを追加（オプション）

---

## 次のステップ

### 動作確認後
1. **学びの文書化**
   - 動作した機能
   - 動作しなかった機能
   - 実装上の課題
   - 本実装への移行時の注意点

2. **Phase 1 完了レポートの作成**
   - 技術検証結果のまとめ
   - 要件の明確化
   - Phase 2 移行の Go/No-Go 判断

3. **美容師との合意形成**
   - UI/UX のレビュー
   - 運用フローの確認
   - Google Calendar 予定フォーマットの合意

---

## 参考資料

- [Phase 1 残作業リスト](./2025-11-12-phase1-remaining-tasks.md)
- [MVP プラン](../design/mvp-plan.md)
- [Google Calendar API 認可フロー調査](../research/google-calendar-api-auth-flow.md)
- [LIFF ユーザー認証調査](../research/liff-user-authentication.md)
- [Google Calendar 予定フォーマット仕様](../design/google-calendar-event-format.md)

---

## 更新履歴

- **2025-11-13**: 初版作成（最小 MVP の実装・検証計画を作成）
