import { NextResponse } from 'next/server';
import { getStylistToken } from '@/lib/firestore';
import { createOAuth2Client, setCredentials, getCalendarClient } from '@/lib/google-auth';
import { getStylistId } from '@/lib/stylist-session';

export async function GET() {
  try {
    const stylistId = await getStylistId();
    if (!stylistId) {
      return NextResponse.json(
        { error: 'Google認証が必要です' },
        { status: 401 }
      );
    }

    const token = await getStylistToken(stylistId);
    if (!token || !token.access_token) {
      return NextResponse.json(
        { error: 'Google認証が必要です' },
        { status: 401 }
      );
    }

    const oauth2Client = createOAuth2Client();
    setCredentials(oauth2Client, token);
    const calendar = getCalendarClient(oauth2Client);

    const res = await calendar.calendarList.list();
    const items = res.data.items || [];

    const calendars = items
      .filter((item) => item.accessRole === 'writer' || item.accessRole === 'owner')
      .map((item) => ({
        id: item.id,
        summary: item.summary,
        backgroundColor: item.backgroundColor,
        primary: item.primary || false,
      }));

    return NextResponse.json({ calendars });
  } catch (error) {
    console.error('Calendar list error:', error);
    return NextResponse.json(
      { error: 'カレンダー一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
