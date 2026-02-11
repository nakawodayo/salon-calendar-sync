import { NextRequest, NextResponse } from 'next/server';
import { getReservation, updateReservationStatus } from '@/lib/firestore';

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

    // Update status to 'rejected'
    await updateReservationStatus(id, 'rejected');

    return NextResponse.json(
      { message: '予約リクエストを却下しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reject reservation error:', error);
    return NextResponse.json(
      { error: '却下処理に失敗しました' },
      { status: 500 }
    );
  }
}
