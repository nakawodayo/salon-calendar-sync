# MVP 作成プラン

**作成日**: 2025-11-11
**関連**: [Phase 1 要件定義](../logs/2025-11-11-phase1-requirements.md)、[システム設計](./2025-11-11-system-design.md)

---

## MVP の目的と範囲

### 目的

**核心的な価値の提供:**

- お客さんがアプリから予約リクエストを送信できる
- 美容師が予約リクエストを承認し、Google Calendar に予定を作成できる
- 手入力作業をほぼゼロにする（最小限の機能で実現）

### MVP に含める機能

#### お客さん側（必須）

1. **LIFF 認証**

   - LINE ユーザー ID と表示名の取得
   - 認証状態の管理

2. **予約リクエスト作成**

   - 日時選択（カレンダー UI）
   - メニュー選択（固定メニューから選択）
   - 顧客名（自動入力: LIFF から取得）
   - 送信

3. **自分の予約リクエスト一覧表示**
   - リクエスト一覧の表示
   - 状態表示（リクエスト中、確定済み）

#### 美容師側（必須）

1. **Google 認証**

   - Google アカウントでログイン
   - Google Calendar API の認可
   - カレンダー選択（単一カレンダーを想定）

2. **予約リクエスト一覧表示**（マスト）

   - 承認待ちのリクエスト一覧
   - 日時でソート
   - 各リクエストの詳細表示

3. **予約承認**

   - リクエストの承認
   - リクエストの拒否

4. **予約確定（FIX）**
   - Google Calendar に予定作成
   - 状態を `fixed` に更新

### MVP に含めない機能（将来の拡張）

1. **長期休暇のお知らせ機能**

   - Phase 2 以降で実装

2. **次の予約情報取得（お客さん側）**

   - Phase 2 以降で実装

3. **手入力予定の読み取り・反映**

   - 双方向同期は Phase 2 以降で実装

4. **調整機能（adjusting 状態の管理）**

   - 最初は承認/拒否のみで運用
   - Phase 2 以降で実装

5. **空き枠判定の高度な実装**

   - MVP では簡易版（重複チェックのみ）
   - Phase 2 以降で所要時間・バッファを考慮

6. **複数カレンダー対応**
   - 単一カレンダーのみ対応

---

## 技術スタック（確認）

### フロントエンド

- **フレームワーク**: Next.js 14+ (App Router) + TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks
- **フォーム管理**: React Hook Form
- **バリデーション**: Zod
- **LIFF SDK**: `@line/liff`

### バックエンド

- **ランタイム**: Node.js 18+ (LTS)
- **言語**: TypeScript
- **フレームワーク**: Express.js
- **ホスティング**: GCP Cloud Functions
- **データベース**: Firebase Firestore
- **外部 API**:
  - Google Calendar API
  - LINE API (LIFF SDK)

### インフラ

- **フロントエンド**: Vercel（無料プラン）
- **バックエンド**: GCP Cloud Functions（無料枠）
- **データベース**: Firebase Firestore（無料枠）
- **ログ**: Cloud Logging
- **モニタリング**: Cloud Monitoring

---

## 実装フェーズ

### Phase 1: 基盤構築（1-2 週間）

**目的**: 開発環境の構築と基盤機能の実装

#### タスクリスト

1. **プロジェクトセットアップ**

   - [ ] リポジトリの初期化
   - [ ] フロントエンド（Next.js）のセットアップ
   - [ ] バックエンド（Cloud Functions）のセットアップ
   - [ ] TypeScript の設定
   - [ ] ESLint、Prettier の設定
   - [ ] ディレクトリ構造の作成（Clean Architecture に基づく）

2. **認証基盤**

   - [ ] LIFF SDK の統合（フロントエンド）
   - [ ] LINE ユーザー ID と表示名の取得
   - [ ] Google OAuth 2.0 の実装（バックエンド）
   - [ ] 認証情報の保存（Firestore）

