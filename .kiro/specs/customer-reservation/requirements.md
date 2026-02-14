# Requirements Document

## Introduction
LINE LIFF アプリを通じた顧客向け予約リクエスト機能。顧客は LINE アプリ内で LIFF を開き、メニュー・希望日時を選択して予約リクエストを送信する。送信済みのリクエストは一覧画面でステータス（リクエスト中 / 確定 / お断り）とともに確認できる。追加アプリのインストールは不要で、LINE 内で完結する体験を提供する。

## Requirements

### Requirement 1: LIFF 認証・初期化
**Objective:** As a 顧客, I want LINE アプリ内で自動的に認証されること, so that 追加のログイン操作なしで予約機能を利用できる

#### Acceptance Criteria
1. When 顧客が LIFF アプリを開いたとき, the LIFF App shall LIFF SDK を初期化し、LINE ログイン状態を確認する
2. While 顧客が LINE にログインしていない状態で, when LIFF アプリを開いたとき, the LIFF App shall LINE ログイン画面にリダイレクトする
3. When LIFF 初期化が成功したとき, the LIFF App shall LINE プロフィール（ユーザー ID・表示名）を取得してホーム画面に表示する
4. If LIFF ID が環境変数に設定されていない場合, then the LIFF App shall エラーメッセージ「LIFF ID が設定されていません」を表示する
5. If LIFF 初期化に失敗した場合, then the LIFF App shall エラー内容を画面に表示する

### Requirement 2: ホーム画面
**Objective:** As a 顧客, I want ログイン後に予約機能へのナビゲーションを表示されること, so that 予約リクエスト作成と一覧確認にすぐアクセスできる

#### Acceptance Criteria
1. When LIFF 認証が完了したとき, the LIFF App shall 顧客の LINE 表示名を含む挨拶メッセージを表示する
2. The LIFF App shall 「予約リクエスト作成」と「予約リクエスト一覧」への 2 つのナビゲーションリンクを表示する
3. When 「予約リクエスト作成」をタップしたとき, the LIFF App shall `/create-request` ページに遷移する
4. When 「予約リクエスト一覧」をタップしたとき, the LIFF App shall `/my-requests` ページに遷移する

### Requirement 3: 予約リクエスト作成
**Objective:** As a 顧客, I want メニューと希望日時を選択して予約リクエストを送信できること, so that 美容師に予約の希望を伝えられる

#### Acceptance Criteria
1. The LIFF App shall 顧客名（LINE 表示名）を読み取り専用で表示する
2. The LIFF App shall 希望日を日付ピッカーで選択させる
3. The LIFF App shall 希望時間を時刻ピッカーで選択させる
4. The LIFF App shall 定義済みメニュー（カット / カット+カラー / カット+パーマ）をラジオボタンで選択させ、各メニューの所要時間（分）を表示する
5. The LIFF App shall デフォルトで最初のメニュー（カット）を選択状態にする
6. When 日時が未選択の状態で送信ボタンがタップされたとき, the LIFF App shall エラーメッセージ「日時を選択してください」を表示する
7. When すべての必須項目が入力された状態で送信ボタンがタップされたとき, the LIFF App shall 予約リクエスト API（`POST /api/reservations`）にデータを送信する
8. While 予約リクエストを送信中, the LIFF App shall 送信ボタンを無効化し「送信中...」テキストを表示する
9. When 予約リクエストの送信が成功したとき, the LIFF App shall 予約リクエスト一覧ページ（`/my-requests`）にリダイレクトする
10. If 予約リクエストの送信が失敗した場合, then the LIFF App shall API から返されたエラーメッセージを画面に表示する

### Requirement 4: 予約リクエスト API（作成）
**Objective:** As a システム, I want 顧客からの予約リクエストデータを受け取り Firestore に保存すること, so that 美容師が予約リクエストを確認・処理できる

#### Acceptance Criteria
1. When `POST /api/reservations` に有効なデータ（customerId, customerName, requestedDateTime, menu）が送信されたとき, the Reservation API shall ステータス `requested` で Firestore に予約レコードを作成し、作成された予約 ID を HTTP 201 で返す
2. If customerId, customerName, requestedDateTime, menu のいずれかが欠けている場合, then the Reservation API shall 不足フィールドの詳細とともに HTTP 400 エラーを返す
3. If requestedDateTime が有効な ISO 8601 形式でない場合, then the Reservation API shall 「日時の形式が正しくありません」エラーを HTTP 400 で返す
4. If Firestore への書き込みに失敗した場合, then the Reservation API shall 「予約リクエストの作成に失敗しました」エラーを HTTP 500 で返す

