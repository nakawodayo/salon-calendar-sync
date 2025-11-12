# Salon Calendar Sync

LINE LIFFアプリを使った美容室予約管理・Google Calendar連携システム

## 概要

お客様がLINE経由で予約リクエストを送信し、スタイリストが承認・調整するとGoogle Calendarに自動同期される美容室向け予約管理システムです。

### 主な機能

- **お客様側**: LINEから予約リクエスト送信
- **スタイリスト側**: 予約の承認・調整・拒否
- **自動連携**: 承認時にGoogle Calendarイベント自動作成

### 予約フロー

```
requested（リクエスト） → adjusting（調整中） → fixed（確定） | rejected（拒否）
```

1. お客様が予約リクエスト送信 → ステータス: `requested`
2. スタイリストが承認 → Google Calendarイベント即座に作成 → ステータス: `fixed`
3. スタイリストが調整 → ステータス: `adjusting` → 詳細編集 → **確定** → カレンダー作成 → ステータス: `fixed`
4. スタイリストが拒否 → ステータス: `rejected`

## 技術スタック

### フロントエンド（LIFF App）

- **Next.js 14+** (App Router) + TypeScript
- **Tailwind CSS** - スタイリング
- **React Hook Form + Zod** - フォーム管理・バリデーション
- **@line/liff SDK** - LINE連携
- **ホスティング**: Vercel

### バックエンド（Serverless）

- **Node.js 18+ LTS** + TypeScript
- **Express.js** - 軽量APIフレームワーク
- **GCP Cloud Functions** - サーバーレス実行環境
- **Firebase Firestore** - データベース
- **外部API**: Google Calendar API, LINE API

## アーキテクチャ

本プロジェクトは**Clean Architecture**の段階的アプローチを採用しています。

```
Presentation → Application → Domain ← Infrastructure
```

### レイヤー構成

1. **Domain Layer**（中心、外部依存なし）
   - エンティティ: ビジネスオブジェクト（`ReservationRequest`）
   - 値オブジェクト: 不変の値（`DateTime`, `ReservationStatus`）
   - リポジトリインターフェース: ここで定義、Infrastructureで実装

2. **Application Layer**（ビジネスロジック）
   - ユースケース: 単一目的のビジネス操作（`CreateReservationRequestUseCase`）
   - DTO: データ転送オブジェクト

3. **Presentation Layer**（HTTP）
   - コントローラー: HTTPリクエスト/レスポンス処理
   - ミドルウェア: 認証、エラーハンドリング
   - ルート: APIルーティング

4. **Infrastructure Layer**（外部関心事）
   - リポジトリ実装: `FirestoreReservationRepository`
   - アダプター: 外部サービスクライアント（`GoogleCalendarAdapter`）
   - 設定: Firebase、外部API設定

### ディレクトリ構造

```
prototypes/           # Phase 1: 実験・MVP
  ui-sketches/        # UIプロトタイプ（HTMLモックアップ）
  mvp/                # 検証実装
src/                  # Phase 2: 本番コード（準備が整い次第）
  backend/
    functions/        # Cloud Functions エントリーポイント
    presentation/     # コントローラー、ミドルウェア、ルート
    application/      # ユースケース、DTO
    domain/           # エンティティ、値オブジェクト、リポジトリIF
    infrastructure/   # リポジトリ実装、アダプター、設定
  frontend/
    app/              # Next.js App Router
    presentation/     # コンポーネント、ページ
    application/      # ユースケース、サービス
    domain/           # エンティティ、リポジトリIF
    infrastructure/   # APIクライアント、リポジトリ実装
docs/ai-philosophy/   # 開発哲学とログ
```

## AI駆動開発哲学

本プロジェクトは**2フェーズAI駆動開発アプローチ**を採用しています。

### Phase 1: プロトタイプによる探索
- アイデアと要件を練り上げるため高速にプロトタイプ作成
- コードは`prototypes/`に配置
- スピードと探索を優先、品質は二の次
- 要件が不明確でも可

### Phase 2: 実装による理解
- 明確な意図と設計で本番コード実装
- コードは`src/`に配置
- 理解、責任、品質を優先
- 要件は明確で文書化されている必要あり

**重要原則**: フェーズ間を反復。理解なしに前進しない。AIが形を生成し、人間が意味を導出する。

### ドキュメント要件

重要なAIとのやり取りはすべてログに記録:

- **日次ログ**: `docs/ai-philosophy/logs/YYYY-MM-DD.md`
- **要件**: `docs/ai-philosophy/logs/YYYY-MM-DD-phase1-requirements.md`
- **調査**: `docs/ai-philosophy/research/YYYY-MM-DD-<topic>.md`
- **設計**: `docs/ai-philosophy/design/`

## ブランチ戦略

### ブランチ命名規則

- `feat/<summary>` - 新機能
- `fix/<summary>` - バグ修正
- `docs/<summary>` - ドキュメント
- `chore/`, `refactor/` - ツール・リファクタリング

### コミット規約

- **プレフィックス**: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- **哲学変更**: `[philosophy]`プレフィックス使用
- **プロトタイプ**: `proto:`プレフィックス使用
- **PR戦略**: Squash mergeでクリーンな履歴維持

## セットアップ

### 前提条件

- Node.js 18+ LTS
- Git
- WSL（開発環境として推奨）

### インストール

```bash
# リポジトリクローン
git clone git@github.com:nakawodayo/salon-calendar-sync.git
cd salon-calendar-sync

# 依存関係インストール（実装開始後）
npm install

# 環境変数設定
cp .env.example .env
# .envファイルを編集して必要な設定を追加
```

### 開発サーバー起動

```bash
# フロントエンド（実装開始後）
cd src/frontend
npm run dev

# バックエンド（実装開始後）
cd src/backend
npm run dev
```

## 現在のステータス

**Phase 1（プロトタイピング段階）**

現在、`prototypes/ui-sketches/`でUI要件を探索・精緻化中です。本番実装（`src/`）は要件が固まり次第開始します。

## テスト

- **Domain/Entities**: ビジネスロジックのユニットテスト
- **Use Cases**: モックリポジトリでテスト
- **Repositories**: FirestoreエミュレーターまたはインメモリーDBでテスト
- **API/Controllers**: エンドツーエンド統合テスト
- **ツール**: Jest, React Testing Library, Firestore Emulator, Supertest

## 重要なドキュメント

- **開発哲学**: `docs/ai-philosophy/README.md`
- **フェーズ**: `docs/ai-philosophy/PHASES.md`
- **要件**: `docs/ai-philosophy/REQUIREMENTS.md`
- **ロギング**: `docs/ai-philosophy/LOGGING.md`
- **コラボレーション**: `docs/ai-philosophy/COLLABORATION.md`
- **ブランチング**: `docs/ai-philosophy/BRANCHING.md`
- **MVPプラン**: `docs/ai-philosophy/design/mvp-plan.md`
- **システム設計**: `docs/ai-philosophy/design/system-design.md`

## ライセンス

（ライセンス情報を追加予定）

## コントリビューション

詳細は`docs/ai-philosophy/COLLABORATION.md`を参照してください。

---

**Note**: このプロジェクトはAI（Claude Code）との協働開発を前提に設計されています。`CLAUDE.md`にAI向けガイドラインが記載されています。
