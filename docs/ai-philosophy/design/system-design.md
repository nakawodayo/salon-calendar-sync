# システム設計（たたき台）

**作成日**: 2025-11-11
**関連**: [Phase 1 要件定義](../logs/2025-11-11-phase1-requirements.md)

---

## 全体の基盤構成

### アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────┐
│                    LIFF アプリ（フロントエンド）          │
│                    Vercel でホスティング                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ お客さん側   │  │ 美容師側     │  │ 共通         │ │
│  │ 予約リクエスト│  │ リクエスト管理│  │ 認証・設定   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ REST/GraphQL API
                          ▼
┌─────────────────────────────────────────────────────────┐
│              GCP Cloud Functions（バックエンド）         │
│              REST/GraphQL API として実装                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ 予約管理API  │  │ カレンダーAPI│  │ ユーザーAPI  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Firebase      │  │Google       │  │LINE API      │
│Firestore     │  │Calendar API │  │(LIFF SDK)    │
│(データベース)│  │(予定管理)   │  │(認証)        │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 技術スタック

- **フロントエンド**: LIFF アプリ（React/Next.js 想定）、Vercel でホスティング
- **バックエンド**: GCP Cloud Functions（Node.js）、REST/GraphQL API
- **データベース**: Firebase Firestore
- **外部 API**: Google Calendar API、LINE API（LIFF SDK）

### アーキテクチャ方針

- **設計方針**: Clean Architecture の原則を取り入れた保守性の高い設計
- **フレームワーク**: Express.js（サーバーレス環境との相性を優先、Nest.js は不使用）
- **段階的導入**: リポジトリパターンとユースケースの実装から開始
- **将来の拡張性**: 今後の Clean Architecture 化も踏まえた設計
- **レイヤー分離**: ドメイン層、アプリケーション層、プレゼンテーション層、インフラストラクチャ層

**実装方針:**

1. **リポジトリパターン**: データベースアクセスを抽象化し、ドメイン層とインフラ層を分離
2. **ユースケース**: アプリケーション層でビジネスロジックを明確化
3. **依存性の逆転**: インターフェースをドメイン層に定義し、実装をインフラ層に配置
4. **段階的発展**: 必要に応じて DI コンテナやモジュールシステムを追加可能な構造

詳細は[アーキテクチャ設計ガイドライン](./2025-11-11-architecture-guidelines.md)と[Clean Architecture 実現可能性調査](../research/2025-11-11-clean-architecture.md)を参照

---

## 開発言語・フレームワーク選定

詳細な調査結果は別ファイルを参照: [開発言語・フレームワーク選定調査](../research/2025-11-11-framework-selection.md)

### 決定事項

- **フロントエンド**: **Next.js 14+ (App Router) + TypeScript**
- **バックエンド**: **Node.js 18+ + TypeScript + Express.js**
- **データベース**: **Firebase Firestore**
- **スタイリング**: **Tailwind CSS**
- **状態管理**: **React Hooks**（必要に応じて Zustand）
- **フォーム管理**: **React Hook Form**
- **バリデーション**: **Zod**

### データフロー

1. **予約リクエスト作成**

   - お客さん（LIFF アプリ）→ Cloud Functions API → Firestore に保存
   - 状態: `requested`

2. **予約リクエスト一覧取得（美容師側）**

   - 美容師（LIFF アプリ）→ Cloud Functions API → Firestore から取得
   - 状態: `requested`, `adjusting` のリクエストを表示

3. **予約承認（即座に Google Calendar に反映）**

   - 美容師（LIFF アプリ）→ Cloud Functions API → Google Calendar API で予定作成
   - 成功: Firestore の状態を `fixed` に更新
   - 失敗: `requested` 状態のまま（エラー表示、再試行可能）

4. **予約調整**

   - 美容師（LIFF アプリ）→ Cloud Functions API → Firestore の状態を `adjusting` に更新
   - 美容師が LINE などでお客さんと調整（アプリ外）
   - 調整完了後、美容師が予約リクエストの内容を編集（日時など）
   - 編集後、FIX で Google Calendar に反映

5. **予約確定（FIX）**

   - 美容師（LIFF アプリ）→ Cloud Functions API → Google Calendar API で予定作成
   - 成功: Firestore の状態を `fixed` に更新
   - 失敗: `adjusting` 状態のまま（エラー表示、再試行可能）

6. **次の予約情報取得**
   - お客さん（LIFF アプリ）→ Cloud Functions API → Google Calendar API から取得
   - LINE ユーザー ID でフィルタリング

---

