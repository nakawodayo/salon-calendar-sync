# Gap Analysis: stylist-management

## 1. 既存コードベースの現状

### 対象ファイル一覧

| カテゴリ | ファイル | 責務 |
|---------|---------|------|
| ページ | `app/stylist/auth/page.tsx` | Google 認証画面（状態確認 + 認証リンク） |
| ページ | `app/stylist/requests/page.tsx` | 予約リクエスト一覧（全件表示） |
| ページ | `app/stylist/requests/[id]/page.tsx` | 予約リクエスト詳細（承認/却下アクション） |
| API | `app/api/auth/google/route.ts` | Google OAuth 認可 URL 生成 + リダイレクト |
| API | `app/api/auth/google/callback/route.ts` | OAuth コールバック（トークン交換 + 保存） |
| API | `app/api/auth/google/status/route.ts` | 認証状態確認 |
| API | `app/api/stylist/requests/route.ts` | 全予約リクエスト一覧取得 |
| API | `app/api/stylist/requests/[id]/route.ts` | 予約リクエスト詳細取得 |
| API | `app/api/stylist/requests/[id]/approve/route.ts` | 予約承認 + Google Calendar 作成 |
| API | `app/api/stylist/requests/[id]/reject/route.ts` | 予約拒否 |
| ライブラリ | `lib/google-auth.ts` | OAuth2 クライアント・認可 URL・トークン交換・Calendar クライアント |
| ライブラリ | `lib/firestore.ts` | Firestore CRUD（トークン保存/取得含む） |
| 型定義 | `types/reservation.ts` | `StylistToken`, `ReservationRequest`, `MENUS` |

### アーキテクチャパターン

- **Google 認証**: サーバーサイド OAuth フロー（API Routes 経由）
- **スタイリスト識別**: ハードコード `'default-stylist'`（シングルスタイリスト前提）
- **データアクセス**: `lib/firestore.ts` に CRUD 関数集約
- **ブランドカラー**: スタイリスト側は青（blue-600）、顧客側は緑（green-600）で差別化
- **ヘッダー**: 白背景 + border-b + sticky（顧客側の緑ヘッダーとは異なるデザイン）

---

## 2. 要件と既存実装のマッピング

### Requirement 1: Google OAuth 認証

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 1.1 | 認証状態を API で確認 | **実装済み** | `app/stylist/auth/page.tsx:13-25` |
| 1.2 | 確認中のスピナー表示 | **実装済み** | `app/stylist/auth/page.tsx:42-47` |
| 1.3 | 認証済み時の UI 表示 | **実装済み** | `app/stylist/auth/page.tsx:49-68` |
| 1.4 | 未認証時の UI 表示 | **実装済み** | `app/stylist/auth/page.tsx:71-99` |
| 1.5 | Google OAuth 画面へのリダイレクト | **実装済み** | `app/stylist/auth/page.tsx:85-98` |

**カバレッジ: 5/5 (100%)**

### Requirement 2: Google OAuth API（認証フロー）

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 2.1 | 認可 URL 生成 + リダイレクト | **実装済み** | `app/api/auth/google/route.ts:4-8` |
| 2.2 | スコープ + offline access | **実装済み** | `lib/google-auth.ts:4-7,24-28` |
| 2.3 | コールバックでトークン交換 + 保存 | **実装済み** | `app/api/auth/google/callback/route.ts:28-41` |
| 2.4 | 成功時のリダイレクト | **実装済み** | `app/api/auth/google/callback/route.ts:44` |
| 2.5 | ユーザー拒否時のエラーリダイレクト | **実装済み** | `app/api/auth/google/callback/route.ts:14-18` |
| 2.6 | 認可コード不在時のエラーリダイレクト | **実装済み** | `app/api/auth/google/callback/route.ts:21-26` |
| 2.7 | トークン交換失敗時のエラーリダイレクト | **実装済み** | `app/api/auth/google/callback/route.ts:45-49` |

