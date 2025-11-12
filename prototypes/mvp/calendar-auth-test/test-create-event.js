const { google } = require('googleapis');
const { authenticate } = require('./auth');

async function createTestEvent() {
  const auth = await authenticate();
  const calendar = google.calendar({ version: 'v3', auth });

  // テストイベント
  const event = {
    summary: 'テスト予約（アプリから作成）',
    description: '【Salon Calendar Sync】\nメニュー: カット\nお客様: テストユーザー',
    start: {
      dateTime: '2025-11-20T10:00:00+09:00',
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: '2025-11-20T11:00:00+09:00',
      timeZone: 'Asia/Tokyo',
    },
  };

  // カレンダー ID（'primary' = メインカレンダー）
  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  console.log('イベントが作成されました:');
  console.log(`- イベント ID: ${res.data.id}`);
  console.log(`- リンク: ${res.data.htmlLink}`);
}

createTestEvent().catch(console.error);
