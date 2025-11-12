# Clean Architecture 実現可能性調査

**作成日**: 2025-11-11
**目的**: Next.js + Express.js + TypeScript 構成で Clean Architecture を実現できるか検証

---

## 結論

**はい、現在の構成で Clean Architecture を実現することは可能です。**

ただし、いくつかの考慮点と実装上の注意点があります。

---

## Clean Architecture とは

Clean Architecture は、**ビジネスロジックを中心に、依存関係を内側から外側に向かって流れるように設計するアーキテクチャ**です。

**主な原則:**

1. **依存性の逆転（Dependency Inversion）**: 内側のレイヤーが外側のレイヤーに依存しない
2. **レイヤー分離**: 各レイヤーが明確な責務を持つ
3. **ビジネスロジックの独立性**: フレームワークや外部ライブラリに依存しない
4. **テスタビリティ**: 各レイヤーを独立してテスト可能

**レイヤー構成:**

```
┌─────────────────────────────────────┐
│  Presentation Layer (UI/API)        │ ← 外側
├─────────────────────────────────────┤
│  Application Layer (Use Cases)       │
├─────────────────────────────────────┤
│  Domain Layer (Entities/Business)    │ ← 内側（中心）
├─────────────────────────────────────┤
│  Infrastructure Layer (DB/External) │ ← 外側
└─────────────────────────────────────┘
```

---

## フロントエンド（Next.js）での実現

### 実現可能性: ✅ 可能

Next.js + TypeScript で Clean Architecture を実現することは可能です。

### ディレクトリ構造（案）

```
frontend/
├── app/                          # Next.js App Router（ルーティング）
│   ├── (customer)/
│   │   ├── page.tsx              # プレゼンテーション層
│   │   └── reservations/
│   └── (stylist)/
│       └── requests/
├── presentation/                 # プレゼンテーション層
│   ├── components/               # UIコンポーネント
│   │   ├── ReservationForm.tsx
│   │   └── RequestList.tsx
│   └── pages/                    # ページコンポーネント
│       ├── CustomerHomePage.tsx
│       └── StylistRequestPage.tsx
├── application/                  # アプリケーション層
│   ├── use-cases/                # ユースケース
│   │   ├── CreateReservationRequest.ts
│   │   ├── GetReservationRequests.ts
│   │   └── ApproveReservation.ts
│   └── services/                 # アプリケーションサービス
│       └── ReservationService.ts
├── domain/                       # ドメイン層（中心）
│   ├── entities/                 # エンティティ
│   │   ├── Reservation.ts
│   │   ├── ReservationRequest.ts
│   │   └── User.ts
│   ├── value-objects/            # 値オブジェクト
│   │   ├── DateTime.ts
│   │   └── ReservationStatus.ts
│   └── repositories/             # リポジトリインターフェース
│       └── IReservationRepository.ts
└── infrastructure/               # インフラストラクチャ層
    ├── api/                      # APIクライアント
    │   └── ReservationApiClient.ts
    ├── repositories/             # リポジトリ実装
    │   └── ReservationRepository.ts
    └── adapters/                 # 外部サービスアダプター
        └── LineLiffAdapter.ts
```

### 実装例

#### ドメイン層（エンティティ）

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

#### アプリケーション層（ユースケース）

```typescript
// application/use-cases/CreateReservationRequest.ts
import { ReservationRequest } from "@/domain/entities/ReservationRequest";
import { IReservationRepository } from "@/domain/repositories/IReservationRepository";

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

#### プレゼンテーション層（コンポーネント）

```typescript
// presentation/components/ReservationForm.tsx
"use client";

import { CreateReservationRequestUseCase } from "@/application/use-cases/CreateReservationRequest";
import { useReservationRepository } from "@/infrastructure/repositories/ReservationRepository";