**カバレッジ: 7/7 (100%)**

### Requirement 3: Google 認証状態確認 API

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 3.1 | トークン取得 + authenticated 返却 | **実装済み** | `app/api/auth/google/status/route.ts:6-11` |
| 3.2 | access_token 存在で true 判定 | **実装済み** | `app/api/auth/google/status/route.ts:10` |
| 3.3 | 取得失敗時に false を返す | **実装済み** | `app/api/auth/google/status/route.ts:12-16` |

**カバレッジ: 3/3 (100%)**

### Requirement 4: 予約リクエスト一覧（スタイリスト用）

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 4.1 | 全予約リクエストの取得・表示 | **実装済み** | `app/stylist/requests/page.tsx:71-86` |
| 4.2 | 顧客名・メニュー・日時・ステータス表示 | **実装済み** | `app/stylist/requests/page.tsx:190-205` |
| 4.3 | ステータスの色分けバッジ | **実装済み** | `app/stylist/requests/page.tsx:23-46` |
| 4.4 | 詳細ページへの遷移 | **実装済み** | `app/stylist/requests/page.tsx:185-211` |
| 4.5 | ヘッダーに認証状態表示 | **実装済み** | `app/stylist/requests/page.tsx:96-111` |
| 4.6 | 未認証時の警告バナー | **実装済み** | `app/stylist/requests/page.tsx:126-146` |
| 4.7 | 「更新」ボタンで再取得 | **実装済み** | `app/stylist/requests/page.tsx:112-117` |
| 4.8 | 0 件時のメッセージ | **実装済み** | `app/stylist/requests/page.tsx:170-179` |
| 4.9 | 取得中のスピナー | **実装済み** | `app/stylist/requests/page.tsx:149-154` |
| 4.10 | 取得失敗時のエラー + 再試行 | **実装済み** | `app/stylist/requests/page.tsx:157-167` |

**カバレッジ: 10/10 (100%)**

### Requirement 5: 予約リクエスト一覧 API（スタイリスト用）

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 5.1 | 全件取得（降順）+ HTTP 200 | **実装済み** | `app/api/stylist/requests/route.ts:4-7` |
| 5.2 | 読み取り失敗時の HTTP 500 | **実装済み** | `app/api/stylist/requests/route.ts:8-14` |

**カバレッジ: 2/2 (100%)**

### Requirement 6: 予約リクエスト詳細（スタイリスト用）

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 6.1 | ID で予約取得・表示 | **実装済み** | `app/stylist/requests/[id]/page.tsx:65-84` |
| 6.2 | 顧客名・メニュー・日時・送信日時・ステータス表示 | **実装済み** | `app/stylist/requests/[id]/page.tsx:253-272` |
| 6.3 | 日本語日時フォーマット | **実装済み** | `app/stylist/requests/[id]/page.tsx:8-21` |
| 6.4 | `requested` 時に承認/却下ボタン表示 | **実装済み** | `app/stylist/requests/[id]/page.tsx:299-340` |
| 6.5 | 承認時の確認ダイアログ | **実装済み** | `app/stylist/requests/[id]/page.tsx:89-91` |
| 6.6 | 確認後に承認 API 呼び出し | **実装済み** | `app/stylist/requests/[id]/page.tsx:94-99` |
| 6.7 | 却下時の確認ダイアログ | **実装済み** | `app/stylist/requests/[id]/page.tsx:124-126` |
| 6.8 | 確認後に却下 API 呼び出し | **実装済み** | `app/stylist/requests/[id]/page.tsx:129-134` |
| 6.9 | API 呼び出し中のスピナー + ボタン無効化 | **実装済み** | `app/stylist/requests/[id]/page.tsx:303-318,320-338` |
| 6.10 | 承認成功時のカレンダーリンク + データリフレッシュ | **実装済み** | `app/stylist/requests/[id]/page.tsx:111-113,208-227` |
| 6.11 | 承認済み予約のカレンダー登録済みバナー | **実装済み** | `app/stylist/requests/[id]/page.tsx:229-238` |
| 6.12 | 却下済みバナー | **実装済み** | `app/stylist/requests/[id]/page.tsx:240-249` |
| 6.13 | HTTP 401 時のGoogle認証エラー + リンク | **実装済み** | `app/stylist/requests/[id]/page.tsx:103-107,285-292` |
| 6.14 | API 失敗時のエラー表示 | **実装済み** | `app/stylist/requests/[id]/page.tsx:276-296` |
| 6.15 | 予約未発見時のエラー + 一覧リンク | **実装済み** | `app/stylist/requests/[id]/page.tsx:180-195` |
| 6.16 | ヘッダーの戻るボタン | **実装済み** | `app/stylist/requests/[id]/page.tsx:156-163` |
| 6.17 | ページ下部の一覧リンク | **実装済み** | `app/stylist/requests/[id]/page.tsx:343-350` |

