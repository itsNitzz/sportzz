import express from "express";
import { createServer } from "node:http";

import matchRouter from "./routes/match-routes.js";
import { attachWebsocketServer } from "./websocket/server.js";
import CONFIG from "./config/env-variables.js";

const app = express();
const server = createServer(app);

app.use(express.json());

app.use("/match", matchRouter);

const { broadcastMatch } = attachWebsocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatch;

server.listen(CONFIG.PORT, CONFIG.HOST, () => {
  const baseURL = `http://${CONFIG.HOST === "0.0.0.0" ? "localhost" : CONFIG.HOST}:${CONFIG.PORT}`;
  console.log("Listening to server ", baseURL);
  console.log(
    "websocket server is running on ",
    `${baseURL.replace("http", "ws")}/ws`,
  );
});
