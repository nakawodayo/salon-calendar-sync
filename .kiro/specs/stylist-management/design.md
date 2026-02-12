# Design Document: スタイリスト管理機能

## UX フロー

### 初回認証時
```
Google OAuth → Callback → トークン保存 → /stylist/calendar-select
  → カレンダー一覧表示 → 選択 → Firestore 保存 → /stylist/requests
```

### カレンダー変更時
```
/stylist/auth → 「カレンダーを変更」リンク → /stylist/calendar-select → 同上
```

## データモデル変更

`StylistToken` に 2 フィールド追加:

```typescript
export interface StylistToken {
  // ...existing fields...
  selectedCalendarId?: string;    // 選択されたカレンダーID
  selectedCalendarName?: string;  // 表示用カレンダー名
}
```

Firestore は schemaless のためマイグレーション不要。既存ドキュメントは `undefined` → `'primary'` フォールバック。

## 再認証時のカレンダー選択保持

**問題**: `saveStylistToken()` は `setDoc`（全上書き）を使用するため、再認証時に `selectedCalendarId` が消失する。

**対策**:
1. OAuth コールバックで `getStylistToken()` を呼び、既存の `selectedCalendarId` / `selectedCalendarName` を取得
2. 新トークンに既存のカレンダー選択を引き継いで保存
3. リダイレクト先を分岐: `selectedCalendarId` があれば `/stylist/requests`、なければ `/stylist/calendar-select`

## API 設計

| Method | Endpoint | 役割 |
|--------|----------|------|
| GET | `/api/auth/google/calendars` | カレンダー一覧取得（writer/owner のみ） |
| POST | `/api/auth/google/calendar-select` | 選択カレンダー保存 |

### GET /api/auth/google/calendars レスポンス
```json
{
  "calendars": [
    { "id": "primary", "summary": "メインカレンダー", "backgroundColor": "#0b8043", "primary": true },
    { "id": "abc@group.calendar.google.com", "summary": "予約用", "backgroundColor": "#7986cb" }
  ]
}
```

### POST /api/auth/google/calendar-select リクエスト
```json
{ "calendarId": "abc@group.calendar.google.com", "calendarName": "予約用" }
```

## カレンダー保存の部分更新

カレンダー選択時は `updateDoc` を使用して `selectedCalendarId` と `selectedCalendarName` のみ更新する（`updateStylistCalendarSelection()` 関数）。これにより、他のトークンフィールドが上書きされない。

---

## マルチスタイリスト識別

### スタイリスト識別フロー

```
Google OAuth（openid + email スコープ追加）
  → Callback → userinfo.get() で email 取得
  → stylistTokens/{email} にトークン保存
  → Cookie「stylist_email」セット（HttpOnly, 1年, path=/）
  → リダイレクト（既存ロジック維持）
```

### セッション管理

- **識別子**: Google メールアドレス
- **保持方法**: HttpOnly Cookie `stylist_email`（`maxAge: 31536000`）
- **Cookie 消失時**: `/api/auth/google/status` が `authenticated: false` を返す → 認証ページで Google 認証ボタン表示 → 再認証で Cookie 再設定

### ヘルパー関数

`lib/stylist-session.ts` に Cookie 読み取りヘルパーを集約:
```typescript
import { cookies } from 'next/headers';
export async function getStylistId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('stylist_email')?.value || null;
}
```

### google-auth.ts 変更

- `SCOPES` に `'openid'`, `'https://www.googleapis.com/auth/userinfo.email'` 追加
- `getUserEmail(oauth2Client)` 関数追加: `google.oauth2('v2').userinfo.get()` でメール取得

### 既存データの扱い

Firestore の `stylistTokens/default-stylist` は孤立ドキュメントになる。再認証時に新しい `stylistTokens/{email}` が作成されるため、手動削除は不要（放置で問題なし）。
