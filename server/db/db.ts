import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import duckdb from "duckdb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const dbType = process.env.DB_TYPE || "duckdb";

import fs from "node:fs";

function getWorkspaceRoot(): string {
  let curr = __dirname;
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(curr, "schema.sql"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(process.cwd());
}

export const workspaceRoot = getWorkspaceRoot();
const dbPath = path.resolve(workspaceRoot, "local.db");
const duckDbInstance = new duckdb.Database(dbPath);

export function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((chunk) =>
      chunk
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0);
}

function normalizeDuckDbRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    if (typeof val === "bigint") {
      normalized[key] = Number(val);
    } else {
      normalized[key] = val;
    }
  }
  return normalized;
}

export const query = async <T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const conn = duckDbInstance.connect();
    conn.all(sql, ...params, (err: unknown, rows: unknown) => {
      if (err) {
        console.error("[DuckDB Query Error]:", err, "SQL:", sql);
        return reject(err);
      }
      if (!Array.isArray(rows)) {
        return resolve([]);
      }
      const cleaned = rows.map((r) =>
        typeof r === "object" && r !== null
          ? (normalizeDuckDbRow(r as Record<string, unknown>) as T)
          : (r as T),
      );
      resolve(cleaned);
    });
  });
};

export const exec = async (sql: string): Promise<void> => {
  const statements = splitSqlStatements(sql);
  const conn = duckDbInstance.connect();
  for (const stmt of statements) {
    if (!stmt.trim()) continue;
    await new Promise<void>((resolve, reject) => {
      conn.exec(stmt, (err: unknown) => {
        if (err) {
          console.error("[DuckDB Exec Error]:", err, "Statement:", stmt);
          return reject(err);
        }
        resolve();
      });
    });
  }
};