**カバレッジ: 17/17 (100%)**

### Requirement 7: 予約リクエスト詳細 API（スタイリスト用）

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 7.1 | ID で取得 + HTTP 200 | **実装済み** | `app/api/stylist/requests/[id]/route.ts:8-19` |
| 7.2 | 未発見時の HTTP 404 | **実装済み** | `app/api/stylist/requests/[id]/route.ts:12-16` |
| 7.3 | 読み取り失敗時の HTTP 500 | **実装済み** | `app/api/stylist/requests/[id]/route.ts:20-26` |

**カバレッジ: 3/3 (100%)**

### Requirement 8: 予約承認 API（Google Calendar 連携）

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 8.1 | 予約リクエスト取得 | **実装済み** | `approve/route.ts:49-56` |
| 8.2 | 未発見時の HTTP 404 | **実装済み** | `approve/route.ts:51-55` |
| 8.3 | 処理済み時の HTTP 400 | **実装済み** | `approve/route.ts:58-63` |
| 8.4 | トークン不在時の HTTP 401 | **実装済み** | `approve/route.ts:66-72` |
| 8.5 | メニュー所要時間 → 終了時刻計算 + イベント作成 | **実装済み** | `approve/route.ts:80-81,116-119` |
| 8.6 | イベントタイトル形式 | **実装済み** | `approve/route.ts:88` |
| 8.7 | イベント説明（メニュー・顧客名・連絡手段・送信日時） | **実装済み** | `approve/route.ts:89-94` |
| 8.8 | タイムゾーン Asia/Tokyo | **実装済み** | `approve/route.ts:97,101` |
| 8.9 | extendedProperties | **実装済み** | `approve/route.ts:103-112` |
| 8.10 | 成功時のステータス更新 + イベント ID 保存 | **実装済み** | `approve/route.ts:125-127` |
| 8.11 | 成功レスポンス（イベント ID + リンク） | **実装済み** | `approve/route.ts:129-136` |
| 8.12 | Google Calendar API 失敗時の HTTP 500 | **実装済み** | `approve/route.ts:137-149` |

**カバレッジ: 12/12 (100%)**

### Requirement 9: 予約拒否 API

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 9.1 | 予約リクエスト取得 | **実装済み** | `reject/route.ts:9-18` |
| 9.2 | 未発見時の HTTP 404 | **実装済み** | `reject/route.ts:13-17` |
| 9.3 | 処理済み時の HTTP 400 | **実装済み** | `reject/route.ts:20-25` |
| 9.4 | ステータス rejected に更新 + HTTP 200 | **実装済み** | `reject/route.ts:28-33` |
| 9.5 | 書き込み失敗時の HTTP 500 | **実装済み** | `reject/route.ts:34-39` |

**カバレッジ: 5/5 (100%)**

