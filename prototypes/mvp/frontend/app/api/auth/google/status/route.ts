import { NextResponse } from 'next/server';
import { getStylistToken } from '@/lib/firestore';
import { getStylistId } from '@/lib/stylist-session';

export async function GET() {
  try {
    const stylistId = await getStylistId();
    if (!stylistId) {
      return NextResponse.json({
        authenticated: false,
        email: null,
        selectedCalendarId: null,
        selectedCalendarName: null,
      });
    }

    const token = await getStylistToken(stylistId);
    return NextResponse.json({
      authenticated: !!token?.access_token,
      email: stylistId,
      selectedCalendarId: token?.selectedCalendarId || null,
      selectedCalendarName: token?.selectedCalendarName || null,
    });
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json({
      authenticated: false,
      email: null,
      selectedCalendarId: null,
      selectedCalendarName: null,
    });
  }
}
