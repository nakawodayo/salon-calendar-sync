# エラーハンドリングとリトライロジック方針

**作成日**: 2025-11-11
**目的**: エラーハンドリングとリトライロジックの設計方針を定義

---

## 設計方針

### 基本原則

1. **エラーの早期検出と適切な処理**
   - 各レイヤーで適切なエラーハンドリングを実装
   - エラーの種類に応じた適切な処理

2. **ユーザーへの明確なエラーメッセージ**
   - 技術的な詳細は隠し、ユーザーに分かりやすいメッセージを返す
   - エラーの種類に応じた適切なHTTPステータスコード

3. **ロギングとモニタリング**
   - エラーの詳細をログに記録
   - 問題の診断と改善に活用

4. **リトライ可能な処理の自動復旧**
   - 一時的な障害に対して自動的にリトライ
   - 指数バックオフによる負荷軽減

---

## エラーの分類

### 1. ビジネスエラー（Business Error）

**定義**: ビジネスロジックに違反する操作

**例:**
- 予約リクエストが既に承認済み
- 予約可能時間外のリクエスト
- 重複予約の試行
- 存在しないリソースへのアクセス

**処理方針:**
- HTTPステータスコード: `400 Bad Request` または `409 Conflict`
- リトライ: 不要（ビジネスロジックの違反のため）
- ユーザーへのメッセージ: 明確なエラーメッセージを返す

**実装例:**

```typescript
// domain/errors/BusinessError.ts
export class BusinessError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "BusinessError";
  }
}

// 使用例
if (!request.canBeApproved()) {
  throw new BusinessError(
    "この予約リクエストは承認できません",
    "RESERVATION_ALREADY_PROCESSED",
    409
  );
}
```

### 2. 認証・認可エラー（Authentication/Authorization Error）

**定義**: 認証情報が不正、または権限が不足

**例:**
- トークンの期限切れ
- 不正な認証情報
- 権限不足

**処理方針:**
- HTTPステータスコード: `401 Unauthorized` または `403 Forbidden`
- リトライ: 不要（認証エラーのため）
- ユーザーへのメッセージ: 認証が必要、または権限が不足している旨を伝える

**実装例:**

```typescript
// domain/errors/AuthenticationError.ts
export class AuthenticationError extends Error {
  constructor(message: string = "認証が必要です") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "権限が不足しています") {
    super(message);
    this.name = "AuthorizationError";
  }
}
```

### 3. バリデーションエラー（Validation Error）

**定義**: リクエストデータの形式が不正

**例:**
- 必須フィールドの欠如
- 不正な日時形式
- 範囲外の値

**処理方針:**
- HTTPステータスコード: `400 Bad Request`
- リトライ: 不要（入力データの問題のため）
- ユーザーへのメッセージ: どのフィールドが不正かを明確に伝える

**実装例:**

```typescript
// domain/errors/ValidationError.ts
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: any
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
```

### 4. 外部APIエラー（External API Error）

**定義**: 外部サービス（Google Calendar API、LINE API）の呼び出し失敗

**例:**
- Google Calendar API のレート制限
- LINE API のタイムアウト
- ネットワークエラー

**処理方針:**
- HTTPステータスコード: `502 Bad Gateway` または `503 Service Unavailable`
- リトライ: **必要**（一時的な障害の可能性があるため）
- ユーザーへのメッセージ: サービスが一時的に利用できない旨を伝える

**実装例:**

```typescript
// domain/errors/ExternalApiError.ts
export class ExternalApiError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly retryable: boolean = true,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "ExternalApiError";
  }
}
```

### 5. データベースエラー（Database Error）

**定義**: データベース操作の失敗

**例:**
- Firestore の接続エラー
- タイムアウト
- 同時書き込みの競合

**処理方針:**
- HTTPステータスコード: `500 Internal Server Error` または `503 Service Unavailable`
- リトライ: **必要**（一時的な障害の可能性があるため）
- ユーザーへのメッセージ: システムエラーが発生した旨を伝える

**実装例:**

```typescript
// domain/errors/DatabaseError.ts
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean = true,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}
```

### 6. システムエラー（System Error）

**定義**: 予期しないシステムエラー

**例:**
- メモリ不足
- 未処理の例外
- 設定エラー

**処理方針:**
- HTTPステータスコード: `500 Internal Server Error`
- リトライ: 不要（システムレベルの問題のため）
- ユーザーへのメッセージ: システムエラーが発生した旨を伝える（詳細は隠す）
- ロギング: 詳細なエラー情報をログに記録

**実装例:**

```typescript
// domain/errors/SystemError.ts
export class SystemError extends Error {
  constructor(
    message: string = "システムエラーが発生しました",
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "SystemError";
  }
}
```

---

## エラーハンドリングの実装

### レイヤー別の責務

#### ドメイン層

- **エラーオブジェクトの定義**: ビジネスエラー、バリデーションエラーなど
- **エラーの発生**: ビジネスロジック違反時にエラーを投げる

