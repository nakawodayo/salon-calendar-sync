import { NextRequest, NextResponse } from 'next/server';
import { getReservation, getStylistToken, updateReservationStatus } from '@/lib/firestore';
import { createOAuth2Client, setCredentials, getCalendarClient } from '@/lib/google-auth';
import { MENUS } from '@/types/reservation';

const STYLIST_ID = 'default-stylist';

/**
 * メニュー名から所要時間（分）を取得
 */
function getMenuDuration(menuName: string): number {
  const menu = MENUS.find((m) => m.name === menuName);
  return menu ? menu.duration : 60; // デフォルトは60分
}

/**
 * リクエスト送信日時を日本語形式にフォーマット
 */
function formatCreatedAt(isoString: string): string {
  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

/**
 * 終了時刻を計算
 */
function calculateEndTime(startDateTime: string, durationMinutes: number): string {
  const startDate = new Date(startDateTime);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  return endDate.toISOString();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get reservation from Firestore
    const reservation = await getReservation(id);
    if (!reservation) {
      return NextResponse.json(
        { error: '予約リクエストが見つかりません' },
        { status: 404 }
      );
    }

    if (reservation.status !== 'requested') {
      return NextResponse.json(
        { error: 'この予約リクエストは既に処理済みです' },
        { status: 400 }
      );
    }

    // Get stylist token
    const token = await getStylistToken(STYLIST_ID);
    if (!token || !token.access_token) {
      return NextResponse.json(
        { error: 'Google認証が必要です' },
        { status: 401 }
      );
    }

    // Set up Google Calendar client
    const oauth2Client = createOAuth2Client();
    setCredentials(oauth2Client, token);
    const calendar = getCalendarClient(oauth2Client);

    // Calculate end time based on menu duration
    const duration = getMenuDuration(reservation.menu);
    const endDateTime = calculateEndTime(reservation.requestedDateTime, duration);

    // Format created at for description
    const formattedCreatedAt = formatCreatedAt(reservation.createdAt);

    // Build Google Calendar event following the spec
    const event = {
      summary: `[予約] ${reservation.customerName}様 - ${reservation.menu}`,
      description:
        `【Salon Calendar Sync】\n` +
        `メニュー: ${reservation.menu}\n` +
        `お客様: ${reservation.customerName}\n` +
        `連絡手段: LINE\n` +
        `リクエスト送信日時: ${formattedCreatedAt}`,
      start: {
        dateTime: reservation.requestedDateTime,
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Tokyo',
      },
      extendedProperties: {
        private: {
          app: 'salon-calendar-sync',
          source: 'app',
          requestId: reservation.id,
          lineUserId: reservation.customerId,
          menu: reservation.menu,
          contact: 'LINE',
        },
      },
    };

    // Insert event into Google Calendar
    const calendarResponse = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    const calendarEventId = calendarResponse.data.id;
    const calendarEventLink = calendarResponse.data.htmlLink;

    // Update Firestore: set status to 'fixed' and save calendar event ID
    await updateReservationStatus(id, 'fixed', {
      googleCalendarEventId: calendarEventId || undefined,
    });

    return NextResponse.json(
      {
        message: '予約を承認し、Googleカレンダーに登録しました',
        calendarEventId,
        calendarEventLink,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Approve reservation error:', error);

    // Check for specific Google API errors
    const errorMessage =
      error instanceof Error ? error.message : 'Googleカレンダーへの登録に失敗しました';

    return NextResponse.json(
      {
        error: `承認処理に失敗しました: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
