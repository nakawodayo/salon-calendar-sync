'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
      label: '却下済み',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  };

  const { label, className } = config[status];

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${className}`}>
      {label}
    </span>
  );
}

export default function StylistRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [reservation, setReservation] = useState<ReservationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [calendarLink, setCalendarLink] = useState<string | null>(null);

  useEffect(() => {
    fetchReservation();
  }, [id]);

  async function fetchReservation() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/stylist/requests/${id}`);
      if (res.status === 404) {
        setError('予約リクエストが見つかりません');
        return;
      }
      if (!res.ok) {
        throw new Error('予約リクエストの取得に失敗しました');
      }
      const data = await res.json();
      setReservation(data.reservation);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約リクエストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!reservation) return;

    const confirmed = window.confirm(
      `${reservation.customerName}様の予約を承認し、Googleカレンダーに登録しますか？`
    );
    if (!confirmed) return;

    try {
      setActionLoading('approve');
      setActionError(null);
      const res = await fetch(`/api/stylist/requests/${id}/approve`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setActionError('Google認証が必要です。認証ページから認証を行ってください。');
          return;
        }
        throw new Error(data.error || '承認処理に失敗しました');
      }

      setCalendarLink(data.calendarEventLink || null);
      // Refresh the reservation data
      await fetchReservation();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '承認処理に失敗しました');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!reservation) return;

    const confirmed = window.confirm(
      `${reservation.customerName}様の予約を却下しますか？`
    );
    if (!confirmed) return;

    try {
      setActionLoading('reject');
      setActionError(null);
      const res = await fetch(`/api/stylist/requests/${id}/reject`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '却下処理に失敗しました');
      }

      // Refresh the reservation data
      await fetchReservation();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '却下処理に失敗しました');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/stylist/requests"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold text-gray-900">予約リクエスト詳細</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
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
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Link
              href="/stylist/requests"
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              一覧に戻る
            </Link>
          </div>
        )}

        {/* Reservation Detail */}
        {!loading && !error && reservation && (
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-500">ステータス</h2>
                <StatusBadge status={reservation.status} />
              </div>

              {/* Calendar Link (shown after approval) */}
              {reservation.status === 'fixed' && calendarLink && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm text-green-800 font-medium">Googleカレンダーに登録しました</p>
                      <a
                        href={calendarLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-700 underline hover:text-green-800 mt-1 inline-block"
                      >
                        カレンダーで確認する
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {reservation.status === 'fixed' && !calendarLink && reservation.googleCalendarEventId && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-green-800">Googleカレンダーに登録済み</p>
                  </div>
                </div>
              )}

              {reservation.status === 'rejected' && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-sm text-red-800">この予約リクエストは却下されました</p>
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-4">予約詳細</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs text-gray-400 mb-1">顧客名</dt>
                  <dd className="text-base font-medium text-gray-900">{reservation.customerName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 mb-1">メニュー</dt>
                  <dd className="text-base text-gray-900">{reservation.menu}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 mb-1">希望日時</dt>
                  <dd className="text-base text-gray-900">{formatDateTime(reservation.requestedDateTime)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 mb-1">リクエスト送信日時</dt>
                  <dd className="text-sm text-gray-600">{formatDateTime(reservation.createdAt)}</dd>
                </div>
              </dl>
            </div>

            {/* Action Error */}
            {actionError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-red-800 font-medium">エラーが発生しました</p>
                    <p className="text-sm text-red-700 mt-1">{actionError}</p>
                    {actionError.includes('Google認証') && (
                      <Link
                        href="/stylist/auth"
                        className="inline-block mt-2 text-sm text-red-800 underline hover:text-red-900"
                      >
                        認証ページへ
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {reservation.status === 'requested' && (
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading !== null}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === 'approve' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      処理中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      承認（Googleカレンダーに登録）
                    </>
                  )}
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading !== null}
                  className="w-full bg-white text-red-600 border-2 border-red-200 py-3 px-4 rounded-lg font-medium hover:bg-red-50 hover:border-red-300 disabled:text-red-300 disabled:border-red-100 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === 'reject' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                      処理中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      却下
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Back Link */}
            <div className="text-center pt-2">
              <Link
                href="/stylist/requests"
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                一覧に戻る
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
