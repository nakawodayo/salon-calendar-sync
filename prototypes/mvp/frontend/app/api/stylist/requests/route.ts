import { NextResponse } from 'next/server';
import { getAllReservations } from '@/lib/firestore';

export async function GET() {
  try {
    const reservations = await getAllReservations();
    return NextResponse.json({ reservations }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    return NextResponse.json(
      { error: '予約リクエストの取得に失敗しました' },
      { status: 500 }
    );
  }
}
