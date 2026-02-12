# Gap Analysis: customer-reservation

## 1. 既存コードベースの現状

### 対象ファイル一覧

| カテゴリ | ファイル | 責務 |
|---------|---------|------|
| ページ | `app/page.tsx` | ホーム画面（LIFF 認証 + ナビゲーション） |
| ページ | `app/create-request/page.tsx` | 予約リクエスト作成フォーム |
| ページ | `app/my-requests/page.tsx` | 予約リクエスト一覧 |
| API | `app/api/reservations/route.ts` | `POST /api/reservations`（予約作成） |
| API | `app/api/reservations/my/route.ts` | `GET /api/reservations/my`（顧客別取得） |
| ライブラリ | `lib/liff.ts` | LIFF SDK ラッパー（init, profile, login, logout） |
| ライブラリ | `lib/firebase.ts` | Firebase singleton 初期化 |
| ライブラリ | `lib/firestore.ts` | Firestore CRUD（予約 + トークン） |
| 型定義 | `types/reservation.ts` | `ReservationRequest`, `MENUS`, `StylistToken` |

### アーキテクチャパターン

- **LIFF 認証**: 各ページで独立して `initializeLiff` → `getUserProfile` を呼び出し（共通化されていない）
- **データアクセス**: `lib/firestore.ts` に関数を集約。Repository Pattern 未適用
- **状態管理**: React `useState`/`useEffect` のみ（グローバル状態管理なし）
- **スタイリング**: Tailwind CSS 4、モバイルファーストのインラインクラス
- **エラー処理**: try-catch + useState でローカルに処理

### 命名規約

- ファイル: kebab-case（`create-request`, `my-requests`）
- コンポーネント: PascalCase デフォルトエクスポート
- 型: PascalCase（`ReservationRequest`）
- 定数: `UPPER_SNAKE_CASE` + `as const`（`MENUS`）

---

## 2. 要件と既存実装のマッピング

### Requirement 1: LIFF 認証・初期化

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 1.1 | LIFF SDK 初期化・ログイン確認 | **実装済み** | `lib/liff.ts:7-18` |
| 1.2 | 未ログイン時の LINE ログインリダイレクト | **実装済み** | `lib/liff.ts:11-13` |
| 1.3 | プロフィール取得・ホーム画面表示 | **実装済み** | `app/page.tsx:23-25`, `lib/liff.ts:24-38` |
| 1.4 | LIFF ID 未設定時のエラー表示 | **実装済み** | `app/page.tsx:19-21` |
| 1.5 | LIFF 初期化失敗時のエラー表示 | **実装済み** | `app/page.tsx:27-30` |

**カバレッジ: 5/5 (100%)**

### Requirement 2: ホーム画面

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 2.1 | LINE 表示名を含む挨拶表示 | **実装済み** | `app/page.tsx:76-80` |
| 2.2 | 2 つのナビゲーションリンク | **実装済み** | `app/page.tsx:84-114` |
| 2.3 | `/create-request` への遷移 | **実装済み** | `app/page.tsx:86-97` |
| 2.4 | `/my-requests` への遷移 | **実装済み** | `app/page.tsx:99-113` |

**カバレッジ: 4/4 (100%)**

### Requirement 3: 予約リクエスト作成

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 3.1 | 顧客名の読み取り専用表示 | **実装済み** | `app/create-request/page.tsx:138-148` |
| 3.2 | 希望日の日付ピッカー | **実装済み** | `app/create-request/page.tsx:151-161` |
| 3.3 | 希望時間の時刻ピッカー | **実装済み** | `app/create-request/page.tsx:164-174` |
| 3.4 | メニュー選択（ラジオボタン + 所要時間表示） | **実装済み** | `app/create-request/page.tsx:177-212` |
| 3.5 | デフォルトでカット選択 | **実装済み** | `app/create-request/page.tsx:23` |
| 3.6 | 日時未選択時のエラー表示 | **実装済み** | `app/create-request/page.tsx:59-61` |
| 3.7 | 予約リクエスト API への送信 | **実装済み** | `app/create-request/page.tsx:70-79` |
| 3.8 | 送信中の UI フィードバック | **実装済み** | `app/create-request/page.tsx:225-228` |
| 3.9 | 成功時のリダイレクト | **実装済み** | `app/create-request/page.tsx:86` |
| 3.10 | 失敗時のエラー表示 | **実装済み** | `app/create-request/page.tsx:87-92`, `214-219` |

**カバレッジ: 10/10 (100%)**

### Requirement 4: 予約リクエスト API（作成）

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 4.1 | 有効データでの Firestore 作成 + HTTP 201 | **実装済み** | `app/api/reservations/route.ts:35-42` |
| 4.2 | 必須フィールド不足時の HTTP 400 | **実装済み** | `app/api/reservations/route.ts:11-24` |
| 4.3 | ISO 8601 バリデーション + HTTP 400 | **実装済み** | `app/api/reservations/route.ts:27-33` |
| 4.4 | Firestore 書き込み失敗時の HTTP 500 | **実装済み** | `app/api/reservations/route.ts:43-49` |

