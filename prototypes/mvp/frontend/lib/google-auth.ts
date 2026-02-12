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
 * OAuth2 クライアントからユーザーのメールアドレスを取得
 */
export async function getUserEmail(oauth2Client: InstanceType<typeof google.auth.OAuth2>): Promise<string> {
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  if (!data.email) {
    throw new Error('メールアドレスを取得できませんでした');
  }
  return data.email;
}
