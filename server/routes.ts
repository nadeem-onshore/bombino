import type { Express, Request, Response } from "express";
import type { Server } from "http";
import fs from "fs";
import path from "path";
import { itdClient } from "./itd";
import type { CreateShipmentPayload, RateParams } from "./itd";
import { handleChat } from "./supportAgent";
import type { ChatMessage } from "./supportTypes";
import {
  SUPPORT_CHAT_MAX_MESSAGES,
  SUPPORT_CHAT_MAX_CONTENT_LENGTH,
} from "./supportTypes";

// ─── Route registration ───────────────────────────────────────────────────────

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ── Auth ──────────────────────────────────────────────────────────────────

  // POST /api/auth/login — authenticate via ITD; store token + user in session
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    try {
      const { token, user } = await itdClient.loginUser(email, password);
      req.session.itdToken = token;
      req.session.user = user;
      res.json(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      res.status(401).json({ message });
    }
  });

  // POST /api/auth/logout — destroy session
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Logout failed" });
        return;
      }
      res.json({ message: "Logged out" });
    });
  });

  // GET /api/auth/me — return session user
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.session.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    res.json(req.session.user);
  });

  // ── ITD: Tracking ────────────────────────────────────────────────────────

  // GET /api/track/:trackingNo — no login required; uses session token if available
  app.get("/api/track/:trackingNo", async (req: Request, res: Response) => {
    const { trackingNo } = req.params;

    try {
      const data = await itdClient.trackShipment(trackingNo, req.session.itdToken);
      res.json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tracking failed";
      res.status(502).json({ message });
    }
  });

  // ── ITD: Rate Calculation ─────────────────────────────────────────────────

  app.post("/api/rates", async (req: Request, res: Response) => {
    const { product_code, destination_code, booking_date, origin_code, pcs, actual_weight } =
      req.body as RateParams;

    if (!product_code || !destination_code || !actual_weight) {
      res.status(400).json({ message: "product_code, destination_code, and actual_weight are required" });
      return;
    }

    try {
      const data = await itdClient.getRates({
        product_code,
        destination_code,
        booking_date: booking_date ?? new Date().toISOString().split("T")[0],
        origin_code: origin_code ?? "IN",
        pcs: pcs ?? "1",
        actual_weight,
      }, req.session.user?.email);
      res.json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rate calculation failed";
      res.status(502).json({ message });
    }
  });

  // ── Support: AI chat ──────────────────────────────────────────────────────

  // POST /api/support/chat — guest and logged-in; validates body and returns { message }
  app.post("/api/support/chat", async (req: Request, res: Response) => {
    // #region agent log
    try {
      const debugLogPath = path.join(process.cwd(), ".cursor", "debug-643d35.log");
      fs.mkdirSync(path.dirname(debugLogPath), { recursive: true });
      fs.appendFileSync(
        debugLogPath,
        JSON.stringify({
          sessionId: "643d35",
          runId: "request",
          hypothesisId: "H0_route_hit",
          location: "routes.ts:POST /api/support/chat",
          message: "chat route hit",
          data: {},
          timestamp: Date.now(),
        }) + "\n"
      );
    } catch (_) {}
    // #endregion
    const body = req.body as { messages?: unknown };
    const messages = body?.messages;

    if (!Array.isArray(messages)) {
      res.status(400).json({ message: "messages must be an array" });
      return;
    }
    if (messages.length < 1 || messages.length > SUPPORT_CHAT_MAX_MESSAGES) {
      res.status(400).json({
        message: `messages must have 1–${SUPPORT_CHAT_MAX_MESSAGES} items`,
      });
      return;
    }

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i] as Record<string, unknown>;
      if (m?.role !== "user" && m?.role !== "assistant") {
        res.status(400).json({
          message: `messages[${i}]: role must be "user" or "assistant"`,
        });
        return;
      }
      if (typeof m?.content !== "string") {
        res.status(400).json({
          message: `messages[${i}]: content must be a string`,
        });
        return;
      }
      if (m.content.length > SUPPORT_CHAT_MAX_CONTENT_LENGTH) {
        res.status(400).json({
          message: `messages[${i}]: content must be at most ${SUPPORT_CHAT_MAX_CONTENT_LENGTH} characters`,
        });
        return;
      }
    }

    const chatMessages: ChatMessage[] = messages.map((m: Record<string, unknown>) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content),
    }));

    const context = {
      user: req.session.user ?? null,
      itdToken: req.session.itdToken ?? null,
    };

    try {
      const message = await handleChat(chatMessages, context);
      res.json({ message });
    } catch {
      res.status(500).json({
        message:
          "Something went wrong. Please try again or contact support from the app menu.",
      });
    }
  });

  // ── ITD: Create Shipment ──────────────────────────────────────────────────

  // POST /api/shipments — requires login (session token)
  app.post("/api/shipments", async (req: Request, res: Response) => {
    if (!req.session.itdToken) {
      res.status(401).json({ message: "Login required to create a shipment" });
      return;
    }

    const payload = req.body as CreateShipmentPayload;

    if (!payload.product_code || !payload.destination_code || !payload.actual_weight) {
      res.status(400).json({ message: "product_code, destination_code, and actual_weight are required" });
      return;
    }

    try {
      const data = await itdClient.createShipment(payload, req.session.itdToken);
      res.json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Shipment creation failed";
      res.status(502).json({ message });
    }
  });

  return httpServer;
}
