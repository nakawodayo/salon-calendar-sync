import { NextRequest, NextResponse } from 'next/server';
import { getReservation } from '@/lib/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservation = await getReservation(id);

    if (!reservation) {
      return NextResponse.json(
        { error: '予約リクエストが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({ reservation }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch reservation:', error);
    return NextResponse.json(
      { error: '予約リクエストの取得に失敗しました' },
      { status: 500 }
    );
  }
}