```typescript
// domain/entities/ReservationRequest.ts
export class ReservationRequest {
  approve(): ReservationRequest {
    if (!this.canBeApproved()) {
      throw new BusinessError(
        "この予約リクエストは承認できません",
        "RESERVATION_ALREADY_PROCESSED",
        409
      );
    }
    // ...
  }
}
```

#### アプリケーション層

- **エラーの捕捉と変換**: ドメイン層のエラーを捕捉し、必要に応じて変換
- **外部API呼び出しのエラーハンドリング**: 外部APIエラーを適切に処理

```typescript
// application/use-cases/ApproveReservationUseCase.ts
export class ApproveReservationUseCase {
  async execute(requestId: string): Promise<ReservationRequest> {
    try {
      const request = await this.reservationRepository.findById(requestId);
      if (!request) {
        throw new BusinessError(
          "予約リクエストが見つかりません",
          "RESERVATION_NOT_FOUND",
          404
        );
      }

      const approvedRequest = request.approve();
      await this.reservationRepository.save(approvedRequest);

      // Google Calendar API 呼び出し
      await this.calendarRepository.createEvent({
        datetime: approvedRequest.datetime,
        title: `${approvedRequest.customerName} - ${approvedRequest.menu}`,
      });

      return approvedRequest;
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error; // そのまま再スロー
      }
      // 予期しないエラーはシステムエラーに変換
      throw new SystemError("予約の承認に失敗しました", error);
    }
  }
}
```

#### プレゼンテーション層

- **エラーミドルウェア**: すべてのエラーを捕捉し、適切なHTTPレスポンスに変換
- **エラーロギング**: エラーの詳細をログに記録

```typescript
// presentation/middleware/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { BusinessError } from "@/domain/errors/BusinessError";
import { AuthenticationError } from "@/domain/errors/AuthenticationError";
import { ValidationError } from "@/domain/errors/ValidationError";
import { ExternalApiError } from "@/domain/errors/ExternalApiError";
import { DatabaseError } from "@/domain/errors/DatabaseError";
import { SystemError } from "@/domain/errors/SystemError";
import { logger } from "@/infrastructure/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // ログに記録
  logger.error("Error occurred", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // エラーの種類に応じて処理
  if (err instanceof BusinessError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: err.message,
      },
    });
  }

  if (err instanceof AuthorizationError) {
    return res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: err.message,
      },
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
        field: err.field,
      },
    });
  }

  if (err instanceof ExternalApiError) {
    return res.status(502).json({
      error: {
        code: "EXTERNAL_API_ERROR",
        message: "外部サービスとの通信に失敗しました",
        service: err.service,
      },
    });
  }

  if (err instanceof DatabaseError) {
    return res.status(503).json({
      error: {
        code: "DATABASE_ERROR",
        message: "データベースエラーが発生しました",
      },
    });
  }

  // システムエラーまたは予期しないエラー
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "システムエラーが発生しました",
    },
  });
}
```

#### インフラストラクチャ層

- **外部API呼び出しのエラーハンドリング**: 外部APIのエラーを適切に変換
- **リトライロジック**: リトライ可能なエラーに対して自動的にリトライ

```typescript
// infrastructure/adapters/GoogleCalendarAdapter.ts
import { ExternalApiError } from "@/domain/errors/ExternalApiError";
import { retryWithBackoff } from "@/infrastructure/utils/retry";

export class GoogleCalendarAdapter {
  async createEvent(event: CalendarEvent): Promise<void> {
    try {
      await retryWithBackoff(
        async () => {
          // Google Calendar API 呼び出し
          await this.calendar.events.insert({
            calendarId: this.calendarId,
            requestBody: event,
          });
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
        }
      );
    } catch (error) {
      throw new ExternalApiError(
        "Google Calendar API の呼び出しに失敗しました",
        "GOOGLE_CALENDAR",
        true,
        error
      );
    }
  }
}
```

---

## リトライロジック

### リトライが必要な処理

1. **外部API呼び出し**
   - Google Calendar API
   - LINE API
   - その他の外部サービス

2. **データベース操作**
   - Firestore の読み書き
   - タイムアウトや接続エラー

3. **ネットワーク通信**
   - HTTPリクエスト
   - WebSocket接続

### リトライ不要な処理

1. **ビジネスロジックエラー**
   - 予約リクエストが既に処理済み
   - バリデーションエラー

2. **認証・認可エラー**
   - トークンの期限切れ
   - 権限不足

3. **入力データの不正**
   - 必須フィールドの欠如
   - 不正な形式

### リトライ戦略

#### 指数バックオフ（Exponential Backoff）

**方針:**
- リトライ間隔を指数的に増加させる
- システムへの負荷を軽減
- 一時的な障害の回復を待つ

**実装例:**

