import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec, dbType } from "./db.js";

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

async function main(): Promise<void> {
  console.log(`[Regen] Iniciando regeneración de base de datos (${dbType})...`);

  const schema = readSql("schema.sql");
  const seeds = readSql("init_values.sql");

  console.log("[Regen] Limpiando tablas existentes...");
  await exec(`
    DROP TABLE IF EXISTS epivox_audience_questions;
    DROP TABLE IF EXISTS epivox_answers;
    DROP TABLE IF EXISTS epivox_participants;
    DROP TABLE IF EXISTS epivox_sessions;
    DROP TABLE IF EXISTS epivox_questions;
    DROP TABLE IF EXISTS epivox_activities;
    DROP TABLE IF EXISTS epivox_themes;
  `);

  if (!schema) {
    console.warn("[Regen] Advertencia: schema.sql está vacío o no existe aún.");
  } else {
    console.log("[Regen] Aplicando DDL de schema.sql...");
    await exec(schema);
    console.log("[Regen] DDL aplicado exitosamente.");
  }

  if (!seeds) {
    console.warn(
      "[Regen] Advertencia: init_values.sql está vacío o no existe aún.",
    );
  } else {
    console.log("[Regen] Aplicando DML de init_values.sql...");
    await exec(seeds);
    console.log("[Regen] DML aplicado exitosamente.");
  }

  console.log("[Regen] Proceso de regeneración finalizado con éxito.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Regen Error]:", err);
  process.exit(1);
});
