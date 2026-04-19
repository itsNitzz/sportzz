import express from "express";
import { createServer } from "node:http";

import { attachWebsocketServer } from "./websocket/server.js";
import CONFIG from "./config/env-variables.js";
import { securityMiddleware } from "./config/arcject-security.js";
import mainRouter from "./routes/index.js";

const app = express();
const server = createServer(app);

app.use(express.json());

app.use(securityMiddleware());
app.use("/", mainRouter);

const { broadcastMatchCreation, broadcastCommentary } =
  attachWebsocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreation;
app.locals.broadcastCommentary = broadcastCommentary;

server.listen(CONFIG.PORT, CONFIG.HOST, () => {
  const baseURL = `http://${CONFIG.HOST === "0.0.0.0" ? "localhost" : CONFIG.HOST}:${CONFIG.PORT}`;
  console.log("Listening to server ", baseURL);
  console.log(
    "websocket server is running on ",
    `${baseURL.replace("http", "ws")}/ws`,
  );
});
