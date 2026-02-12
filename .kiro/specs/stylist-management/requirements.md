# Requirements Document

## Introduction
スタイリスト（美容師）向けの予約管理機能。Google OAuth で認証し、顧客から送信された予約リクエストの一覧・詳細を確認する。リクエストを承認すると Google Calendar にイベントが自動作成され、拒否するとステータスが更新される。個人経営の美容院で、美容師が承認ボタンを押すだけで予約管理が完了する体験を提供する。

## Requirements

### Requirement 1: Google OAuth 認証
**Objective:** As a スタイリスト, I want Google アカウントで認証できること, so that Google Calendar と連携して予約管理ができる

#### Acceptance Criteria
1. When スタイリスト認証ページが開かれたとき, the Stylist App shall Google 認証状態を API（`GET /api/auth/google/status`）で確認する
2. While 認証状態を確認中, the Stylist App shall スピナーと「認証状態を確認中...」テキストを表示する
3. When 認証済みと判定されたとき, the Stylist App shall 「Google認証済み」メッセージと「予約リクエスト一覧へ」ボタンを表示する
4. When 未認証と判定されたとき, the Stylist App shall 「Google認証が必要です」メッセージと「Googleアカウントで認証」ボタンを表示する
5. When 「Googleアカウントで認証」ボタンがクリックされたとき, the Stylist App shall Google OAuth 認証画面（`/api/auth/google`）にリダイレクトする

### Requirement 2: Google OAuth API（認証フロー）
**Objective:** As a システム, I want Google OAuth フローを管理すること, so that スタイリストの Google Calendar へのアクセスを安全に許可できる

#### Acceptance Criteria
1. When `GET /api/auth/google` にアクセスされたとき, the Auth API shall Google OAuth 認可 URL を生成し、Google 認証画面にリダイレクトする
2. The Auth API shall `calendar.readonly` と `calendar.events` スコープを要求し、`access_type: offline` で refresh token を取得する
3. When Google 認証成功後にコールバック（`GET /api/auth/google/callback`）が呼ばれたとき, the Auth API shall 認可コードをアクセストークンに交換し、Firestore に保存する
4. When コールバック後のトークン保存が成功したとき, the Auth API shall スタイリスト予約一覧ページ（`/stylist/requests`）にリダイレクトする
5. If Google 認証がユーザーによって拒否された場合, then the Auth API shall 認証ページにエラーパラメータ付きでリダイレクトする
6. If 認可コードがコールバックに含まれていない場合, then the Auth API shall 認証ページにエラーパラメータ付きでリダイレクトする
7. If トークン交換に失敗した場合, then the Auth API shall 認証ページにエラーパラメータ付きでリダイレクトする

### Requirement 3: Google 認証状態確認 API
**Objective:** As a システム, I want スタイリストの Google 認証状態を返すこと, so that フロントエンドが認証状態に応じた UI を表示できる

#### Acceptance Criteria
1. When `GET /api/auth/google/status` にアクセスされたとき, the Auth API shall Firestore からスタイリストのトークンを取得し、`authenticated: true/false` を返す
2. The Auth API shall アクセストークンが存在し空でない場合に `authenticated: true` を返す
3. If Firestore からのトークン取得に失敗した場合, then the Auth API shall `authenticated: false` を返す（エラーを握りつぶす）

### Requirement 4: 予約リクエスト一覧（スタイリスト用）
**Objective:** As a スタイリスト, I want 全顧客の予約リクエスト一覧を確認できること, so that 未対応のリクエストを把握し処理できる

