'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CalendarItem {
  id: string;
  summary: string;
  backgroundColor: string;
  primary: boolean;
}

export default function CalendarSelectPage() {
  const router = useRouter();
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendars();
  }, []);

  async function fetchCalendars() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google/calendars');
      if (res.status === 401) {
        router.push('/stylist/auth');
        return;
      }
      if (!res.ok) throw new Error('取得に失敗しました');
      const data = await res.json();
      setCalendars(data.calendars);
      // デフォルトで primary カレンダーを選択
      const primary = data.calendars.find((c: CalendarItem) => c.primary);
      if (primary) {
        setSelectedId(primary.id);
      } else if (data.calendars.length > 0) {
        setSelectedId(data.calendars[0].id);
      }
    } catch {
      setError('カレンダー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      const selected = calendars.find((c) => c.id === selectedId);
      const res = await fetch('/api/auth/google/calendar-select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: selectedId,
          calendarName: selected?.summary || '',
        }),
      });
      if (!res.ok) throw new Error('保存に失敗しました');
      router.push('/stylist/requests');
    } catch {
      setError('カレンダーの保存に失敗しました');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            書き込み先カレンダーを選択
          </h1>
          <p className="text-gray-600 text-sm">
            予約承認時にイベントを登録するカレンダーを選んでください
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">カレンダー一覧を取得中...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={fetchCalendars}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                再試行
              </button>
            </div>
          )}

          {!loading && !error && calendars.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">書き込み可能なカレンダーが見つかりません</p>
            </div>
          )}

          {!loading && !error && calendars.length > 0 && (
            <>
              <div className="space-y-3 mb-6">
                {calendars.map((cal) => (
                  <button
                    key={cal.id}
                    onClick={() => setSelectedId(cal.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedId === cal.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: cal.backgroundColor }}
                      />
                      <span className="font-medium text-gray-900">
                        {cal.summary}
                      </span>
                      {cal.primary && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          メイン
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!selectedId || submitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    保存中...
                  </span>
                ) : (
                  '決定'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
