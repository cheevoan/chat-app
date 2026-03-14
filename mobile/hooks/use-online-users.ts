import { useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { joinOnlineChannel, leaveOnlineChannel } from "@/src/services/echo";

export function useOnlineUsers() {
  const { token, isAuthenticated } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Only connect when user is actually authenticated
    if (!isAuthenticated || !token) return;

    let mounted = true;

    const connect = async () => {
      try {
        await joinOnlineChannel({
          onJoin: (members: any[]) => {
            if (!mounted) return;
            setOnlineUserIds(new Set(members.map((m: any) => m.id)));
          },
          onJoining: (member: any) => {
            if (!mounted) return;
            setOnlineUserIds((prev) => new Set([...prev, member.id]));
          },
          onLeaving: (member: any) => {
            if (!mounted) return;
            setOnlineUserIds((prev) => {
              const next = new Set(prev);
              next.delete(member.id);
              return next;
            });
          },
        });
      } catch (err) {
        console.log("useOnlineUsers: could not connect", err);
      }
    };

    connect();

    return () => {
      mounted = false;
      leaveOnlineChannel().catch(() => {});
    };
  }, [isAuthenticated, token]); // re-run when auth state changes

  const isOnline = (userId: number) => onlineUserIds.has(userId);
  return { onlineUserIds, isOnline };
}
