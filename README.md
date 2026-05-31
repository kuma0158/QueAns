# QueAns - 社員研修QA管理システム

質問・回答を一元管理する社内ツール。Next.js (App Router) + Postgres(Neon) + Prisma + Vercel Blob 構成。

## 機能

- プロジェクト配下に質問をぶら下げる構造
- カテゴリーは多対多
- 質問の CRUD（案件名, 確認事項, 質問者, 起票日, 期限, 回答, 回答者, ステータス, 備考）
- ステータス自動判定（新規 / 対応中 / 完了 / 期限超過）
- ダッシュボード（進捗率、プロジェクト/カテゴリー別件数、期限超過リスト）
- 添付ファイル（画像はサムネプレビュー、その他はDL）
- 簡易ログイン（ID/Pass）
- カテゴリー・プロジェクト CRUD 管理画面

## ローカル開発

Neon (or 互換のPostgres) の接続文字列が必要です。Vercel ダッシュボードで Neon を作成 → Vercel CLI で env pull するのが楽：

```powershell
npm i -g vercel
vercel link        # プロジェクト紐付け
vercel env pull .env.local   # Vercelの環境変数をローカルに取得
```

または手動で `.env` の `DATABASE_URL` を Neon の接続文字列にする。

```powershell
cd e:\QueAns
npm install
npx prisma migrate dev --name init   # 初回。マイグレーション作成 + Neon に適用
npm run db:seed                      # 初期ユーザー＆カテゴリー
npm run dev
```

http://localhost:3000 ・ ログイン `admin` / `admin123` (`.env` で `SEED_ADMIN_PASSWORD` 上書き可)

## Vercel + Neon 本番デプロイ

### ① Neon DB を作る (Vercel ダッシュボードから1クリック)

1. Vercel ダッシュボード → 対象プロジェクト → **Storage** タブ
2. `Create Database` → **Neon (Postgres)** を選択
3. リージョン: `Asia Pacific (Singapore)` 推奨（Tokyo無ければ）
4. 名前を付けて作成
5. **`Connect Project`** を押す → 自動で `DATABASE_URL` 等の環境変数がプロジェクトに注入される

### ② Vercel Blob を作る (添付ファイル永続化)

1. 同じ Storage タブ → `Create Database` → **Blob**
2. 名前を付けて作成 → `Connect Project` で `BLOB_READ_WRITE_TOKEN` 自動注入

### ③ ローカルで初期マイグレーション & seed

```powershell
cd e:\QueAns
vercel env pull .env.local           # ①②の env を取得
# .env.local の DATABASE_URL をコピーして .env の DATABASE_URL に貼る (or .env.local をそのまま使用)
npx prisma migrate dev --name init   # ローカル & Neon にマイグレーション適用
$env:SEED_ADMIN_PASSWORD = "<本番用パスワード>"
$env:SEED_USER_PASSWORD  = "<同じく>"
npm run db:seed                      # 初期ユーザー & カテゴリーを Neon に投入
```

`prisma/migrations/<timestamp>_init/` が生成されます。**git に commit & push してください**。

### ④ git push → 自動デプロイ

```powershell
git add prisma/migrations vercel.json package.json src/
git commit -m "Switch to Neon (Postgres) + Vercel Blob"
git push
```

Vercel が自動デプロイ → `vercel.json` の buildCommand に `prisma migrate deploy` があるので、ビルド時にスキーマ適用される。

### ⑤ 動作確認

`https://que-ans-eight.vercel.app/login` で③で設定した admin パスワードでログイン → プロジェクト/質問の作成・編集を試す → コールドスタート後 (5分以上経過) も残っていることを確認。

## DB の中身を変更する方法

| やり方 | 使う場面 |
|---|---|
| **Neon Console** (https://console.neon.tech) | 行を直接編集・SQL実行 |
| **`npx prisma studio`** (ローカルから接続) | GUI で各テーブルを CRUD |
| **アプリの管理画面** | カテゴリー/プロジェクトはアプリ内で編集可能 |
| **`psql` コマンド** | スクリプト一括実行 |

例: ローカルから Prisma Studio で Neon を直接操作：
```powershell
$env:DATABASE_URL = "<Neonの接続文字列>"
npx prisma studio    # → http://localhost:5555
```

## 環境変数

| 変数 | ローカル | Vercel | 自動注入 |
|---|---|---|---|
| `DATABASE_URL` | **必須** (Neon接続文字列) | **必須** | ✓ (Storage連携) |
| `SESSION_SECRET` | 任意 | **必須** | × 手動設定 |
| `BLOB_READ_WRITE_TOKEN` | 任意 | Blob使うなら必須 | ✓ (Storage連携) |
| `UPLOAD_ROOT` | 任意 | 不要 | — |
| `SEED_ADMIN_PASSWORD` | 任意 | seed時のみ | — |

## スキーマ変更時

```powershell
npx prisma migrate dev --name <name>    # ローカルでmigration作成 & Neon適用
git add prisma/migrations
git commit -m "schema: <name>"
git push                                 # Vercel build で migrate deploy 自動適用
```

## 別経路: Xserver VPS + Docker

Vercel を使わず自前ホスト運用したい場合の構成も同梱（`Dockerfile`, `docker-compose.yml`, `caddy/`）。
ただし schema が `postgresql` になっているので Docker 運用時も Postgres が必要。SQLite に戻す場合は schema の `provider` を `sqlite` に戻し migration を作り直してください。

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma 5 + PostgreSQL (Neon)
- `@vercel/blob`
- bcryptjs
- Cookie ベースの簡易セッション

## 注意事項

- 初期パスワード `admin123` / `user123` は本番で必ず変更
- Neon の無料枠は 0.5GB DB + コンピュート時間制限あり。超えたら自動スケール or アップグレード
- Vercel Blob 無料枠は 5GB
- 添付ファイルは認証ゲート経由で配信（`/api/attachments/[id]` がストリーミング）
