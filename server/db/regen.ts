import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import duckdb from "duckdb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

// Cargar variables de entorno desde .env en la raíz o en server/
dotenv.config({ path: path.resolve(root, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

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
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV || "development";
  const isProduction = appEnv.toLowerCase() === "production";
  
  // Si SEED_MOCK_DATA está definido explícitamente se respeta; de lo contrario, en producción es false y en desarrollo es true.
  const shouldSeedMockData =
    process.env.SEED_MOCK_DATA !== undefined
      ? process.env.SEED_MOCK_DATA.toLowerCase() === "true"
      : !isProduction;

  console.log(`[Regen] ========================================================`);
  console.log(`[Regen] Entorno detectado: ${appEnv.toUpperCase()}`);
  console.log(`[Regen] ¿Cargar preguntas y actividades mockup?: ${shouldSeedMockData ? "SÍ (Desarrollo)" : "NO (Producción limpia)"}`);
  console.log(`[Regen] ========================================================`);

  const dbPath = path.resolve(root, "local.db");
  const walPath = path.resolve(root, "local.db.wal");

  console.log("[Regen] Limpiando base de datos existente...");
  if (fs.existsSync(walPath)) {
    try {
      fs.unlinkSync(walPath);
    } catch {
      // WAL puede estar en limpieza
    }
  }
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch {
      console.error("\n❌ [Regen Error]: 'local.db' está siendo utilizada por otro proceso (por ejemplo, un servidor 'npm run dev' activo).");
      console.error("👉 Por favor detén el servidor antes de ejecutar 'npm run db:regen'.\n");
      process.exit(1);
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

  // 1. DDL: Estructura de tablas e índices
  const schema = readSql("schema.sql");
  if (!schema) {
    console.warn("[Regen] Advertencia: schema.sql está vacío o no existe aún.");
  } else {
    console.log("[Regen] Aplicando DDL de schema.sql...");
    await execSql(schema);
    console.log("[Regen] DDL aplicado exitosamente.");
  }

  // 2. DML Master: Usuario administrador inicial y temas visuales (siempre requeridos)
  const masterSeeds = readSql("init_master.sql") || readSql("init_values.sql");
  if (!masterSeeds) {
    console.warn("[Regen] Advertencia: No se encontraron semillas maestras (init_master.sql).");
  } else {
    console.log("[Regen] Aplicando DML Maestro (init_master.sql: usuario admin + temas)...");
    await execSql(masterSeeds);
    console.log("[Regen] Semillas maestras aplicadas exitosamente.");
  }

  // 3. DML Mockup: Preguntas, presentaciones y sesiones demostrativas
  if (shouldSeedMockData) {
    const mockupSeeds = readSql("init_mockup.sql");
    if (mockupSeeds) {
      console.log("[Regen] Aplicando DML Mockup (init_mockup.sql: actividades, preguntas y sesiones demo)...");
      await execSql(mockupSeeds);
      console.log("[Regen] Datos de prueba cargados exitosamente.");
    }
  } else {
    console.log("[Regen] 🛡️ MODO LIMPIO DE PRODUCCIÓN: Se omitieron todas las preguntas y presentaciones mockup.");
  }

  console.log("[Regen] Proceso de regeneración finalizado con éxito.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Regen Error]:", err);
  process.exit(1);
});
