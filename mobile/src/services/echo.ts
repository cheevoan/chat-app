import Echo from "laravel-echo";
import Pusher from "pusher-js/react-native";
import * as SecureStore from "expo-secure-store";

// ── Update these to match your setup ─────────────────────────
const REVERB_HOST = "192.168.18.38"; // ← your PC LAN IP
const REVERB_PORT = 8080;
const REVERB_APP_KEY = "qxfl2zvaxavxdxpwn3mj"; // ← must match REVERB_APP_KEY in .env

(global as any).Pusher = Pusher;

let echoInstance: Echo | null = null;
let _authToken: string | null = null;

// ── Set token from AuthContext after login ────────────────────
export function setEchoToken(token: string | null) {
  _authToken = token;
  if (!token) disconnectEcho();
}

// ── Create Echo instance ──────────────────────────────────────
export function getEcho(): Echo {
  if (echoInstance) return echoInstance;
  if (!_authToken) throw new Error("No auth token for Echo");

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: REVERB_APP_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: false,
    enabledTransports: ["ws"],
    authEndpoint: `http://${REVERB_HOST}:8000/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${_authToken}`,
        Accept: "application/json",
      },
    },
  });

  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch {}
    echoInstance = null;
  }
}

// ── DM conversation channel ───────────────────────────────────
export function listenConversation(
  conversationId: number,
  onMessage: (msg: any) => void,
) {
  try {
    getEcho()
      .private(`conversation.${conversationId}`)
      .listen(".MessageSent", (e: any) => {
        console.log("WS DM:", conversationId, e?.message?.id);
        onMessage(e.message);
      });
  } catch (err) {
    console.log("listenConversation error:", err);
  }
}

export function leaveConversation(conversationId: number) {
  try {
    getEcho().leave(`conversation.${conversationId}`);
  } catch {}
}

// ── Group channel ─────────────────────────────────────────────
export function listenGroup(groupId: number, onMessage: (msg: any) => void) {
  try {
    getEcho()
      .private(`group.${groupId}`)
      .listen(".MessageSent", (e: any) => {
        console.log("WS group:", groupId, e?.message?.id);
        onMessage(e.message);
      });
  } catch (err) {
    console.log("listenGroup error:", err);
  }
}

export function leaveGroup(groupId: number) {
  try {
    getEcho().leave(`group.${groupId}`);
  } catch {}
}

// ── Presence channel ──────────────────────────────────────────
export function joinOnlineChannel(callbacks: {
  onJoin?: (members: any[]) => void;
  onJoining?: (member: any) => void;
  onLeaving?: (member: any) => void;
}) {
  try {
    const ch = getEcho().join("online");
    if (callbacks.onJoin) ch.here(callbacks.onJoin);
    if (callbacks.onJoining) ch.joining(callbacks.onJoining);
    if (callbacks.onLeaving) ch.leaving(callbacks.onLeaving);
    return ch;
  } catch (err) {
    console.log("online channel error:", err);
  }
}

export function leaveOnlineChannel() {
  try {
    getEcho().leave("online");
  } catch {}
}

// ── Personal user channel ─────────────────────────────────────
export function listenUserChannel(
  userId: number,
  onMessage: (msg: any) => void,
) {
  try {
    getEcho()
      .private(`user.${userId}`)
      .listen(".MessageSent", (e: any) => {
        console.log("WS user channel:", e?.message?.id);
        onMessage(e.message);
      });
  } catch (err) {
    console.log("listenUserChannel error:", err);
  }
}

export function leaveUserChannel(userId: number) {
  try {
    getEcho().leave(`user.${userId}`);
  } catch {}
}
