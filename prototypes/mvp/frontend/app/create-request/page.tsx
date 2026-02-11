'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initializeLiff, getUserProfile } from '@/lib/liff';
import { MENUS } from '@/types/reservation';

export default function CreateRequestPage() {
  const router = useRouter();

  // Auth state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);

  // Form state
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [menu, setMenu] = useState(MENUS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error('LIFF ID が設定されていません');
        }

        await initializeLiff(liffId);
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(
          err instanceof Error ? err.message : '初期化に失敗しました'
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (!date || !time) {
        throw new Error('日時を選択してください');
      }

      const requestedDateTime = new Date(`${date}T${time}:00`).toISOString();
      const selectedMenu = MENUS.find((m) => m.id === menu);

      if (!selectedMenu) {
        throw new Error('メニューを選択してください');
      }

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: profile.userId,
          customerName: profile.displayName,
          requestedDateTime,
          menu: selectedMenu.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '予約リクエストの送信に失敗しました');
      }

      router.push('/my-requests');
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError(
        err instanceof Error ? err.message : '送信に失敗しました'
      );
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-lg font-bold">予約リクエスト作成</h1>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-6">
        <div className="space-y-5">
          {/* Customer Name (readonly) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              顧客名
            </label>
            <input
              type="text"
              value={profile?.displayName ?? ''}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-600"
            />
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              希望日
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Time */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              希望時間
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Menu Selection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              メニュー
            </label>
            <div className="space-y-2">
              {MENUS.map((item) => (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                    menu === item.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="menu"
                      value={item.id}
                      checked={menu === item.id}
                      onChange={(e) => setMenu(e.target.value as typeof menu)}
                      className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {item.duration}分
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="rounded-lg bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-green-600 py-3.5 text-base font-semibold text-white transition-colors active:bg-green-700 disabled:bg-gray-400"
          >
            {submitting ? '送信中...' : '予約リクエストを送信'}
          </button>
        </div>
      </form>
    </div>
  );
}
