import type { IncomingMessage, Server, ServerResponse } from "http";
import {
  WebSocketServer,
  WebSocket,
  type Server as WSServer,
  type RawData,
} from "ws";

import type { Match } from "../validation/matches.js";
import { wsArcjet } from "../config/arcject-security.js";
import { match } from "assert";

interface CustomWebSocket extends WebSocket {
  subscriptions: Set<string>;
}

const matchSubscribers = new Map<string, Set<WebSocket>>();

export function attachWebsocketServer(
  server: Server<typeof IncomingMessage, typeof ServerResponse>,
) {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 1024 * 1024,
  });

  server.on("upgrade", async (req, socket, head) => {
    if (req.url !== "/ws") {
      socket.destroy();
      return;
    }

    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);
        if (decision.isDenied()) {
          if (decision.reason.isRateLimit()) {
            socket.write("HTTP/1.1 429 Too Many Requests\r\n\r\n");
          } else {
            socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
          }

          socket.destroy();
          return;
        }
      } catch (e) {
        console.error("Arcjet protection error:", e);
        socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        socket.destroy();
        return;
      }
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", async (socket: CustomWebSocket) => {
    sendJSON(socket, { type: "welcome" });

    socket.subscriptions = new Set();

    socket.on("message", (data: RawData) => {
      handleMessage(socket, data);
    });

    socket.on("error", () => {
      socket.terminate();
    });

    socket.on("close", () => {
      cleanupSubscriptions(socket);
    });
  });

  function broadcastMatchCreation(match: Match & { id: string }) {
    broadcast(wss, { type: "match_created", data: match });
  }

  function broadcastCommentary(matchId: string, comment: any) {
    broadcastCommentaryToSubscribers(matchId, {
      type: "commentary",
      data: comment,
    });
  }

  return { broadcastMatchCreation, broadcastCommentary };
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

function broadcastCommentaryToSubscribers(matchId: string, payload: any) {
  const subscribers = matchSubscribers.get(matchId);

  if (!subscribers || !subscribers.size) return;

  for (const socket of subscribers) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }
}

export function sendJSON(socket: WebSocket, payload: Record<string, string>) {
  if (socket.readyState !== WebSocket.OPEN) return null;
  socket.send(JSON.stringify(payload));
}

function subscribe(matchId: string, socket: CustomWebSocket) {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }

  matchSubscribers.get(matchId)?.add(socket);
}

function unsubscribe(matchId: string, socket: WebSocket) {
  const subscribers = matchSubscribers.get(matchId);

  if (!subscribers) return;

  subscribers.delete(socket);

  if (!subscribers.size) {
    matchSubscribers.delete(matchId);
  }
}

function cleanupSubscriptions(socket: CustomWebSocket) {
  for (const matchId of socket.subscriptions) {
    unsubscribe(matchId, socket);
  }
}

function handleMessage(socket: CustomWebSocket, data: any) {
  let message;
  try {
    message = JSON.parse(data.toString());
  } catch {
    sendJSON(socket, { type: "error", message: "Invalid data" });
    return;
  }

  if (message.type === "subscribe" && typeof message.matchId === "string") {
    subscribe(message.matchId, socket);
    socket.subscriptions.add(message.matchId);
    sendJSON(socket, { type: "subscribed", matchId: message.matchId });
    return;
  }
  if (message.type === "unsubscribe" && typeof message.matchId === "string") {
    unsubscribe(message.matchId, socket);
    socket.subscriptions.delete(message.matchId);
    sendJSON(socket, { type: "unsubscribed", matchId: message.matchId });
    return;
  }
}
