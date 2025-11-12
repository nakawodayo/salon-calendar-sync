# 開発言語・フレームワーク選定調査

**作成日**: 2025-11-11
**目的**: フロントエンド・バックエンドの開発言語・フレームワークの選定

---

## フロントエンドフレームワークとは？

フロントエンドフレームワークは、**Web アプリケーションの UI（ユーザーインターフェース）を効率的に構築するためのツール**です。

**提供する主な機能:**

1. **コンポーネント化**: UI を小さな部品（コンポーネント）に分割して再利用可能にする
2. **状態管理**: データの変更を自動的に UI に反映させる仕組み
3. **ルーティング**: ページ遷移を管理（例: `/home` → `/reservations`）
4. **ビルド・最適化**: コードを最適化してブラウザで高速に動作させる
5. **開発体験**: ホットリロード（保存したら即座に反映）、型チェック、エラーメッセージなど

**例**: React、Vue.js、Next.js など

---

## フロントエンド

### Next.js は無料で使える？

**はい、完全に無料です。**

- **オープンソース**: MIT ライセンスで公開されており、商用利用も含めて無料
- **Vercel も無料**: Next.js の開発元である Vercel のホスティングも無料プランあり
- **追加費用なし**: フレームワーク自体に料金は一切かからない

### 推奨: Next.js + TypeScript

**理由:**

1. **Vercel との統合が最強**

   - Vercel の開発元であり、最適化されている
   - 自動デプロイ、プレビュー環境の生成がスムーズ
   - SSR、SSG、ISR などの機能を最高のパフォーマンスで実行

2. **TypeScript による型安全性**

   - 開発効率とバグ防止に寄与
   - API レスポンスの型定義が容易

3. **LIFF SDK との統合**

   - Next.js で LIFF SDK を簡単に統合可能
   - サーバーサイドとクライアントサイドの両方で動作

4. **開発体験**
   - ホットリロード、型チェック、エラーハンドリングが充実
   - 豊富なエコシステムとドキュメント

**技術スタック:**

- **フレームワーク**: Next.js 14+（App Router）
- **言語**: TypeScript
- **UI ライブラリ**: React
- **スタイリング**: Tailwind CSS（推奨）または CSS Modules
- **状態管理**: React Hooks（useState, useContext）または Zustand（必要に応じて）
- **HTTP クライアント**: fetch API または axios
- **フォーム管理**: React Hook Form（推奨）

---

## バックエンド

### Nest.js vs Express.js の比較

**Nest.js の特徴:**

- **メリット**:
  - モジュール化されたアーキテクチャ（大規模開発に適している）
  - TypeScript を完全サポート
  - 依存性注入（DI）によるテスト容易性
  - 豊富なエコシステム（認証、GraphQL など）
- **デメリット**:
  - 学習コストが高い（Angular の概念、DI の理解が必要）
  - サーバーレス環境（Cloud Functions）ではオーバーヘッドになる可能性
  - 日本語情報が少ない
  - 厳格な構造により自由度が制限される

**Express.js の特徴:**

- **メリット**:
  - シンプルで軽量
  - 学習コストが低い
  - 自由度が高い（柔軟な実装が可能）
  - サーバーレス環境に適している
  - 日本語情報が豊富
- **デメリット**:
  - 大規模開発では構造化が必要（自前で設計する必要がある）
  - モジュール化は自前で実装する必要がある

**本プロジェクトでの判断:**

- **Cloud Functions はサーバーレス環境**: 関数単位で実行されるため、軽量な方が良い
- **小規模〜中規模のプロジェクト**: 厳格な構造は不要
- **開発速度を重視**: 学習コストが低い方が良い
- **柔軟性を重視**: 要件変更に対応しやすい方が良い

→ **Express.js を推奨**

**ただし、Clean Architecture を前提とする場合は Nest.js の方が優れている可能性が高い（詳細は[Clean Architecture 実現可能性調査](./2025-11-11-clean-architecture.md)を参照）。**

将来的に大規模化する可能性がある場合や、Clean Architecture を前提とする場合は Nest.js も検討可能。

### 推奨: Node.js + TypeScript + Express.js

**理由:**

1. **GCP Cloud Functions との相性**

   - Node.js は Cloud Functions で標準的にサポート
   - デプロイと実行が簡単

2. **フロントエンドとの言語統一**

   - TypeScript をフロントエンドとバックエンドで共有
   - 型定義の共有が容易（API レスポンスの型など）