```typescript
// infrastructure/utils/retry.ts
export interface RetryOptions {
  maxRetries: number; // 最大リトライ回数
  initialDelay: number; // 初期遅延時間（ミリ秒）
  maxDelay: number; // 最大遅延時間（ミリ秒）
  multiplier: number; // 遅延時間の倍率（デフォルト: 2）
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    multiplier = 2,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // リトライ可能なエラーかチェック
      if (!isRetryableError(error)) {
        throw error;
      }

      // 最後の試行でない場合、待機してリトライ
      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelay * Math.pow(multiplier, attempt),
          maxDelay
        );
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

function isRetryableError(error: any): boolean {
  // ネットワークエラー
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
    return true;
  }

  // HTTPステータスコード
  if (error.response) {
    const status = error.response.status;
    // 5xxエラーはリトライ可能
    if (status >= 500 && status < 600) {
      return true;
    }
    // 429 Too Many Requests もリトライ可能
    if (status === 429) {
      return true;
    }
  }

  // タイムアウトエラー
  if (error.name === "TimeoutError") {
    return true;
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

#### リトライ可能なエラーの判定

**リトライ可能:**
- ネットワークエラー（`ECONNRESET`, `ETIMEDOUT`）
- HTTP 5xxエラー（サーバーエラー）
- HTTP 429エラー（レート制限）
- タイムアウトエラー
- データベース接続エラー

**リトライ不要:**
- HTTP 4xxエラー（クライアントエラー）
- 認証エラー（401, 403）
- バリデーションエラー（400）
- ビジネスロジックエラー

### リトライ設定（推奨値）

#### Google Calendar API

```typescript
const googleCalendarRetryOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
  multiplier: 2,
};
```

#### LINE API

```typescript
const lineApiRetryOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
  multiplier: 2,
};
```

#### Firestore

```typescript
const firestoreRetryOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 500, // 0.5秒
  maxDelay: 5000, // 5秒
  multiplier: 2,
};
```

---

## ロギング

### ログレベル

1. **ERROR**: エラーが発生した場合
2. **WARN**: 警告（リトライ、レート制限など）
3. **INFO**: 重要な処理の開始・終了
4. **DEBUG**: デバッグ情報（開発環境のみ）

### ログに記録する情報

- **エラーメッセージ**: エラーの内容
- **スタックトレース**: エラーの発生箇所
- **リクエスト情報**: パス、メソッド、パラメータ
- **ユーザー情報**: ユーザーID（個人情報は除外）
- **タイムスタンプ**: エラー発生時刻
- **リトライ情報**: リトライ回数、遅延時間

### ロギングの実装

```typescript
// infrastructure/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});
```

---

## Cloud Functions での考慮事項

### タイムアウト

- **最大実行時間**: 540秒（9分）
- **推奨**: 外部API呼び出しにはタイムアウトを設定

```typescript
// infrastructure/utils/timeout.ts
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]);
}
```

### コールドスタート

- **考慮**: コールドスタート時のエラーハンドリング
- **対策**: 接続プールの初期化を遅延実行

### レート制限

- **Google Calendar API**: 1秒あたりのリクエスト数に制限
- **LINE API**: レート制限あり
- **対策**: リトライ時にレート制限を考慮した遅延

---

## エラーレスポンス形式

### 標準形式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "ユーザー向けのエラーメッセージ",
    "details": {
      "field": "field_name",
      "value": "invalid_value"
    }
  }
}
```

### エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|----------------|------|
| `VALIDATION_ERROR` | 400 | バリデーションエラー |
| `UNAUTHORIZED` | 401 | 認証エラー |
| `FORBIDDEN` | 403 | 権限不足 |
| `RESERVATION_NOT_FOUND` | 404 | 予約リクエストが見つからない |
| `RESERVATION_ALREADY_PROCESSED` | 409 | 予約リクエストが既に処理済み |
| `EXTERNAL_API_ERROR` | 502 | 外部APIエラー |
| `DATABASE_ERROR` | 503 | データベースエラー |
| `INTERNAL_SERVER_ERROR` | 500 | システムエラー |

---

## 実装の優先順位

### Phase 1: 基本的なエラーハンドリング（必須）

1. **エラーオブジェクトの定義**
   - ドメイン層にエラーオブジェクトを定義
   - ビジネスエラー、バリデーションエラーなど

2. **エラーミドルウェアの実装**
   - Express.jsのエラーハンドリングミドルウェア
   - エラーの種類に応じた適切なHTTPレスポンス

3. **基本的なロギング**
   - エラーのログ記録
   - コンソール出力（開発環境）

### Phase 2: リトライロジックの実装（必須）

1. **リトライユーティリティの実装**
   - 指数バックオフの実装
   - リトライ可能なエラーの判定

2. **外部API呼び出しへの適用**
   - Google Calendar API
   - LINE API

3. **データベース操作への適用**
   - Firestore の読み書き

### Phase 3: 高度なエラーハンドリング（オプション）

1. **エラートラッキング**
   - エラーの集計と分析
   - アラート機能

2. **リトライ戦略の最適化**
   - エラーの種類に応じた最適なリトライ戦略
   - レート制限の考慮

---

## 参考資料

- [Express.js Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [AWS Serverless Error Handling](https://aws.amazon.com/jp/builders-flash/202306/serverless-error-handling/)
- [Google Calendar API Rate Limiting](https://developers.google.com/calendar/api/guides/rate-limits)
- [LINE API Rate Limiting](https://developers.line.biz/ja/docs/messaging-api/rate-limits/)

---

## 更新履歴

- **2025-11-11**: 初版作成（エラーハンドリングとリトライロジックの設計方針を定義）