3. **データベース設計**

   - [ ] Firestore のコレクション設計
   - [ ] データモデルの定義（TypeScript）
   - [ ] セキュリティルールの設定

4. **ロギング基盤**

   - [ ] Winston の導入
   - [ ] Cloud Logging への送信設定
   - [ ] エラーログの記録

5. **エラーハンドリング基盤**
   - [ ] エラーオブジェクトの定義（ドメイン層）
   - [ ] エラーハンドリングミドルウェア（プレゼンテーション層）
   - [ ] 基本的なエラーレスポンス形式

**成果物:**

- 認証が動作する状態
- ログが記録される状態
- エラーハンドリングが動作する状態

---

### Phase 2: お客さん側機能（1-2 週間）

**目的**: お客さんが予約リクエストを送信できる機能の実装

#### タスクリスト

1. **リポジトリパターンの実装**

   - [ ] `IReservationRepository` インターフェースの定義（ドメイン層）
   - [ ] `FirestoreReservationRepository` の実装（インフラ層）
   - [ ] リポジトリのテスト

2. **ドメイン層の実装**

   - [ ] `ReservationRequest` エンティティの実装
   - [ ] `ReservationStatus` 値オブジェクトの実装
   - [ ] ビジネスロジックの実装

3. **ユースケースの実装**

   - [ ] `CreateReservationRequestUseCase` の実装
   - [ ] `GetMyReservationRequestsUseCase` の実装

4. **API の実装**

   - [ ] `POST /api/reservations/requests` の実装
   - [ ] `GET /api/reservations/my-requests` の実装
   - [ ] バリデーション（Zod）
   - [ ] エラーハンドリング

5. **フロントエンド UI**

   - [ ] トップページ（ホーム画面）
   - [ ] 予約リクエスト作成画面
   - [ ] 自分の予約リクエスト一覧画面
   - [ ] LIFF SDK の統合

6. **統合テスト**
   - [ ] お客さん側のエンドツーエンドテスト
   - [ ] エラーケースのテスト

**成果物:**

- お客さんが予約リクエストを送信できる状態
- 自分の予約リクエスト一覧を表示できる状態

---

### Phase 3: 美容師側機能（1-2 週間）

**目的**: 美容師が予約リクエストを承認し、Google Calendar に予定を作成できる機能の実装

#### タスクリスト

1. **Google Calendar API の統合**

   - [ ] Google Calendar API クライアントの実装
   - [ ] カレンダー一覧取得の実装
   - [ ] 予定作成の実装
   - [ ] リトライロジックの実装

2. **リポジトリパターンの拡張**

   - [ ] `ICalendarRepository` インターフェースの定義
   - [ ] `GoogleCalendarRepository` の実装

3. **ユースケースの実装**

   - [ ] `GetReservationRequestsUseCase` の実装（美容師側）
   - [ ] `ApproveReservationUseCase` の実装
   - [ ] `RejectReservationUseCase` の実装
   - [ ] `FixReservationUseCase` の実装（Google Calendar に予定作成）

4. **API の実装**

   - [ ] `GET /api/reservations/requests` の実装（美容師側）
   - [ ] `POST /api/reservations/requests/:id/approve` の実装
   - [ ] `POST /api/reservations/requests/:id/reject` の実装
   - [ ] `POST /api/reservations/requests/:id/fix` の実装
   - [ ] 認証ミドルウェアの実装

5. **Google 認証 UI**

   - [ ] Google 認証・カレンダー選択画面
   - [ ] 認証状態の確認

6. **美容師側 UI**

   - [ ] 予約リクエスト管理画面（一覧）
   - [ ] 予約リクエスト詳細・操作画面
   - [ ] 承認/拒否/FIX ボタン

7. **統合テスト**
   - [ ] 美容師側のエンドツーエンドテスト
   - [ ] Google Calendar への予定作成のテスト
   - [ ] エラーケースのテスト

**成果物:**

- 美容師が予約リクエストを承認できる状態
- Google Calendar に予定が作成される状態

---

