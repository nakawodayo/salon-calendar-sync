## ブランチ運用ルール

基本方針は「main ベースで継続開発し、PR は都度の短いトピックブランチで運用」です。

---

### ブランチ種別

- main
  - 常にデプロイ可能（破壊的変更は PR レビュー経由）
  - 直接コミットは避け、原則 PR 経由で反映
- feature ブランチ（例: `feat/<summary>`）
  - 新機能やドキュメント追加
- fix ブランチ（例: `fix/<summary>`）
  - バグ修正やドキュメント修正
- chore/refactor ブランチ（例: `chore/...` `refactor/...`）
  - ツール整備、リファクタリング等

---

### 命名・コミットメッセージ

- ブランチ名: 動詞/目的が分かる短い英語（例: `feat/ai-philosophy-phase1-setup`）
- コミット: プレフィックス推奨
  - `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
  - 思想・原則の更新は `[philosophy]` を付す（例: `[philosophy] Update PHASES.md`）

---

### 典型フロー

```bash
# main 最新化
git checkout main
git pull --ff-only

# 作業ブランチ作成
git checkout -b feat/<summary>

# 作業→コミット→プッシュ
git add -A
git commit -m "feat: <message>"
git push -u origin feat/<summary>

# PR 作成→レビュー→マージ（Squash推奨）
```

---

### リベース/マージ戦略

- 原則 squash merge（履歴を簡潔に）
- 長期ブランチは避け、こまめに main を取り込む（`git pull --rebase` 推奨）

---

### PR の粒度

- 1 目的 1 PR（レビュー可能サイズを維持）
- 変更範囲が広い場合は、準備 PR → 本体 PR に分割
