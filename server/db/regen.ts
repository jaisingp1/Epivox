import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import duckdb from "duckdb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

function readSql(fileName: string): string {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) {
    return "";
  }
  return fs.readFileSync(filePath, "utf-8");
}

function splitSqlStatements(sql: string): string[] {
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

async function main(): Promise<void> {
  console.log(`[Regen] Iniciando regeneración de base de datos (duckdb)...`);

  const dbPath = path.resolve(root, "local.db");
  const walPath = path.resolve(root, "local.db.wal");

  console.log("[Regen] Limpiando base de datos existente...");
  if (fs.existsSync(walPath)) {
    try {
      fs.unlinkSync(walPath);
    } catch {
      // Ignorar si está en uso
    }
  }
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch {
      // Ignorar si está en uso
    }
  }

  const duckDb = new duckdb.Database(dbPath);
  const conn = duckDb.connect();

  const execSql = async (sql: string): Promise<void> => {
    const statements = splitSqlStatements(sql);
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

  const schema = readSql("schema.sql");
  const seeds = readSql("init_values.sql");

  if (!schema) {
    console.warn("[Regen] Advertencia: schema.sql está vacío o no existe aún.");
  } else {
    console.log("[Regen] Aplicando DDL de schema.sql...");
    await execSql(schema);
    console.log("[Regen] DDL aplicado exitosamente.");
  }

  if (!seeds) {
    console.warn(
      "[Regen] Advertencia: init_values.sql está vacío o no existe aún.",
    );
  } else {
    console.log("[Regen] Aplicando DML de init_values.sql...");
    await execSql(seeds);
    console.log("[Regen] DML aplicado exitosamente.");
  }

  console.log("[Regen] Proceso de regeneración finalizado con éxito.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Regen Error]:", err);
  process.exit(1);
});
