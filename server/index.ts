import http from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Server as SocketIOServer } from "socket.io";
import epivoxRoutes from "./routes/epivox.routes.js";
import { setupSocketManager } from "./services/socketManager.js";

// Polyfill for BigInt serialization from DuckDB aggregations
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

dotenv.config();

const app = express();
const server = http.createServer(app);

// Sockets configuration with low latency
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Identity / SSO simulation middleware (Rule 6)
app.use((req, _res, next) => {
  const forwardedEmail =
    req.headers["x-forwarded-email"] ||
    req.headers["x-forwarded-preferred-username"] ||
    req.headers["x-user-email"];

  // Fallback for non-production development
  if (!forwardedEmail && process.env.NODE_ENV !== "production") {
    req.headers["x-user-email"] = "jaising.pasten@epiroc.com";
  }
  next();
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    module: "Epivox",
    timestamp: new Date().toISOString(),
  });
});

// Epivox REST routes
app.use("/api/epivox", epivoxRoutes);

// Epivox Real-time WebSockets
setupSocketManager(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[Epivox Server] Ejecutándose en http://localhost:${PORT}`);
});