## 画面一覧

### お客さん側（エンドユーザー）

#### 1. トップページ / ホーム画面

- **機能**:
  - 次の予約情報を表示（「○○ さんの次の予約は...」）
  - 長期休暇のお知らせ表示（あれば）
  - 予約リクエストボタン
  - 自分の予約リクエスト一覧へのリンク

#### 2. 予約リクエスト作成画面

- **機能**:
  - **日時選択（カレンダー UI）**
    - **推奨**: ホットペッパービューティー風のグリッド形式カレンダー
      - 日付 × 時間のグリッドで空き状況を一目で確認
      - 予約可能な時間帯（◎）をクリックして選択
      - 週単位で前後の週に移動可能
      - 土日・祝日を色分け表示
    - **代替案**: シンプルな日付・時間選択（MVP 初期段階）
  - メニュー選択（固定メニューから選択）
  - **所要時間・終了時刻の自動表示**（メニューと開始時刻から自動計算）
    - カット: 1 時間
    - カラー: 2 時間
    - パーマ: 1 時間
    - 組み合わせで合計時間を計算
  - 顧客名（自動入力: LIFF から取得した表示名）
  - 連絡手段（任意入力）
  - 送信ボタン

#### 3. 自分の予約リクエスト一覧画面

- **機能**:
  - 自分の予約リクエスト一覧を表示
  - 状態表示（リクエスト中、調整中、確定済み）
  - 各リクエストの詳細表示

### 美容師側（管理者）

#### 4. 予約リクエスト管理画面（一覧）

- **機能**:
  - 承認・調整待ちのリクエスト一覧を表示（状態: `requested`, `adjusting`）
  - 状態でフィルタリング（リクエスト中、調整中）
  - 日時でソート
  - 各リクエストの詳細表示・操作ボタン

#### 5. 予約リクエスト詳細・操作画面

- **機能**:
  - リクエストの詳細表示（日時、メニュー、顧客名、連絡手段）
  - **リクエスト中（`requested`）の場合**:
    - 承認ボタン（即座に Google Calendar に予定作成）
    - 調整ボタン（状態を `adjusting` に更新）
    - 拒否ボタン
  - **調整中（`adjusting`）の場合**:
    - 予約内容の編集（日時、メニューなど）
    - 確定（FIX）ボタン（Google Calendar に予定作成）
    - キャンセルボタン（状態を `requested` に戻す）

#### 6. 予約リクエスト編集画面（調整中の場合）

- **機能**:
  - 調整中のリクエストの内容を編集
  - 日時変更（カレンダー UI）
  - メニュー変更（固定メニューから選択）
  - **所要時間・終了時刻の自動表示**（メニューと開始時刻から自動計算）
    - カット: 1 時間
    - カラー: 2 時間
    - パーマ: 1 時間
    - 組み合わせで合計時間を計算
  - 確定（FIX）ボタン（編集内容で Google Calendar に予定作成、Firestore も更新）
  - キャンセルボタン（編集を破棄して一覧に戻る）

#### 7. Google 認証・カレンダー選択画面

- **機能**:
  - Google アカウントでログイン
  - Google Calendar API の認可
  - カレンダー一覧表示
  - 使用するカレンダーの選択
  - 認証状態の確認

#### 8. 長期休暇お知らせ設定画面

- **機能**:
  - お知らせの表示/非表示設定
  - お知らせ内容の入力・編集
  - 表示期間の設定（開始日、終了日）

### 共通

#### 9. 認証・ログイン画面

- **機能**:
  - LIFF SDK で LINE ユーザー認証
  - ユーザー情報取得（ユーザー ID、表示名）
  - 初回アクセス時の権限確認

---

## API 一覧

### 予約管理 API

#### 1. 予約リクエスト作成

- **エンドポイント**: `POST /api/reservations/requests`
- **認証**: LINE ユーザー ID（LIFF SDK から取得）
- **リクエスト**:
  ```json
  {
    "datetime": "2025-11-20T14:00:00+09:00",
    "menu": "カット",
    "customerName": "山田太郎",
    "contact": "LINE",
    "lineUserId": "U1234567890abcdef"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "req_1234567890",
    "status": "requested",
    "createdAt": "2025-11-11T10:00:00+09:00"
  }
  ```
- **処理**:
  - 空き枠確認（Google Calendar API）
  - Firestore に予約リクエストを保存
  - 状態: `requested`

#### 2. 予約リクエスト一覧取得（美容師側）

