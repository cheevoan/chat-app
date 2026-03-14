import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "./AuthContext";
import {
  setEchoToken,
  disconnectEcho,
  listenUserChannel,
  leaveUserChannel,
  joinOnlineChannel,
  leaveOnlineChannel,
} from "@/src/services/echo";
import { showMessageNotification } from "@/src/services/notifications";

interface OnlineContextType {
  onlineIds: Set<number>;
  isOnline: (id: number) => boolean;
}

const RealtimeContext = createContext<OnlineContextType>({
  onlineIds: new Set(),
  isOnline: () => false,
});

export function useOnline() {
  return useContext(RealtimeContext);
}

export const activeScreen = { conversationId: 0, groupId: 0 };

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, token, isAuthenticated } = useAuth();
  const [onlineIds, setOnlineIds] = useState<Set<number>>(new Set());
  const appState = useRef(AppState.currentState);

  const connect = () => {
    if (!isAuthenticated || !token || !user) return;

    // Give Echo the current token
    setEchoToken(token);

    // Online presence channel
    joinOnlineChannel({
      onJoin: (members: any[]) =>
        setOnlineIds(new Set(members.map((m: any) => m.id))),
      onJoining: (member: any) =>
        setOnlineIds((prev) => new Set([...prev, member.id])),
      onLeaving: (member: any) =>
        setOnlineIds((prev) => {
          const next = new Set(prev);
          next.delete(member.id);
          return next;
        }),
    });

    // Personal channel for incoming message notifications
    listenUserChannel(user.id, (message: any) => {
      if (!message) return;
      const senderId = message.sender?.id ?? message.sender_id;
      if (senderId === user.id) return;
      if (
        message.conversation_id &&
        activeScreen.conversationId === message.conversation_id
      )
        return;
      if (message.group_id && activeScreen.groupId === message.group_id) return;

      showMessageNotification({
        title: message.sender?.name ?? "New message",
        body: message.message ?? "📎 Attachment",
        conversationId: message.conversation_id ?? undefined,
        groupId: message.group_id ?? undefined,
        senderName: message.sender?.name,
      });
    });
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setEchoToken(null);
      return;
    }

    connect();

    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        console.log("App foregrounded — reconnecting Echo");
        disconnectEcho();
        connect();
      }
      appState.current = next;
    });

    return () => {
      sub.remove();
      leaveOnlineChannel();
      if (user) leaveUserChannel(user.id);
      disconnectEcho();
    };
  }, [isAuthenticated, token, user?.id]);

  return (
    <RealtimeContext.Provider
      value={{ onlineIds, isOnline: (id) => onlineIds.has(id) }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}
