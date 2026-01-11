import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  // Usaremos uma URL dummy para o generate, já que não precisamos conectar
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy",
  },
});
