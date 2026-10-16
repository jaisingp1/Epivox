import http from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import epivoxRoutes from "./routes/epivox.routes.js";
import { setupSocketManager } from "./services/socketManager.js";

// Polyfill para serialización de BigInt desde agregaciones DuckDB
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configuración de WebSockets de baja latencia
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Endpoint de verificación de salud
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    module: "Epivox",
    standalone: true,
    timestamp: new Date().toISOString(),
  });
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/epivox", epivoxRoutes);

// Servidor de WebSockets de Epivox en tiempo real
setupSocketManager(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[Epivox Server] Ejecutándose en http://localhost:${PORT}`);
});
