import React, { useEffect, useState, useRef } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { messageService, conversationService } from "@/src/services/services";
import { useAuth } from "@/src/context/AuthContext";
import { Message } from "@/src/types";
import MessageBubble from "@/components/MessageBubble";

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  // Edit state
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [editText, setEditText] = useState("");
  // Action menu
  const [menuMsg, setMenuMsg] = useState<Message | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // ── Header ────────────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      title: name ?? "Chat",
      headerRight: () => (
        <TouchableOpacity
          onPress={confirmRemoveFriend}
          style={{ marginRight: 12 }}
        >
          <Text style={{ fontSize: 22 }}>🗑️</Text>
        </TouchableOpacity>
      ),
    });
  }, [name, id]);

  const scrollDown = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);

  // ── Load messages ─────────────────────────────────────────
  const load = async () => {
    if (!id) return;
    try {
      const res = await messageService.getConversationMessages(Number(id));
      const msgs = (res.data ?? []).slice().reverse();
      setMessages(msgs);
      scrollDown();
    } catch (e: any) {
      console.log("load err:", e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // ── Remove friend (delete conversation) ──────────────────
  const confirmRemoveFriend = () => {
    Alert.alert(
      "Remove Friend",
      `Delete your conversation with ${name}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await conversationService.delete(Number(id));
              router.back();
            } catch (e: any) {
              Alert.alert(
                "Error",
                e?.response?.data?.message ?? "Failed to delete.",
              );
            }
          },
        },
      ],
    );
  };

  // ── Long-press message menu ───────────────────────────────
  const openMenu = (msg: Message) => {
    // Only show actions for own messages
    if (msg.sender?.id !== user?.id) return;
    setMenuMsg(msg);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setMenuMsg(null);
  };

  // ── Delete message ────────────────────────────────────────
  const confirmDelete = (msg: Message) => {
    closeMenu();
    Alert.alert("Delete Message", "Delete this message?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await messageService.delete(msg.id);
            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          } catch (e: any) {
            Alert.alert(
              "Error",
              e?.response?.data?.message ?? "Failed to delete.",
            );
          }
        },
      },
    ]);
  };

  // ── Edit message ──────────────────────────────────────────
  const startEdit = (msg: Message) => {
    closeMenu();
    setEditingMsg(msg);
    setEditText(msg.message ?? "");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelEdit = () => {
    setEditingMsg(null);
    setEditText("");
  };

  const saveEdit = async () => {
    if (!editingMsg || !editText.trim()) return;
    try {
      const updated = await messageService.edit(editingMsg.id, editText.trim());
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMsg.id ? { ...m, message: updated.message } : m,
        ),
      );
      cancelEdit();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to edit.");
    }
  };

  // ── Send message ──────────────────────────────────────────
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !id) return;
    setText("");
    setSending(true);
    try {
      const msg = await messageService.sendToConversation(Number(id), trimmed);
      console.log("sent id:", msg?.id, "text:", msg?.message);
      setMessages((prev) => [...prev, msg]);
      scrollDown();
    } catch (e: any) {
      console.log("send err:", e?.message, e?.response?.status);
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  const isEditing = !!editingMsg;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
      >
        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m, i) => `msg-${m.id ?? i}`}
          contentContainerStyle={s.listContent}
          onContentSizeChange={scrollDown}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>👋</Text>
              <Text style={s.emptyText}>Say hello!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onLongPress={() => openMenu(item)}
              delayLongPress={400}
              activeOpacity={1}
            >
              <MessageBubble
                message={item}
                isOwn={item.sender?.id === user?.id}
              />
            </TouchableOpacity>
          )}
        />

        {/* Edit banner */}
        {isEditing && (
          <View style={s.editBanner}>
            <Text style={s.editBannerLabel}>✏️ Editing message</Text>
            <TouchableOpacity onPress={cancelEdit}>
              <Text style={s.editBannerCancel}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <View style={s.bar}>
          <TextInput
            ref={inputRef}
            style={[s.input, isEditing && s.inputEditing]}
            placeholder={isEditing ? "Edit message..." : "Type a message..."}
            placeholderTextColor="#999"
            value={isEditing ? editText : text}
            onChangeText={isEditing ? setEditText : setText}
            multiline
            maxLength={2000}
            onFocus={scrollDown}
          />
          {isEditing ? (
            <TouchableOpacity
              style={[
                s.btn,
                { backgroundColor: editText.trim() ? "#27ae60" : "#ccc" },
              ]}
              onPress={saveEdit}
              disabled={!editText.trim()}
              activeOpacity={0.8}
            >
              <Text style={{ color: "#fff", fontSize: 18 }}>✓</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                s.btn,
                { backgroundColor: text.trim() ? "#0a7ea4" : "#ccc" },
              ]}
              onPress={send}
              disabled={sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 20 }}>➤</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Message action menu modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={s.modalOverlay} onPress={closeMenu}>
          <View style={s.menuCard}>
            <Text style={s.menuTitle} numberOfLines={2}>
              "{menuMsg?.message}"
            </Text>

            <TouchableOpacity
              style={s.menuItem}
              onPress={() => startEdit(menuMsg!)}
            >
              <Text style={s.menuItemIcon}>✏️</Text>
              <Text style={s.menuItemText}>Edit Message</Text>
            </TouchableOpacity>

            <View style={s.menuDivider} />

            <TouchableOpacity
              style={s.menuItem}
              onPress={() => confirmDelete(menuMsg!)}
            >
              <Text style={s.menuItemIcon}>🗑️</Text>
              <Text style={[s.menuItemText, { color: "#e74c3c" }]}>
                Delete Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.menuItem, s.menuCancel]}
              onPress={closeMenu}
            >
              <Text
                style={[
                  s.menuItemText,
                  { color: "#666", textAlign: "center", width: "100%" },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1, backgroundColor: "#f0f0f0" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingVertical: 10, paddingHorizontal: 6, flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: { color: "#888", marginTop: 8, fontSize: 14 },

  // ── Input bar ──
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    paddingBottom: Platform.OS === "android" ? 14 : 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#f8f8f8",
    color: "#000",
  },
  inputEditing: {
    borderColor: "#27ae60",
    backgroundColor: "#f0fff4",
  },
  btn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Edit banner ──
  editBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0fff4",
    borderTopWidth: 1,
    borderTopColor: "#27ae60",
  },
  editBannerLabel: { color: "#27ae60", fontWeight: "600", fontSize: 13 },
  editBannerCancel: { color: "#e74c3c", fontWeight: "600", fontSize: 13 },

  // ── Action menu modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    paddingBottom: 30,
  },
  menuCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    paddingTop: 16,
  },
  menuTitle: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    fontSize: 13,
    color: "#888",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  menuItemIcon: { fontSize: 20 },
  menuItemText: { fontSize: 16, color: "#111", fontWeight: "500" },
  menuDivider: { height: 1, backgroundColor: "#f0f0f0", marginHorizontal: 16 },
  menuCancel: {
    borderTopWidth: 8,
    borderTopColor: "#f5f5f5",
    justifyContent: "center",
  },
});
