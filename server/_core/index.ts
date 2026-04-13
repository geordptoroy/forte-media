if (process.env.NODE_ENV !== "production") {
  import("dotenv/config");
}
import express from "express";
import { createServer } from "http";
import cors from "cors";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { notificationManager } from "../notifications";
import { sdk } from "./sdk";
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
  
  // Habilitar CORS para permitir conexões de qualquer origem (ideal para API independente)
  app.use(cors({
    origin: true, // Permite qualquer origem ou configure uma lista específica
    credentials: true,
  }));

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  app.get("/health", (_req, res) => {
    // Retornar 200 OK imediatamente para o healthcheck do Docker
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: ENV.nodeEnv,
      version: "2.0.0-refactored"
    });
  });

  /**
   * Meta API Event Streaming (SSE)
   * Tracks real-time requests and responses from Meta APIs.
   */
  app.get("/api/meta/events", async (req, res) => {
    try {
      let user;
      try {
        user = await sdk.authenticateRequest(req as any);
      } catch (authError: any) {
        logger.error("SSE Auth Failed:", { error: authError.message, cookies: req.headers.cookie ? "present" : "missing" });
        res.status(403).json({ error: "Forbidden", details: authError.message });
        return;
      }

      if (!user?.id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Para Nginx

      const userId = user.id;
      
      // Enviar evento inicial de conexão
      res.write(`data: ${JSON.stringify({ type: "connected", userId })}\n\n`);

      // Subscrever a eventos da Meta API para este usuário
      const onMetaEvent = (event: any) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      logger.on(`meta_event:${userId}`, onMetaEvent);

      req.on("close", () => {
        logger.off(`meta_event:${userId}`, onMetaEvent);
        res.end();
      });
    } catch (error) {
      logger.error("SSE Connection Error:", error);
      res.status(500).end();
    }
  });

  app.use(async (req, res, next) => {
    if (req.path.startsWith("/api/notifications")) {
      try {
        const user = await sdk.authenticateRequest(req as any);
        (req as any).user = user;
      } catch (error) {
      }
    }
    next();
  });

  app.get("/api/notifications/stream", (req, res) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write("data: {\"type\":\"connected\"}\n\n");
    const unsubscribe = notificationManager.subscribe(userId, (notification) => {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    });
    req.on("close", () => {
      unsubscribe();
      res.end();
    });
  });

  app.post("/api/notifications/:id/read", (req, res) => {
    const userId = (req as any).user?.id;
    const notificationId = req.params.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const success = notificationManager.markAsRead(userId, notificationId);
    res.json({ success });
  });

  app.post("/api/notifications/clear", (req, res) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    notificationManager.clearNotifications(userId);
    res.json({ success: true });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Se for uma API pura, não precisamos servir arquivos estáticos ou setupVite
  // Mas mantemos por compatibilidade caso o usuário queira rodar o frontend original
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
      database: ENV.databaseUrl.replace(/:[^:@]+@/, ":****@"), // Ocultar senha
    });
  });
}

startServer().catch(console.error);
