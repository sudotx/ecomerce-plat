import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/errorHandler.js";

const app = express();

// Allow the local Vite dev server to call this API.
// CLIENT_ORIGIN defaults to the standard Vite dev URL.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);

app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);

// 404 + error handling must run after all routes
app.use(notFoundHandler);
app.use(errorHandler);

export default app;