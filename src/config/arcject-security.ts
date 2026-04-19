import type { NextFunction, Response, Request } from "express";
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

import CONFIG from "./env-variables.js";

const arcjetMode = CONFIG.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

const httpArcjet = CONFIG.ARCJET_KEY
  ? arcjet({
      key: CONFIG.ARCJET_KEY,
      rules: [
        shield({
          mode: arcjetMode,
        }),
        detectBot({
          mode: arcjetMode,
          allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        slidingWindow({
          mode: arcjetMode,
          interval: 10,
          max: 50,
        }),
      ],
    })
  : null;

export const wsArcjet = CONFIG.ARCJET_KEY
  ? arcjet({
      key: CONFIG.ARCJET_KEY,
      rules: [
        shield({
          mode: arcjetMode,
        }),
        // detectBot({
        //   mode: arcjetMode,
        //   allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        // }),
        slidingWindow({
          mode: arcjetMode,
          interval: 2,
          max: 5,
        }),
      ],
    })
  : null;

export const securityMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!httpArcjet) return next();

    try {
      const decision = await httpArcjet.protect(req);

      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({ message: "Too many requests." });
        } else {
          return res.status(403).json({ message: "Forbidden." });
        }
      }
    } catch (e) {
      console.error("Arcjet error", e);
      return res.status(503).json({ message: "Service unavailable." });
    }
    next();
  };
};
