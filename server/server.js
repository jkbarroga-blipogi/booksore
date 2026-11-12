import fs from "node:fs";
import path from "node:path";
import { createDatabase } from "./db/database.js";
import { seedDatabase } from "./services/seed-service.js";
import { createApp } from "./app.js";

const envFile = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envFile) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envFile);
}

const port = Number(process.env.PORT || 3000);
const dbPath = process.env.DB_PATH || "./data/booksore.db";

const db = createDatabase(dbPath);
await seedDatabase(db);

const app = createApp({ db });
const server = app.listen(port, () => {
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "server_started",
      port,
      dbPath,
    }),
  );
});

function shutdown(signal) {
  console.info(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", event: "shutdown", signal }));
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
