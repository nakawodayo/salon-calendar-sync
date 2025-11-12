# Google Calendar 予定フォーマット仕様

**作成日**: 2025-11-12
**関連**: [Phase 1 要件定義](../logs/2025-11-11-phase1-requirements.md)、[システム設計](./system-design.md)、[Phase 1 残作業リスト](../logs/2025-11-12-phase1-remaining-tasks.md)

---

## 概要

このドキュメントでは、Salon Calendar Sync アプリが Google Calendar に作成する予定のフォーマット仕様を定義します。

**目的**:
- アプリが作成した予定を確実に識別できるようにする
- 手入力予定とアプリ作成予定を区別する
- 予約情報（メニュー、顧客名、連絡手段）を適切に記録する
- Firestore との連携を実現する
- 美容師が見やすい形式で予定を表示する

---

## 予定フォーマット仕様

### 全体構造

```javascript
const event = {
  summary: '[予約] 山田太郎様 - カット + カラー',
  description: '【Salon Calendar Sync】\nメニュー: カット + カラー\nお客様: 山田太郎\n連絡手段: LINE\nリクエスト送信日時: 2025年11月11日 14:30',
  start: {
    dateTime: '2025-11-25T15:00:00+09:00',
    timeZone: 'Asia/Tokyo',
  },
  end: {
    dateTime: '2025-11-25T18:00:00+09:00',
    timeZone: 'Asia/Tokyo',
  },
  extendedProperties: {
    private: {
      app: 'salon-calendar-sync',
      source: 'app',
      requestId: 'req_1234567890',
      lineUserId: 'U1234567890abcdef',
      menu: 'カット + カラー',
      contact: 'LINE',
    },
  },
  calendarId: 'primary',
};
```

---

## 各フィールドの詳細仕様

### 1. `summary` - 予定タイトル

**形式**: `[予約] {顧客名} - {メニュー}`

**例**:
- `[予約] 山田太郎様 - カット`
- `[予約] 佐藤花子様 - カット + カラー`
- `[予約] 田中一郎様 - カット + パーマ`

**目的**:
- カレンダーのタイムライン表示で一目で予約とわかる
- 顧客名とメニューを素早く確認できる
- `[予約]` プレフィックスでアプリ作成予定を視覚的に識別

**注意点**:
- 顧客名には「様」を付ける（美容師からの要望想定）
- メニュー名は正式名称を使用（UIと一致させる）

---

### 2. `description` - 詳細情報

**形式**:
```
【Salon Calendar Sync】
メニュー: {メニュー名}
お客様: {顧客名}
連絡手段: {連絡手段}
リクエスト送信日時: {送信日時}
```

**例**:
```
【Salon Calendar Sync】
メニュー: カット + カラー
お客様: 山田太郎
連絡手段: LINE
リクエスト送信日時: 2025年11月11日 14:30
```

**目的**:
- 人間が読める形式で予約詳細を表示
- `【Salon Calendar Sync】` マーカーでアプリ作成予定を識別（補助的）
- Google Calendar UI で予定詳細を開いたときに情報が見やすい

**注意点**:
- マーカーは `【Salon Calendar Sync】`（全角かぎ括弧 + スペースなし）で統一
- 連絡手段が未入力の場合は `連絡手段: -` と表示
- リクエスト送信日時は日本語形式（例: `2025年11月11日 14:30`）

---

### 3. `start` / `end` - 開始・終了時刻

**形式**:
```javascript
{
  dateTime: 'YYYY-MM-DDTHH:mm:ss+09:00', // ISO 8601 形式
  timeZone: 'Asia/Tokyo',
}
```

**例**:
```javascript
start: {
  dateTime: '2025-11-25T15:00:00+09:00',
  timeZone: 'Asia/Tokyo',
},
end: {
  dateTime: '2025-11-25T18:00:00+09:00', // 開始時刻 + 180分
  timeZone: 'Asia/Tokyo',
},
```

**終了時刻の計算**:

メニューごとの所要時間を定義し、開始時刻に加算して終了時刻を算出します。

