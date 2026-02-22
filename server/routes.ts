import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { itdClient } from "./itd";
import type { CreateShipmentPayload, RateParams } from "./itd";
import { type User, insertUserSchema } from "@shared/schema";

// ─── Passport setup ───────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends Omit<import("@shared/schema").User, "password"> {}
  }
}

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) return done(null, false, { message: "Invalid credentials" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: "Invalid credentials" });

      const { password: _pw, ...safeUser } = user;
      return done(null, safeUser as Express.User);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => done(null, (user as User).id));

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) return done(null, false);
    const { password: _pw, ...safeUser } = user;
    done(null, safeUser as Express.User);
  } catch (err) {
    done(err);
  }
});

// ─── Route registration ───────────────────────────────────────────────────────

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ── Auth ──────────────────────────────────────────────────────────────────

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      return;
    }

    const existing = await storage.getUserByUsername(parsed.data.username);
    if (existing) {
      res.status(409).json({ message: "Username already taken" });
      return;
    }

    const hashed = await bcrypt.hash(parsed.data.password, 10);
    const user = await storage.createUser({
      username: parsed.data.username,
      password: hashed,
    });

    const { password: _pw, ...safeUser } = user;
    req.login(safeUser as Express.User, (err) => {
      if (err) {
        res.status(500).json({ message: "Login after register failed" });
        return;
      }
      res.status(201).json(safeUser);
    });
  });

  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    passport.authenticate(
      "local",
      (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
        if (err) return next(err);
        if (!user) {
          res.status(401).json({ message: info?.message ?? "Invalid credentials" });
          return;
        }
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          res.json(user);
        });
      }
    )(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    res.json(req.user);
  });

  // ── ITD: Tracking ────────────────────────────────────────────────────────

  app.get("/api/track/:trackingNo", async (req: Request, res: Response) => {
    const { trackingNo } = req.params;
    if (!trackingNo) {
      res.status(400).json({ message: "trackingNo is required" });
      return;
    }

    try {
      const data = await itdClient.trackShipment(trackingNo);
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
      });
      res.json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rate calculation failed";
      res.status(502).json({ message });
    }
  });

  // ── ITD: Create Shipment ──────────────────────────────────────────────────

  app.post("/api/shipments", async (req: Request, res: Response) => {
    const payload = req.body as CreateShipmentPayload;

    if (!payload.product_code || !payload.destination_code || !payload.actual_weight) {
      res.status(400).json({ message: "product_code, destination_code, and actual_weight are required" });
      return;
    }

    try {
      const data = await itdClient.createShipment(payload);
      res.json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Shipment creation failed";
      res.status(502).json({ message });
    }
  });

  return httpServer;
}

export { passport };
