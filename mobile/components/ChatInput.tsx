import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

export interface AttachFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
  isImage: boolean;
}

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  onSend: (text: string, files: AttachFile[]) => Promise<void>;
  placeholder?: string;
  isEditing?: boolean;
  editValue?: string;
  onEditChange?: (t: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onFocus?: () => void;
}

function getFileIcon(type: string): string {
  if (type.includes("pdf")) return "📄";
  if (type.includes("word") || type.includes("document")) return "📝";
  if (type.includes("excel") || type.includes("sheet")) return "📊";
  if (type.includes("powerpoint") || type.includes("presentation")) return "📊";
  if (type.includes("text")) return "📃";
  if (type.includes("zip") || type.includes("rar")) return "🗜️";
  return "📎";
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  placeholder = "Type a message...",
  isEditing,
  editValue,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onFocus,
}: Props) {
  const [files, setFiles] = useState<AttachFile[]>([]);
  const [sending, setSending] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // ── Pick from gallery ─────────────────────────────────────
  const pickImage = async () => {
    setShowPicker(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission required",
        "Allow photo access to attach images.",
      );
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 10,
    });
    if (res.canceled) return;

    const picked: AttachFile[] = res.assets.map((a) => {
      const name = a.fileName ?? a.uri.split("/").pop() ?? "image.jpg";
      const type = a.mimeType ?? "image/jpeg";
      return { uri: a.uri, name, type, size: a.fileSize, isImage: true };
    });
    setFiles((prev) => [...prev, ...picked].slice(0, 10));
  };

  // ── Camera ────────────────────────────────────────────────
  const takePhoto = async () => {
    setShowPicker(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Allow camera access.");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (res.canceled) return;
    const a = res.assets[0];
    setFiles((prev) =>
      [
        ...prev,
        {
          uri: a.uri,
          name: a.fileName ?? `photo_${Date.now()}.jpg`,
          type: a.mimeType ?? "image/jpeg",
          size: a.fileSize,
          isImage: true,
        },
      ].slice(0, 10),
    );
  };

  // ── Documents ─────────────────────────────────────────────
  const pickDocument = async () => {
    setShowPicker(false);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;

      const picked: AttachFile[] = res.assets.map((a) => {
        const mime = a.mimeType ?? "application/octet-stream";
        return {
          uri: a.uri,
          name: a.name,
          type: mime,
          size: a.size ?? undefined,
          isImage: mime.startsWith("image/"),
        };
      });
      setFiles((prev) => [...prev, ...picked].slice(0, 10));
    } catch (e) {
      console.log("doc pick error:", e);
    }
  };

  const removeFile = (i: number) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  // ── Send ──────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed && files.length === 0) return;
    setSending(true);
    try {
      await onSend(trimmed, files);
      setFiles([]);
    } catch {
    } finally {
      setSending(false);
    }
  };

  const canSend = value.trim().length > 0 || files.length > 0;

  // ── Edit mode ─────────────────────────────────────────────
  if (isEditing) {
    return (
      <View style={s.bar}>
        <TextInput
          style={[s.input, s.inputEditing]}
          value={editValue}
          onChangeText={onEditChange}
          multiline
          maxLength={2000}
          placeholder="Edit message..."
          placeholderTextColor="#999"
          onFocus={onFocus}
          autoFocus
        />
        <TouchableOpacity
          style={[
            s.sendBtn,
            { backgroundColor: (editValue ?? "").trim() ? "#27ae60" : "#ccc" },
          ]}
          onPress={onSaveEdit}
          disabled={!(editValue ?? "").trim()}
        >
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>
            ✓
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      {/* File previews */}
      {files.length > 0 && (
        <View style={s.previewBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.previewScroll}
          >
            {files.map((f, i) => (
              <View key={i} style={s.previewItem}>
                {f.isImage ? (
                  <Image source={{ uri: f.uri }} style={s.previewImg} />
                ) : (
                  <View style={s.previewDoc}>
                    <Text style={{ fontSize: 30 }}>{getFileIcon(f.type)}</Text>
                    <Text style={s.previewDocName} numberOfLines={2}>
                      {f.name}
                    </Text>
                    <Text style={s.previewDocSize}>{formatSize(f.size)}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={s.removeBtn}
                  onPress={() => removeFile(i)}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input row */}
      <View style={s.bar}>
        <TouchableOpacity
          style={s.attachBtn}
          onPress={() => setShowPicker(true)}
        >
          <Text style={{ fontSize: 22 }}>➕</Text>
        </TouchableOpacity>

        <TextInput
          style={s.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={2000}
          onFocus={onFocus}
        />

        <TouchableOpacity
          style={[s.sendBtn, { backgroundColor: canSend ? "#0a7ea4" : "#ccc" }]}
          onPress={handleSend}
          disabled={!canSend || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
              ➤
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Picker sheet */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={s.overlay} onPress={() => setShowPicker(false)}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Add Attachment</Text>

            <TouchableOpacity style={s.option} onPress={pickImage}>
              <View style={[s.optIcon, { backgroundColor: "#dbeafe" }]}>
                <Text style={{ fontSize: 28 }}>🖼️</Text>
              </View>
              <View>
                <Text style={s.optLabel}>Photo / Video</Text>
                <Text style={s.optSub}>Choose from gallery</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.option} onPress={takePhoto}>
              <View style={[s.optIcon, { backgroundColor: "#dcfce7" }]}>
                <Text style={{ fontSize: 28 }}>📷</Text>
              </View>
              <View>
                <Text style={s.optLabel}>Camera</Text>
                <Text style={s.optSub}>Take a new photo</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.option} onPress={pickDocument}>
              <View style={[s.optIcon, { backgroundColor: "#fef3c7" }]}>
                <Text style={{ fontSize: 28 }}>📄</Text>
              </View>
              <View>
                <Text style={s.optLabel}>Document</Text>
                <Text style={s.optSub}>PDF, Word, Excel, ZIP…</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => setShowPicker(false)}
            >
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: "#fff" },

  // ── Input bar ──
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: Platform.OS === "android" ? 14 : 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 6,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#f8f8f8",
    color: "#000",
  },
  inputEditing: { borderColor: "#27ae60", backgroundColor: "#f0fff4" },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 1,
  },

  // ── File previews ──
  previewBar: { borderTopWidth: 1, borderTopColor: "#eee", paddingVertical: 8 },
  previewScroll: { paddingHorizontal: 12, gap: 8, flexDirection: "row" },
  previewItem: { position: "relative", marginRight: 8 },
  previewImg: { width: 80, height: 80, borderRadius: 10 },
  previewDoc: {
    width: 90,
    height: 90,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  previewDocName: {
    fontSize: 10,
    color: "#444",
    textAlign: "center",
    marginTop: 4,
  },
  previewDocSize: { fontSize: 9, color: "#999", marginTop: 2 },
  removeBtn: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Picker sheet ──
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
    textAlign: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14,
  },
  optIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  optLabel: { fontSize: 16, fontWeight: "600", color: "#111" },
  optSub: { fontSize: 12, color: "#888", marginTop: 2 },
  cancelBtn: {
    marginTop: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "600", color: "#555" },
});
