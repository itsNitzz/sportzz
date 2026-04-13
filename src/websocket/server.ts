import type { IncomingMessage, Server, ServerResponse } from "http";
import { WebSocketServer, WebSocket, type Server as WSServer } from "ws";

import type { Match } from "../validation/matches.js";

export function attachWebsocketServer(
  server: Server<typeof IncomingMessage, typeof ServerResponse>,
) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket) => {
    sendJSON(socket, { type: "welcome" });

    socket.on("error", console.error);
  });

  function broadcastMatch(match: Match & { id: string }) {
    broadcast(wss, { type: "match_created", data: match });
  }

  return { broadcastMatch };
}

export function sendJSON(socket: WebSocket, payload: Record<string, string>) {
  if (socket.readyState !== WebSocket.OPEN) return null;
  socket.send(JSON.stringify(payload));
}

export function broadcast(
  wss: WSServer<typeof WebSocket, typeof IncomingMessage>,
  payload: any,
) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
  }
}