export function ReservationForm() {
  const repository = useReservationRepository();
  const useCase = new CreateReservationRequestUseCase(repository);

  const handleSubmit = async (data: FormData) => {
    await useCase.execute({
      datetime: data.datetime,
      menu: data.menu,
      customerName: data.customerName,
      lineUserId: data.lineUserId,
    });
  };

  // UI実装...
}
```

### 注意点

1. **Next.js App Router の制約**

   - ファイルベースのルーティングを使用するため、`app/` ディレクトリは Next.js の規約に従う必要がある
   - プレゼンテーション層のコンポーネントは `app/` に配置し、ビジネスロジックは別レイヤーに分離

2. **依存性注入（DI）**

   - React Hooks や Context API を使用して依存性を注入
   - または、軽量な DI ライブラリ（例: `inversify`）を使用

3. **状態管理**
   - アプリケーション層の状態は Zustand や Context API で管理
   - ドメイン層の状態はエンティティ内で管理

---

## バックエンド（Express.js）での実現

### 実現可能性: ✅ 可能

Express.js + TypeScript で Clean Architecture を実現することは可能です。ただし、Nest.js と比較して、**自前でレイヤー構造を実装する必要があります**。

### ディレクトリ構造（案）

```
backend/
├── functions/                    # Cloud Functions エントリーポイント
│   ├── reservations/
│   │   └── index.ts
│   └── calendar/
│       └── index.ts
├── presentation/                # プレゼンテーション層
│   ├── controllers/             # コントローラー
│   │   ├── ReservationController.ts
│   │   └── CalendarController.ts
│   ├── middleware/              # ミドルウェア
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   └── routes/                  # ルーティング
│       └── reservation.routes.ts
├── application/                 # アプリケーション層
│   ├── use-cases/               # ユースケース
│   │   ├── CreateReservationRequestUseCase.ts
│   │   ├── ApproveReservationUseCase.ts
│   │   └── GetReservationRequestsUseCase.ts
│   └── dto/                     # データ転送オブジェクト
│       └── CreateReservationRequestDto.ts
├── domain/                      # ドメイン層（中心）
│   ├── entities/                # エンティティ
│   │   ├── Reservation.ts
│   │   └── ReservationRequest.ts
│   ├── value-objects/           # 値オブジェクト
│   │   ├── DateTime.ts
│   │   └── ReservationStatus.ts
│   └── repositories/            # リポジトリインターフェース
│       ├── IReservationRepository.ts
│       └── ICalendarRepository.ts
└── infrastructure/              # インフラストラクチャ層
    ├── repositories/            # リポジトリ実装
    │   ├── FirestoreReservationRepository.ts
    │   └── GoogleCalendarRepository.ts
    ├── adapters/                # 外部サービスアダプター
    │   ├── GoogleCalendarAdapter.ts
    │   └── LineApiAdapter.ts
    └── config/                  # 設定
        └── firebase.config.ts
```

### 実装例

#### ドメイン層（エンティティ）

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

#### アプリケーション層（ユースケース）

```typescript
// application/use-cases/ApproveReservationUseCase.ts
import { ReservationRequest } from "@/domain/entities/ReservationRequest";
import { IReservationRepository } from "@/domain/repositories/IReservationRepository";
import { ICalendarRepository } from "@/domain/repositories/ICalendarRepository";

export class ApproveReservationUseCase {
  constructor(
    private reservationRepository: IReservationRepository,
    private calendarRepository: ICalendarRepository
  ) {}

  async execute(requestId: string): Promise<ReservationRequest> {
    // リポジトリ経由で取得
    const request = await this.reservationRepository.findById(requestId);
    if (!request) {
      throw new Error("Reservation request not found");
    }

    // ビジネスロジック
    if (!request.canBeApproved()) {
      throw new Error("Cannot approve this request");
    }

    // 承認処理
    const approvedRequest = request.approve();
    await this.reservationRepository.save(approvedRequest);

    // カレンダーに反映（オプション）
    await this.calendarRepository.createEvent({
      datetime: approvedRequest.datetime,
      title: `${approvedRequest.customerName} - ${approvedRequest.menu}`,
    });

    return approvedRequest;
  }
}
```

#### プレゼンテーション層（コントローラー）

```typescript
// presentation/controllers/ReservationController.ts
import { Request, Response } from "express";
import { ApproveReservationUseCase } from "@/application/use-cases/ApproveReservationUseCase";
import { ReservationRepository } from "@/infrastructure/repositories/FirestoreReservationRepository";
import { CalendarRepository } from "@/infrastructure/repositories/GoogleCalendarRepository";

