/**
 * Express-session type augmentation for Bombino auth.
 * Extends session so req.session.user and req.session.itdToken are typed.
 * No runtime behavior.
 */

import type s from "express-session";

declare global {
  namespace Express {
    interface Request {
      session: s.Session & Partial<s.SessionData> & {
        user?: { id: string; email: string; fullName: string };
        itdToken?: string;
      };
    }
  }
}

declare module "express-session" {
  interface SessionData {
    user?: { id: string; email: string; fullName: string };
    itdToken?: string;
  }
}
