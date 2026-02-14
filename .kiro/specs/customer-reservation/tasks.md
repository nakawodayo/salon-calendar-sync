# Implementation Tasks

## Task 1: Firestore に `getNextFixedReservation()` 追加
- **Requirements:** 9.1
- **File:** `prototypes/mvp/frontend/lib/firestore.ts`
- **Description:** `limit` を import に追加し、`customerId` + `status == 'fixed'` + `requestedDateTime >= now` + `orderBy('requestedDateTime', 'asc')` + `limit(1)` で直近1件を返す関数を追加する
- **Notes:** Firestore 複合インデックス（`customerId` + `status` + `requestedDateTime`）が必要（初回実行時にコンソールにリンク表示）

## Task 2: 新規 API `GET /api/reservations/next` 作成
- **Requirements:** 9.1, 9.2, 9.3, 9.4
- **File:** `prototypes/mvp/frontend/app/api/reservations/next/route.ts`
- **Description:** 既存 `/api/reservations/my/route.ts` と同じエラーハンドリングパターンで、`{ reservation: ReservationRequest | null }` を返す

## Task 3: `app/page.tsx` に次回予約カード表示を追加
- **Requirements:** 8.1, 8.2, 8.3
- **File:** `prototypes/mvp/frontend/app/page.tsx`
- **Description:** LIFF 初期化後に `/api/reservations/next?customerId=...` を fetch し、プロフィール表示とナビゲーションリンクの間にカードを配置する

## Task 4: デモガイド更新
- **Requirements:** N/A（ドキュメント）
- **File:** `docs/demo-guide.md`
- **Description:** 「今後対応予定の改善」リストから該当項目を削除し、Step 2 周辺に承認後ホーム画面で「次回のご予約」が表示される旨を追記する

## Task 5: cc-sdd ドキュメント更新
- **Requirements:** N/A
- **Files:** `.kiro/specs/customer-reservation/requirements.md`, `.kiro/specs/customer-reservation/tasks.md`, `.kiro/specs/customer-reservation/spec.json`
- **Description:** 仕様書に Requirement 8, 9 を追加、タスク一覧を作成、spec.json の phase を更新する
