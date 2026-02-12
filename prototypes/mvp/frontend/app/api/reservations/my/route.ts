import { NextRequest, NextResponse } from 'next/server';
import { getReservationsByCustomer } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId パラメータが必要です' },
        { status: 400 }
      );
    }

    const reservations = await getReservationsByCustomer(customerId);

    return NextResponse.json({ reservations }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    return NextResponse.json(
      { error: '予約リクエストの取得に失敗しました' },
      { status: 500 }
    );
  }
}
