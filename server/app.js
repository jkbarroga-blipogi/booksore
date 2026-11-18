import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import helmet from "helmet";
import { AppError } from "./errors/domain-errors.js";
import { BookRepository } from "./repositories/book-repository.js";
import { UserRepository } from "./repositories/user-repository.js";
import { BookService } from "./services/book-service.js";
import { AuthService } from "./services/auth-service.js";
import { UserService } from "./services/user-service.js";
import { createAuthMiddleware } from "./middleware/auth-middleware.js";
import { createBookController } from "./controllers/book-controller.js";
import { createAuthController } from "./controllers/auth-controller.js";
import { createUserController } from "./controllers/user-controller.js";
import { createApiRouter } from "./routes/api-routes.js";

export function createApp({ db, sessionSecret, silentLogs = false, staticDir } = {}) {
  const secret =
    sessionSecret || process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
  const resolvedStaticDir = staticDir || path.resolve(process.cwd(), "dist");

  const app = express();
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "http:"],
          connectSrc: ["'self'"],
        },
      },
    }),
  );

  app.use(express.json({ limit: "100kb" }));

  if (!silentLogs) {
    app.use((req, res, next) => {
      const start = Date.now();
      const requestId = crypto.randomUUID();
      res.setHeader("X-Request-Id", requestId);
      res.on("finish", () => {
        console.info(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "info",
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
          }),
        );
      });
      next();
    });
  }

  const bookRepo = new BookRepository(db);
  const userRepo = new UserRepository(db);
  const bookService = new BookService(bookRepo);
  const authService = new AuthService(userRepo, secret);
  const userService = new UserService(userRepo);

  const { attachSession, requireAuth, requireAdmin } = createAuthMiddleware(secret, userRepo);
  const bookController = createBookController(bookService);
  const authController = createAuthController(authService);
  const userController = createUserController(userService);

  app.use(attachSession);
  app.use(
    "/api/v1",
    createApiRouter({
      bookController,
      authController,
      userController,
      requireAuth,
      requireAdmin,
    }),
  );

  app.use("/api", (_req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "API endpoint not found",
      },
    });
  });

  if (fs.existsSync(path.join(resolvedStaticDir, "index.html"))) {
    app.use(express.static(resolvedStaticDir));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(resolvedStaticDir, "index.html"));
    });
  }

  app.use((err, _req, res, _next) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      });
    }

    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({
        error: {
          code: "INVALID_JSON",
          message: "Malformed JSON request body",
        },
      });
    }

    if (!silentLogs) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          message: err?.message || "Unhandled server error",
        }),
      );
    }

    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected system error occurred",
      },
    });
  });

  return app;
}
