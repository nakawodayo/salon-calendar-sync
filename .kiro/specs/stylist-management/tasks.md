# Implementation Tasks: スタイリスト管理機能

## タスク一覧

- [x] 1. `StylistToken` 型に `selectedCalendarId?`, `selectedCalendarName?` を追加
  - `types/reservation.ts`
  - _Requirements: 11.13, 11.14_

- [x] 2. Firestore ヘルパー `updateStylistCalendarSelection()` を追加
  - `lib/firestore.ts` に `updateDoc` でカレンダー選択フィールドのみ更新する関数を追加
  - _Requirements: 11.11_

- [x] 3. `GET /api/auth/google/calendars` API を作成
  - `app/api/auth/google/calendars/route.ts` を新規作成
  - Firestore からトークン取得 → OAuth2 クライアント設定 → `calendarList.list()` 呼び出し
  - `accessRole` が `writer` or `owner` のみフィルタ
  - _Requirements: 11.8, 11.9, 11.10_

- [x] 4. `POST /api/auth/google/calendar-select` API を作成
  - `app/api/auth/google/calendar-select/route.ts` を新規作成
  - body から `calendarId`, `calendarName` を取得、未指定なら 400
  - _Requirements: 11.6, 11.11, 11.12_

- [x] 5. `/stylist/calendar-select` ページを作成
  - `app/stylist/calendar-select/page.tsx` を新規作成
  - カード形式で各カレンダーを表示（名前 + 色ドット）、ラジオ選択
  - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 6. OAuth コールバックでカレンダー選択を保持 + リダイレクト分岐
  - `app/api/auth/google/callback/route.ts` を修正
  - _Requirements: 11.1, 11.17, 11.18_

- [x] 7. 承認 API で `selectedCalendarId` を使用
  - `app/api/stylist/requests/[id]/approve/route.ts` を修正
  - _Requirements: 11.13, 11.14_

- [x] 8. 認証状態 API でカレンダー情報を返す
  - `app/api/auth/google/status/route.ts` を修正
  - _Requirements: 11.16_

- [x] 9. 認証ページに現在のカレンダー表示 + 変更リンクを追加
  - `app/stylist/auth/page.tsx` を修正
  - _Requirements: 11.15_

- [x] 10. デモガイド更新
  - `docs/demo-guide.md` を更新
  - _Requirements: N/A（ドキュメント）_

- [x] 11. cc-sdd ドキュメント更新
  - `requirements.md` に Requirement 11 追加
  - `gap-analysis.md` に Requirement 11 のマッピング追加
  - `design.md` 新規作成
  - `tasks.md` 新規作成

## マルチスタイリスト識別（Requirement 12）

- [x] 12. `lib/stylist-session.ts` 新規作成（Cookie ヘルパー）
  - `getStylistId()`: Cookie から `stylist_email` を読み取り
  - _Requirements: 12.5, 12.6, 12.7, 12.8, 12.9_

- [x] 13. OAuth スコープ追加 + `getUserEmail()` 関数追加
  - `lib/google-auth.ts` に `openid` + `userinfo.email` スコープ追加
  - `getUserEmail()` 関数: `google.oauth2('v2').userinfo.get()` でメール取得
  - _Requirements: 12.1, 12.2_

- [x] 14. OAuth コールバックで email 取得 → Firestore キーに使用 → Cookie セット
  - `app/api/auth/google/callback/route.ts` を修正
  - `STYLIST_ID` ハードコードを削除、`getUserEmail()` でメール取得
  - `stylist_email` Cookie を HttpOnly, 1年有効でセット
  - _Requirements: 12.2, 12.3, 12.4, 12.12_

- [x] 15. 認証状態 API を Cookie ベースに変更 + email 返却
  - `app/api/auth/google/status/route.ts` を修正
  - `STYLIST_ID` ハードコードを削除、`getStylistId()` で Cookie から取得
  - レスポンスに `email` フィールド追加
  - _Requirements: 12.5, 12.9, 12.10_

- [x] 16. カレンダー一覧 API を Cookie ベースに変更
  - `app/api/auth/google/calendars/route.ts` を修正
  - `STYLIST_ID` ハードコードを削除、`getStylistId()` で Cookie から取得
  - _Requirements: 12.6, 12.9_

- [x] 17. カレンダー選択 API を Cookie ベースに変更
  - `app/api/auth/google/calendar-select/route.ts` を修正
  - `STYLIST_ID` ハードコードを削除、`getStylistId()` で Cookie から取得
  - _Requirements: 12.7, 12.9_

- [x] 18. 承認 API を Cookie ベースに変更
  - `app/api/stylist/requests/[id]/approve/route.ts` を修正
  - `STYLIST_ID` ハードコードを削除、`getStylistId()` で Cookie から取得
  - _Requirements: 12.8, 12.9_

- [x] 19. 認証ページにメールアドレス表示
  - `app/stylist/auth/page.tsx` を修正
  - status API の `email` フィールドを認証済みセクションに表示
  - _Requirements: 12.11_

- [x] 20. cc-sdd ドキュメント更新
  - `requirements.md` に Requirement 12 追加
  - `gap-analysis.md` に Requirement 12 のマッピング追加、合計を 86 → 98 に更新
  - `design.md` にマルチスタイリスト設計を追記
  - `tasks.md` にタスク 12-20 を追記
