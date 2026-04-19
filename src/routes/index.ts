import { Router } from "express";

import matchRouter from "./match-routes.ts";
import commentaryRouter from "./commentary.ts";

const mainRouter = Router();

mainRouter.use("/matches", matchRouter);
mainRouter.use("/matches/:id/commentary", commentaryRouter);

export default mainRouter;
