# Project Structure

## Organization Philosophy

**二段階開発**: `prototypes/` で探索・検証し、`src/` で本番実装（現在は Phase 1 プロトタイプ段階）。
MVP コードは `prototypes/mvp/frontend/` に Next.js App Router ベースで構築。

## Directory Patterns

### Prototype MVP
**Location**: `prototypes/mvp/frontend/`
**Purpose**: MVP 検証用の Next.js アプリケーション
**Structure**:
```
app/                  # Next.js App Router（ページ + API Routes）
lib/                  # 共有ユーティリティ（Firebase, LIFF, Google Auth）
types/                # ドメイン型定義
```

### App Router - ページ
**Location**: `prototypes/mvp/frontend/app/`
**Purpose**: お客さん向けと美容師向けで URL を分離
**Pattern**:
- お客さん: `/`, `/create-request`, `/my-requests`
- 美容師: `/stylist/auth`, `/stylist/requests`, `/stylist/requests/[id]`

### App Router - API Routes
**Location**: `prototypes/mvp/frontend/app/api/`
**Purpose**: バックエンド API エンドポイント
**Pattern**:
- 予約: `/api/reservations`, `/api/reservations/my`
- 認証: `/api/auth/google`, `/api/auth/google/callback`, `/api/auth/google/status`
- スタイリスト操作: `/api/stylist/requests/[id]/approve`, `.../reject`

### Shared Libraries
**Location**: `prototypes/mvp/frontend/lib/`
**Purpose**: 外部サービス連携のシングルトン・ヘルパー
**Pattern**: 1 ファイル = 1 責務（`firebase.ts`, `liff.ts`, `firestore.ts`, `google-auth.ts`）

### Design Documentation
**Location**: `docs/ai-philosophy/`
**Purpose**: AI 開発哲学、設計ドキュメント、リサーチログ
**Pattern**:
- `logs/`: 日付プレフィックス（`YYYY-MM-DD-*.md`）
- `research/`, `design/`: トピック名（日付なし）

## Naming Conventions

- **Files**: kebab-case（`create-request`, `google-auth.ts`）
- **Components**: PascalCase 関数コンポーネント（`export default function Home()`）
- **Types**: PascalCase（`ReservationRequest`, `StylistToken`）
- **Constants**: UPPER_SNAKE_CASE 配列 + `as const`（`MENUS`）
- **API Routes**: `route.ts`（Next.js App Router 規約）

## Import Organization

```typescript
// External packages
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Internal absolute imports (@/ alias)
import { initializeLiff } from '@/lib/liff';
import type { ReservationRequest } from '@/types/reservation';
```

**Path Aliases**:
- `@/`: `prototypes/mvp/frontend/` ルートにマップ

## Code Organization Principles

- **お客さん / 美容師の分離**: URL パス・API・ページが明確に分かれている
- **lib/ の責務分離**: 外部サービスごとに 1 ファイル
- **types/ 集約**: ドメイン型は `types/` に集約し、アプリ全体で共有

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