#### Acceptance Criteria
1. When 予約リクエスト一覧ページが開かれたとき, the Stylist App shall 全予約リクエストを API（`GET /api/stylist/requests`）から取得して表示する
2. The Stylist App shall 各予約リクエストについて、顧客名・メニュー・希望日時・ステータスバッジを表示する
3. The Stylist App shall ステータスを色分けバッジで表示する：未対応（黄色）、承認済み（緑色）、却下（赤色）
4. When 予約リクエストカードがタップされたとき, the Stylist App shall 該当の詳細ページ（`/stylist/requests/[id]`）に遷移する
5. The Stylist App shall ヘッダーに Google 認証状態を表示する：認証済み（緑チェックマーク）、未認証（赤色の警告リンク）
6. While Google 認証が未完了の状態で, the Stylist App shall 認証を促す警告バナーと認証ページへのリンクを表示する
7. When 「更新」ボタンがクリックされたとき, the Stylist App shall 予約リクエスト一覧を再取得する
8. When 予約リクエストが 0 件のとき, the Stylist App shall 「予約リクエストはまだありません」メッセージを表示する
9. While 予約リクエストの取得中, the Stylist App shall スピナーと「読み込み中...」テキストを表示する
10. If 予約リクエストの取得に失敗した場合, then the Stylist App shall エラーメッセージと「再試行」ボタンを表示する

### Requirement 5: 予約リクエスト一覧 API（スタイリスト用）
**Objective:** As a システム, I want 全予約リクエスト一覧を返すこと, so that スタイリストが全リクエストを確認できる

#### Acceptance Criteria
1. When `GET /api/stylist/requests` にアクセスされたとき, the Stylist API shall Firestore から全予約リクエストを作成日時の降順で取得し HTTP 200 で返す
2. If Firestore からの読み取りに失敗した場合, then the Stylist API shall 「予約リクエストの取得に失敗しました」エラーを HTTP 500 で返す

### Requirement 6: 予約リクエスト詳細（スタイリスト用）
**Objective:** As a スタイリスト, I want 予約リクエストの詳細を確認し承認/拒否できること, so that 予約を処理してカレンダーに反映できる

#### Acceptance Criteria
1. When 詳細ページが開かれたとき, the Stylist App shall URL パラメータの ID で予約リクエストを API（`GET /api/stylist/requests/[id]`）から取得して表示する
2. The Stylist App shall 顧客名・メニュー・希望日時・リクエスト送信日時・ステータスを表示する
3. The Stylist App shall 希望日時を日本語ロケールのフォーマット（例: 2026年2月11日(水) 10:00）で表示する
4. While 予約リクエストのステータスが `requested` の場合, the Stylist App shall 「承認（Googleカレンダーに登録）」と「却下」の 2 つのアクションボタンを表示する
5. When 「承認」ボタンがクリックされたとき, the Stylist App shall 確認ダイアログ（「〇〇様の予約を承認し、Googleカレンダーに登録しますか？」）を表示する
6. When 確認ダイアログで OK がクリックされたとき, the Stylist App shall 承認 API（`POST /api/stylist/requests/[id]/approve`）を呼び出す
7. When 「却下」ボタンがクリックされたとき, the Stylist App shall 確認ダイアログ（「〇〇様の予約を却下しますか？」）を表示する
8. When 却下の確認ダイアログで OK がクリックされたとき, the Stylist App shall 却下 API（`POST /api/stylist/requests/[id]/reject`）を呼び出す
9. While 承認または却下の API を呼び出し中, the Stylist App shall 該当ボタンにスピナーと「処理中...」を表示し、全アクションボタンを無効化する
10. When 承認が成功したとき, the Stylist App shall 「Googleカレンダーに登録しました」メッセージとカレンダーへのリンクを表示し、予約データをリフレッシュする
11. When 承認済みの予約に Google Calendar イベント ID が存在するとき, the Stylist App shall 「Googleカレンダーに登録済み」バナーを表示する
12. When 却下済みの予約が表示されるとき, the Stylist App shall 「この予約リクエストは却下されました」バナーを表示する
13. If 承認 API が HTTP 401 を返した場合, then the Stylist App shall 「Google認証が必要です」エラーメッセージと認証ページへのリンクを表示する
14. If 承認または却下の API が失敗した場合, then the Stylist App shall エラーメッセージを表示する
15. When 予約リクエストが見つからないとき, the Stylist App shall エラーメッセージと「一覧に戻る」リンクを表示する
16. The Stylist App shall ヘッダーに戻るボタン（一覧ページへ遷移）を含める
17. The Stylist App shall ページ下部に「一覧に戻る」リンクを表示する

### Requirement 7: 予約リクエスト詳細 API（スタイリスト用）
**Objective:** As a システム, I want 予約リクエストの詳細を個別に返すこと, so that スタイリストがリクエスト内容を確認できる

