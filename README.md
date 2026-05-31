# QueAns - 社員研修QA管理システム

質問・回答を一元管理する社内ツール。Next.js (App Router) + SQLite + Prisma で構築。

## 機能

- 質問の登録・編集・削除（10項目: 案件名、確認事項、質問者、起票日、期限、回答、回答者、ステータス、備考）
- ステータス自動判定（新規 / 対応中 / 完了 / 期限超過）
- ダッシュボード（進捗率、完了数、期限超過件数）
- 簡易ログイン（ID / パスワード）

## セットアップ

```powershell
cd e:\QueAns
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

初期ログイン:
- 管理者: `admin` / `admin123`
- 一般: `user` / `user123`

ブラウザで http://localhost:3000 を開く。

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- bcryptjs (パスワードハッシュ)
- Cookie ベースの簡易セッション

## Render へのデプロイ

`render.yaml` を同梱しています。Web Service (Starter $7/月) + Persistent Disk (1GB) で動作します。

### 手順

1. **GitHub にコードを push**
   ```powershell
   cd e:\QueAns
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create queans --private --source=. --push  # gh CLI 利用時
   ```

2. **Render でサービス作成**
   - https://dashboard.render.com で `New +` → `Blueprint`
   - GitHub リポジトリを選び `Apply` → `render.yaml` 自動検出
   - 初回のみ Render → GitHub の認可を求められる
   - サービス名 `queans`、リージョン `singapore`、Starter プランで作成される

3. **デプロイ完了確認**
   - 初回ビルドで `prisma migrate deploy` → `db:seed` → `next build` まで自動実行
   - 完了後 `https://queans.onrender.com` (または独自ドメイン) でアクセス
   - 初期ログイン: `admin` / `admin123`（**必ず seed.ts を変更して再デプロイ、もしくはログイン後にユーザー追加 API でローテーション**）

4. **Xserver のドメインを使う場合**
   - Render の Custom Domain で `queans.example.com` 等を登録
   - Xserver サーバーパネル → DNS設定 で CNAME を Render の指定先 (`xxxx.onrender.com`) に向ける
   - Render 側で自動 SSL 発行（Let's Encrypt）

### Render 設定の中身（render.yaml）

| 項目 | 値 | 意味 |
|---|---|---|
| `plan` | `starter` | $7/月。無料プランは永続ディスク不可で SQLite が消えるため不可 |
| `disk.mountPath` | `/data` | SQLite と uploads を永続化 |
| `DATABASE_URL` | `file:/data/db/queans.db` | 永続ディスク上に SQLite |
| `UPLOAD_ROOT` | `/data/uploads` | 添付ファイルも永続ディスク上 |
| `SESSION_SECRET` | 自動生成 | Render が起動時にランダム生成（再デプロイで変わらない） |

### 注意事項

- 初期ユーザー（admin/admin123）は **デプロイ前に `prisma/seed.ts` を編集**するか、デプロイ後すぐに管理画面（未実装）またはシェルで変更してください
- `db:seed` は idempotent (upsert) ですが、Question は `count===0` のときだけ追加されるので、データ投入後は安全
- DB バックアップは Render Shell から `cp /data/db/queans.db /tmp/...` で取得、または `pg_dump` 相当のスクリプトを cron job で
- 同時アクセスが増えてきたら Prisma の datasource を Postgres に切り替え可能（Render 無料 Postgres もあり）
