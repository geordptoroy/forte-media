import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { notificationManager } from "../notifications";
import { sdk } from "./sdk";

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
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Health check endpoint (used by Docker HEALTHCHECK and Nginx)
  app.get("/health", (_req, res) => {
    res.status(200).send("ok");
  });

  // Middleware to inject user for non-tRPC routes (like SSE)
  app.use(async (req, res, next) => {
    if (req.path.startsWith("/api/notifications")) {
      try {
        const user = await sdk.authenticateRequest(req as any);
        (req as any).user = user;
      } catch (error) {
        // Continue without user, individual routes will handle 401
      }
    }
    next();
  });

  // SSE endpoint for real-time notifications
  app.get("/api/notifications/stream", (req, res) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send initial connection message
    res.write("data: {\"type\":\"connected\"}\n\n");

    // Subscribe to notifications
    const unsubscribe = notificationManager.subscribe(userId, (notification) => {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    });

    // Handle client disconnect
    req.on("close", () => {
      unsubscribe();
      res.end();
    });
  });

  // Mark notification as read
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

  // Clear all notifications
  app.post("/api/notifications/clear", (req, res) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    notificationManager.clearNotifications(userId);
    res.json({ success: true });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
