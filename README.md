# QueAns - 社員研修QA管理システム

質問・回答を一元管理する社内ツール。Next.js (App Router) + SQLite + Prisma で構築、Docker でデプロイ。

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

```powershell
cd e:\QueAns
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

http://localhost:3000 ・ 初期ログイン `admin` / `admin123`

DB: `prisma/dev.db` (SQLite)、添付: `./uploads/`

## Xserver VPS にデプロイ

### 構成
```
[Internet] → :443 [Caddy(自動SSL)] → :3000 [Next.js app] → /data/db/queans.db (SQLite)
                                                          → /data/uploads/    (添付)
```

両方とも docker compose で起動。永続データは VPS の `./data/` ディレクトリ。

### 0. 事前準備
- Xserver VPS 2GB プラン以上を契約 (¥830/月)
- ドメイン (例: `queans.example.com`) を Xserver サーバーパネルで取得 or DNS で VPS の IP に向ける
- VPS の OS は **Ubuntu 22.04 (or 24.04) LTS** を選択

### 1. VPS 初回セットアップ (SSH 接続して実行)

```bash
ssh root@<your-vps-ip>     # またはユーザー名

# Docker & Compose plugin インストール
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin git
systemctl enable --now docker

# 一般ユーザー (任意。root運用しないなら)
useradd -m -G docker -s /bin/bash queans
su - queans

# ファイアウォール (Xserver VPS は管理画面でも設定可)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. アプリ配置

```bash
sudo mkdir -p /srv/queans && sudo chown $USER:$USER /srv/queans
cd /srv/queans
git clone https://github.com/kuma0158/QueAns.git .

# 環境変数ファイル作成
cp .env.example .env
nano .env   # 下記参照
```

`.env` を編集：
```env
DOMAIN=queans.example.com
LETSENCRYPT_EMAIL=you@example.com
SESSION_SECRET=<openssl rand -hex 32 で生成した64文字>
SEED_ADMIN_PASSWORD=<強いパスワード>
SEED_USER_PASSWORD=<強いパスワード>
```

`SESSION_SECRET` 生成:
```bash
openssl rand -hex 32
```

### 3. DNS 設定

ドメイン管理側 (Xserver なら DNSレコード設定) で：
- `queans.example.com` の A レコード → VPS の IP

設定後 `dig queans.example.com` で確認、伝播してから次へ (通常5〜30分)。

### 4. 起動

```bash
cd /srv/queans
docker compose up -d --build
```

初回ビルドは5〜15分。完了後：
- Caddy が自動で Let's Encrypt から SSL 証明書取得 (10〜60秒)
- アプリが `prisma migrate deploy` でスキーマ適用 → seed で初期ユーザー投入

### 5. 動作確認

```bash
docker compose ps                # 両方 healthy
docker compose logs -f app       # アプリログ
docker compose logs -f caddy     # 証明書取得状況
```

ブラウザで `https://queans.example.com` を開き、`.env` に書いた admin パスワードでログイン。

## 運用コマンド

| 操作 | コマンド |
|---|---|
| 更新 (コード変更後) | `cd /srv/queans && git pull && docker compose up -d --build app` |
| ログ確認 | `docker compose logs -f app` |
| 再起動 | `docker compose restart app` |
| 停止 | `docker compose down` |
| DBバックアップ | `cp data/db/queans.db data/db/backup-$(date +%F).db` |
| 添付バックアップ | `tar -czf uploads-$(date +%F).tar.gz data/uploads` |
| DB復元 | `docker compose down && cp <backup> data/db/queans.db && docker compose up -d` |
| 中に入って調査 | `docker compose exec app sh` |

### 定期バックアップ (cron 例)

```bash
crontab -e
```
```
# 毎日午前3時に SQLite と uploads を圧縮バックアップ (30日分保持)
0 3 * * * cd /srv/queans && tar -czf backups/queans-$(date +\%F).tar.gz data/db data/uploads && find backups -mtime +30 -delete
```

## アーキテクチャ

- **app** コンテナ: Next.js 14 + Prisma + SQLite
- **caddy** コンテナ: リバースプロキシ + 自動Let's Encrypt SSL
- 通信: Caddy → app は内部ネットワーク `web` 経由のみ (app の3000は外部非公開)
- データ永続化: ホストの `./data/` を `/data` にマウント
  - `./data/db/queans.db` ← SQLite
  - `./data/uploads/` ← 添付ファイル

## 環境変数

| 変数 | 用途 | デフォルト |
|---|---|---|
| `DOMAIN` | 公開ドメイン | 必須 |
| `LETSENCRYPT_EMAIL` | SSL証明書通知用 | 必須 |
| `SESSION_SECRET` | Cookieセッション署名 | 必須 |
| `SEED_ADMIN_PASSWORD` | 初期admin password | `admin123` |
| `SEED_USER_PASSWORD` | 初期user password | `user123` |
| `DATABASE_URL` | DB接続先 (compose内で自動設定) | `file:/data/db/queans.db` |
| `UPLOAD_ROOT` | 添付保存先 (compose内で自動設定) | `/data/uploads` |

## スキーマ変更時

```powershell
# ローカルで開発
npx prisma migrate dev --name <name>
git add prisma/migrations
git commit -m "schema: <name>"
git push
```

VPS 側：
```bash
cd /srv/queans
git pull
docker compose up -d --build app
# コンテナ起動時に prisma migrate deploy が自動適用
```

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma 5 + SQLite
- bcryptjs (パスワードハッシュ)
- Cookie ベースの簡易セッション
- Docker / Docker Compose
- Caddy (リバースプロキシ + 自動SSL)