| メニュー | 所要時間 |
|---------|---------|
| カット | 60分 |
| カット + カラー | 180分 |
| カット + パーマ | 120分 |
| カット + カラー + パーマ | 240分 |

**計算例**:
```javascript
const menuDurations = {
  'カット': 60,
  'カット + カラー': 180,
  'カット + パーマ': 120,
  'カット + カラー + パーマ': 240,
};

const startTime = new Date('2025-11-25T15:00:00+09:00');
const duration = menuDurations['カット + カラー']; // 180分
const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
// => 2025-11-25T18:00:00+09:00
```

**注意点**:
- タイムゾーンは必ず `Asia/Tokyo` を指定
- ISO 8601 形式で統一（`+09:00` のタイムゾーン表記を含む）
- 終了時刻は自動計算（手動入力不可）

---

### 4. `extendedProperties` - 拡張プロパティ（アプリ専用データ）

**形式**:
```javascript
extendedProperties: {
  private: {
    app: 'salon-calendar-sync',          // アプリ識別子（固定値）
    source: 'app',                        // 作成元（app/manual）
    requestId: 'req_1234567890',          // Firestore リクエストID
    lineUserId: 'U1234567890abcdef',      // LINE ユーザーID
    menu: 'カット + カラー',              // メニュー
    contact: 'LINE',                      // 連絡手段
  },
}
```

**各フィールドの説明**:

#### `app` - アプリ識別子
- **値**: `'salon-calendar-sync'`（固定値）
- **目的**: アプリが作成した予定であることを識別
- **必須**: ✅ Yes

#### `source` - 作成元
- **値**: `'app'` または `'manual'`
- **目的**: アプリ作成予定と手入力予定を区別
- **必須**: ✅ Yes
- **備考**: アプリが作成する予定は常に `'app'`

#### `requestId` - Firestore リクエストID
- **値**: Firestore の `reservationRequests` コレクションのドキュメントID
- **目的**: Google Calendar の予定と Firestore のデータを紐付け
- **必須**: ✅ Yes
- **例**: `'req_1731380400000_U1234567890abcdef'`

#### `lineUserId` - LINE ユーザーID
- **値**: LINE ユーザーの一意な識別子
- **目的**: 特定のお客様の予約履歴を検索・取得
- **必須**: ✅ Yes
- **例**: `'U1234567890abcdef'`

#### `menu` - メニュー
- **値**: メニュー名（文字列）
- **目的**: API 検索時にメニュー情報を取得
- **必須**: ✅ Yes
- **例**: `'カット + カラー'`

#### `contact` - 連絡手段
- **値**: 連絡手段（文字列）または空文字列
- **目的**: 連絡手段の記録
- **必須**: ⚠️ Optional（未入力の場合は空文字列）
- **例**: `'LINE'`、`'090-1234-5678'`、`''`

**重要ポイント**:
- `extendedProperties.private` は Google Calendar UI には表示されない
- API 経由でのみ取得可能
- アプリ専用のメタデータとして活用
- 他のカレンダーアプリには影響しない

---

### 5. `calendarId` - カレンダーID

**値**: `'primary'`（メインカレンダー）

**注意点**:
- MVP では美容師のメインカレンダーに固定
- Phase 2 以降で複数カレンダー対応を検討
- 美容師が選択したカレンダーに作成する仕組みを追加予定

---

## アプリ作成予定の識別方法

### 主要な識別方法: `extendedProperties.private`

アプリが作成した予定は、以下の条件で識別します：

```javascript
// 条件: extendedProperties.private.app === 'salon-calendar-sync'
const isAppCreatedEvent = (event) => {
  return event.extendedProperties?.private?.app === 'salon-calendar-sync';
};
```

**検索方法（Google Calendar API）**:
```javascript
const response = await calendar.events.list({
  calendarId: 'primary',
  privateExtendedProperty: 'app=salon-calendar-sync',
  timeMin: new Date().toISOString(),
  orderBy: 'startTime',
  singleEvents: true,
});
```

### 補助的な識別方法: `description` マーカー

`extendedProperties` が取得できない場合（他のカレンダーアプリ経由など）の補助として、`description` に固有マーカーを含めます。

