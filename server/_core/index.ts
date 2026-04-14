import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { notificationManager } from "../notifications";
import { logger } from "./logger";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  if (process.env.NODE_ENV === "production") {
    return startPort;
  }
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return startPort;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  app.use(cors({
    origin: true,
    credentials: true,
  }));

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: ENV.nodeEnv,
      version: "2.0.0-reset"
    });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else if (process.env.SERVE_FRONTEND === "true") {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "4000");
  const port = await findAvailablePort(preferredPort);

  server.listen(port, "0.0.0.0", () => {
    logger.info(`🚀 Backend API running on port ${port}`, {
      env: ENV.nodeEnv,
      port,
    });
  });
}

startServer().catch(console.error);
