# アーキテクチャ設計ガイドライン

**作成日**: 2025-11-11
**目的**: Clean Architecture の原則を取り入れた保守性の高い設計方針を定義

---

## 設計方針

### 基本方針

1. **Clean Architecture の原則を取り入れる**

   - リポジトリパターンとユースケースの実装から開始
   - 今後の Clean Architecture 化も踏まえた設計

2. **サーバーレス環境との相性を優先**

   - Nest.js は使用しない（コールドスタート、メモリ使用量を考慮）
   - Express.js で軽量に実装

3. **段階的な発展を可能にする**

   - 必要に応じて DI コンテナやモジュールシステムを追加可能な構造
   - 既存のコードを壊さずに拡張可能

4. **保守性を重視**
   - 明確な責務分離
   - テスタビリティの確保
   - コードの可読性と理解しやすさ

---

## レイヤー構成

### バックエンド（Express.js）

```
backend/
├── functions/                    # Cloud Functions エントリーポイント
│   ├── reservations/
│   │   └── index.ts
│   └── calendar/
│       └── index.ts
├── presentation/                 # プレゼンテーション層
│   ├── controllers/             # コントローラー（HTTPリクエスト/レスポンス処理）
│   │   ├── ReservationController.ts
│   │   └── CalendarController.ts
│   ├── middleware/              # ミドルウェア
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   └── routes/                  # ルーティング
│       └── reservation.routes.ts
├── application/                  # アプリケーション層
│   ├── use-cases/               # ユースケース（ビジネスロジックの実装）
│   │   ├── CreateReservationRequestUseCase.ts
│   │   ├── ApproveReservationUseCase.ts
│   │   └── GetReservationRequestsUseCase.ts
│   └── dto/                     # データ転送オブジェクト
│       └── CreateReservationRequestDto.ts
├── domain/                       # ドメイン層（中心）
│   ├── entities/                # エンティティ（ビジネスオブジェクト）
│   │   ├── Reservation.ts
│   │   └── ReservationRequest.ts
│   ├── value-objects/           # 値オブジェクト
│   │   ├── DateTime.ts
│   │   └── ReservationStatus.ts
│   └── repositories/            # リポジトリインターフェース
│       ├── IReservationRepository.ts
│       └── ICalendarRepository.ts
└── infrastructure/               # インフラストラクチャ層
    ├── repositories/            # リポジトリ実装
    │   ├── FirestoreReservationRepository.ts
    │   └── GoogleCalendarRepository.ts
    ├── adapters/                # 外部サービスアダプター
    │   ├── GoogleCalendarAdapter.ts
    │   └── LineApiAdapter.ts
    └── config/                  # 設定
        └── firebase.config.ts
```

### フロントエンド（Next.js）

```
frontend/
├── app/                          # Next.js App Router（ルーティング）
│   ├── (customer)/
│   │   ├── page.tsx              # プレゼンテーション層
│   │   └── reservations/
│   └── (stylist)/
│       └── requests/
├── presentation/                 # プレゼンテーション層
│   ├── components/              # UIコンポーネント
│   │   ├── ReservationForm.tsx
│   │   └── RequestList.tsx
│   └── pages/                   # ページコンポーネント
│       ├── CustomerHomePage.tsx
│       └── StylistRequestPage.tsx
├── application/                 # アプリケーション層
│   ├── use-cases/               # ユースケース
│   │   ├── CreateReservationRequest.ts
│   │   └── GetReservationRequests.ts
│   └── services/                # アプリケーションサービス
│       └── ReservationService.ts
├── domain/                       # ドメイン層（中心）
│   ├── entities/               # エンティティ
│   │   ├── Reservation.ts
│   │   └── ReservationRequest.ts
│   └── repositories/            # リポジトリインターフェース
│       └── IReservationRepository.ts
└── infrastructure/              # インフラストラクチャ層
    ├── api/                     # APIクライアント
    │   └── ReservationApiClient.ts
    └── repositories/            # リポジトリ実装
        └── ReservationRepository.ts
```

---

## 実装原則

### 1. リポジトリパターン

**目的**: データベースアクセスを抽象化し、ドメイン層とインフラ層を分離

**実装方法:**

- インターフェースをドメイン層に定義
- 実装をインフラ層に配置
- 依存性の逆転を実現

**例:**

```typescript
// domain/repositories/IReservationRepository.ts
export interface IReservationRepository {
  findById(id: string): Promise<ReservationRequest | null>;
  save(request: ReservationRequest): Promise<void>;
  findByStatus(status: ReservationStatus): Promise<ReservationRequest[]>;
}

// infrastructure/repositories/FirestoreReservationRepository.ts
export class FirestoreReservationRepository implements IReservationRepository {
  // Firestore の実装
}
```

### 2. ユースケース

**目的**: ビジネスロジックを明確化し、アプリケーション層で実装

**実装方法:**

- 各ユースケースを独立したクラスとして実装
- リポジトリインターフェースに依存
- 単一責任の原則に従う

**例:**

