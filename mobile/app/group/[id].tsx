import React, { useEffect, useState, useRef } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Text,
  KeyboardAvoidingView,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { messageService } from "@/src/services/services";
import { listenGroup, leaveGroup } from "@/src/services/echo";
import { activeScreen } from "@/src/context/RealtimeContext";
import { useAuth } from "@/src/context/AuthContext";
import { Message } from "@/src/types";
import MessageBubble from "@/components/MessageBubble";
import ChatInput, { AttachFile } from "@/components/ChatInput";

export default function GroupChatScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [editText, setEditText] = useState("");
  const [menuMsg, setMenuMsg] = useState<Message | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const listRef = useRef<FlatList>(null);
  const seenIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    navigation.setOptions({
      title: name ?? "Group",
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/group/detail", params: { id, name } })
          }
          style={{ marginRight: 12 }}
        >
          <Text style={{ fontSize: 22 }}>ℹ️</Text>
        </TouchableOpacity>
      ),
    });
  }, [name, id]);

  const scrollDown = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);

  useEffect(() => {
    if (!id) return;
    activeScreen.groupId = Number(id);
    setLoading(true);
    messageService
      .getGroupMessages(Number(id))
      .then((res) => {
        const msgs = (res.data ?? []).slice().reverse();
        msgs.forEach((m: Message) => seenIds.current.add(m.id));
        setMessages(msgs);
        scrollDown();
      })
      .catch((e) => console.log("group load err:", e?.message))
      .finally(() => setLoading(false));

    listenGroup(Number(id), (incoming: Message) => {
      if (!incoming?.id || seenIds.current.has(incoming.id)) return;
      if (incoming.sender?.id === user?.id) return;
      seenIds.current.add(incoming.id);
      setMessages((prev) => [...prev, incoming]);
      scrollDown();
    });

    return () => {
      activeScreen.groupId = 0;
      leaveGroup(Number(id));
    };
  }, [id]);

  const openMenu = (msg: Message) => {
    if (msg.sender?.id !== user?.id) return;
    setMenuMsg(msg);
    setMenuVisible(true);
  };
  const closeMenu = () => {
    setMenuVisible(false);
    setMenuMsg(null);
  };

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
            Alert.alert("Error", e?.response?.data?.message ?? "Failed.");
          }
        },
      },
    ]);
  };

  const startEdit = (msg: Message) => {
    closeMenu();
    setEditingMsg(msg);
    setEditText(msg.message ?? "");
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
      Alert.alert("Error", e?.response?.data?.message ?? "Failed.");
    }
  };

  const handleSend = async (text: string, files: AttachFile[]) => {
    if (!id) return;
    try {
      const msg = await messageService.sendToGroup(
        Number(id),
        text || undefined,
        files.length ? files : undefined,
      );
      seenIds.current.add(msg.id);
      setMessages((prev) => [...prev, msg]);
      setText("");
      scrollDown();
    } catch (e: any) {
      console.log("group send err:", e?.message, e?.response?.status);
      Alert.alert("Error", "Could not send message.");
    }
  };

  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m, i) => `g-${m.id ?? i}`}
          contentContainerStyle={s.listContent}
          onContentSizeChange={scrollDown}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>👋</Text>
              <Text style={s.emptyText}>No messages yet!</Text>
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
                showSender
              />
            </TouchableOpacity>
          )}
        />

        {editingMsg && (
          <View style={s.editBanner}>
            <Text style={s.editLabel}>✏️ Editing message</Text>
            <TouchableOpacity onPress={cancelEdit}>
              <Text style={s.editCancel}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <ChatInput
          value={text}
          onChangeText={setText}
          onSend={handleSend}
          placeholder="Message group..."
          isEditing={!!editingMsg}
          editValue={editText}
          onEditChange={setEditText}
          onSaveEdit={saveEdit}
          onCancelEdit={cancelEdit}
          onFocus={scrollDown}
        />
      </KeyboardAvoidingView>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={s.overlay} onPress={closeMenu}>
          <View style={s.menu}>
            <Text style={s.menuTitle} numberOfLines={2}>
              "{menuMsg?.message}"
            </Text>
            <TouchableOpacity
              style={s.menuItem}
              onPress={() => startEdit(menuMsg!)}
            >
              <Text style={s.menuIcon}>✏️</Text>
              <Text style={s.menuText}>Edit Message</Text>
            </TouchableOpacity>
            <View
              style={{
                height: 1,
                backgroundColor: "#f0f0f0",
                marginHorizontal: 16,
              }}
            />
            <TouchableOpacity
              style={s.menuItem}
              onPress={() => confirmDelete(menuMsg!)}
            >
              <Text style={s.menuIcon}>🗑️</Text>
              <Text style={[s.menuText, { color: "#e74c3c" }]}>
                Delete Message
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.menuItem,
                { borderTopWidth: 8, borderTopColor: "#f5f5f5" },
              ]}
              onPress={closeMenu}
            >
              <Text
                style={[
                  s.menuText,
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
  emptyText: { color: "#888", marginTop: 8 },
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
  editLabel: { color: "#27ae60", fontWeight: "600", fontSize: 13 },
  editCancel: { color: "#e74c3c", fontWeight: "600", fontSize: 13 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    paddingBottom: 30,
  },
  menu: {
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
  menuIcon: { fontSize: 20 },
  menuText: { fontSize: 16, color: "#111", fontWeight: "500" },
});
