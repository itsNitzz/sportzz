import { Router, type Request, type Response } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
  type Match,
} from "../validation/matches.js";
import { prisma } from "../config/prisma.js";
import { getMatchStatus } from "../utils/match-status.js";

const router = Router();

const MAX_LIMIT = 100;

router.get("/", async (req: Request, res: Response) => {
  const validation = listMatchesQuerySchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json({
      message: "Invalid query.",
      error: validation.error.issues,
    });
  }
  const limit = Math.min(validation.data.limit ?? 50, MAX_LIMIT);
  try {
    const dbResponse = await prisma.match.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ matches: dbResponse });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Failed to fetch matches.", error: JSON.stringify(e) });
  }
});

router.post("/", async (req, res) => {
  const validationResponse = createMatchSchema.safeParse(req.body);

  if (!validationResponse.success) {
    return res.status(400).json({
      message: "Invalid match data",
      error: validationResponse.error.issues,
    });
  }

  const {
    data: { startTime, endTime, homeScore, awayScore },
  } = validationResponse as { data: Match; error: any; success: boolean };

  try {
    const dbResonse = await prisma.match.create({
      data: {
        ...req.body,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      },
    });
    res.status(201).json({ data: dbResonse });
    try {
      res.app.locals.broadcastMatchCreated?.(dbResonse);
    } catch (broadcastError) {
      console.error("Failed to broadcast match_created", broadcastError);
    }
  } catch (e) {
    res.status(500).json({
      message: "Server error: Failed to create match",
      error: JSON.stringify(e),
    });
  }
});

export default router;
