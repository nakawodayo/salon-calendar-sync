/**
 * 予約リクエストの状態
 */
export type ReservationStatus = 'requested' | 'fixed' | 'rejected';

/**
 * 予約リクエスト
 */
export interface ReservationRequest {
  id: string;
  customerId: string;        // LINE ユーザー ID
  customerName: string;       // LINE 表示名
  requestedDateTime: string;  // ISO 8601 形式
  menu: string;               // メニュー名
  status: ReservationStatus;
  googleCalendarEventId?: string;  // Google Calendar イベント ID（承認後）
  createdAt: string;
  updatedAt: string;
}

/**
 * 予約リクエスト作成用のデータ
 */
export interface CreateReservationRequestData {
  customerId: string;
  customerName: string;
  requestedDateTime: string;
  menu: string;
}

/**
 * スタイリストの Google OAuth トークン
 */
export interface StylistToken {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
  selectedCalendarId?: string;
  selectedCalendarName?: string;
}

/**
 * メニュー定義（MVP用の固定メニュー）
 * 所要時間は google-calendar-event-format.md 仕様に準拠
 */
export const MENUS = [
  { id: 'cut', name: 'カット', duration: 60 },
  { id: 'cut-color', name: 'カット + カラー', duration: 180 },
  { id: 'cut-perm', name: 'カット + パーマ', duration: 120 },
] as const;

export type MenuId = typeof MENUS[number]['id'];
