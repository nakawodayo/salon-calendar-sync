import { NextRequest, NextResponse } from 'next/server';
import { getNextFixedReservation } from '@/lib/firestore';

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

    const reservation = await getNextFixedReservation(customerId);

    return NextResponse.json({ reservation }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch next reservation:', error);
    return NextResponse.json(
      { error: '次回予約の取得に失敗しました' },
      { status: 500 }
    );
  }
}
