import { defineConfig } from "drizzle-kit";

// No Docker, o host do banco é 'db'. No desenvolvimento local, é 'localhost'.
// Substituímos dinamicamente para garantir que comandos como 'db:push' funcionem em ambos.
let connectionString = process.env.DATABASE_URL;

if (connectionString && connectionString.includes("@localhost")) {
  // Se estivermos dentro de um container Docker, 'localhost' não funcionará para o banco.
  // Verificamos se estamos no Docker (geralmente via existência de /.dockerenv)
  connectionString = connectionString.replace("@localhost", "@db");
}

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