- **エンドポイント**: `GET /api/reservations/requests`
- **認証**: 美容師認証（Google アカウント）（Google アカウント）
- **クエリパラメータ**:
  - `status`: `requested`, `adjusting`, `all`（オプション）
  - `from`: 開始日時（オプション）
  - `to`: 終了日時（オプション）
- **レスポンス**:
  ```json
  {
    "requests": [
      {
        "id": "req_1234567890",
        "datetime": "2025-11-20T14:00:00+09:00",
        "menu": "カット",
        "customerName": "山田太郎",
        "contact": "LINE",
        "lineUserId": "U1234567890abcdef",
        "status": "requested",
        "createdAt": "2025-11-11T10:00:00+09:00"
      }
    ]
  }
  ```
- **処理**: Firestore から条件に合致するリクエストを取得

#### 3. 予約リクエスト一覧取得（お客さん側）

- **エンドポイント**: `GET /api/reservations/my-requests`
- **認証**: LINE ユーザー ID（LIFF SDK から取得）
- **レスポンス**: 自分の予約リクエスト一覧
- **処理**: Firestore から LINE ユーザー ID でフィルタリング

#### 4. 予約リクエスト承認（即座に Google Calendar に反映）

- **エンドポイント**: `POST /api/reservations/requests/:id/approve`
- **認証**: 美容師認証（Google アカウント）
- **レスポンス（成功時）**:
  ```json
  {
    "id": "req_1234567890",
    "status": "fixed",
    "calendarEventId": "event_abc123",
    "updatedAt": "2025-11-11T11:00:00+09:00"
  }
  ```
- **レスポンス（失敗時）**:
  ```json
  {
    "error": {
      "code": "GOOGLE_CALENDAR_ERROR",
      "message": "Google Calendar への予定作成に失敗しました"
    }
  }
  ```
- **処理**:
  - Google Calendar API で予定を作成（承認と同時に実行）
  - 成功: Firestore の状態を `fixed` に更新、Google Calendar のイベント ID を保存
  - 失敗: `requested` 状態のまま、エラーを返す（再試行可能）

#### 5. 予約リクエスト拒否

- **エンドポイント**: `POST /api/reservations/requests/:id/reject`
- **認証**: 美容師認証（Google アカウント）
- **レスポンス**: 状態を `rejected` に更新
- **処理**: Firestore の状態を `rejected` に更新

#### 6. 予約リクエスト調整開始

- **エンドポイント**: `POST /api/reservations/requests/:id/adjust`
- **認証**: 美容師認証（Google アカウント）
- **レスポンス**:
  ```json
  {
    "id": "req_1234567890",
    "status": "adjusting",
    "updatedAt": "2025-11-11T11:00:00+09:00"
  }
  ```
- **処理**: Firestore の状態を `adjusting` に更新

#### 7. 予約確定（FIX）

- **エンドポイント**: `POST /api/reservations/requests/:id/fix`
- **認証**: 美容師認証（Google アカウント）
- **リクエスト**（調整後の内容を編集する場合）:
  ```json
  {
    "datetime": "2025-11-20T15:00:00+09:00", // 調整後の日時（オプション、編集しない場合は省略）
    "menu": "カット + パーマ" // 調整後のメニュー（オプション、編集しない場合は省略）
  }
  ```
- **レスポンス（成功時）**:
  ```json
  {
    "id": "req_1234567890",
    "status": "fixed",
    "calendarEventId": "event_abc123",
    "updatedAt": "2025-11-11T13:00:00+09:00"
  }
  ```
- **レスポンス（失敗時）**:
  ```json
  {
    "error": {
      "code": "GOOGLE_CALENDAR_ERROR",
      "message": "Google Calendar への予定作成に失敗しました"
    }
  }
  ```
- **処理**:
  - 状態が `adjusting` の場合のみ実行可能
  - リクエストボディで編集内容が送信された場合、Firestore の予約リクエスト内容を先に更新
  - Google Calendar API で予定を作成（調整後の内容で作成）
  - 成功: Firestore の状態を `fixed` に更新、Google Calendar のイベント ID を保存
  - 失敗: `adjusting` 状態のまま、エラーを返す（再試行可能）

#### 9. 予約調整キャンセル（調整をやめる）

- **エンドポイント**: `POST /api/reservations/requests/:id/cancel-adjust`
- **認証**: 美容師認証（Google アカウント）
- **レスポンス**:
  ```json
  {
    "id": "req_1234567890",
    "status": "requested",
    "updatedAt": "2025-11-11T13:00:00+09:00"
  }
  ```
- **処理**:
  - 状態が `adjusting` の場合のみ実行可能
  - Firestore の状態を `requested` に戻す（編集内容は保持）