export class ReservationController {
  async approveRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 依存性注入（簡易版）
      const reservationRepo = new ReservationRepository();
      const calendarRepo = new CalendarRepository();
      const useCase = new ApproveReservationUseCase(reservationRepo, calendarRepo);

      const result = await useCase.execute(id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

#### インフラストラクチャ層（リポジトリ実装）

```typescript
// infrastructure/repositories/FirestoreReservationRepository.ts
import { IReservationRepository } from "@/domain/repositories/IReservationRepository";
import { ReservationRequest } from "@/domain/entities/ReservationRequest";
import { getFirestore } from "firebase-admin/firestore";

export class FirestoreReservationRepository implements IReservationRepository {
  private db = getFirestore();

  async findById(id: string): Promise<ReservationRequest | null> {
    const doc = await this.db.collection("reservations").doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return this.toEntity(doc.data());
  }

  async save(request: ReservationRequest): Promise<void> {
    await this.db.collection("reservations").doc(request.id).set({
      datetime: request.datetime.toISOString(),
      menu: request.menu,
      customerName: request.customerName,
      lineUserId: request.lineUserId,
      status: request.status.value,
      createdAt: request.createdAt.toISOString(),
    });
  }

  private toEntity(data: any): ReservationRequest {
    // Firestoreのデータをエンティティに変換
    return new ReservationRequest(
      data.id,
      DateTime.fromISO(data.datetime),
      data.menu,
      data.customerName,
      data.lineUserId,
      ReservationStatus.fromValue(data.status),
      DateTime.fromISO(data.createdAt)
    );
  }
}
```

### 注意点

1. **依存性注入（DI）**

   - Express.js には DI コンテナが標準でないため、自前で実装するか、軽量な DI ライブラリ（例: `inversify`）を使用
   - または、ファクトリーパターンで依存性を管理

2. **Cloud Functions との統合**

   - Cloud Functions は関数単位で実行されるため、各関数で依存性を注入する必要がある
   - 共通の DI コンテナを用意して、各関数で使用

3. **Firebase Firestore の抽象化**
   - Firestore の直接的な依存を避けるため、リポジトリパターンで抽象化
   - ドメイン層は `IReservationRepository` インターフェースに依存し、実装はインフラ層に配置

---

## 現在の構成での実現可能性評価

### ✅ 実現可能な点

1. **TypeScript による型安全性**

   - インターフェースと実装を明確に分離可能
   - 依存性の逆転を型システムで強制可能

2. **Next.js の柔軟性**

   - App Router はファイルベースだが、ディレクトリ構造でレイヤー分離可能
   - コンポーネントとビジネスロジックを分離可能

3. **Express.js の軽量性**

   - フレームワークの制約が少ないため、自由にレイヤー構造を設計可能
   - 必要最小限の機能のみを使用可能

4. **Firebase Firestore の抽象化**
   - リポジトリパターンで Firestore への依存を抽象化可能
   - ドメイン層は Firestore に依存しない

### ⚠️ 注意が必要な点

1. **学習コスト**

   - Clean Architecture の概念と実装方法を理解する必要がある
   - レイヤー間の依存関係を適切に管理する必要がある

2. **初期開発時間**

   - レイヤー分割と依存性注入の実装により、初期開発時間が増加する可能性
   - 小規模プロジェクトでは過剰な設計になる可能性

3. **Cloud Functions の制約**

   - 関数単位で実行されるため、各関数で依存性を注入する必要がある
   - 共通の DI コンテナを用意する必要がある

4. **Nest.js との比較**
   - Nest.js は標準で Clean Architecture の構造を提供
   - Express.js は自前で実装する必要がある

---

## 推奨事項

### 小規模〜中規模プロジェクトの場合

1. **段階的な導入**

   - 最初はシンプルな構造から始める
   - 必要に応じてレイヤーを追加

2. **リポジトリパターンの優先**

   - データベースアクセスをリポジトリパターンで抽象化
   - ドメイン層とインフラ層を分離

3. **ユースケースの明確化**
   - アプリケーション層でユースケースを明確に定義
   - ビジネスロジックをドメイン層に集約

### 大規模プロジェクトの場合

1. **Nest.js の検討**

   - より厳格な構造が必要な場合は Nest.js を検討
   - ただし、Cloud Functions との相性を考慮

2. **DI コンテナの導入**

   - `inversify` などの DI コンテナを導入
   - 依存性の管理を自動化

3. **テスト戦略**
   - 各レイヤーを独立してテスト可能にする
   - モックとスタブを活用

---

## 実装の優先順位

1. **Phase 1: リポジトリパターンの導入**

   - Firestore への依存をリポジトリインターフェースで抽象化
   - ドメイン層とインフラ層を分離

2. **Phase 2: ユースケースの明確化**

   - アプリケーション層でユースケースを定義
   - ビジネスロジックをドメイン層に集約

3. **Phase 3: 依存性注入の導入**

   - DI コンテナまたはファクトリーパターンを導入
   - 依存関係を明確化

4. **Phase 4: 完全な Clean Architecture**
   - 全レイヤーを実装
   - テスト戦略を確立

---

## 参考資料

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Next.js/App Router を CleanArchitecture 風に構築してみた](https://zenn.dev/ficilcom/articles/clean_architecture_for_frontend)
- [Next.js で Clean Architecture と DDD #TypeScript](https://qiita.com/dordieux/items/dad83aa9546b5988e885)
- [Node.js + Express.js で Clean Architecture を実装する](https://dev.to/santypk4/bulletproof-node-js-project-architecture-4epf)

---

## Clean Architecture を前提とした場合の Nest.js vs Express.js

### 結論

**Clean Architecture を前提とする場合、Nest.js の方が優れている可能性が高いです。**

### Nest.js が優れている理由

#### 1. 組み込みのモジュールシステムと依存性注入（DI）

**Nest.js:**

- 標準で DI コンテナを提供
- モジュールシステムでレイヤーを自然に分離
- デコレータベースの依存性注入で実装が簡潔

**Express.js:**

- DI コンテナを自前で実装する必要がある
- モジュールシステムも自前で設計する必要がある
- 依存性注入の実装が複雑になる可能性

#### 2. TypeScript との深い統合

**Nest.js:**

- TypeScript を前提として設計
- デコレータによる型安全な依存性注入
- コンパイル時に依存関係を検証可能

**Express.js:**

- TypeScript は使用可能だが、型安全性は自前で確保
- 依存性注入の型安全性を自前で実装する必要がある

#### 3. Clean Architecture の実装事例とベストプラクティス

**Nest.js:**

- Clean Architecture の実装事例が豊富
- 公式ドキュメントにアーキテクチャパターンが記載
- コミュニティでのベストプラクティスが確立

**Express.js:**

- 実装事例はあるが、Nest.js ほど豊富ではない
- ベストプラクティスは自前で確立する必要がある

#### 4. エンタープライズレベルの機能

**Nest.js:**

- マイクロサービス、GraphQL、WebSocket などの公式サポート
- テストユーティリティが充実
- ミドルウェア、ガード、インターセプターなどの機能が標準

**Express.js:**

- 基本的な機能のみ提供
- 高度な機能は自前で実装する必要がある

### Cloud Functions での Nest.js 使用可能性

#### 実現可能性: ✅ 可能

Nest.js は Cloud Functions で使用可能ですが、いくつかの考慮点があります：

**実装方法:**

1. **Nest.js アプリケーションを Cloud Functions でラップ**

   - Nest.js アプリを起動し、HTTP リクエストを処理
   - 各 Cloud Function で Nest.js アプリのインスタンスを作成

2. **サーバーレスアダプターの使用**
   - `@nestjs/platform-express` を使用
   - Cloud Functions の HTTP トリガーで Nest.js アプリを実行

**注意点:**

- **コールドスタート**: Nest.js アプリの起動時間がかかる可能性
- **メモリ使用量**: Express.js よりメモリ使用量が多くなる可能性
- **デプロイサイズ**: 依存関係が多くなるため、デプロイサイズが大きくなる可能性

**対策:**

- コールドスタートを最小化するための最適化
- 必要最小限のモジュールのみをインポート
- バンドルサイズの最適化

### 比較表

| 項目                     | Nest.js            | Express.js           |
| ------------------------ | ------------------ | -------------------- |
| **DI コンテナ**          | 標準提供           | 自前実装が必要       |
| **モジュールシステム**   | 標準提供           | 自前設計が必要       |
| **型安全性（DI）**       | デコレータで自動   | 自前で実装           |
| **実装事例**             | 豊富               | 限定的               |
| **学習コスト**           | 高い               | 低い                 |
| **Cloud Functions 対応** | 可能（最適化必要） | 容易                 |
| **メモリ使用量**         | やや多い           | 少ない               |
| **コールドスタート**     | やや遅い           | 速い                 |
| **開発速度（初期）**     | やや遅い           | 速い                 |
| **開発速度（長期）**     | 速い（構造化済み） | やや遅い（自前設計） |
| **保守性**               | 高い               | 中程度               |

### 推奨事項

#### Clean Architecture を前提とする場合

**Nest.js を推奨する条件:**

1. **プロジェクトが中規模以上**

   - 複数の機能モジュールがある
   - 長期的な保守が必要

2. **チームが Clean Architecture を理解している**

   - DI やモジュールシステムの概念を理解
   - TypeScript に慣れている

3. **Cloud Functions の制約を許容できる**
   - コールドスタートの遅延を許容
   - メモリ使用量の増加を許容

**Express.js を推奨する条件:**

1. **プロジェクトが小規模**

   - 機能が限定的
   - シンプルな構造で十分

2. **開発速度を最優先**

   - 初期開発を迅速に進めたい
   - 学習コストを抑えたい

3. **Cloud Functions のパフォーマンスを重視**
   - コールドスタートを最小化したい
   - メモリ使用量を最小化したい

### ハイブリッドアプローチ

**段階的な移行:**

1. **Phase 1: Express.js で開始**

   - リポジトリパターンとユースケースを実装
   - 基本的な Clean Architecture の構造を確立

2. **Phase 2: 必要に応じて Nest.js に移行**
   - プロジェクトが成長したら Nest.js に移行
   - 既存のドメイン層とアプリケーション層を再利用

### 結論

**Clean Architecture を前提とする場合、Nest.js の方が優れている可能性が高いです。**

**理由:**

1. 標準で DI コンテナとモジュールシステムを提供
2. Clean Architecture の実装事例が豊富
3. 型安全性と保守性が高い
4. エンタープライズレベルの機能を提供

**ただし、以下の点を考慮:**

1. **Cloud Functions での使用**: 最適化が必要
2. **学習コスト**: Express.js より高い
3. **初期開発時間**: Express.js より長くなる可能性

**推奨:**

- **Clean Architecture を前提とする場合**: **Nest.js を推奨**
- **小規模プロジェクトで迅速な開発を優先**: Express.js を推奨
- **段階的な導入**: Express.js で開始し、必要に応じて Nest.js に移行

---

## 結論（全体）

**現在の構成（Next.js + Express.js + TypeScript）で Clean Architecture を実現することは可能です。**

**ただし、Clean Architecture を前提とする場合、Nest.js の方が優れている可能性が高いです。**

### 推奨事項

1. **Clean Architecture を前提とする場合**

   - **Nest.js を推奨**（DI コンテナ、モジュールシステムが標準提供）
   - Cloud Functions での使用は可能だが、最適化が必要

2. **小規模プロジェクトで迅速な開発を優先する場合**

   - Express.js を推奨（学習コストが低く、初期開発が速い）

3. **段階的な導入**
   - Express.js で開始し、必要に応じて Nest.js に移行
   - リポジトリパターンとユースケースの明確化から開始