### Requirement 10: スタイリスト UI 共通仕様

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 10.1 | ブランドカラー（blue-600） | **実装済み** | 全スタイリストページのボタン・リンク |
| 10.2 | sticky 白ヘッダー + 戻るナビ | **実装済み** | 一覧: `page.tsx:91`, 詳細: `page.tsx:153` |
| 10.3 | 取得中のスピナー | **実装済み** | 全スタイリストページ |
| 10.4 | モバイルファースト + max-w-2xl | **実装済み** | 一覧: `page.tsx:124`, 詳細: `page.tsx:170` |

**カバレッジ: 4/4 (100%)**

### Requirement 11: Google Calendar 選択機能

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 11.1 | OAuth 認証後にカレンダー選択ページへリダイレクト | **実装済み** | `app/api/auth/google/callback/route.ts:49-51` |
| 11.2 | カレンダー一覧の取得・表示 | **実装済み** | `app/stylist/calendar-select/page.tsx:25-46` |
| 11.3 | カレンダー名・背景色のカード形式表示 | **実装済み** | `app/stylist/calendar-select/page.tsx:114-135` |
| 11.4 | 取得中のスピナー表示 | **実装済み** | `app/stylist/calendar-select/page.tsx:90-95` |
| 11.5 | 取得失敗時のエラー + 再試行ボタン | **実装済み** | `app/stylist/calendar-select/page.tsx:97-106` |
| 11.6 | 「決定」クリックで calendar-select API に送信 | **実装済み** | `app/stylist/calendar-select/page.tsx:52-70` |
| 11.7 | 保存成功後にリクエスト一覧へリダイレクト | **実装済み** | `app/stylist/calendar-select/page.tsx:66` |
| 11.8 | GET /api/auth/google/calendars で一覧取得 | **実装済み** | `app/api/auth/google/calendars/route.ts:8-36` |
| 11.9 | writer/owner のみフィルタ | **実装済み** | `app/api/auth/google/calendars/route.ts:24` |
| 11.10 | トークン不在時に HTTP 401 | **実装済み** | `app/api/auth/google/calendars/route.ts:10-14` |
| 11.11 | POST で calendarId を Firestore に保存 | **実装済み** | `app/api/auth/google/calendar-select/route.ts:18` |
| 11.12 | calendarId 未指定時に HTTP 400 | **実装済み** | `app/api/auth/google/calendar-select/route.ts:12-15` |
| 11.13 | 承認時に selectedCalendarId を使用 | **実装済み** | `approve/route.ts:117` |
| 11.14 | selectedCalendarId 未保存時は primary フォールバック | **実装済み** | `approve/route.ts:117` |
| 11.15 | 認証ページに現在のカレンダー名 + 変更リンク表示 | **実装済み** | `app/stylist/auth/page.tsx:65-76` |
| 11.16 | status API で selectedCalendarId/Name を返す | **実装済み** | `app/api/auth/google/status/route.ts:11-12` |
| 11.17 | 再認証時に既存 selectedCalendarId を保持 | **実装済み** | `app/api/auth/google/callback/route.ts:33,42-43` |
| 11.18 | 再認証時にカレンダー選択済みなら requests へ直接リダイレクト | **実装済み** | `app/api/auth/google/callback/route.ts:49-51` |

**カバレッジ: 18/18 (100%)**

### Requirement 12: マルチスタイリスト識別

