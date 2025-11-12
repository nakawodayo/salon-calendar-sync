## 共同作業方針（WSL ベース）

WSL 上での開発・Git 操作を標準とします。認証やツール互換の観点から、日常の Git 操作とローカル実行は WSL を推奨します。

---

### 基本ルール

- 作業シェルは WSL（bash）を使用
- リポジトリパスは `/mnt/c/...` 経由でアクセス（本リポジトリ例: `/mnt/c/Users/pbnakao/salon-calendar-sync/salon-calendar-sync`）
- PowerShell からの Git 操作は原則行わない（認証相違・挙動差の回避）

---

### よく使うコマンド例（WSL）

```bash
# 移動
cd /mnt/c/Users/pbnakao/salon-calendar-sync/salon-calendar-sync

# 取得と状態確認
git fetch --all -p
git status
git branch -vv

# プッシュ（追跡つき）
git push -u origin <branch>
```

---

### 認証・リモート

- リモートは SSH を使用（例: `git@github.com:nakawodayo/salon-calendar-sync.git`）
- 認証エラー時は `ssh -T git@github.com` で疎通確認

---

### PowerShell 併用時の注意

- PowerShell での複合コマンド（`&&` 等）が失敗する場合があるため、Git 操作は WSL 側に統一
- 必要に応じて `wsl bash -lc '<cmd>'` で実行

---

### コミット/ブランチのリマインド運用

- リマインド対象

  - 進捗の区切り（関数/ファイル/テストが通った等）
  - 仕様や設計の合意変更が発生した瞬間
  - 15–30 分以上の連続作業後（時間ベース）
  - 変更が 2 種類以上混ざり始めた兆候がある時

- チェックリスト（短い通知で促します）

  - 一目的か（機能/修正/整備の混在なし）
  - ビルド/テストが通る単位か
  - 差分はレビュー可能サイズか
  - ブランチ名とコミット Prefix は適切か

- 運用スタイル

  - 方針: 「main ベース + 短命トピックブランチ（PR は Squash）」
  - ブランチ命名例: `feat/<summary>`, `fix/<summary>`, `docs/<summary>`
  - メッセージ Prefix 例: `feat:`, `fix:`, `docs:`, `[philosophy]`

- トーン/頻度の調整
  - 依頼に応じて厳しめ/ゆるめ、頻度（15 分/30 分）を可変で運用
