import { NextRequest, NextResponse } from 'next/server';
import { updateStylistCalendarSelection } from '@/lib/firestore';
import { getStylistId } from '@/lib/stylist-session';

export async function POST(request: NextRequest) {
  try {
    const stylistId = await getStylistId();
    if (!stylistId) {
      return NextResponse.json(
        { error: 'Google認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { calendarId, calendarName } = body;

    if (!calendarId) {
      return NextResponse.json(
        { error: 'calendarId は必須です' },
        { status: 400 }
      );
    }

    await updateStylistCalendarSelection(stylistId, calendarId, calendarName || '');

    return NextResponse.json({ message: 'カレンダーを保存しました' });
  } catch (error) {
    console.error('Calendar select error:', error);
    return NextResponse.json(
      { error: 'カレンダーの保存に失敗しました' },
      { status: 500 }
    );
  }
}
