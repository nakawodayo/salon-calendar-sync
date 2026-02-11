import { NextResponse } from 'next/server';
import { createOAuth2Client, getAuthUrl } from '@/lib/google-auth';

export async function GET() {
  try {
    const oauth2Client = createOAuth2Client();
    const authUrl = getAuthUrl(oauth2Client);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth URL generation error:', error);
    return NextResponse.json(
      { error: 'Google認証URLの生成に失敗しました' },
      { status: 500 }
    );
  }
}
