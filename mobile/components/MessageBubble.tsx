import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Message } from "@/src/types";

interface Props {
  message: Message;
  isOwn: boolean;
  showSender?: boolean;
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime: string): string {
  if (mime.includes("pdf")) return "📄";
  if (mime.includes("word")) return "📝";
  if (mime.includes("excel") || mime.includes("sheet")) return "📊";
  if (mime.includes("text")) return "📃";
  return "📎";
}

export default function MessageBubble({
  message,
  isOwn,
  showSender = false,
}: Props) {
  const bubbleBg = isOwn ? "#0a7ea4" : "#ffffff";
  const bubbleText = isOwn ? "#ffffff" : "#111111";
  const timeColor = isOwn ? "rgba(255,255,255,0.7)" : "#999";

  const timeStr = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <View style={[s.row, isOwn ? s.rowOwn : s.rowOther]}>
      <View
        style={[
          s.bubble,
          {
            backgroundColor: bubbleBg,
            borderBottomRightRadius: isOwn ? 4 : 18,
            borderBottomLeftRadius: isOwn ? 18 : 4,
            shadowColor: "#000",
            shadowOpacity: isOwn ? 0 : 0.06,
            shadowRadius: 4,
            elevation: isOwn ? 0 : 1,
          },
        ]}
      >
        {/* Sender name (groups) */}
        {showSender && !isOwn && message.sender && (
          <Text style={[s.senderName, { color: "#0a7ea4" }]}>
            {message.sender.name}
          </Text>
        )}

        {/* Attachments */}
        {(message.attachments ?? []).map((att) => (
          <View key={att.id} style={s.attachment}>
            {att.is_image ? (
              <TouchableOpacity onPress={() => Linking.openURL(att.url)}>
                <Image
                  source={{ uri: att.url }}
                  style={s.image}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  s.fileRow,
                  {
                    backgroundColor: isOwn
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.05)",
                  },
                ]}
                onPress={() => Linking.openURL(att.url)}
              >
                <Text style={{ fontSize: 24 }}>{fileIcon(att.mime ?? "")}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[s.fileName, { color: bubbleText }]}
                    numberOfLines={1}
                  >
                    {att.name}
                  </Text>
                  <Text style={[s.fileSize, { color: timeColor }]}>
                    {fileSize(att.size)}
                  </Text>
                </View>
                <Text style={{ color: timeColor, fontSize: 12 }}>↓</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Message text */}
        {!!message.message && (
          <Text style={[s.msgText, { color: bubbleText }]}>
            {message.message}
          </Text>
        )}

        {/* Time */}
        <Text style={[s.time, { color: timeColor }]}>{timeStr}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 3, flexDirection: "row" },
  rowOwn: { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  senderName: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  attachment: { marginBottom: 6 },
  image: { width: 200, height: 140, borderRadius: 10 },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  fileName: { fontSize: 13, fontWeight: "600" },
  fileSize: { fontSize: 11, marginTop: 2 },
  msgText: { fontSize: 15, lineHeight: 22 },
  time: { fontSize: 11, textAlign: "right", marginTop: 4 },
});
