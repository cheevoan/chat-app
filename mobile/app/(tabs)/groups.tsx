import React, { useEffect, useState, useCallback } from "react";
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
import { groupService } from "@/src/services/services";
import { Group } from "@/src/types";
import { useTheme } from "@/constants/theme";
import Avatar from "@/components/Avatar";

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, shadows } = useTheme();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await groupService.list();
      setGroups(res.data);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const timeLabel = (str?: string | null) => {
    if (!str) return "";
    const d = new Date(str);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[
        s.flex,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View
        style={[
          s.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[typography.h3, { color: colors.text }]}>Groups</Text>
      </View>

      {/* Search */}
      <View
        style={[
          s.searchWrap,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TextInput
          style={[
            s.searchInput,
            {
              backgroundColor: colors.surfaceSecond,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Search groups..."
          placeholderTextColor={colors.textPlaceholder}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(g) => String(g.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => load(true)}
          />
        }
        contentContainerStyle={{ paddingBottom: 90 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 48 }}>👥</Text>
            <Text
              style={[
                typography.body,
                { color: colors.textMuted, marginTop: 8 },
              ]}
            >
              {search ? "No results." : "No groups yet."}
            </Text>
            {!search && (
              <TouchableOpacity
                style={[s.createBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/group/create")}
              >
                <Text style={[typography.button, { color: "#fff" }]}>
                  Create a Group
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              s.row,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.divider,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: "/group/[id]",
                params: { id: item.id, name: item.name },
              })
            }
            activeOpacity={0.7}
          >
            {/* Group avatar (initials based) */}
            <Avatar name={item.name} size={50} />
            <View style={s.rowInfo}>
              <View style={s.rowTop}>
                <Text
                  style={[typography.bodyBold, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {item.last_message && (
                  <Text style={[typography.small, { color: colors.textMuted }]}>
                    {timeLabel(item.last_message.created_at)}
                  </Text>
                )}
              </View>
              <Text
                style={[typography.caption, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {item.last_message?.message ??
                  item.description ??
                  "No messages yet"}
              </Text>
            </View>
            {/* Member count badge */}
            <View style={[s.badge, { backgroundColor: colors.primaryLight }]}>
              <Text
                style={[
                  typography.small,
                  { color: colors.primary, fontWeight: "700" },
                ]}
              >
                {item.member_count ?? ""}👤
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: colors.primary }, shadows.md]}
        onPress={() => router.push("/group/create")}
        activeOpacity={0.85}
      >
        <Text style={s.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 8,
  },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  createBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: { color: "#fff", fontSize: 26, lineHeight: 30 },
});