```javascript
// 補助的な識別
const isAppCreatedEventByDescription = (event) => {
  return event.description?.includes('【Salon Calendar Sync】');
};
```

**注意**:
- 主要な識別方法は `extendedProperties.private.app`
- `description` マーカーは補助的（人間が見てもわかる）
- 両方を組み合わせることで確実性を向上

---

## 手入力予定との区別方法

### 区別ロジック

```javascript
const getEventSource = (event) => {
  const source = event.extendedProperties?.private?.source;

  if (source === 'app') {
    return 'アプリ作成';
  } else {
    return '手入力';
  }
};
```

### 手入力予定の特徴

- `extendedProperties.private` が存在しない、または
- `extendedProperties.private.app` が `'salon-calendar-sync'` でない、または
- `extendedProperties.private.source` が `'app'` でない

### アプリ作成予定の特徴

- `extendedProperties.private.app === 'salon-calendar-sync'`
- `extendedProperties.private.source === 'app'`
- `description` に `【Salon Calendar Sync】` を含む（補助的）

---

## 実装例

### イベント作成の完全な実装例

```javascript
const { google } = require('googleapis');

/**
 * Google Calendar に予約予定を作成
 * @param {object} auth - OAuth2Client
 * @param {object} reservationRequest - Firestore の予約リクエストデータ
 * @returns {object} - 作成されたイベント
 */
async function createReservationEvent(auth, reservationRequest) {
  const calendar = google.calendar({ version: 'v3', auth });

  // メニュー別の所要時間（分）
  const menuDurations = {
    'カット': 60,
    'カット + カラー': 180,
    'カット + パーマ': 120,
    'カット + カラー + パーマ': 240,
  };

  // 開始時刻
  const startTime = new Date(reservationRequest.datetime);

  // 終了時刻を計算
  const duration = menuDurations[reservationRequest.menu];
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

  // ISO 8601 形式に変換（Asia/Tokyo タイムゾーン付き）
  const formatDateTime = (date) => {
    return date.toISOString().replace('Z', '+09:00');
  };

  // リクエスト送信日時をフォーマット
  const formatRequestDateTime = (timestamp) => {
    const date = timestamp.toDate();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${year}年${month}月${day}日 ${hour}:${minute}`;
  };

  // イベントオブジェクトを作成
  const event = {
    summary: `[予約] ${reservationRequest.customerName}様 - ${reservationRequest.menu}`,
    description:
      `【Salon Calendar Sync】\n` +
      `メニュー: ${reservationRequest.menu}\n` +
      `お客様: ${reservationRequest.customerName}\n` +
      `連絡手段: ${reservationRequest.contact || '-'}\n` +
      `リクエスト送信日時: ${formatRequestDateTime(reservationRequest.createdAt)}`,
    start: {
      dateTime: formatDateTime(startTime),
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: formatDateTime(endTime),
      timeZone: 'Asia/Tokyo',
    },
    extendedProperties: {
      private: {
        app: 'salon-calendar-sync',
        source: 'app',
        requestId: reservationRequest.id,
        lineUserId: reservationRequest.lineUserId,
        menu: reservationRequest.menu,
        contact: reservationRequest.contact || '',
      },
    },
  };

  // Google Calendar に予定を作成
  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  console.log(`予定を作成しました: ${response.data.htmlLink}`);
  return response.data;
}
```

### 特定のお客様の予約履歴を取得する例

```javascript
/**
 * 特定のお客様（LINE ユーザー）の予約履歴を取得
 * @param {object} auth - OAuth2Client
 * @param {string} lineUserId - LINE ユーザーID
 * @returns {Array} - 予約イベントのリスト
 */
async function getCustomerReservations(auth, lineUserId) {
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.list({
    calendarId: 'primary',
    privateExtendedProperty: `lineUserId=${lineUserId}`,
    timeMin: new Date().toISOString(), // 現在以降
    orderBy: 'startTime',
    singleEvents: true,
  });

  return response.data.items || [];
}
```

### アプリ作成予定のみをフィルタリングする例

```javascript
/**
 * アプリが作成した予定のみを取得
 * @param {object} auth - OAuth2Client
 * @param {string} timeMin - 検索開始日時（ISO 8601形式）
 * @param {string} timeMax - 検索終了日時（ISO 8601形式）
 * @returns {Array} - アプリ作成イベントのリスト
 */
