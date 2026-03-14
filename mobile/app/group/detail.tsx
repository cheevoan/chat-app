import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  TextInput,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { groupService, userService } from "@/src/services/services";
import { useAuth } from "@/src/context/AuthContext";
import { Group, User } from "@/src/types";
import Avatar from "@/components/Avatar";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingAv, setUploadingAv] = useState(false);

  // Add member
  const [showAdd, setShowAdd] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [addingMems, setAddingMems] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      setGroup(await groupService.get(Number(id)));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const isOwner = group?.owner?.id === user?.id;

  // ── Avatar ─────────────────────────────────────────────
  const pickAvatar = async () => {
    if (!isOwner) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Allow photo access.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled) return;
    setUploadingAv(true);
    try {
      const updated = await groupService.uploadAvatar(
        Number(id),
        res.assets[0].uri,
      );
      setGroup(updated);
      Alert.alert("✅ Done", "Group photo updated!");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Upload failed.");
    } finally {
      setUploadingAv(false);
    }
  };

  // ── Add members modal ──────────────────────────────────
  const openAddModal = async () => {
    setShowAdd(true);
    setSelected([]);
    setUserSearch("");
    setLoadingUsers(true);
    try {
      const res = await userService.list();
      const memberIds = new Set((group?.members ?? []).map((m) => m.id));
      setAllUsers((res.data ?? []).filter((u: User) => !memberIds.has(u.id)));
    } catch {
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUser = (uid: number) =>
    setSelected((p) =>
      p.includes(uid) ? p.filter((x) => x !== uid) : [...p, uid],
    );

  const addMembers = async () => {
    if (!selected.length) return;
    setAddingMems(true);
    try {
      await groupService.addMembers(Number(id), selected);
      setShowAdd(false);
      await load();
      Alert.alert("✅ Done", `${selected.length} member(s) added.`);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? "Could not add members.",
      );
    } finally {
      setAddingMems(false);
    }
  };

  // ── Remove member ──────────────────────────────────────
  const removeMember = (uid: number, mname: string) => {
    Alert.alert("Remove Member", `Remove ${mname} from group?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await groupService.removeMember(Number(id), uid);
            setGroup((g) =>
              g ? { ...g, members: g.members?.filter((m) => m.id !== uid) } : g,
            );
          } catch {
            Alert.alert("Error", "Could not remove member.");
          }
        },
      },
    ]);
  };

  // ── Leave / Delete ─────────────────────────────────────
  const leaveGroup = () =>
    Alert.alert("Leave Group", `Leave "${group?.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          setLeaving(true);
          try {
            await groupService.leave(Number(id));
            router.replace("/(tabs)/groups");
          } catch {
            Alert.alert("Error", "Could not leave.");
          } finally {
            setLeaving(false);
          }
        },
      },
    ]);

  const deleteGroup = () =>
    Alert.alert("Delete Group", `Permanently delete "${group?.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await groupService.delete(Number(id));
            router.replace("/(tabs)/groups");
          } catch {
            Alert.alert("Error", "Could not delete.");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  if (!group)
    return (
      <View style={s.center}>
        <Text style={s.muted}>Group not found.</Text>
      </View>
    );

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        {/* ── Group avatar + info ───────────────────────── */}
        <View style={s.card}>
          <View style={s.groupHeader}>
            <TouchableOpacity
              onPress={pickAvatar}
              disabled={!isOwner || uploadingAv}
              style={s.avatarWrap}
            >
              {group.avatar ? (
                <Image source={{ uri: group.avatar }} style={s.avatarImg} />
              ) : (
                <Avatar name={group.name} size={80} />
              )}
              {isOwner && (
                <View style={s.cameraBadge}>
                  {uploadingAv ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ fontSize: 12 }}>📷</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.groupName}>{group.name}</Text>
              {!!group.description && (
                <Text style={s.groupDesc}>{group.description}</Text>
              )}
              <Text style={s.groupMeta}>
                {group.members?.length ?? group.member_count ?? 0} members
              </Text>
              {isOwner && (
                <TouchableOpacity onPress={pickAvatar} style={{ marginTop: 6 }}>
                  <Text style={s.changePhotoText}>📷 Change Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* ── Members list ─────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>
              Members ({group.members?.length ?? 0})
            </Text>
            {isOwner && (
              <TouchableOpacity style={s.addBtn} onPress={openAddModal}>
                <Text style={s.addBtnText}>+ Add Member</Text>
              </TouchableOpacity>
            )}
          </View>

          {(group.members ?? []).map((member, i) => (
            <View
              key={member.id}
              style={[
                s.memberRow,
                i < (group.members?.length ?? 0) - 1 && s.memberBorder,
              ]}
            >
              <Avatar name={member.name} uri={member.avatar} size={42} />
              <View style={s.memberInfo}>
                <View style={s.memberNameRow}>
                  <Text style={s.memberName}>{member.name}</Text>
                  {member.id === group.owner?.id && (
                    <View style={s.ownerBadge}>
                      <Text style={s.ownerText}>Owner</Text>
                    </View>
                  )}
                </View>
                <Text style={s.memberEmail}>{member.email}</Text>
              </View>
              {isOwner && member.id !== user?.id && (
                <TouchableOpacity
                  style={s.removeBtn}
                  onPress={() => removeMember(member.id, member.name)}
                >
                  <Text style={s.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* ── Actions ──────────────────────────────────── */}
        <View style={s.card}>
          {!isOwner && (
            <TouchableOpacity
              style={[s.actionBtn, s.warnBtn, leaving && s.disabled]}
              onPress={leaveGroup}
              disabled={leaving}
            >
              {leaving ? (
                <ActivityIndicator color="#e67e22" size="small" />
              ) : (
                <Text style={[s.actionText, { color: "#e67e22" }]}>
                  🚪 Leave Group
                </Text>
              )}
            </TouchableOpacity>
          )}
          {isOwner && (
            <TouchableOpacity
              style={[s.actionBtn, s.dangerBtn, deleting && s.disabled]}
              onPress={deleteGroup}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#e74c3c" size="small" />
              ) : (
                <Text style={[s.actionText, { color: "#e74c3c" }]}>
                  🗑 Delete Group
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ── Add member modal ─────────────────────────────── */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdd(false)}
      >
        <View style={s.modal}>
          {/* Modal header */}
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={s.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Add Members</Text>
            <TouchableOpacity
              onPress={addMembers}
              disabled={!selected.length || addingMems}
            >
              {addingMems ? (
                <ActivityIndicator size="small" color="#0a7ea4" />
              ) : (
                <Text
                  style={[s.modalDone, !selected.length && { opacity: 0.4 }]}
                >
                  Add {selected.length > 0 ? `(${selected.length})` : ""}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={s.modalSearch}>
            <TextInput
              style={s.modalSearchInput}
              placeholder="Search users..."
              placeholderTextColor="#999"
              value={userSearch}
              onChangeText={setUserSearch}
            />
          </View>

          {/* Selected chips */}
          {selected.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.chips}
              contentContainerStyle={{ padding: 8, gap: 6 }}
            >
              {allUsers
                .filter((u) => selected.includes(u.id))
                .map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={s.chip}
                    onPress={() => toggleUser(u.id)}
                  >
                    <Text style={s.chipText}>{u.name} ✕</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          )}

          {loadingUsers ? (
            <ActivityIndicator color="#0a7ea4" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(u) => String(u.id)}
              ListEmptyComponent={
                <Text style={s.emptyText}>
                  {userSearch
                    ? "No users found."
                    : "All users are already members."}
                </Text>
              }
              renderItem={({ item }) => {
                const checked = selected.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[s.userRow, checked && s.userRowChecked]}
                    onPress={() => toggleUser(item.id)}
                    activeOpacity={0.7}
                  >
                    <Avatar name={item.name} uri={item.avatar} size={42} />
                    <View style={s.userInfo}>
                      <Text style={s.userName}>{item.name}</Text>
                      <Text style={s.userEmail}>{item.email}</Text>
                    </View>
                    <View style={[s.checkbox, checked && s.checkboxChecked]}>
                      {checked && (
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          ✓
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: "#888", fontSize: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111" },

  // Group header
  groupHeader: { flexDirection: "row", gap: 14, alignItems: "center" },
  avatarWrap: { position: "relative" },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  groupName: { fontSize: 18, fontWeight: "700", color: "#111" },
  groupDesc: { fontSize: 13, color: "#666", marginTop: 4 },
  groupMeta: { fontSize: 12, color: "#999", marginTop: 4 },
  changePhotoText: { color: "#0a7ea4", fontWeight: "600", fontSize: 13 },

  // Members
  addBtn: {
    backgroundColor: "#e6f4f8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  addBtnText: { color: "#0a7ea4", fontWeight: "700", fontSize: 13 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  memberBorder: { borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  memberInfo: { flex: 1, marginLeft: 10 },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  memberName: { fontSize: 15, fontWeight: "600", color: "#111" },
  memberEmail: { fontSize: 12, color: "#888", marginTop: 1 },
  ownerBadge: {
    backgroundColor: "#e6f4f8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  ownerText: { color: "#0a7ea4", fontSize: 10, fontWeight: "700" },
  removeBtn: {
    borderWidth: 1,
    borderColor: "#e74c3c",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeBtnText: { color: "#e74c3c", fontWeight: "600", fontSize: 12 },

  // Actions
  actionBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  warnBtn: { borderColor: "#e67e22" },
  dangerBtn: { borderColor: "#e74c3c" },
  actionText: { fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.6 },

  // Add member modal
  modal: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  modalCancel: { color: "#666", fontSize: 15 },
  modalDone: { color: "#0a7ea4", fontSize: 15, fontWeight: "700" },
  modalSearch: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  modalSearchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
  },
  chips: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: "#eee" },
  chip: {
    backgroundColor: "#e6f4f8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: "#0a7ea4", fontWeight: "600", fontSize: 13 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userRowChecked: { backgroundColor: "#f0f9ff" },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: "600", color: "#111" },
  userEmail: { fontSize: 12, color: "#888", marginTop: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: { backgroundColor: "#0a7ea4", borderColor: "#0a7ea4" },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 40,
    fontSize: 14,
  },
});
