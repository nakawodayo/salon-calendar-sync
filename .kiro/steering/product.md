# Product Overview

LINE LIFF アプリとして動作するサロン予約管理システム。お客さんが LINE から予約リクエストを送信し、美容師がそれを承認すると Google Calendar に自動で予定が作成される。手入力作業をほぼゼロにすることが核心的な価値。

## Core Capabilities

1. **LINE 予約リクエスト** - お客さんが LIFF アプリからメニュー・日時を選んで予約リクエストを送信
2. **スタイリスト予約管理** - 美容師がリクエスト一覧を確認し、承認/拒否を判断
3. **Google Calendar 自動連携** - 承認時に Google Calendar へ予定を自動作成
4. **認証統合** - お客さんは LINE (LIFF)、美容師は Google OAuth で認証

## Target Use Cases

- **個人経営の美容院**: 美容師が一人で予約管理と施術を行う環境
- **LINE を主要連絡手段とする顧客層**: 電話やメールより LINE で予約したい顧客
- **Google Calendar で予定管理**: 既存の Google Calendar ワークフローを壊さない

## Value Proposition

- 既存の LINE + Google Calendar の使い方を変えずに予約管理を自動化
- お客さん側は LINE アプリ内で完結（追加アプリ不要）
- 美容師側は承認ボタンを押すだけで Google Calendar に反映

## Reservation Flow

予約の状態遷移: `requested` → `fixed` | `rejected`

1. お客さんがリクエスト送信 → `requested`
2. 美容師が承認 → Google Calendar 自動作成 → `fixed`
3. 美容師が拒否 → `rejected`

※ MVP では `adjusting`（日時調整）状態は未実装

---
_Focus on patterns and purpose, not exhaustive feature lists_