async function getAppCreatedEvents(auth, timeMin, timeMax) {
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.list({
    calendarId: 'primary',
    privateExtendedProperty: 'app=salon-calendar-sync',
    timeMin: timeMin,
    timeMax: timeMax,
    orderBy: 'startTime',
    singleEvents: true,
  });

  return response.data.items || [];
}
```

---

## Firestore との連携

### 予定作成時の処理フロー

```
1. 美容師が予約リクエストを承認（または調整後に確定）
   ↓
2. Google Calendar に予定を作成
   ↓
3. 作成された予定の `id` を取得
   ↓
4. Firestore の予約リクエストに `calendarEventId` を保存
   ↓
5. Firestore のステータスを `fixed` に更新
```

### Firestore データモデルとの対応

**Firestore (`reservationRequests` コレクション)**:
```javascript
{
  id: 'req_1731380400000_U1234567890abcdef', // リクエストID
  lineUserId: 'U1234567890abcdef',            // LINE ユーザーID
  customerName: '山田太郎',                   // 顧客名
  datetime: '2025-11-25T15:00:00+09:00',      // 予約日時
  menu: 'カット + カラー',                    // メニュー
  contact: 'LINE',                            // 連絡手段
  status: 'fixed',                            // ステータス
  calendarEventId: 'abc123xyz456',            // Google Calendar のイベントID ★
  createdAt: Timestamp,                       // 作成日時
  updatedAt: Timestamp,                       // 更新日時
}
```

**Google Calendar Event**:
```javascript
{
  id: 'abc123xyz456',                         // イベントID ★
  summary: '[予約] 山田太郎様 - カット + カラー',
  // ...
  extendedProperties: {
    private: {
      requestId: 'req_1731380400000_U1234567890abcdef', // リクエストID ★
      // ...
    },
  },
}
```

**双方向参照**:
- Firestore → Google Calendar: `calendarEventId`
- Google Calendar → Firestore: `extendedProperties.private.requestId`

### 予定削除/変更時の同期

**予定削除時**:
1. Google Calendar の予定を削除
2. Firestore のステータスを `rejected` または `cancelled` に更新
3. `calendarEventId` は保持（履歴として残す）

**予定変更時**:
1. Google Calendar の予定を更新（`events.update`）
2. Firestore の `datetime` または `menu` を更新
3. Firestore の `updatedAt` を更新

---

## タイムゾーンの扱い

### 基本方針

- **タイムゾーン**: `Asia/Tokyo` 固定
- **日時形式**: ISO 8601 形式（`YYYY-MM-DDTHH:mm:ss+09:00`）
- **サマータイム**: 日本にはサマータイムがないため考慮不要

### 実装時の注意点

```javascript
// ❌ 悪い例: タイムゾーンなし
const event = {
  start: {
    dateTime: '2025-11-25T15:00:00', // タイムゾーン情報がない
  },
};

// ✅ 良い例: タイムゾーン付き
const event = {
  start: {
    dateTime: '2025-11-25T15:00:00+09:00', // タイムゾーン情報あり
    timeZone: 'Asia/Tokyo',                // 明示的にタイムゾーン指定
  },
};
```

### Date オブジェクトからの変換

```javascript
// ISO 8601 形式に変換（Asia/Tokyo タイムゾーン付き）
const formatDateTime = (date) => {
  // JavaScript の Date は UTC ベースなので、+09:00 を明示的に付与
  const isoString = date.toISOString(); // 例: '2025-11-25T06:00:00.000Z'

  // UTC → JST に変換（+9時間）
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const jstIsoString = jstDate.toISOString().slice(0, -1); // 'Z' を削除

  return jstIsoString + '+09:00'; // タイムゾーン付与
};

// または、ライブラリを使用（推奨）
// date-fns-tz または luxon を使用
import { format } from 'date-fns-tz';