### Phase 4: 統合テストとデプロイ（1 週間）

**目的**: 全体の統合テストと本番環境へのデプロイ

#### タスクリスト

1. **統合テスト**

   - [ ] エンドツーエンドテスト（お客さん側 → 美容師側 → Google Calendar）
   - [ ] エラーケースのテスト
   - [ ] パフォーマンステスト

2. **モニタリング設定**

   - [ ] Cloud Monitoring のアラートポリシー設定
   - [ ] 通知チャネルの設定（Email、Slack）
   - [ ] ダッシュボードの作成

3. **セキュリティチェック**

   - [ ] Firestore のセキュリティルールの確認
   - [ ] 認証・認可の確認
   - [ ] 個人情報の保護確認

4. **デプロイ準備**

   - [ ] 環境変数の設定
   - [ ] デプロイスクリプトの作成
   - [ ] ドキュメントの整備

5. **デプロイ**

   - [ ] ステージング環境へのデプロイ
   - [ ] 本番環境へのデプロイ
   - [ ] 動作確認

6. **運用準備**
   - [ ] 運用マニュアルの作成
   - [ ] トラブルシューティングガイドの作成

**成果物:**

- 本番環境で動作する MVP
- モニタリングとアラートが設定された状態

---

## ディレクトリ構造

```
salon-calendar-sync/
├── frontend/                    # Next.js アプリ（LIFF）
│   ├── app/                    # App Router
│   │   ├── (customer)/        # お客さん側
│   │   │   ├── page.tsx       # トップページ
│   │   │   └── reservations/ # 予約関連
│   │   └── (stylist)/         # 美容師側
│   │       └── requests/      # リクエスト管理
│   ├── presentation/          # プレゼンテーション層
│   │   ├── components/        # UIコンポーネント
│   │   └── pages/            # ページコンポーネント
│   ├── application/          # アプリケーション層
│   │   ├── use-cases/        # ユースケース
│   │   └── services/        # アプリケーションサービス
│   ├── domain/               # ドメイン層
│   │   ├── entities/        # エンティティ
│   │   ├── value-objects/   # 値オブジェクト
│   │   └── repositories/   # リポジトリインターフェース
│   └── infrastructure/      # インフラストラクチャ層
│       ├── api/            # APIクライアント
│       └── repositories/   # リポジトリ実装
├── backend/                 # GCP Cloud Functions
│   ├── functions/          # 各 Cloud Function
│   │   ├── reservations/   # 予約管理API
│   │   ├── calendar/       # カレンダーAPI
│   │   └── auth/           # 認証API
│   ├── presentation/       # プレゼンテーション層
│   │   ├── controllers/   # コントローラー
│   │   ├── middleware/    # ミドルウェア
│   │   └── routes/        # ルーティング
│   ├── application/        # アプリケーション層
│   │   ├── use-cases/     # ユースケース
│   │   └── dto/           # データ転送オブジェクト
│   ├── domain/            # ドメイン層
│   │   ├── entities/      # エンティティ
│   │   ├── value-objects/ # 値オブジェクト
│   │   └── repositories/ # リポジトリインターフェース
│   └── infrastructure/    # インフラストラクチャ層
│       ├── repositories/  # リポジトリ実装
│       ├── adapters/      # 外部サービスアダプター
│       └── config/        # 設定
├── shared/                 # フロントエンド・バックエンド共通
│   └── types/             # 共有型定義
├── prototypes/            # Phase 1: プロトタイプ
│   ├── ui-sketches/
│   └── mvp/
└── docs/                  # ドキュメント
    └── ai-philosophy/
```

---

## 実装の優先順位

### 必須機能（MVP）

1. **認証**

   - LIFF 認証（お客さん側）
   - Google 認証（美容師側）

2. **予約リクエスト作成**

   - お客さんが予約リクエストを送信
   - Firestore に保存

3. **予約リクエスト一覧表示**

   - 美容師がリクエスト一覧を確認（マスト）

4. **予約承認・確定**
   - 美容師がリクエストを承認
   - Google Calendar に予定作成

