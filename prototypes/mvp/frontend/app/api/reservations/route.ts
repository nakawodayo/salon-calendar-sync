import { NextRequest, NextResponse } from 'next/server';
import { createReservation } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { customerId, customerName, requestedDateTime, menu } = body;

    // Validate required fields
    if (!customerId || !customerName || !requestedDateTime || !menu) {
      return NextResponse.json(
        {
          error: '必須項目が不足しています',
          details: {
            customerId: !customerId ? '必須' : undefined,
            customerName: !customerName ? '必須' : undefined,
            requestedDateTime: !requestedDateTime ? '必須' : undefined,
            menu: !menu ? '必須' : undefined,
          },
        },
        { status: 400 }
      );
    }

    // Validate requestedDateTime is a valid ISO 8601 string
    const parsedDate = new Date(requestedDateTime);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: '日時の形式が正しくありません' },
        { status: 400 }
      );
    }

    const id = await createReservation({
      customerId,
      customerName,
      requestedDateTime,
      menu,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Failed to create reservation:', error);
    return NextResponse.json(
      { error: '予約リクエストの作成に失敗しました' },
      { status: 500 }
    );
  }
}
