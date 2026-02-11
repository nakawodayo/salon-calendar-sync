import { NextResponse } from 'next/server';
import { getStylistToken } from '@/lib/firestore';

const STYLIST_ID = 'default-stylist';

export async function GET() {
  try {
    const token = await getStylistToken(STYLIST_ID);
    return NextResponse.json({
      authenticated: !!token?.access_token,
    });
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json({
      authenticated: false,
    });
  }
}
