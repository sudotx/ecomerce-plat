import { config as loadEnv } from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { validateEnv } from "./config/env.js";

// dotenv never overrides an env var that is already exported, so a stray
// PORT=3001 in the shell silently shadowed the configured 5001 and the API
// was unreachable (the server logged "listening" on 3001 but that port was
// taken). This project treats server/.env as the source of truth: load it
// with override so the configured values always win.
loadEnv({ override: true });

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    validateEnv();
    await connectDB();
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

/**
 * Graceful shutdown: stop accepting requests and close the Mongo
 * connection before the process exits.
 */
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
