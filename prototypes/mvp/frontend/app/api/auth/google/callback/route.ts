import { NextRequest, NextResponse } from 'next/server';
import { createOAuth2Client, getTokenFromCode, getEmailFromIdToken } from '@/lib/google-auth';
import { saveStylistToken, getStylistToken } from '@/lib/firestore';
import type { StylistToken } from '@/types/reservation';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle user denial or other errors from Google
  if (error) {
    console.error('Google OAuth error:', error);
    const errorUrl = new URL('/stylist/auth', request.url);
    errorUrl.searchParams.set('error', 'auth_denied');
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    console.error('No authorization code received');
    const errorUrl = new URL('/stylist/auth', request.url);
    errorUrl.searchParams.set('error', 'no_code');
    return NextResponse.redirect(errorUrl);
  }

  try {
    const oauth2Client = createOAuth2Client();
    const tokens = await getTokenFromCode(oauth2Client, code);

    // id_token からメールアドレスを取得
    if (!tokens.id_token) {
      throw new Error('id_token が取得できませんでした');
    }
    const email = getEmailFromIdToken(tokens.id_token);

    // 既存トークンからカレンダー選択を取得（再認証時の引き継ぎ）
    const existingToken = await getStylistToken(email);

    // Save tokens to Firestore (メールアドレスをドキュメント ID として使用)
    const stylistToken: StylistToken = {
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || undefined,
      scope: tokens.scope || '',
      token_type: tokens.token_type || 'Bearer',
      expiry_date: tokens.expiry_date || undefined,
      selectedCalendarId: existingToken?.selectedCalendarId,
      selectedCalendarName: existingToken?.selectedCalendarName,
    };

    await saveStylistToken(email, stylistToken);

    // カレンダー選択済みなら予約一覧へ、未選択ならカレンダー選択ページへ
    const redirectPath = existingToken?.selectedCalendarId
      ? '/stylist/requests'
      : '/stylist/calendar-select';

    const response = NextResponse.redirect(new URL(redirectPath, request.url));

    // stylist_email Cookie をセット（HttpOnly, 1年有効, path=/）
    response.cookies.set('stylist_email', email, {
      httpOnly: true,
      maxAge: 31536000, // 1年
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    console.error('Token exchange error:', err);
    const errorUrl = new URL('/stylist/auth', request.url);
    errorUrl.searchParams.set('error', 'token_exchange_failed');
    return NextResponse.redirect(errorUrl);
  }
}
