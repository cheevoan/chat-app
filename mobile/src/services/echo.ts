import Echo from "laravel-echo";
import Pusher from "pusher-js/react-native";
import * as SecureStore from "expo-secure-store";

// ── Update these to match your setup ─────────────────────────
const REVERB_HOST = "192.168.1.176"; // ← your PC LAN IP
const REVERB_PORT = 8080;
const REVERB_APP_KEY = "qxfl2zvaxavxdxpwn3mj"; // ← must match REVERB_APP_KEY in .env

(global as any).Pusher = Pusher;

let echoInstance: Echo | null = null;

export async function getEcho(): Promise<Echo> {
  if (echoInstance) return echoInstance;

  const token = await SecureStore.getItemAsync("auth_token");
  if (!token) throw new Error("No auth token");

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
        Authorization: `Bearer ${token}`,
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

export async function listenConversation(
  conversationId: number,
  onMessage: (message: any) => void,
) {
  try {
    const echo = await getEcho();
    echo
      .private(`conversation.${conversationId}`)
      .listen(".MessageSent", (e: any) => {
        onMessage(e.message);
      });
  } catch (err) {
    console.log("listenConversation error:", err);
  }
}

export async function leaveConversation(conversationId: number) {
  try {
    const echo = await getEcho();
    echo.leave(`conversation.${conversationId}`);
  } catch {}
}

export async function listenGroup(
  groupId: number,
  onMessage: (message: any) => void,
) {
  try {
    const echo = await getEcho();
    echo.private(`group.${groupId}`).listen(".MessageSent", (e: any) => {
      onMessage(e.message);
    });
  } catch (err) {
    console.log("listenGroup error:", err);
  }
}

export async function leaveGroup(groupId: number) {
  try {
    const echo = await getEcho();
    echo.leave(`group.${groupId}`);
  } catch {}
}

export async function joinOnlineChannel(callbacks: {
  onJoin?: (members: any[]) => void;
  onJoining?: (member: any) => void;
  onLeaving?: (member: any) => void;
}) {
  const echo = await getEcho(); // throws if no token — caller handles it
  const ch = echo.join("online");
  if (callbacks.onJoin) ch.here(callbacks.onJoin);
  if (callbacks.onJoining) ch.joining(callbacks.onJoining);
  if (callbacks.onLeaving) ch.leaving(callbacks.onLeaving);
  return ch;
}

export async function leaveOnlineChannel() {
  try {
    const echo = await getEcho();
    echo.leave("online");
  } catch {}
}
