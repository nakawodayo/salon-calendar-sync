const { google } = require('googleapis');
const { authenticate } = require('./auth');

async function listCalendars() {
  const auth = await authenticate();
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.calendarList.list();
  const calendars = res.data.items;

  if (!calendars || calendars.length === 0) {
    console.log('カレンダーが見つかりませんでした。');
    return;
  }

  console.log('カレンダー一覧:');
  calendars.forEach((cal) => {
    console.log(`- ${cal.summary} (${cal.id})`);
  });
}

listCalendars().catch(console.error);
