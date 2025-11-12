const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const { authenticate } = require('./auth');

const TOKEN_PATH = path.join(__dirname, 'token.json');

/**
 * トークンの有効期限を過去の日時に設定して期限切れをシミュレート
 */
async function expireToken() {
  try {
    const tokenData = JSON.parse(await fs.readFile(TOKEN_PATH));
    const originalExpiry = tokenData.expiry_date;

    console.log('=== トークン期限切れテストを開始 ===\n');
    console.log('現在のトークン情報:');
    console.log(`- アクセストークン: ${tokenData.access_token.substring(0, 20)}...`);
    console.log(`- リフレッシュトークン: ${tokenData.refresh_token ? '存在する' : '存在しない'}`);
    console.log(`- 元の有効期限: ${new Date(originalExpiry).toLocaleString()}\n`);

    // 有効期限を過去の日時に変更
    tokenData.expiry_date = 1; // 1970年1月1日
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokenData, null, 2));

    console.log('✓ トークンの有効期限を過去の日時に変更しました');
    console.log(`- 新しい有効期限: ${new Date(1).toLocaleString()}\n`);

  } catch (err) {
    console.error('エラー: token.json が見つかりません。先に認証を完了させてください。');
    process.exit(1);
  }
}

/**
 * 期限切れトークンでAPIを呼び出し、自動更新を確認
 */
async function testTokenRefresh() {
  await expireToken();

  console.log('=== APIを呼び出してトークン自動更新をテスト ===\n');

  const auth = await authenticate();
  const calendar = google.calendar({ version: 'v3', auth });

  console.log('カレンダー一覧を取得中...\n');
  const res = await calendar.calendarList.list();
  const calendars = res.data.items;

  console.log('✓ API呼び出しが成功しました（トークンが自動更新されました）\n');

  if (calendars && calendars.length > 0) {
    console.log(`カレンダー数: ${calendars.length}件`);
    console.log('取得したカレンダー:');
    calendars.slice(0, 3).forEach((cal) => {
      console.log(`- ${cal.summary}`);
    });
  }

  // 更新後のトークン情報を表示
  const updatedToken = JSON.parse(await fs.readFile(TOKEN_PATH));
  console.log('\n更新後のトークン情報:');
  console.log(`- アクセストークン: ${updatedToken.access_token.substring(0, 20)}...`);
  console.log(`- 新しい有効期限: ${new Date(updatedToken.expiry_date).toLocaleString()}`);

  console.log('\n=== テスト完了 ===');
}

testTokenRefresh().catch(console.error);
