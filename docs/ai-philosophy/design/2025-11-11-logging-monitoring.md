# ログとモニタリング方針

**作成日**: 2025-11-11
**目的**: ログとモニタリングの設計方針を定義。特に非業務例外（システムエラー）の検知と通知を重視

---

## 設計方針

### 基本原則

1. **非業務例外の即座検知**

   - システムエラーや予期しないエラーが発生した際、開発者が即座に検知できる仕組み
   - アラート通知による迅速な対応

2. **構造化ログの採用**

   - JSON 形式の構造化ログで記録
   - 検索・分析・集計が容易

3. **適切なログレベル**

   - エラーの重要度に応じたログレベル
   - 情報過多を避け、重要なエラーを見逃さない

4. **個人情報の保護**
   - ログに個人情報を含めない
   - 必要最小限の情報のみ記録

---

## ログ設計

### ログレベル

1. **ERROR**: システムエラー、予期しないエラー（非業務例外）
2. **WARN**: 警告（リトライ、レート制限、バリデーション警告など）
3. **INFO**: 重要な処理の開始・終了、ビジネスイベント
4. **DEBUG**: デバッグ情報（開発環境のみ）

### ログに記録する情報

#### エラーログ（ERROR）

```typescript
{
  level: "error",
  timestamp: "2025-11-11T10:00:00.000Z",
  message: "予期しないエラーが発生しました",
  error: {
    name: "SystemError",
    message: "予期しないエラーが発生しました",
    stack: "Error: ...\n  at ...",
    code: "INTERNAL_SERVER_ERROR"
  },
  context: {
    function: "ApproveReservationUseCase",
    requestId: "req_1234567890",
    userId: "U1234567890abcdef", // 個人情報は除外
    path: "/api/reservations/requests/req_1234567890/approve",
    method: "POST"
  },
  metadata: {
    environment: "production",
    version: "1.0.0"
  }
}
```

#### 警告ログ（WARN）

```typescript
{
  level: "warn",
  timestamp: "2025-11-11T10:00:00.000Z",
  message: "Google Calendar API のレート制限に達しました",
  context: {
    function: "GoogleCalendarAdapter",
    service: "GOOGLE_CALENDAR",
    retryCount: 3
  }
}
```

#### 情報ログ（INFO）

```typescript
{
  level: "info",
  timestamp: "2025-11-11T10:00:00.000Z",
  message: "予約リクエストが承認されました",
  context: {
    function: "ApproveReservationUseCase",
    requestId: "req_1234567890",
    status: "approved"
  }
}
```

### ロギングの実装

#### Winston + Cloud Logging

```typescript
// infrastructure/logger.ts
import winston from "winston";
import { LoggingWinston } from "@google-cloud/logging-winston";

// 環境変数からログレベルを取得
const logLevel = process.env.LOG_LEVEL || "info";

// 開発環境かどうか
const isDevelopment = process.env.NODE_ENV === "development";

// トランスポートの設定
const transports: winston.transport[] = [];

// 開発環境: コンソール出力（色付き、読みやすい形式）
if (isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
          }`;
        })
      ),
    })
  );
} else {
  // 本番環境: Cloud Logging に送信
  transports.push(new LoggingWinston());
}

// ロガーの作成
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
  // 未処理の例外をログに記録
  exceptionHandlers: transports,
  // 未処理のPromise拒否をログに記録
  rejectionHandlers: transports,
});

// 構造化ログのヘルパー関数
export function logError(error: Error, context: Record<string, any> = {}): void {
  logger.error({
    message: error.message,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
  });
}

export function logWarning(message: string, context: Record<string, any> = {}): void {
  logger.warn({
    message,
    context,
  });
}

export function logInfo(message: string, context: Record<string, any> = {}): void {
  logger.info({
    message,
    context,
  });
}
```

#### エラーハンドリングミドルウェアでの使用

```typescript
// presentation/middleware/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { logError } from "@/infrastructure/logger";
import { SystemError } from "@/domain/errors/SystemError";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // システムエラー（非業務例外）の場合は詳細にログに記録
  if (err instanceof SystemError || !err.name.includes("Error")) {
    logError(err, {
      function: "errorHandler",
      requestId: req.headers["x-request-id"],
      path: req.path,
      method: req.method,
      query: req.query,
      body: sanitizeRequestBody(req.body), // 個人情報を除外
      userId: req.user?.id,
    });
  }

  // エラーレスポンスの処理...
}
```

---

## モニタリング

### GCP Cloud Logging

**目的**: ログの集約、検索、分析

**機能:**

- ログの自動収集（Cloud Functions から自動的に送信）
- ログの検索とフィルタリング
- ログの保存期間設定（デフォルト: 30 日、最大: 7 年）

**設定:**

```typescript
// Cloud Functions のログ設定
// functions/reservations/index.ts
import { logger } from "@/infrastructure/logger";

