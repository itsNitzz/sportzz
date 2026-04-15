import type { IncomingMessage, Server, ServerResponse } from "http";
import { WebSocketServer, WebSocket, type Server as WSServer } from "ws";

import type { Match } from "../validation/matches.js";
import { wsArcjet } from "../config/arcject-security.js";

export function attachWebsocketServer(
  server: Server<typeof IncomingMessage, typeof ServerResponse>,
) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", async (socket, req) => {
    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);
        if (decision.isDenied()) {
          let code = 0;
          let reason = "";

          if (decision.reason.isRateLimit()) {
            code = 1013;
            reason = "Rate limit exceeded";
          } else {
            code = 1008;
            reason = "Access denied";
          }

          socket.close(code, reason);
          return;
        }
      } catch (e) {
        console.error(e);
        socket.close(1011, "Server security error.");
        return;
      }
    }
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
