import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "node:http";
import { Server } from "socket.io";

import { connectDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import { attachGameSockets } from "./socket/game.js";

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://localhost:3001,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => !origin || CLIENT_ORIGINS.includes(origin);

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

attachGameSockets(io);

async function startServer() {
  try {
    await connectDatabase();

    httpServer.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