```typescript
// application/use-cases/CreateReservationRequestUseCase.ts
export class CreateReservationRequestUseCase {
  constructor(private reservationRepository: IReservationRepository) {}

  async execute(params: {
    datetime: DateTime;
    menu: string;
    customerName: string;
    lineUserId: string;
  }): Promise<ReservationRequest> {
    // ビジネスロジック
    const request = new ReservationRequest(
      generateId(),
      params.datetime,
      params.menu,
      params.customerName,
      params.lineUserId,
      ReservationStatus.REQUESTED,
      DateTime.now()
    );

    // リポジトリ経由で保存
    await this.reservationRepository.save(request);
    return request;
  }
}
```

### 3. 依存性の逆転

**目的**: 内側のレイヤーが外側のレイヤーに依存しないようにする

**実装方法:**

- ドメイン層にインターフェースを定義
- インフラ層でインターフェースを実装
- アプリケーション層はインターフェースに依存

**依存関係の方向:**

```
Presentation → Application → Domain ← Infrastructure
```

### 4. エンティティと値オブジェクト

**目的**: ビジネスロジックをドメイン層に集約

**実装方法:**

- エンティティ: 識別子を持つビジネスオブジェクト
- 値オブジェクト: 不変の値（日時、ステータスなど）
- ビジネスルールをエンティティ内に実装

**例:**

```typescript
// domain/entities/ReservationRequest.ts
export class ReservationRequest {
  constructor(
    public readonly id: string,
    public readonly datetime: DateTime,
    public readonly menu: string,
    public readonly customerName: string,
    public readonly lineUserId: string,
    public readonly status: ReservationStatus,
    public readonly createdAt: DateTime
  ) {}

  canBeApproved(): boolean {
    return this.status === ReservationStatus.REQUESTED;
  }

  approve(): ReservationRequest {
    if (!this.canBeApproved()) {
      throw new Error("Cannot approve this request");
    }
    return new ReservationRequest(
      this.id,
      this.datetime,
      this.menu,
      this.customerName,
      this.lineUserId,
      ReservationStatus.APPROVED,
      this.createdAt
    );
  }
}
```

---

## 実装の優先順位

### Phase 1: リポジトリパターンの導入（必須）

1. **リポジトリインターフェースの定義**

   - ドメイン層にインターフェースを定義
   - 必要なメソッドを明確化

2. **リポジトリ実装**

   - インフラ層で Firestore の実装を作成
   - インターフェースを実装

3. **コントローラーでの使用**
   - コントローラーでリポジトリを使用
   - 直接的な Firestore アクセスを排除

### Phase 2: ユースケースの明確化（必須）

1. **ユースケースの定義**

   - 各ビジネスロジックをユースケースとして定義
   - アプリケーション層に配置

2. **コントローラーの簡素化**

   - コントローラーはユースケースを呼び出すだけ
   - HTTP リクエスト/レスポンスの変換のみ

3. **ビジネスロジックの集約**
   - ビジネスロジックをユースケースに集約
   - エンティティのメソッドも活用

### Phase 3: 依存性注入の導入（オプション）

1. **ファクトリーパターンの導入**

   - リポジトリとユースケースの生成をファクトリーで管理
   - 依存関係を明確化

2. **DI コンテナの検討（将来）**
   - 必要に応じて軽量な DI ライブラリ（例: `inversify`）を導入
   - ただし、サーバーレス環境でのパフォーマンスを考慮

### Phase 4: 完全な Clean Architecture（将来）

1. **全レイヤーの実装**

   - プレゼンテーション層、アプリケーション層、ドメイン層、インフラ層を完全に分離

2. **テスト戦略の確立**
   - 各レイヤーを独立してテスト可能にする
   - モックとスタブを活用

---

## コーディング規約

### 命名規則

- **エンティティ**: 単数形、PascalCase（例: `ReservationRequest`）
- **値オブジェクト**: 単数形、PascalCase（例: `ReservationStatus`）
- **リポジトリインターフェース**: `I` + エンティティ名 + `Repository`（例: `IReservationRepository`）
- **リポジトリ実装**: 実装名 + `Repository`（例: `FirestoreReservationRepository`）
- **ユースケース**: 動詞 + 名詞 + `UseCase`（例: `CreateReservationRequestUseCase`）
- **コントローラー**: 名詞 + `Controller`（例: `ReservationController`）

### ディレクトリ構造

- **レイヤーごとにディレクトリを分離**
- **機能ごとにサブディレクトリを作成**
- **共通のコードは `shared/` または `common/` に配置**

### 依存関係のルール

1. **ドメイン層**: 他のレイヤーに依存しない
2. **アプリケーション層**: ドメイン層のみに依存
3. **プレゼンテーション層**: アプリケーション層とドメイン層に依存
4. **インフラ層**: ドメイン層のインターフェースを実装

---

## テスト戦略

### 単体テスト

- **エンティティ**: ビジネスロジックのテスト
- **ユースケース**: モックリポジトリを使用してテスト
- **リポジトリ**: 実際のデータベースまたはインメモリデータベースでテスト

### 統合テスト

- **コントローラー**: HTTP リクエスト/レスポンスのテスト
- **API**: エンドツーエンドのテスト

---

## 参考資料

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Clean Architecture 実現可能性調査](../research/2025-11-11-clean-architecture.md)
- [開発言語・フレームワーク選定調査](../research/2025-11-11-framework-selection.md)
- [エラーハンドリングとリトライロジック方針](./2025-11-11-error-handling-retry.md)

---

## 更新履歴

- **2025-11-11**: 初版作成（リポジトリパターンとユースケースの実装方針を定義）