| AC# | 要件 | 実装状況 | 対応ファイル |
|-----|------|----------|-------------|
| 12.1 | OAuth スコープに openid + userinfo.email 追加 | **実装済み** | `lib/google-auth.ts:4-7` |
| 12.2 | OAuth コールバックで email 取得 | **実装済み** | `app/api/auth/google/callback/route.ts:31` |
| 12.3 | Firestore ドキュメント ID にメールアドレス使用 | **実装済み** | `app/api/auth/google/callback/route.ts:47` |
| 12.4 | stylist_email Cookie セット（HttpOnly, 1年） | **実装済み** | `app/api/auth/google/callback/route.ts:57-62` |
| 12.5 | 認証状態 API が Cookie からスタイリスト ID 取得 | **実装済み** | `app/api/auth/google/status/route.ts:7` |
| 12.6 | カレンダー一覧 API が Cookie からスタイリスト ID 取得 | **実装済み** | `app/api/auth/google/calendars/route.ts:8` |
| 12.7 | カレンダー選択 API が Cookie からスタイリスト ID 取得 | **実装済み** | `app/api/auth/google/calendar-select/route.ts:7` |
| 12.8 | 承認 API が Cookie からスタイリスト ID 取得 | **実装済み** | `app/api/stylist/requests/[id]/approve/route.ts:49` |
| 12.9 | Cookie 不在時に HTTP 401 | **実装済み** | 上記全 API ルート |
| 12.10 | 認証状態 API がメールアドレスを返却 | **実装済み** | `app/api/auth/google/status/route.ts:20` |
| 12.11 | 認証ページにメールアドレス表示 | **実装済み** | `app/stylist/auth/page.tsx:59-63` |
| 12.12 | 異なるアカウントで別々の Firestore ドキュメントに保存 | **実装済み** | `app/api/auth/google/callback/route.ts:31,47` |

**カバレッジ: 12/12 (100%)**

---

## 3. 全体カバレッジサマリー

| Requirement | AC 数 | 実装済み | 未実装 | カバレッジ |
|-------------|--------|---------|--------|-----------|
| 1: Google OAuth 認証 | 5 | 5 | 0 | 100% |
| 2: Google OAuth API | 7 | 7 | 0 | 100% |
| 3: 認証状態確認 API | 3 | 3 | 0 | 100% |
| 4: 予約リクエスト一覧 | 10 | 10 | 0 | 100% |
| 5: 一覧 API | 2 | 2 | 0 | 100% |
| 6: 予約リクエスト詳細 | 17 | 17 | 0 | 100% |
| 7: 詳細 API | 3 | 3 | 0 | 100% |
| 8: 予約承認 API | 12 | 12 | 0 | 100% |
| 9: 予約拒否 API | 5 | 5 | 0 | 100% |
| 10: UI 共通仕様 | 4 | 4 | 0 | 100% |
| 11: Google Calendar 選択機能 | 18 | 18 | 0 | 100% |
| 12: マルチスタイリスト識別 | 12 | 12 | 0 | 100% |
| **合計** | **98** | **98** | **0** | **100%** |

---

## 4. 要件外の既知の課題

以下は現在の要件書の範囲外だが、今後の改善で検討すべき事項:

### トークン有効期限管理
- `expiry_date` は保存されるが、有効期限チェックは未実装
- 認証状態 API は `access_token` の存在のみで判定（期限切れでも `true`）
- `googleapis` ライブラリの暗黙的リフレッシュに依存
- リフレッシュ後の新トークンの Firestore 書き戻しなし

### 重複コード
- `formatDateTime` が一覧ページと詳細ページで重複定義
- `StatusBadge` コンポーネントが一覧ページと詳細ページで重複定義

---

## 5. 複雑度・リスク評価

- **工数**: **N/A**（全要件が実装済みのため追加実装なし）
- **リスク**: **Low**（既存実装が要件を完全にカバー）

---

## 6. 設計フェーズへの推奨事項

### 結論
スタイリスト予約管理フロー（stylist-management）は、全 98 件の Acceptance Criteria が既存 MVP コードで **100% カバー** されている。追加の実装タスクは不要。

### 将来的な改善候補（設計フェーズで検討）
1. **トークン有効期限管理**: 期限切れ検知 + リフレッシュ後のトークン永続化
2. **重複コードの共通化**: `formatDateTime`, `StatusBadge` のコンポーネント抽出
3. **テスト戦略**: API Routes のインテグレーションテスト

### Research Needed
- **トークンリフレッシュ**: googleapis ライブラリの自動リフレッシュ動作の詳細検証（リフレッシュ後の `on('tokens')` イベントでの書き戻し等）
