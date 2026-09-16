import mongoose from "mongoose";

/**
 * GET /api/health
 * Reports whether the server is up and whether MongoDB is reachable.
 */
export function getHealth(req, res) {
  const dbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: "ok",
    database: dbConnected ? "connected" : "disconnected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}