// Turso (libSQL) に prisma/migrations 配下の SQL を順番に適用する。
//
// 使い方:
//   $env:TURSO_DATABASE_URL = "libsql://<your-db>.turso.io"
//   $env:TURSO_AUTH_TOKEN   = "<token>"
//   node scripts/turso-push.mjs
//
// _prisma_migrations テーブルで適用済みを管理し、未適用のものだけを流す。
// 初回実行時はゼロから全部適用する。

import { createClient } from "@libsql/client";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("TURSO_DATABASE_URL is required");
  process.exit(1);
}

const client = createClient({ url, authToken });

// 1) Ensure tracking table
await client.execute(`
  CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const migrationsDir = path.resolve("prisma/migrations");
const entries = readdirSync(migrationsDir)
  .filter((name) => {
    const p = path.join(migrationsDir, name);
    return statSync(p).isDirectory();
  })
  .sort();

const applied = new Set(
  (await client.execute("SELECT id FROM _prisma_migrations")).rows.map(
    (r) => r.id,
  ),
);

let count = 0;
for (const name of entries) {
  if (applied.has(name)) {
    console.log(`- skip   ${name} (already applied)`);
    continue;
  }
  const sqlPath = path.join(migrationsDir, name, "migration.sql");
  const sql = readFileSync(sqlPath, "utf8");

  // libsql の execute は単一文。複数文をセミコロンで分割して順次実行する。
  const statements = sql
    .split(/;\s*\n/g)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  console.log(`+ apply  ${name} (${statements.length} statements)`);
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (e) {
      console.error(`  failed on:\n${stmt}\n`, e);
      process.exit(1);
    }
  }
  await client.execute({
    sql: "INSERT INTO _prisma_migrations (id) VALUES (?)",
    args: [name],
  });
  count++;
}
console.log(`Done. Applied ${count} new migration(s).`);