### 簡易実装（MVP）

1. **空き枠判定**

   - 最初は重複チェックのみ
   - 所要時間・バッファは Phase 2 以降

2. **エラーハンドリング**

   - 基本的なエラーハンドリングのみ
   - リトライロジックは Phase 2 以降

3. **ログ**
   - 基本的なログ記録のみ
   - モニタリングは Phase 4 で設定

---

## テスト方針

### 単体テスト

- **エンティティ**: ビジネスロジックのテスト
- **ユースケース**: モックリポジトリを使用してテスト
- **リポジトリ**: Firestore エミュレータを使用してテスト

### 統合テスト

- **API**: エンドツーエンドのテスト
- **Google Calendar API**: テストカレンダーを使用
- **LIFF**: モックまたはテスト環境を使用

### テストツール

- **Jest**: テストフレームワーク
- **React Testing Library**: フロントエンドのテスト
- **Firestore Emulator**: データベースのテスト
- **Supertest**: API のテスト

---

## デプロイ方針

### 環境

1. **開発環境**

   - ローカル開発
   - Firestore Emulator を使用

2. **ステージング環境**

   - Vercel Preview
   - Cloud Functions（ステージング用）
   - Firestore（テストデータ）

3. **本番環境**
   - Vercel Production
   - Cloud Functions（本番用）
   - Firestore（本番データ）

### デプロイフロー

1. **フロントエンド**

   - GitHub にプッシュ
   - Vercel が自動デプロイ

2. **バックエンド**

   - Cloud Functions にデプロイ
   - `gcloud functions deploy` コマンド

3. **データベース**
   - Firestore のセキュリティルールをデプロイ
   - `firebase deploy --only firestore:rules`

---

## リスクと対策

### 技術的リスク

1. **Google Calendar API のレート制限**

   - **対策**: リトライロジックの実装
   - **対策**: キャッシュの活用

2. **LIFF SDK の統合**

   - **対策**: テスト環境での動作確認
   - **対策**: エラーハンドリングの実装

3. **Firestore のセキュリティルール**
   - **対策**: セキュリティルールの徹底的なテスト
   - **対策**: 最小権限の原則

### 運用リスク

1. **認証トークンの期限切れ**

   - **対策**: リフレッシュトークンの自動更新
   - **対策**: エラーハンドリングと再認証フロー

2. **同時リクエストの競合**
   - **対策**: Firestore のトランザクションを使用
   - **対策**: 楽観的ロックの実装

---

## 成功指標（MVP）

### 機能的な成功指標

- [ ] お客さんが予約リクエストを送信できる
- [ ] 美容師が予約リクエスト一覧を確認できる
- [ ] 美容師が予約を承認できる
- [ ] Google Calendar に予定が作成される

### 非機能的な成功指標

- [ ] 予約確定からカレンダー反映まで 3 秒以内
- [ ] エラー発生時に開発者に通知される
- [ ] ログが適切に記録される

---

## 次のステップ（Phase 2 以降）

1. **調整機能の実装**

   - `adjusting` 状態の管理
   - 日時の調整機能

2. **空き枠判定の高度化**

   - 所要時間の考慮
   - バッファ時間の考慮

3. **長期休暇のお知らせ機能**

   - お知らせの設定・表示

4. **次の予約情報取得**

   - お客さん側の次の予約表示

5. **手入力予定の読み取り**
   - 双方向同期の実装

---

## 参考資料

- [Phase 1 要件定義](../logs/2025-11-11-phase1-requirements.md)
- [システム設計](./2025-11-11-system-design.md)
- [アーキテクチャ設計ガイドライン](./2025-11-11-architecture-guidelines.md)
- [エラーハンドリングとリトライロジック方針](./2025-11-11-error-handling-retry.md)
- [ログとモニタリング方針](./2025-11-11-logging-monitoring.md)

---

## 更新履歴

- **2025-11-11**: 初版作成（MVP の作成プランを定義）
