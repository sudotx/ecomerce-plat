import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

// Port 5001 (not 5000): macOS AirPlay Receiver occupies 5000.
const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
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