### カレンダー連携 API

#### 10. 空き枠確認

- **エンドポイント**: `GET /api/calendar/availability`
- **認証**: 美容師認証（Google アカウント）
- **クエリパラメータ**:
  - `from`: 開始日時
  - `to`: 終了日時
  - `duration`: 所要時間（分）
- **レスポンス**:
  ```json
  {
    "availableSlots": [
      {
        "start": "2025-11-20T14:00:00+09:00",
        "end": "2025-11-20T15:00:00+09:00"
      }
    ]
  }
  ```
- **処理**:
  - Google Calendar API から既存の予定を取得
  - 空き枠を計算（所要時間、バッファ時間を考慮）

#### 11. 次の予約情報取得

- **エンドポイント**: `GET /api/calendar/next-reservation`
- **認証**: LINE ユーザー ID（LIFF SDK から取得）
- **レスポンス**:
  ```json
  {
    "nextReservation": {
      "datetime": "2025-11-20T14:00:00+09:00",
      "menu": "カット",
      "customerName": "山田太郎"
    }
  }
  ```
- **処理**:
  - Google Calendar API から今後の予定を取得
  - LINE ユーザー ID でフィルタリング（予定の説明欄に保存された情報から）

#### 12. 手入力予定の読み取り（双方向同期）

- **エンドポイント**: `GET /api/calendar/sync`
- **認証**: 美容師認証（Google アカウント）
- **処理**:
  - Google Calendar API から最近の予定を取得
  - アプリで作成した予定と手入力予定を区別
  - 手入力予定を Firestore に反映（要検討: 必要か？）

### お知らせ管理 API

#### 13. 長期休暇お知らせ取得

- **エンドポイント**: `GET /api/announcements`
- **認証**: 不要（公開情報）
- **レスポンス**:
  ```json
  {
    "announcement": {
      "enabled": true,
      "message": "12月25日〜1月5日まで長期休暇のため予約をお受けできません",
      "startDate": "2025-12-25",
      "endDate": "2026-01-05"
    }
  }
  ```
- **処理**: Firestore からお知らせ情報を取得

#### 14. 長期休暇お知らせ設定

- **エンドポイント**: `POST /api/announcements`
- **認証**: 美容師認証（Google アカウント）
- **リクエスト**:
  ```json
  {
    "enabled": true,
    "message": "12月25日〜1月5日まで長期休暇のため予約をお受けできません",
    "startDate": "2025-12-25",
    "endDate": "2026-01-05"
  }
  ```
- **レスポンス**: 設定完了
- **処理**: Firestore にお知らせ情報を保存

### 認証管理 API（美容師側）

#### 15. Google 認証開始

- **エンドポイント**: `GET /api/auth/google/login`
- **認証**: 不要
- **レスポンス**: Google OAuth 2.0 の認証 URL にリダイレクト
- **処理**: Google OAuth 2.0 の認証フローを開始

#### 16. Google 認証コールバック

- **エンドポイント**: `GET /api/auth/google/callback`
- **認証**: Google OAuth 2.0 の認証コード
- **クエリパラメータ**:
  - `code`: Google OAuth 2.0 の認証コード
  - `state`: CSRF 対策の状態トークン
- **レスポンス**: 認証成功後、カレンダー選択画面にリダイレクト
- **処理**:
  - 認証コードをアクセストークン・リフレッシュトークンに交換
  - 認証情報を Firestore に保存（暗号化）
  - セッションを確立

#### 17. カレンダー一覧取得

- **エンドポイント**: `GET /api/auth/calendars`
- **認証**: 美容師認証（Google アカウント）（Google アカウント）
- **レスポンス**:
  ```json
  {
    "calendars": [
      {
        "id": "primary",
        "summary": "メインカレンダー",
        "description": "予約管理用"
      }
    ]
  }
  ```
- **処理**: Google Calendar API からカレンダー一覧を取得

#### 18. カレンダー選択・設定

- **エンドポイント**: `POST /api/auth/calendar/select`
- **認証**: 美容師認証（Google アカウント）（Google アカウント）
- **リクエスト**:
  ```json
  {
    "calendarId": "primary"
  }
  ```
- **レスポンス**: 設定完了
- **処理**: 選択したカレンダー ID を Firestore に保存

#### 19. 認証状態確認

- **エンドポイント**: `GET /api/auth/status`
- **認証**: セッションまたはトークン
- **レスポンス**:
  ```json
  {
    "authenticated": true,
    "googleAccount": "example@gmail.com",
    "calendarId": "primary",
    "calendarName": "メインカレンダー"
  }
  ```
