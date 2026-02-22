import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { itdClient } from "./itd";
import type { CreateShipmentPayload, RateParams } from "./itd";

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
        origin_code: origin_code ?? "US",
        pcs: pcs ?? "1",
        actual_weight,
      });
      res.json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rate calculation failed";
      res.status(502).json({ message });
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
