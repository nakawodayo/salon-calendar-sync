'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { initializeLiff, getUserProfile } from '@/lib/liff';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);

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
      <header className="bg-green-600 px-4 py-6 text-white">
        <h1 className="text-center text-xl font-bold">サロン予約</h1>
      </header>

      {/* Profile Section */}
      <div className="px-4 py-6">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">ようこそ</p>
          <p className="text-lg font-semibold text-gray-800">
            {profile?.displayName} さん
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4">
        <div className="space-y-3">
          <Link
            href="/create-request"
            className="flex items-center justify-between rounded-lg bg-green-600 px-5 py-4 text-white shadow-sm transition-colors active:bg-green-700"
          >
            <div>
              <p className="text-base font-semibold">予約リクエスト作成</p>
              <p className="mt-0.5 text-sm text-green-100">
                新しい予約をリクエストする
              </p>
            </div>
            <span className="text-xl">&rsaquo;</span>
          </Link>

          <Link
            href="/my-requests"
            className="flex items-center justify-between rounded-lg bg-white px-5 py-4 shadow-sm transition-colors active:bg-gray-50"
          >
            <div>
              <p className="text-base font-semibold text-gray-800">
                予約リクエスト一覧
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                過去のリクエストを確認する
              </p>
            </div>
            <span className="text-xl text-gray-400">&rsaquo;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