**カバレッジ: 4/4 (100%)**

### Requirement 5: 予約リクエスト一覧表示

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 5.1 | LIFF 認証 + 自分の予約のみ取得 | **実装済み** | `app/my-requests/page.tsx:55-71` |
| 5.2 | メニュー名・希望日時・ステータス表示 | **実装済み** | `app/my-requests/page.tsx:147-166` |
| 5.3 | ステータスの色分け表示 | **実装済み** | `app/my-requests/page.tsx:8-27` |
| 5.4 | 日本語ロケールの日時フォーマット | **実装済み** | `app/my-requests/page.tsx:29-43` |
| 5.5 | 0 件時のメッセージ + 作成リンク | **実装済み** | `app/my-requests/page.tsx:132-142` |
| 5.6 | 戻るボタンでホームへ遷移 | **実装済み** | `app/my-requests/page.tsx:124-125` |
| 5.7 | 取得失敗時のエラー表示 + ホームリンク | **実装済み** | `app/my-requests/page.tsx:98-117` |

**カバレッジ: 7/7 (100%)**

### Requirement 6: 予約リクエスト API（取得）

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 6.1 | customerId でフィルタして HTTP 200 | **実装済み** | `app/api/reservations/my/route.ts:12-16` |
| 6.2 | customerId 未指定時の HTTP 400 | **実装済み** | `app/api/reservations/my/route.ts:9-12` |
| 6.3 | Firestore 読み取り失敗時の HTTP 500 | **実装済み** | `app/api/reservations/my/route.ts:18-24` |

**カバレッジ: 3/3 (100%)**

### Requirement 7: UI 共通仕様

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 7.1 | ローディングスピナー + テキスト | **実装済み** | 全3ページに実装（`page.tsx:39-48` 等） |
| 7.2 | モバイルファーストレイアウト | **実装済み** | Tailwind CSS クラスで全ページに適用 |
| 7.3 | ブランドカラー（green-600）の一貫使用 | **実装済み** | ヘッダー + ボタンで統一 |
| 7.4 | ヘッダーバー + サブページの戻るナビ | **実装済み** | サブページに `‹` リンク付きヘッダー |

**カバレッジ: 4/4 (100%)**

---

## 3. 全体カバレッジサマリー

| Requirement | AC 数 | 実装済み | 未実装 | カバレッジ |
|-------------|--------|---------|--------|-----------|
| 1: LIFF 認証・初期化 | 5 | 5 | 0 | 100% |
| 2: ホーム画面 | 4 | 4 | 0 | 100% |
| 3: 予約リクエスト作成 | 10 | 10 | 0 | 100% |
| 4: 予約リクエスト API（作成） | 4 | 4 | 0 | 100% |
| 5: 予約リクエスト一覧表示 | 7 | 7 | 0 | 100% |
| 6: 予約リクエスト API（取得） | 3 | 3 | 0 | 100% |
| 7: UI 共通仕様 | 4 | 4 | 0 | 100% |
| **合計** | **37** | **37** | **0** | **100%** |

---

## 4. 実装アプローチ評価

### Option A: 現状維持（コード変更なし）

全要件が既に実装済みのため、顧客フローについては追加実装は不要。

**Trade-offs**:
- ✅ コード変更リスクゼロ
- ✅ 既存の動作を維持
- ❌ LIFF 初期化の重複コード（3ページで同一パターン）が放置される
- ❌ テストが未構築

### Option B: 品質改善リファクタリング（将来検討）

既存コードを仕様書に照らして品質向上させる。ただし今回のスコープ外。

**改善候補（参考）**:
1. LIFF 認証の共通化（カスタムフック `useLiff()` の抽出）
2. API エラーレスポンスの型定義
3. ローディング・エラー UI コンポーネントの共通化

---

## 5. 複雑度・リスク評価

- **工数**: **N/A**（全要件が実装済みのため追加実装なし）
- **リスク**: **Low**（既存実装が要件を完全にカバー）

---

## 6. 設計フェーズへの推奨事項

### 結論
顧客予約フロー（customer-reservation）は、全 37 件の Acceptance Criteria が既存 MVP コードで **100% カバー** されている。追加の実装タスクは不要。

### 設計フェーズでの検討事項（将来的なリファクタリング向け）
1. LIFF 認証パターンの共通化（3ページで重複する初期化ロジック）
2. エラー表示 UI の共通コンポーネント抽出
3. テスト戦略の策定（Jest + React Testing Library）

### Research Needed
- なし（顧客フローの範囲では技術的な未知項目なし）