#### Acceptance Criteria
1. When `GET /api/stylist/requests/[id]` にアクセスされたとき, the Stylist API shall 指定された ID の予約リクエストを Firestore から取得し HTTP 200 で返す
2. If 指定された ID の予約リクエストが存在しない場合, then the Stylist API shall HTTP 404 エラーを返す
3. If Firestore からの読み取りに失敗した場合, then the Stylist API shall HTTP 500 エラーを返す

### Requirement 8: 予約承認 API（Google Calendar 連携）
**Objective:** As a システム, I want 予約リクエストを承認して Google Calendar にイベントを自動作成すること, so that スタイリストの承認操作だけでカレンダー登録が完了する

#### Acceptance Criteria
1. When `POST /api/stylist/requests/[id]/approve` にアクセスされたとき, the Approve API shall 予約リクエストを Firestore から取得する
2. If 予約リクエストが存在しない場合, then the Approve API shall HTTP 404 エラーを返す
3. If 予約リクエストのステータスが `requested` でない場合, then the Approve API shall 「この予約リクエストは既に処理済みです」エラーを HTTP 400 で返す
4. If スタイリストの Google OAuth トークンが Firestore に存在しない場合, then the Approve API shall HTTP 401 エラーを返す
5. When トークンが有効なとき, the Approve API shall メニューの所要時間から終了時刻を計算し、Google Calendar イベントを作成する
6. The Approve API shall カレンダーイベントのタイトルを `[予約] {顧客名}様 - {メニュー名}` 形式で設定する
7. The Approve API shall カレンダーイベントの説明に、メニュー・顧客名・連絡手段（LINE）・リクエスト送信日時を含める
8. The Approve API shall カレンダーイベントにタイムゾーン `Asia/Tokyo` を設定する
9. The Approve API shall カレンダーイベントの `extendedProperties` にアプリ識別子・リクエスト ID・LINE ユーザー ID・メニュー名を格納する
10. When Google Calendar イベントの作成が成功したとき, the Approve API shall 予約ステータスを `fixed` に更新し、カレンダーイベント ID を Firestore に保存する
11. When 全処理が成功したとき, the Approve API shall カレンダーイベント ID とイベントリンクを含む成功レスポンスを HTTP 200 で返す
12. If Google Calendar API の呼び出しに失敗した場合, then the Approve API shall エラー詳細を含むメッセージを HTTP 500 で返す

### Requirement 9: 予約拒否 API
**Objective:** As a システム, I want 予約リクエストを拒否してステータスを更新すること, so that スタイリストが不要なリクエストを却下できる

#### Acceptance Criteria
1. When `POST /api/stylist/requests/[id]/reject` にアクセスされたとき, the Reject API shall 予約リクエストを Firestore から取得する
2. If 予約リクエストが存在しない場合, then the Reject API shall HTTP 404 エラーを返す
3. If 予約リクエストのステータスが `requested` でない場合, then the Reject API shall 「この予約リクエストは既に処理済みです」エラーを HTTP 400 で返す
4. When 予約リクエストのステータスが `requested` のとき, the Reject API shall ステータスを `rejected` に更新し、成功メッセージを HTTP 200 で返す
5. If Firestore への書き込みに失敗した場合, then the Reject API shall 「却下処理に失敗しました」エラーを HTTP 500 で返す

### Requirement 10: スタイリスト UI 共通仕様
**Objective:** As a スタイリスト, I want 一貫性のあるプロフェッショナルな UI で操作できること, so that 効率的に予約管理ができる

#### Acceptance Criteria
1. The Stylist App shall ブランドカラー（青: blue-600）をプライマリアクションボタンに使用する
2. The Stylist App shall 白背景のヘッダーバーを sticky で表示し、サブページには戻るナビゲーションを含める
3. While ページデータの取得中, the Stylist App shall スピナーと「読み込み中...」テキストを表示する
4. The Stylist App shall モバイルファーストのレスポンシブレイアウトを採用する（最大幅: max-w-2xl）

### Requirement 11: Google Calendar 選択機能
**Objective:** As a スタイリスト, I want 予約承認時のイベント書き込み先カレンダーを選択できること, so that 用途に応じたカレンダーで予約管理ができる

