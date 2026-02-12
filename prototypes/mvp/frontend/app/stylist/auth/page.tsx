'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StylistAuthPage() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [email, setEmail] = useState<string | null>(null);
  const [calendarName, setCalendarName] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/google/status');
      if (res.ok) {
        const data = await res.json();
        setAuthStatus(data.authenticated ? 'authenticated' : 'unauthenticated');
        setEmail(data.email || null);
        setCalendarName(data.selectedCalendarName || null);
      } else {
        setAuthStatus('unauthenticated');
      }
    } catch {
      setAuthStatus('unauthenticated');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Salon Calendar Sync
          </h1>
          <p className="text-gray-600 text-sm">
            スタイリスト管理画面
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {authStatus === 'checking' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">認証状態を確認中...</p>
            </div>
          )}

          {authStatus === 'authenticated' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Google認証済み
              </h2>
              {email && (
                <p className="text-gray-500 text-sm mb-2">
                  {email}
                </p>
              )}
              <p className="text-gray-500 text-sm mb-4">
                Googleアカウントとの連携が完了しています。
              </p>

              {/* カレンダー情報 */}
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-600">
                  書き込み先: <span className="font-medium text-gray-900">{calendarName || '未選択（メインカレンダー）'}</span>
                </p>
                <Link
                  href="/stylist/calendar-select"
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-1 inline-block"
                >
                  カレンダーを変更
                </Link>
              </div>

              <Link
                href="/stylist/requests"
                className="inline-block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
              >
                予約リクエスト一覧へ
              </Link>
            </div>
          )}

          {authStatus === 'unauthenticated' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Google認証が必要です
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                予約リクエストの承認にはGoogleカレンダーとの連携が必要です。
                下のボタンからGoogleアカウントで認証してください。
              </p>
              <a
                href="/api/auth/google"
                className="inline-block w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors text-center"
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Googleアカウントで認証
                </span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          認証情報は安全に保管されます
        </p>
      </div>
    </div>
  );
}
