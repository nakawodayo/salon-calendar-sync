# Technology Stack

## Architecture

Next.js App Router でフロントエンドとバックエンド（API Routes）を統合したモノリシック構成。
将来的には Clean Architecture（Repository Pattern → Use Cases → DI）を段階的に導入予定。

## Core Technologies

- **Language**: TypeScript (strict mode)
- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js 18+
- **Styling**: Tailwind CSS 4

## Key Libraries

- **`@line/liff`**: LINE Front-end Framework SDK - お客さん認証
- **`firebase`**: Firestore クライアント - データ永続化
- **`googleapis`**: Google Calendar API / OAuth2 - 美容師認証・カレンダー連携

## Development Standards

### Type Safety
- TypeScript strict mode 有効
- ドメイン型を `types/` に集約（`ReservationRequest`, `StylistToken` 等）
- `as const` で定数の型安全性を確保（`MENUS`）

### Code Patterns
- LIFF を使うページは必ず `'use client'` ディレクティブ
- Next.js 16 の動的パラメータは `Promise<{id: string}>` で `await` が必要
- Firebase は singleton パターンで初期化（`lib/firebase.ts`）

### Testing
- 未構築（MVP フェーズ）
- 計画: Jest + React Testing Library + Firestore Emulator

## Development Environment

### Required Tools
- Node.js 18+
- npm (package manager)

### Common Commands
```bash
# Dev: npm run dev (from prototypes/mvp/frontend/)
# Build: npx next build (from prototypes/mvp/frontend/)
# Lint: npm run lint
```

## Key Technical Decisions

- **モノリシック Next.js**: MVP ではフロントエンドと API Routes を一体化。将来の Cloud Functions 分離を見据えて `lib/` にロジックを集約
- **Firestore 直接アクセス**: MVP では Repository Pattern 未適用。`lib/firestore.ts` に CRUD 関数を集約
- **Google OAuth サーバーサイド**: トークンは Firestore に保存し、API Routes から Google Calendar API を呼び出す

---
_Document standards and patterns, not every dependency_
