import { NextRequest, NextResponse } from 'next/server';
import { createOAuth2Client, getTokenFromCode } from '@/lib/google-auth';
import { saveStylistToken } from '@/lib/firestore';
import type { StylistToken } from '@/types/reservation';

const STYLIST_ID = 'default-stylist';

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

    // Save tokens to Firestore
    const stylistToken: StylistToken = {
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || undefined,
      scope: tokens.scope || '',
      token_type: tokens.token_type || 'Bearer',
      expiry_date: tokens.expiry_date || undefined,
    };

    await saveStylistToken(STYLIST_ID, stylistToken);

    // Redirect to stylist requests page on success
    return NextResponse.redirect(new URL('/stylist/requests', request.url));
  } catch (err) {
    console.error('Token exchange error:', err);
    const errorUrl = new URL('/stylist/auth', request.url);
    errorUrl.searchParams.set('error', 'token_exchange_failed');
    return NextResponse.redirect(errorUrl);
  }
}
