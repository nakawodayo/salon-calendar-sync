'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ReservationRequest, ReservationStatus } from '@/types/reservation';

function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekDay = weekDays[date.getDay()];
    return `${year}年${month}月${day}日(${weekDay}) ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

function StatusBadge({ status }: { status: ReservationStatus }) {
  const config: Record<ReservationStatus, { label: string; className: string }> = {
    requested: {
      label: '未対応',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    fixed: {
      label: '承認済み',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    rejected: {
      label: '却下',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  };

  const { label, className } = config[status];

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}

export default function StylistRequestsPage() {
  const [reservations, setReservations] = useState<ReservationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<boolean | null>(null);

  useEffect(() => {
    fetchReservations();
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/google/status');
      if (res.ok) {
        const data = await res.json();
        setAuthStatus(data.authenticated);
      }
    } catch {
      setAuthStatus(false);
    }
  }

  async function fetchReservations() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/stylist/requests');
      if (!res.ok) {
        throw new Error('予約リクエストの取得に失敗しました');
      }
      const data = await res.json();
      setReservations(data.reservations);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約リクエストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">予約リクエスト一覧</h1>
            <div className="flex items-center gap-3">
              {authStatus === false && (
                <Link
                  href="/stylist/auth"
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Google認証が必要
                </Link>
              )}
              {authStatus === true && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  認証済み
                </span>
              )}
              <button
                onClick={fetchReservations}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Auth Warning */}
        {authStatus === false && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm text-yellow-800 font-medium">Google認証が必要です</p>
                <p className="text-sm text-yellow-700 mt-1">
                  予約の承認にはGoogleカレンダーとの連携が必要です。
                </p>
                <Link
                  href="/stylist/auth"
                  className="inline-block mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
                >
                  認証ページへ移動
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">読み込み中...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={fetchReservations}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              再試行
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && reservations.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">予約リクエストはまだありません</p>
          </div>
        )}

        {/* Request List */}
        {!loading && !error && reservations.length > 0 && (
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <Link
                key={reservation.id}
                href={`/stylist/requests/${reservation.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {reservation.customerName}
                  </h3>
                  <StatusBadge status={reservation.status} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="text-gray-400 mr-2">メニュー:</span>
                    {reservation.menu}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="text-gray-400 mr-2">希望日時:</span>
                    {formatDateTime(reservation.requestedDateTime)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