export const reservations = functions
  .region("asia-northeast1")
  .https.onRequest(async (req, res) => {
    // リクエストIDを設定（トレーシング用）
    const requestId = req.headers["x-request-id"] || generateRequestId();
    req.headers["x-request-id"] = requestId;

    // ログに記録
    logger.info("Request received", {
      requestId,
      path: req.path,
      method: req.method,
    });

    try {
      // 処理...
    } catch (error) {
      logger.error("Request failed", {
        requestId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  });
```

### アラート設定

#### 非業務例外（システムエラー）の検知

**目的**: システムエラーや予期しないエラーが発生した際、開発者に即座に通知

**アラート条件:**

- ログレベルが `ERROR` かつ、エラーコードが `INTERNAL_SERVER_ERROR` または `SYSTEM_ERROR`
- 5 分間に 3 回以上発生

**通知方法:**

1. **Email 通知**（必須）

   - GCP Cloud Monitoring の通知チャネルを使用
   - SMTP サーバー不要、GCP が自動的にメール送信
   - 開発者のメールアドレスに送信

2. **Slack 通知**（推奨）
   - GCP Cloud Monitoring の通知チャネルを使用
   - Slack Webhook URL を設定
   - エラーの概要とリンクを含む

**注意**: SMTP サーバーを立てる必要はありません。GCP の監視機能（Cloud Monitoring/Logging）のアラートポリシーと通知チャネルを使用します。

#### Cloud Monitoring のアラートポリシー設定

**GCP Console での設定手順:**

##### 1. 通知チャネルの作成

1. **Cloud Monitoring → 通知チャネル** に移動
2. **通知チャネルを作成** をクリック
3. **Email 通知チャネル** を選択
   - 表示名: `システムエラー通知`
   - Email アドレス: 開発者のメールアドレスを入力
   - **作成** をクリック
4. **Slack 通知チャネル** を作成（オプション）
   - Slack Webhook URL を入力
   - 通知先のチャンネルを指定

##### 2. アラートポリシーの作成

1. **Cloud Monitoring → アラート** に移動
2. **アラートポリシーを作成** をクリック
3. **条件を追加** をクリック
   - **指標タイプ**: `ログベースの指標`
   - **指標**: `ログエントリ数`
   - **フィルタ**:
     ```
     resource.type="cloud_function"
     severity="ERROR"
     jsonPayload.error.code="INTERNAL_SERVER_ERROR"
     ```
   - **集約**: `カウント`
   - **期間**: `5 分`
   - **閾値**: `3` 以上
4. **通知とアクション** を設定
   - 先ほど作成した Email 通知チャネルを選択
   - Slack 通知チャネルも選択（オプション）
5. **ドキュメント** を設定（オプション）
   - アラートの説明や対応手順を記載
6. **ポリシー名**: `システムエラー検知`
7. **作成** をクリック

**アラートがトリガーされると:**

- GCP が自動的にメールを送信（SMTP サーバー不要）
- メールにはエラーの概要、発生時刻、Cloud Logging へのリンクが含まれる
- Slack 通知も送信される（設定した場合）

**設定例（Terraform）:**

```hcl
resource "google_monitoring_alert_policy" "system_error_alert" {
  display_name = "システムエラー検知"
  combiner     = "OR"

  conditions {
    display_name = "システムエラーの発生"

    condition_threshold {
      filter          = "resource.type=\"cloud_function\" AND severity=\"ERROR\" AND jsonPayload.error.code=\"INTERNAL_SERVER_ERROR\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 3
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.email.id,
    google_monitoring_notification_channel.slack.id,
  ]
}
```

### モニタリングメトリクス

#### 監視対象

1. **エラーレート**

   - エラー発生率（エラー数 / 総リクエスト数）
   - 目標: 1%以下

2. **レスポンスタイム**

   - API の平均レスポンスタイム
   - 目標: 1 秒以下（P95）

3. **リクエスト数**

   - 1 時間あたりのリクエスト数
   - 異常な増加を検知

4. **外部 API 呼び出し**

   - Google Calendar API の呼び出し成功率
   - LINE API の呼び出し成功率
   - 目標: 99%以上

5. **データベース操作**
   - Firestore の読み書き成功率
   - 目標: 99.9%以上

#### Cloud Monitoring のダッシュボード

**推奨ダッシュボード:**

1. **エラー監視ダッシュボード**

   - エラーレート（時系列）
   - エラーの種類別集計
   - システムエラーの発生状況

2. **パフォーマンス監視ダッシュボード**

   - レスポンスタイム（P50, P95, P99）
   - リクエスト数（時系列）
   - 外部 API 呼び出しの成功率

3. **リソース監視ダッシュボード**
   - Cloud Functions の実行回数
   - メモリ使用量
   - 実行時間

---

## 通知設定

### GCP Cloud Monitoring の通知チャネル

**重要**: SMTP サーバーを立てる必要はありません。GCP の監視機能（Cloud Monitoring）の通知チャネルを使用します。

#### Email 通知チャネル

**設定手順:**

1. **Cloud Monitoring → 通知チャネル** に移動
2. **通知チャネルを作成** をクリック
3. **Email** を選択
4. 開発者のメールアドレスを入力
5. **作成** をクリック

**動作:**

- アラートポリシーで設定した条件が満たされると、GCP が自動的にメールを送信
- メールには以下の情報が含まれる:
  - アラートのタイトル
  - 発生時刻
  - エラーの概要
  - Cloud Logging への直接リンク
  - アラートポリシーの詳細

#### Slack 通知チャネル（オプション）

**設定手順:**

1. **Slack Webhook URL の取得**

   - Slack の **Apps → Incoming Webhooks** に移動
   - **Add to Slack** をクリック
   - 通知先のチャンネルを選択（例: `#alerts`）
   - Webhook URL をコピー

2. **Cloud Monitoring → 通知チャネル** に移動
3. **通知チャネルを作成** をクリック
4. **Webhook URL** を選択
5. 表示名: `Slack アラート通知`
6. Webhook URL: 先ほど取得した Slack Webhook URL を入力
7. **作成** をクリック

**動作:**

- アラートがトリガーされると、Slack チャンネルに通知が送信される
- 通知にはエラーの概要と Cloud Logging へのリンクが含まれる

---

## ログの保存と保持期間

### 保存期間

- **エラーログ**: 90 日間（問題の調査と分析のため）
- **警告ログ**: 30 日間
- **情報ログ**: 7 日間
- **デバッグログ**: 1 日間（開発環境のみ）

### ログのアーカイブ

- 90 日を超えるログは Cloud Storage にアーカイブ
- 必要に応じて復元可能

---

## 個人情報の保護

### ログに含めない情報

- **個人情報**: メールアドレス、電話番号、住所
- **認証情報**: パスワード、トークン（一部をマスク）
- **機密情報**: クレジットカード情報、その他の機密データ

### ログのサニタイズ

```typescript
// infrastructure/utils/sanitize.ts
export function sanitizeRequestBody(body: any): any {
  if (!body) return body;

  const sanitized = { ...body };
  const sensitiveFields = ["password", "token", "accessToken", "refreshToken"];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "***REDACTED***";
    }
  }

  return sanitized;
}
```

---

## 実装の優先順位

### Phase 1: 基本的なロギング（必須）

1. **Winston の導入**

   - ログレベルの設定
   - コンソール出力（開発環境）
   - Cloud Logging への送信（本番環境）

2. **エラーログの記録**

   - エラーハンドリングミドルウェアでのログ記録
   - システムエラーの詳細ログ

3. **構造化ログの実装**
   - JSON 形式でのログ出力
   - コンテキスト情報の付与

### Phase 2: アラート通知（必須）

1. **通知チャネルの作成**

   - Cloud Monitoring で Email 通知チャネルを作成
   - Slack 通知チャネルを作成（オプション）

2. **アラートポリシーの設定**
   - Cloud Monitoring でアラートポリシーを作成
   - 非業務例外の検知条件を設定
   - 通知チャネルを関連付け

**注意**: SMTP サーバーを立てる必要はありません。GCP の監視機能が自動的にメールを送信します。

### Phase 3: モニタリングダッシュボード（オプション）

1. **Cloud Monitoring ダッシュボードの作成**

   - エラー監視ダッシュボード
   - パフォーマンス監視ダッシュボード

2. **メトリクスの収集**
   - エラーレート
   - レスポンスタイム
   - 外部 API 呼び出し成功率

---

## 環境変数

```bash
# ログレベル
LOG_LEVEL=info  # error, warn, info, debug

# 環境
NODE_ENV=production  # development, production
```

**注意**: 通知設定は GCP Cloud Monitoring の通知チャネルで行うため、環境変数での設定は不要です。

---

## 参考資料

- [Cloud Logging ドキュメント](https://cloud.google.com/logging/docs)
- [Cloud Monitoring ドキュメント](https://cloud.google.com/monitoring/docs)
- [Winston ドキュメント](https://github.com/winstonjs/winston)
- [@google-cloud/logging-winston](https://github.com/googleapis/nodejs-logging-winston)

---

## 更新履歴

- **2025-11-11**: 初版作成（ログとモニタリングの設計方針を定義、非業務例外の検知を重視）
