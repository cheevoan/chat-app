import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { conversationService } from "@/src/services/services";
import { Conversation } from "@/src/types";
import { useAuth } from "@/src/context/AuthContext";
import { useOnline } from "@/src/context/RealtimeContext";
import Avatar from "@/components/Avatar";

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { isOnline } = useOnline();
  const navigating = useRef(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const res = await conversationService.list();
      setConversations(res.data ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  const openChat = (item: Conversation) => {
    if (navigating.current) return;
    navigating.current = true;
    router.push({
      pathname: "/chat/[id]",
      params: { id: String(item.id), name: item.other_user.name },
    });
    setTimeout(() => {
      navigating.current = false;
    }, 800);
  };

  const filtered = conversations.filter((c) =>
    c.other_user?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const timeLabel = (str: string) => {
    const d = new Date(str);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (!isAuthenticated || loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 40 }}>⚠️</Text>
        <Text style={s.errorTitle}>Could not load chats</Text>
        <Text style={s.errorMsg}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.flex, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={s.newBtn}
          onPress={() => router.push("/chat/search")}
        >
          <Text style={s.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          placeholder="Search..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor="#0a7ea4"
            onRefresh={() => load(true)}
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 48 }}>💬</Text>
            <Text style={s.emptyText}>
              {search ? "No results." : "No conversations yet."}
            </Text>
            {!search && (
              <TouchableOpacity
                style={s.startBtn}
                onPress={() => router.push("/chat/search")}
              >
                <Text style={s.startBtnText}>Start a Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const online = isOnline(item.other_user.id);
          return (
            <TouchableOpacity
              style={s.row}
              onPress={() => openChat(item)}
              activeOpacity={0.6}
            >
              <View>
                <Avatar
                  name={item.other_user.name}
                  uri={item.other_user.avatar}
                  size={50}
                />
                {/* Online dot */}
                {online && <View style={s.onlineDot} />}
              </View>
              <View style={s.rowInfo}>
                <View style={s.rowTop}>
                  <View style={s.rowNameWrap}>
                    <Text style={s.rowName} numberOfLines={1}>
                      {item.other_user.name}
                    </Text>
                    {online && (
                      <View style={s.onlineBadge}>
                        <Text style={s.onlineBadgeText}>Online</Text>
                      </View>
                    )}
                  </View>
                  {item.last_message?.created_at && (
                    <Text style={s.rowTime}>
                      {timeLabel(item.last_message.created_at)}
                    </Text>
                  )}
                </View>
                <Text style={s.rowMsg} numberOfLines={1}>
                  {item.last_message?.message ?? "No messages yet"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111" },
  newBtn: {
    backgroundColor: "#e6f4f8",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  newBtnText: { color: "#0a7ea4", fontWeight: "700", fontSize: 14 },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: "#000",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  // Online dot on avatar
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#52c41a",
    borderWidth: 2,
    borderColor: "#fff",
  },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    alignItems: "center",
  },
  rowNameWrap: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  rowName: { fontSize: 15, fontWeight: "600", color: "#111" },
  onlineBadge: {
    backgroundColor: "#52c41a",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  onlineBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  rowTime: { fontSize: 12, color: "#999", marginLeft: 8 },
  rowMsg: { fontSize: 13, color: "#888" },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyText: { color: "#888", fontSize: 14 },
  startBtn: {
    marginTop: 12,
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  startBtnText: { color: "#fff", fontWeight: "700" },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginTop: 12 },
  errorMsg: {
    fontSize: 13,
    color: "#e53935",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: "#fff", fontWeight: "700" },
});
