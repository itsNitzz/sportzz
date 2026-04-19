import { Router } from "express";
import {
  listMatchesQuerySchema,
  matchIdParamSchema,
  type MatchParam,
} from "../validation/matches.ts";
import { createCommentarySchema } from "../validation/commentary.ts";
import { prisma } from "../config/prisma.ts";

const MAX_LIMIT = 500;

const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get("/", async (req, res) => {
  const idValidation = matchIdParamSchema.safeParse(req.params) as {
    data: MatchParam;
    error: any;
    success: boolean;
  };
  const queryValidation = listMatchesQuerySchema.safeParse(req.query);

  if (!idValidation.success || !queryValidation.success) {
    return res.status(422).json({ message: "Invalid params." });
  }

  const {
    data: { id: matchId },
  } = idValidation;
  try {
    const limit = queryValidation.data.limit ?? 100;

    const commentaries = await prisma.commentary.findMany({
      where: {
        matchId,
      },
      take: limit > MAX_LIMIT ? MAX_LIMIT : limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ data: commentaries });
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error." });
  }
});

commentaryRouter.post("/", async (req, res) => {
  try {
    const {
      success: idValidation,
      data: { id: matchId },
    } = matchIdParamSchema.safeParse(req.params) as {
      data: MatchParam;
      error: any;
      success: boolean;
    };
    const { success: dataValidation, data } = createCommentarySchema.safeParse(
      req.body,
    );

    if (!idValidation || !dataValidation) {
      return res.status(422).json({ message: "Invalid data." });
    }

    const commentary = await prisma.commentary.create({
      data: {
        ...data,
        matchId,
        metadata: data.metadata ?? {},
      },
    });

    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(matchId, commentary);
    }

    res.status(201).json({ data: commentary });
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error." });
  }
});

export default commentaryRouter;