### Requirement 5: 予約リクエスト一覧表示
**Objective:** As a 顧客, I want 自分が送信した予約リクエストの一覧とステータスを確認できること, so that 予約の進捗状況を把握できる

#### Acceptance Criteria
1. When 予約リクエスト一覧ページが開かれたとき, the LIFF App shall LIFF 認証を行い、自分（ログイン中の顧客）の予約リクエストのみを取得して表示する
2. The LIFF App shall 各予約リクエストについて、メニュー名・希望日時・ステータスを表示する
3. The LIFF App shall ステータスを色分けして表示する：リクエスト中（黄色）、確定（緑色）、お断り（赤色）
4. The LIFF App shall 希望日時を日本語ロケールのフォーマット（例: 2026年2月11日(水) 10:00）で表示する
5. When 予約リクエストが 0 件のとき, the LIFF App shall 「予約リクエストはありません」メッセージと「予約リクエストを作成」リンクを表示する
6. When ヘッダーの戻るボタンがタップされたとき, the LIFF App shall ホームページ（`/`）に遷移する
7. If 予約リクエストの取得に失敗した場合, then the LIFF App shall エラーメッセージとホームへの戻りリンクを表示する

### Requirement 6: 予約リクエスト API（取得）
**Objective:** As a システム, I want 特定の顧客の予約リクエスト一覧を返すこと, so that 顧客が自分のリクエスト状況を確認できる

#### Acceptance Criteria
1. When `GET /api/reservations/my?customerId={id}` にリクエストが送信されたとき, the Reservation API shall 指定された customerId に紐づく予約リクエスト一覧を HTTP 200 で返す
2. If customerId クエリパラメータが指定されていない場合, then the Reservation API shall 「customerId パラメータが必要です」エラーを HTTP 400 で返す
3. If Firestore からの読み取りに失敗した場合, then the Reservation API shall 「予約リクエストの取得に失敗しました」エラーを HTTP 500 で返す

### Requirement 7: UI 共通仕様
**Objective:** As a 顧客, I want 一貫性のあるモバイルフレンドリーな UI で操作できること, so that LINE アプリ内で快適に利用できる

#### Acceptance Criteria
1. While ページの初期化中（LIFF 認証・データ取得中）, the LIFF App shall スピナーアニメーションと「読み込み中...」テキストを表示する
2. The LIFF App shall モバイルファーストのレスポンシブレイアウトを採用する
3. The LIFF App shall ブランドカラー（緑: green-600）をヘッダーとプライマリボタンに一貫して使用する
4. The LIFF App shall 各ページにヘッダーバーを表示し、サブページには戻るナビゲーションを含める

### Requirement 8: ホーム画面 次回予約表示
**Objective:** As a 顧客, I want ホーム画面で次回の確定済み予約を確認できること, so that 予約一覧を開かなくても次の予約日時がわかる

#### Acceptance Criteria
1. When ホーム画面が表示されたとき, the LIFF App shall 確定済み予約のうち未来の直近1件を取得して「次回のご予約」カードに表示する
2. When 確定済みの未来の予約が存在しないとき, the LIFF App shall 「現在確定している予約はありません」メッセージを表示する
3. The LIFF App shall 次回予約カードに日付・時刻・メニュー名を表示する

### Requirement 9: 次回予約 API
**Objective:** As a システム, I want 特定の顧客の次回確定済み予約を返すこと, so that ホーム画面で直近の予約情報を表示できる

#### Acceptance Criteria
1. When `GET /api/reservations/next?customerId={id}` にリクエストが送信されたとき, the Reservation API shall 確定済み（`fixed`）かつ未来の予約のうち直近1件を HTTP 200 で返す
2. If customerId クエリパラメータが指定されていない場合, then the Reservation API shall 「customerId パラメータが必要です」エラーを HTTP 400 で返す
3. When 該当する予約が存在しないとき, the Reservation API shall `{ reservation: null }` を HTTP 200 で返す
4. If Firestore からの読み取りに失敗した場合, then the Reservation API shall 「次回予約の取得に失敗しました」エラーを HTTP 500 で返す