const formatDateTime = (date) => {
  return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: 'Asia/Tokyo' });
};
```

---

## 美容師との合意事項チェックリスト

このフォーマットを美容師と確認する際のチェックリストです。

### 予定タイトル形式

- [ ] **予定タイトルの形式を確認**
  - 形式: `[予約] {顧客名}様 - {メニュー}`
  - 例: `[予約] 山田太郎様 - カット + カラー`
  - `[予約]` プレフィックスの有無
  - 「様」の付け方（付ける/付けない）

### 詳細情報の表示内容

- [ ] **予定詳細に表示する情報を確認**
  - メニュー: ✅
  - お客様名: ✅
  - 連絡手段: ✅
  - リクエスト送信日時: ✅
  - その他追加したい情報:

### 識別マーカー

- [ ] **アプリ識別マーカーを確認**
  - マーカー: `【Salon Calendar Sync】`
  - 予定詳細の先頭に表示
  - マーカーの表記変更希望の有無

### メニューと所要時間

- [ ] **各メニューの所要時間を確認**
  - カット: 60分
  - カット + カラー: 180分
  - カット + パーマ: 120分
  - カット + カラー + パーマ: 240分
  - 所要時間の変更希望の有無

### カレンダーの選択

- [ ] **予定を作成するカレンダーを確認**
  - MVP: メインカレンダー（`primary`）固定
  - Phase 2: カレンダー選択機能の必要性

### その他

- [ ] **予定の色分け希望の有無**
  - アプリ作成予定を特定の色で表示したいか
  - Google Calendar の `colorId` で設定可能

- [ ] **リマインダー設定の希望**
  - 予定の何分前に通知するか
  - 通知方法（ポップアップ、メール）

- [ ] **予定の公開範囲**
  - 通常は美容師のみ閲覧可能
  - お客様にも共有したい場合の対応（Phase 2 以降）

---

## 今後の拡張可能性

### Phase 2 以降で検討する機能

#### 1. カラー設定による視覚的区別

アプリ作成予定を特定の色で表示：

```javascript
const event = {
  // ...
  colorId: '9', // Google Calendar の色ID（例: 9 = ブルー）
};
```

#### 2. リマインダー設定

予定の通知設定：

```javascript
const event = {
  // ...
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'popup', minutes: 30 },  // 30分前にポップアップ
      { method: 'email', minutes: 1440 }, // 1日前にメール
    ],
  },
};
```

#### 3. 参加者設定（お客様メールアドレス）

お客様のメールアドレスがわかる場合、参加者として追加：

```javascript
const event = {
  // ...
  attendees: [
    { email: 'customer@example.com' }, // お客様のメールアドレス
  ],
};
```

#### 4. 複数カレンダー対応

美容師が予定を作成するカレンダーを選択できるようにする：

```javascript
// カレンダー一覧を取得
const calendars = await calendar.calendarList.list();

// 美容師が選択したカレンダーに予定を作成
await calendar.events.insert({
  calendarId: selectedCalendarId, // 美容師が選択したカレンダーID
  resource: event,
});
```

#### 5. 予定のロック（編集防止）

アプリ作成予定を誤って手動編集できないようにする：

```javascript
const event = {
  // ...
  locked: true, // 編集をロック（管理者のみ編集可能）
};
```

**注意**: Google Calendar API の `locked` プロパティは管理者権限が必要

---

## 参考資料

### Google Calendar API ドキュメント

- [Events: insert](https://developers.google.com/calendar/api/v3/reference/events/insert)
- [Events: list](https://developers.google.com/calendar/api/v3/reference/events/list)
- [Events Resource](https://developers.google.com/calendar/api/v3/reference/events)
- [Extended Properties](https://developers.google.com/calendar/api/guides/extended-properties)

### プロジェクト内関連ドキュメント

- [Phase 1 要件定義](../logs/2025-11-11-phase1-requirements.md)
- [システム設計](./system-design.md)
- [Google Calendar API 認可フロー調査](../research/google-calendar-api-auth-flow.md)
- [Phase 1 残作業リスト](../logs/2025-11-12-phase1-remaining-tasks.md)

---

## 更新履歴

- **2025-11-12**: 初版作成（Google Calendar 予定フォーマット仕様の策定）
