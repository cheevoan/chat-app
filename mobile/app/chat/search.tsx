import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { userService, conversationService } from "@/src/services/services";
import { useAuth } from "@/src/context/AuthContext";
import { User } from "@/src/types";
import { useTheme } from "@/constants/theme";
import Avatar from "@/components/Avatar";

export default function UserSearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors, typography, spacing, radius } = useTheme();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }
      setLoading(true);
      try {
        const res = await userService.list(query.trim());
        setUsers(res.data.filter((u) => u.id !== user?.id));
      } finally {
        setLoading(false);
      }
    }, 380);
    return () => clearTimeout(t);
  }, [query]);

  const startChat = async (target: User) => {
    setStarting(target.id);
    try {
      const conv = await conversationService.findOrCreate(target.id);
      router.replace({
        pathname: "/chat/[id]",
        params: { id: conv.id, name: target.name },
      });
    } finally {
      setStarting(null);
    }
  };

  return (
    <View style={[s.flex, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View
        style={[
          s.bar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TextInput
          style={[
            s.input,
            {
              backgroundColor: colors.surfaceSecond,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Search by name or email..."
          placeholderTextColor={colors.textPlaceholder}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCapitalize="none"
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>

      <FlatList
        data={users}
        keyExtractor={(u) => String(u.id)}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {query.trim()
                ? "No users found."
                : "Start typing to search users."}
            </Text>
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
            onPress={() => startChat(item)}
            disabled={starting === item.id}
            activeOpacity={0.7}
          >
            <Avatar name={item.name} uri={item.avatar} size={46} />
            <View style={s.info}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {item.email}
              </Text>
            </View>
            {starting === item.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ color: colors.primary, fontSize: 20 }}>→</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  info: { flex: 1, marginLeft: 12 },
  empty: { paddingTop: 60, alignItems: "center" },
});
