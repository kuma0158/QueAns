# QueAns - 社員研修QA管理システム

質問・回答を一元管理する社内ツール。Next.js (App Router) + SQLite/Turso + Prisma で構築。

## 機能

- プロジェクト配下に質問をぶら下げる構造（多階層）
- カテゴリーは複数付けられる多対多
- 質問の登録・編集・削除（10項目: ID, 案件名, 確認事項, 質問者, 起票日, 期限, 回答, 回答者, ステータス, 備考）
- ステータス自動判定（新規 / 対応中 / 完了 / 期限超過）
- ダッシュボード（進捗率、プロジェクト別/カテゴリー別件数、期限超過リスト）
- 添付ファイル（画像はサムネプレビュー、その他はダウンロード）
- 簡易ログイン（ID / パスワード）
- カテゴリー・プロジェクトの CRUD 管理画面

## ローカル開発

```powershell
cd e:\QueAns
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

初期ログイン: `admin` / `admin123` (or `user` / `user123`)
ブラウザで http://localhost:3000

ローカルは SQLite (`prisma/dev.db`) + ファイルシステム (`./uploads`) で完結。Turso/Blob トークン不要。

## Vercel へのデプロイ

Vercel は永続ストレージが無いので、以下の組み合わせで動かします。

| 用途 | サービス | 無料枠 |
|---|---|---|
| ホスティング | Vercel | Hobby 無料 |
| データベース | Turso (libSQL) | 9GB |
| ファイルストレージ | Vercel Blob | 5GB |

### 手順

#### 1. Turso のセットアップ

```powershell
# Turso CLI インストール (PowerShell)
irm get.tur.so/install.ps1 | iex

# サインアップ & DB 作成
turso auth signup
turso db create queans --location nrt   # nrt = 成田(東京)

# 接続情報を取得
turso db show queans                    # URL を控える
turso db tokens create queans           # token を控える
```

#### 2. Turso にスキーマを流す

```powershell
$env:TURSO_DATABASE_URL = "libsql://queans-<your-user>.turso.io"
$env:TURSO_AUTH_TOKEN   = "<token>"

# スキーマ適用 (prisma/migrations 配下の SQL を順に流す)
npm run db:turso:push

# 初期データ投入 (ユーザー & カテゴリー)
# 任意で初期パスワードも環境変数で渡せる
$env:SEED_ADMIN_PASSWORD = "<your-strong-pw>"
$env:SEED_USER_PASSWORD  = "<your-strong-pw>"
npm run db:turso:seed
```

#### 3. GitHub に push

```powershell
cd e:\QueAns
git init
git branch -M main
git add .
git commit -m "Initial commit"
# GitHub に空リポジトリを作って:
git remote add origin https://github.com/<you>/queans.git
git push -u origin main
```

#### 4. Vercel にインポート

1. https://vercel.com にログイン (GitHub 連携)
2. `Add New...` → `Project` → 上のリポジトリを選択 → `Import`
3. **Environment Variables** で以下を設定:
   - `TURSO_DATABASE_URL` = `libsql://...turso.io`
   - `TURSO_AUTH_TOKEN`   = `<手順1のtoken>`
   - `SESSION_SECRET`     = `openssl rand -hex 32` で生成した値
4. `Deploy` を押す（最初のビルドは Blob 無しでも完走する）

#### 5. Vercel Blob を有効化

1. Vercel ダッシュボード → Project → `Storage` タブ → `Create Database`
2. `Blob` を選択 → 名前を付けて作成
3. 自動的に `BLOB_READ_WRITE_TOKEN` が環境変数として注入される
4. 反映のため再デプロイ（または次回 push 時に有効化）

これ以降のアップロードは Blob に保存され、URL を Attachment.url に記録します。

#### 6. 独自ドメイン（Xserver のドメインを使う場合）

- Vercel ダッシュボード → Project → `Domains` → `queans.example.com` を追加
- 表示される CNAME 値 (`cname.vercel-dns.com`) を控える
- Xserver サーバーパネル → DNSレコード設定 で CNAME を追加
- 5〜30分で SSL 自動発行（Let's Encrypt）

## 環境変数 早見表

| 変数 | ローカル | Vercel | 用途 |
|---|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | 不要 (空でも可) | Prisma CLI 用 |
| `TURSO_DATABASE_URL` | 未設定 | **必須** | Runtime DB 接続先 |
| `TURSO_AUTH_TOKEN` | 未設定 | **必須** | Turso 認証 |
| `BLOB_READ_WRITE_TOKEN` | 未設定 (任意) | Blob ストレージ作成で自動注入 | Vercel Blob 認証 |
| `SESSION_SECRET` | 任意 | **必須** | Cookie セッション署名 |
| `UPLOAD_ROOT` | 任意 | 不要 | ローカル fs 保存先 |

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma 5 + `@prisma/adapter-libsql` (driverAdapters preview)
- `@libsql/client` (Turso)
- `@vercel/blob`
- bcryptjs (パスワードハッシュ)
- Cookie ベースの簡易セッション

## スキーマ変更を Turso に反映する

```powershell
# ローカルで migration を作成
npx prisma migrate dev --name <name>

# Turso に差分適用
$env:TURSO_DATABASE_URL = "libsql://..."
$env:TURSO_AUTH_TOKEN   = "..."
npm run db:turso:push
```

`scripts/turso-push.mjs` が `_prisma_migrations` テーブルで適用済みを追跡するので、未適用の SQL だけが流れます。

## 注意事項

- 既存の `./uploads` に保存した添付ファイルは **Vercel デプロイ時に持っていけません**（永続ストレージ無し）。本番 (Blob) で再アップロードしてください。
- 添付ファイルは認証ゲート経由で配信されます（`/api/attachments/[id]` がストリーミング）。
- 初期パスワード `admin123` / `user123` は本番では必ず変更してください。
