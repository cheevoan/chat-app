import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { groupService, userService } from "@/src/services/services";
import { User } from "@/src/types";
import { useTheme } from "@/constants/theme";
import Avatar from "@/components/Avatar";

export default function CreateGroupScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius, shadows } = useTheme();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    userService
      .list()
      .then((res) => setUsers(res.data))
      .finally(() => setLoadingUsers(false));
  }, []);

  const toggle = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const create = async () => {
    if (!name.trim()) {
      setNameErr("Group name is required.");
      return;
    }
    setCreating(true);
    try {
      const group = await groupService.create(
        name.trim(),
        desc.trim() || undefined,
        selected,
      );
      router.replace({
        pathname: "/group/[id]",
        params: { id: group.id, name: group.name },
      });
    } catch {
      Alert.alert("Error", "Could not create group. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Group details card */}
        <View style={[s.card, { backgroundColor: colors.surface }, shadows.sm]}>
          <Text
            style={[typography.h4, { color: colors.text, marginBottom: 14 }]}
          >
            Group Details
          </Text>

          <Text style={[s.label, { color: colors.textSecondary }]}>
            Group Name *
          </Text>
          <TextInput
            style={[
              s.input,
              {
                borderColor: nameErr ? colors.danger : colors.inputBorder,
                backgroundColor: colors.inputBg,
                color: colors.text,
              },
            ]}
            placeholder="Enter group name"
            placeholderTextColor={colors.textPlaceholder}
            value={name}
            onChangeText={(v) => {
              setName(v);
              setNameErr("");
            }}
          />
          {nameErr ? (
            <Text style={[s.err, { color: colors.danger }]}>{nameErr}</Text>
          ) : null}

          <Text style={[s.label, { color: colors.textSecondary }]}>
            Description (optional)
          </Text>
          <TextInput
            style={[
              s.input,
              s.multiline,
              {
                borderColor: colors.inputBorder,
                backgroundColor: colors.inputBg,
                color: colors.text,
              },
            ]}
            placeholder="What's this group about?"
            placeholderTextColor={colors.textPlaceholder}
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Members card */}
        <View style={[s.card, { backgroundColor: colors.surface }, shadows.sm]}>
          <View style={s.memberHeader}>
            <Text style={[typography.h4, { color: colors.text }]}>
              Add Members
            </Text>
            {selected.length > 0 && (
              <View
                style={[s.countBadge, { backgroundColor: colors.primaryLight }]}
              >
                <Text
                  style={[
                    typography.small,
                    { color: colors.primary, fontWeight: "700" },
                  ]}
                >
                  {selected.length} selected
                </Text>
              </View>
            )}
          </View>

          {/* Member search */}
          <TextInput
            style={[
              s.searchInput,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceSecond,
                color: colors.text,
              },
            ]}
            placeholder="Search members..."
            placeholderTextColor={colors.textPlaceholder}
            value={search}
            onChangeText={setSearch}
          />

          {/* Selected chips */}
          {selected.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.chips}
            >
              {users
                .filter((u) => selected.includes(u.id))
                .map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={[s.chip, { backgroundColor: colors.primaryLight }]}
                    onPress={() => toggle(u.id)}
                  >
                    <Text style={[typography.small, { color: colors.primary }]}>
                      {u.name} ✕
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          )}

          {loadingUsers ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginVertical: 20 }}
            />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(u) => String(u.id)}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.textMuted,
                      textAlign: "center",
                      marginVertical: 20,
                    },
                  ]}
                >
                  No users found.
                </Text>
              }
              renderItem={({ item }) => {
                const checked = selected.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[
                      s.userRow,
                      {
                        borderBottomColor: colors.divider,
                        backgroundColor: checked
                          ? colors.primaryLight
                          : "transparent",
                      },
                    ]}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.7}
                  >
                    <Avatar name={item.name} uri={item.avatar} size={40} />
                    <View style={s.userInfo}>
                      <Text
                        style={[typography.bodyBold, { color: colors.text }]}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[typography.small, { color: colors.textMuted }]}
                      >
                        {item.email}
                      </Text>
                    </View>
                    <View
                      style={[
                        s.checkbox,
                        {
                          backgroundColor: checked
                            ? colors.primary
                            : "transparent",
                          borderColor: checked ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {checked && (
                        <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        {/* Create button */}
        <TouchableOpacity
          style={[
            s.createBtn,
            { backgroundColor: colors.primary, opacity: creating ? 0.65 : 1 },
          ]}
          onPress={create}
          disabled={creating}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[typography.button, { color: "#fff" }]}>
              Create Group
              {selected.length > 0 ? ` (${selected.length + 1} members)` : ""}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: { height: 80, textAlignVertical: "top", paddingTop: 12 },
  err: { fontSize: 12, marginTop: 4 },
  searchInput: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    marginBottom: 8,
  },
  chips: { flexDirection: "row", marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginRight: 6,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 2,
  },
  userInfo: { flex: 1, marginLeft: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  createBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
});
