const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const url = require('url');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

/**
 * OAuth 2.0 クライアントを作成
 */
async function createOAuth2Client() {
  const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH));
  const { client_id, client_secret } = credentials.web || credentials.installed;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    REDIRECT_URI
  );

  return oauth2Client;
}

/**
 * 認可 URL を生成
 */
function getAuthUrl(oauth2Client) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',  // リフレッシュトークンを取得
    scope: SCOPES,
    prompt: 'consent'        // 毎回同意画面を表示（テスト用）
  });
}

/**
 * 認可コードをトークンと交換
 */
async function getTokenFromCode(oauth2Client, code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  return tokens;
}

/**
 * 保存されたトークンを読み込み
 */
async function loadSavedToken(oauth2Client) {
  try {
    const token = JSON.parse(await fs.readFile(TOKEN_PATH));
    oauth2Client.setCredentials(token);
    return oauth2Client;
  } catch (err) {
    return null;
  }
}

/**
 * 認証フローを実行（初回のみ）
 */
async function authenticate() {
  const oauth2Client = await createOAuth2Client();

  // トークン更新イベントを監視
  oauth2Client.on('tokens', (tokens) => {
    console.log('[トークン更新] 新しいアクセストークンを取得しました');
    if (tokens.refresh_token) {
      console.log('[トークン更新] 新しいリフレッシュトークンも取得しました');
    }
    // 更新されたトークンを保存
    fs.writeFile(TOKEN_PATH, JSON.stringify(tokens)).catch(console.error);
  });

  // 既存のトークンがあれば使用
  const savedClient = await loadSavedToken(oauth2Client);
  if (savedClient) {
    console.log('既存のトークンを使用します');
    return savedClient;
  }

  // 認証フローを開始
  const authUrl = getAuthUrl(oauth2Client);
  console.log('以下の URL にアクセスして認証してください:');
  console.log(authUrl);

  // ローカルサーバーでコールバックを受け取る
  const code = await getAuthorizationCode();
  await getTokenFromCode(oauth2Client, code);

  console.log('認証が完了しました。トークンを保存しました。');
  return oauth2Client;
}

/**
 * ローカルサーバーで認可コードを受け取る
 */
function getAuthorizationCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
        const code = qs.get('code');

        res.end('認証が完了しました。このウィンドウを閉じてください。');
        server.close();
        resolve(code);
      } catch (err) {
        reject(err);
      }
    }).listen(3000, () => {
      console.log('ローカルサーバーがポート 3000 で起動しました');
    });
  });
}

module.exports = { authenticate };