3. **エコシステム**

   - Google Calendar API、Firebase Firestore の SDK が充実
   - 豊富なライブラリとドキュメント

4. **開発効率**
   - 非同期処理（async/await）が書きやすい
   - エラーハンドリングが容易

**技術スタック:**

- **ランタイム**: Node.js 18+（LTS）
- **言語**: TypeScript
- **フレームワーク**: Express.js または Fastify（軽量）
- **HTTP クライアント**: Google APIs Node.js Client（Google Calendar API）
- **データベース**: Firebase Admin SDK（Firestore）
- **認証**: Google OAuth 2.0 Client Library
- **バリデーション**: Zod または Joi
- **エラーハンドリング**: カスタムミドルウェア

---

## データベース

- **Firebase Firestore**: 既に決定
- **SDK**: Firebase Admin SDK（Node.js）

---

## 開発ツール

- **パッケージマネージャー**: npm または pnpm
- **ビルドツール**: Next.js のビルドシステム、TypeScript Compiler
- **リンター**: ESLint + TypeScript ESLint
- **フォーマッター**: Prettier
- **型チェック**: TypeScript
- **テスト**: Jest + React Testing Library（フロントエンド）、Jest（バックエンド）

---

## ディレクトリ構造（案）

```
salon-calendar-sync/
├── frontend/              # Next.js アプリ（LIFF）
│   ├── app/              # App Router
│   ├── components/       # React コンポーネント
│   ├── lib/             # ユーティリティ、API クライアント
│   ├── types/           # TypeScript 型定義
│   └── public/          # 静的ファイル
├── backend/             # GCP Cloud Functions
│   ├── functions/       # 各 Cloud Function
│   │   ├── reservations/
│   │   ├── calendar/
│   │   ├── auth/
│   │   └── announcements/
│   ├── lib/             # 共通ライブラリ
│   └── types/           # TypeScript 型定義
├── shared/              # フロントエンド・バックエンド共通
│   └── types/          # 共有型定義（API レスポンスなど）
├── prototypes/          # Phase 1: プロトタイプ
│   ├── ui-sketches/
│   └── mvp/
└── docs/               # ドキュメント
    └── ai-philosophy/
```

---

## 選択肢の比較

### フロントエンドフレームワーク比較

| 項目         | Next.js + TypeScript | React + TypeScript | Vue.js + TypeScript |
| ------------ | -------------------- | ------------------ | ------------------- |
| Vercel 統合  | 最強                 | 良好               | 良好                |
| SSR/SSG      | 優秀                 | 限定的             | 良好                |
| 学習コスト   | 中                   | 低                 | 中                  |
| エコシステム | 充実                 | 充実               | 充実                |
| LIFF 統合    | 容易                 | 容易               | 容易                |

### バックエンド言語比較

| 項目                       | Node.js + TypeScript | Python |
| -------------------------- | -------------------- | ------ |
| Cloud Functions サポート   | 標準                 | あり   |
| フロントエンドとの言語統一 | 可能                 | 不可   |
| Google Calendar API SDK    | 充実                 | 充実   |
| Firebase SDK               | 充実                 | 充実   |
| 開発効率                   | 高い                 | 高い   |

---

## 推奨構成（決定）

- **フロントエンド**: **Next.js 14+ (App Router) + TypeScript**
- **バックエンド**: **Node.js 18+ + TypeScript + Express.js**
- **データベース**: **Firebase Firestore**
- **スタイリング**: **Tailwind CSS**
- **状態管理**: **React Hooks**（必要に応じて Zustand）
- **フォーム管理**: **React Hook Form**
- **バリデーション**: **Zod**

### アーキテクチャ設計方針

- **リポジトリパターン**: データベースアクセスを抽象化し、ドメイン層とインフラ層を分離
- **ユースケース**: アプリケーション層でビジネスロジックを明確化
- **依存性の逆転**: インターフェースをドメイン層に定義し、実装をインフラ層に配置
- **段階的発展**: 必要に応じて DI コンテナやモジュールシステムを追加可能な構造
- **保守性重視**: Clean Architecture の原則を取り入れつつ、サーバーレス環境との相性も考慮

詳細は[Clean Architecture 実現可能性調査](./2025-11-11-clean-architecture.md)を参照

---

## 参考資料

- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [Express.js 公式ドキュメント](https://expressjs.com/)
- [Nest.js 公式ドキュメント](https://nestjs.com/)
- [TypeScript 公式ドキュメント](https://www.typescriptlang.org/)
