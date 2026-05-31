# QueAns - 社員研修QA管理システム

質問・回答を一元管理する社内ツール。Next.js (App Router) + Postgres (Xata) + Prisma + Vercel Blob で構築。

## 機能

- プロジェクト配下に質問をぶら下げる構造
- カテゴリーは多対多で複数付与可
- 質問の登録・編集・削除（案件名, 確認事項, 質問者, 起票日, 期限, 回答, 回答者, ステータス, 備考）
- ステータス自動判定（新規 / 対応中 / 完了 / 期限超過）
- ダッシュボード（進捗率、プロジェクト/カテゴリー別件数、期限超過リスト）
- 添付ファイル（画像はサムネプレビュー、その他はダウンロード）
- 簡易ログイン（ID / パスワード）
- カテゴリー・プロジェクト CRUD 管理画面

## ローカル開発

1. Xata でデータベースを作成（下記の「Xata セットアップ」参照）して接続文字列を取得
2. `.env` の `DATABASE_URL` にその値を貼り付け
3. 以下を実行

```powershell
cd e:\QueAns
npm install
npx prisma migrate dev --name init   # 初回のみ。マイグレーションファイル作成 + DBに適用
npm run db:seed                       # 初期ユーザー & カテゴリー
npm run dev
```

ブラウザで http://localhost:3000 ・ 初期ログイン `admin` / `admin123`

添付ファイルはローカルでは `./uploads` に保存（`BLOB_READ_WRITE_TOKEN` を設定すれば Vercel Blob に切替可）。

## Vercel へのデプロイ

| 用途 | サービス | 無料枠 |
|---|---|---|
| ホスティング | Vercel | Hobby 無料 |
| データベース | Xata (Postgres) | 15GB |
| ファイルストレージ | Vercel Blob | 5GB |

### ① Xata セットアップ

1. https://xata.io にサインアップ（GitHub連携可）
2. ダッシュボードで `Create database`
3. リージョンは `Asia Pacific (Tokyo)` 等を選択
4. 作成後、`Connect` または `Settings → Connection` から **Postgres 接続文字列** を取得
   - 形式: `postgresql://<workspace>:<api-key>@<region>.sql.xata.sh:5432/<db>:main?sslmode=require`
5. 接続文字列をメモ帳に控える

### ② ローカルからスキーマと初期データを Xata に流す

```powershell
cd e:\QueAns
# .env の DATABASE_URL に上の接続文字列を貼る
npx prisma migrate dev --name init   # 初回のみ
npm run db:seed
```

初回でローカル `prisma/migrations/<timestamp>_init/` が作られ、自動的に Xata にも適用されます。
`prisma/migrations/` は Git にコミットしてください（Vercel ビルドで `migrate deploy` がこれを使います）。

### ③ GitHub に push

```powershell
git add .
git commit -m "Switch to Xata (Postgres)"
git push
```

### ④ Vercel にプロジェクト作成（初回のみ）

1. https://vercel.com にログイン → `Add New...` → `Project`
2. リポジトリ選択 → `Import`
3. **Environment Variables** に設定:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | ①の Xata 接続文字列 |
   | `SESSION_SECRET` | `-join ((1..32) \| %{ "{0:x2}" -f (Get-Random -Max 256) })` で生成 |

4. `Deploy`（5〜10分でビルド完了）。ビルド時に `prisma migrate deploy` が走り Xata にスキーマ適用

### ⑤ Vercel Blob を有効化

1. Vercel ダッシュボード → Project → `Storage` タブ → `Create Database` → `Blob`
2. 名前を付けて作成。`BLOB_READ_WRITE_TOKEN` が自動で環境変数注入される
3. `Deployments` → 最新の `...` メニュー → `Redeploy`

これ以降の添付ファイルアップロードは Blob に保存され、URL が Attachment.url に記録されます。

### ⑥ ドメイン（Xserver のドメインを使う場合）

- Vercel → Project → `Domains` → `queans.example.com` 追加
- 表示される `CNAME` 値 (`cname.vercel-dns.com`) を Xserver サーバーパネルの DNSレコード設定で CNAME 登録
- 5〜30分で SSL 自動発行

## 環境変数 早見表

| 変数 | ローカル | Vercel | 用途 |
|---|---|---|---|
| `DATABASE_URL` | **必須** (Xata 接続文字列) | **必須** | Postgres 接続 |
| `SESSION_SECRET` | 任意 | **必須** | Cookie セッション署名 |
| `BLOB_READ_WRITE_TOKEN` | 任意 | Blob 作成で自動注入 | Vercel Blob 認証 |
| `UPLOAD_ROOT` | 任意 | 不要 | ローカル fs 保存先 |

## スキーマ変更時

```powershell
# ローカルで migration 作成 + Xata に適用
npx prisma migrate dev --name <name>
git add prisma/migrations
git commit -m "schema: <name>"
git push
```

Vercel ビルド時に `prisma migrate deploy` が未適用 migration を自動適用します。

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma 5 + PostgreSQL (Xata)
- `@vercel/blob`
- bcryptjs (パスワードハッシュ)
- Cookie ベースの簡易セッション

## 注意事項

- 既存ローカルの SQLite データ（`prisma/dev.db`）は廃止されました。Postgres に直接データを入れてください。
- 初期パスワード `admin123` / `user123` は本番では必ず変更してください（`SEED_ADMIN_PASSWORD` 環境変数経由でも seed 時に上書き可能）。
- 添付ファイルは認証ゲート経由で配信されます（`/api/attachments/[id]` がストリーミング）。