#### Acceptance Criteria
1. When OAuth 認証完了後, the Auth API shall カレンダー選択ページ `/stylist/calendar-select` にリダイレクトする
2. When カレンダー選択ページが開かれたとき, the Stylist App shall Google Calendar API からカレンダー一覧を取得・表示する
3. The Stylist App shall 各カレンダーにカレンダー名・背景色を表示し、選択可能なカード形式で提供する
4. While カレンダー一覧取得中, the Stylist App shall スピナーと「カレンダー一覧を取得中...」テキストを表示する
5. If カレンダー一覧取得に失敗した場合, then the Stylist App shall エラーメッセージと「再試行」ボタンを表示する
6. When カレンダー選択後「決定」がクリックされたとき, the Stylist App shall `POST /api/auth/google/calendar-select` にカレンダー ID を送信する
7. When カレンダー保存が成功したとき, the Stylist App shall `/stylist/requests` にリダイレクトする
8. When `GET /api/auth/google/calendars` にアクセスされたとき, the Calendar API shall calendarList.list を呼び出し書き込み可能カレンダー一覧を返す
9. The Calendar API shall アクセスロールが `writer` または `owner` のカレンダーのみ返す
10. If スタイリストのトークンが不在または無効の場合, then the Calendar API shall HTTP 401 を返す
11. When `POST /api/auth/google/calendar-select` にアクセスされたとき, the Calendar API shall calendarId を Firestore に保存する
12. If calendarId が未指定の場合, then the Calendar API shall HTTP 400 を返す
13. When 承認時に `selectedCalendarId` が保存されているとき, the Approve API shall そのカレンダーにイベントを作成する
14. If `selectedCalendarId` が未保存の場合, then the Approve API shall `'primary'` カレンダーをフォールバックとして使用する
15. When 認証済み状態のとき, the Stylist App shall 認証ページで現在選択中のカレンダー名と「カレンダーを変更」リンクを表示する
16. When `GET /api/auth/google/status` にアクセスされたとき, the Auth API shall `selectedCalendarId` と `selectedCalendarName` もレスポンスに含める
17. When 再認証（トークン更新）時, the Auth API shall 既存の `selectedCalendarId` を保持して新トークンに引き継ぐ
18. When 再認証時にカレンダー選択済みの場合, the Auth API shall `/stylist/requests` に直接リダイレクトする

### Requirement 12: マルチスタイリスト識別
**Objective:** As a スタイリスト, I want 自分の Google アカウントで独立して認証・操作できること, so that 複数のスタイリストが別々のカレンダーで予約管理できる

#### Acceptance Criteria
1. The Auth API shall OAuth スコープに `openid` と `userinfo.email` を含める
2. When OAuth コールバックが呼ばれたとき, the Auth API shall Google userinfo API からメールアドレスを取得する
3. The Auth API shall Firestore ドキュメント ID としてメールアドレスを使用する（`stylistTokens/{email}`）
4. When OAuth コールバック成功後, the Auth API shall `stylist_email` Cookie（HttpOnly、有効期限 1 年、path=/）をセットする
5. When `GET /api/auth/google/status` にアクセスされたとき, the Auth API shall Cookie からスタイリスト ID を取得する
6. When `GET /api/auth/google/calendars` にアクセスされたとき, the Calendar API shall Cookie からスタイリスト ID を取得する
7. When `POST /api/auth/google/calendar-select` にアクセスされたとき, the Calendar API shall Cookie からスタイリスト ID を取得する
8. When `POST /api/stylist/requests/[id]/approve` にアクセスされたとき, the Approve API shall Cookie からスタイリスト ID を取得する
9. If Cookie が不在の場合, then 各 API shall HTTP 401 を返す（status API は `authenticated: false` を返す）
10. When `GET /api/auth/google/status` にアクセスされたとき, the Auth API shall スタイリストのメールアドレスをレスポンスに含める
11. When 認証済みのとき, the Stylist App shall 認証ページにログイン中のメールアドレスを表示する
12. When 異なる Google アカウントで認証した場合, the Auth API shall 別々の Firestore ドキュメントにトークンを保存する
