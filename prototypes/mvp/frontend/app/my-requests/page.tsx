'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { initializeLiff, getUserProfile } from '@/lib/liff';
import type { ReservationRequest } from '@/types/reservation';

const STATUS_CONFIG: Record<
  ReservationRequest['status'],
  { label: string; bgClass: string; textClass: string }
> = {
  requested: {
    label: 'リクエスト中',
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-800',
  },
  fixed: {
    label: '確定',
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
  },
  rejected: {
    label: 'お断り',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
  },
};

function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export default function MyRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<ReservationRequest[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error('LIFF ID が設定されていません');
        }

        await initializeLiff(liffId);
        const profile = await getUserProfile();

        // Fetch reservations for this customer
        const res = await fetch(
          `/api/reservations/my?customerId=${encodeURIComponent(profile.userId)}`
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '予約リクエストの取得に失敗しました');
        }

        const data = await res.json();
        setReservations(data.reservations);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(
          err instanceof Error ? err.message : '読み込みに失敗しました'
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <span className="text-xl text-red-600">!</span>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-800">
            エラーが発生しました
          </h2>
          <p className="text-sm text-gray-500">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-green-600 underline"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 px-4 py-4 text-white">
        <div className="flex items-center">
          <Link href="/" className="mr-3 text-lg">&lsaquo;</Link>
          <h1 className="text-lg font-bold">予約リクエスト一覧</h1>
        </div>
      </header>

      {/* Reservation List */}
      <div className="px-4 py-6">
        {reservations.length === 0 ? (
          <div className="rounded-lg bg-white px-4 py-10 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              予約リクエストはありません
            </p>
            <Link
              href="/create-request"
              className="mt-4 inline-block rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors active:bg-green-700"
            >
              予約リクエストを作成
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((reservation) => {
              const status = STATUS_CONFIG[reservation.status];
              return (
                <div
                  key={reservation.id}
                  className="rounded-lg bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-800">
                        {reservation.menu}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatDateTime(reservation.requestedDateTime)}
                      </p>
                    </div>
                    <span
                      className={`ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bgClass} ${status.textClass}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