- **処理**: 認証状態とカレンダー設定を確認

### ユーザー管理 API

#### 20. ユーザー情報取得（お客さん側）

- **エンドポイント**: `GET /api/users/me`
- **認証**: LINE ユーザー ID（LIFF SDK から取得）
- **レスポンス**:
  ```json
  {
    "lineUserId": "U1234567890abcdef",
    "displayName": "山田太郎",
    "profileImageUrl": "https://..."
  }
  ```
- **処理**: LIFF SDK から取得した情報を返す（または Firestore から取得）

---

## データモデル（Firestore）

### 予約リクエスト（reservations）

```typescript
{
  id: string;                    // リクエスト ID
  lineUserId: string;            // LINE ユーザー ID
  customerName: string;          // 顧客名
  datetime: string;              // 予約希望日時（ISO 8601）
  menu: string;                  // メニュー
  contact: string;               // 連絡手段
  status: "requested" | "adjusting" | "rejected" | "fixed";
  createdAt: Timestamp;          // 作成日時
  updatedAt: Timestamp;          // 更新日時
  calendarEventId?: string;      // Google Calendar のイベント ID（確定時）
  adjustedDatetime?: string;     // 調整後の日時
}
```

### お知らせ（announcements）

```typescript
{
  id: string; // お知らせ ID（固定: "main"）
  enabled: boolean; // 表示/非表示
  message: string; // お知らせ内容
  startDate: string; // 表示開始日
  endDate: string; // 表示終了日
  updatedAt: Timestamp; // 更新日時
}
```

### ユーザー情報（users）

```typescript
{
  lineUserId: string;            // LINE ユーザー ID（ドキュメント ID）
  displayName: string;           // 表示名
  profileImageUrl?: string;      // プロフィール画像 URL
  createdAt: Timestamp;          // 作成日時
  updatedAt: Timestamp;          // 更新日時
}
```

### 美容師認証情報（stylistAuth）

```typescript
{
  id: string; // 認証情報 ID（固定: "main"）
  googleAccount: string; // Google アカウント（メールアドレス）
  accessToken: string; // アクセストークン（暗号化推奨）
  refreshToken: string; // リフレッシュトークン（暗号化推奨）
  tokenExpiry: Timestamp; // トークンの有効期限
  calendarId: string; // 選択されたカレンダー ID
  calendarName: string; // カレンダー名
  createdAt: Timestamp; // 作成日時
  updatedAt: Timestamp; // 更新日時
}
```

---

## 認証・権限管理

### お客さん側

- **認証**: LIFF SDK で LINE ユーザー ID を取得
- **権限**: 自分の予約リクエストのみ操作可能

### 美容師側

- **認証**: **Google アカウント認証（OAuth 2.0）**
  - Google アカウントでログイン
  - Google Calendar API の認可を同時に行う
  - 普段予約管理に使っているカレンダーを選択・指定
  - 認証情報（アクセストークン、リフレッシュトークン）を Firestore に保存
- **権限**: すべての予約リクエストの操作、お知らせ設定、Google Calendar への予定作成
- **認証フロー**:
  1. 美容師が管理画面にアクセス
  2. Google アカウントでログイン（OAuth 2.0）
  3. Google Calendar API の認可（カレンダーの読み取り・書き込み権限）
  4. 使用するカレンダーを選択（複数カレンダーがある場合）
  5. 認証情報を Firestore に保存（暗号化推奨）
  6. 以降はリフレッシュトークンで自動更新

---

## 次の検討事項

- [x] 美容師側の認証方法の決定（Google アカウント認証に決定）
- [x] エラーハンドリングとリトライロジック（詳細は[エラーハンドリングとリトライロジック方針](./2025-11-11-error-handling-retry.md)を参照）
- [x] 予約承認フローの再検討（承認と FIX の統合、詳細は[予約リクエストフローの再検討](./2025-11-11-reservation-flow-revision.md)を参照）
- [ ] Google Calendar の予定フォーマット取り決め（状態情報の保存方法）
- [ ] 認証情報（トークン）の保存方法（暗号化、セキュリティ）
- [ ] カレンダー選択 UI（複数カレンダーがある場合の選択方法）
- [ ] 同時リクエストの競合処理（原子性の担保）
- [ ] タイムアウト処理（一定時間経過後のリクエストの自動キャンセル）
- [x] ログとモニタリング（詳細は[ログとモニタリング方針](./2025-11-11-logging-monitoring.md)を参照）
