import { google } from 'googleapis';
import type { StylistToken } from '@/types/reservation';

const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Google OAuth2 クライアントを作成
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Google OAuth 認可 URL を生成
 */
export function getAuthUrl(oauth2Client: InstanceType<typeof google.auth.OAuth2>): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

/**
 * 認可コードをトークンに交換
 */
export async function getTokenFromCode(
  oauth2Client: InstanceType<typeof google.auth.OAuth2>,
  code: string
) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

/**
 * 保存済みトークンで OAuth2 クライアントを設定
 */
export function setCredentials(
  oauth2Client: InstanceType<typeof google.auth.OAuth2>,
  tokens: StylistToken
) {
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

/**
 * Google Calendar API クライアントを取得
 */
export function getCalendarClient(oauth2Client: InstanceType<typeof google.auth.OAuth2>) {
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * トークンレスポンスの id_token からメールアドレスを取得
 * openid + email スコープで取得した id_token (JWT) をデコードする
 */
export function getEmailFromIdToken(idToken: string): string {
  const payload = JSON.parse(
    Buffer.from(idToken.split('.')[1], 'base64url').toString()
  );
  if (!payload.email) {
    throw new Error('id_token にメールアドレスが含まれていません');
  }
  return payload.email;
}
