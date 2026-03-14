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
import { useTheme } from "@/constants/theme";

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

export default function MessageBubble({
  message,
  isOwn,
  showSender = false,
}: Props) {
  const { colors, typography } = useTheme();

  const bubbleBg = isOwn ? colors.bubbleOwn : colors.bubbleOther;
  const bubbleText = isOwn ? colors.bubbleOwnText : colors.bubbleOtherText;
  const timeColor = isOwn ? "rgba(255,255,255,0.65)" : colors.textMuted;

  const timeStr = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={[s.row, isOwn ? s.rowOwn : s.rowOther]}>
      <View
        style={[
          s.bubble,
          {
            backgroundColor: bubbleBg,
            borderBottomRightRadius: isOwn ? 4 : 16,
            borderBottomLeftRadius: !isOwn ? 4 : 16,
            // Shadow for other's bubble
            ...(!isOwn
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 1,
                }
              : {}),
          },
        ]}
      >
        {/* Sender name (group chats) */}
        {showSender && !isOwn && message.sender && (
          <Text
            style={[
              typography.small,
              { color: colors.primary, fontWeight: "700", marginBottom: 3 },
            ]}
          >
            {message.sender.name}
          </Text>
        )}

        {/* Attachments */}
        {message.attachments?.map((att) => (
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
                style={[s.fileRow, { backgroundColor: "rgba(0,0,0,0.06)" }]}
                onPress={() => Linking.openURL(att.url)}
              >
                <Text style={s.fileIcon}>📎</Text>
                <View style={s.fileInfo}>
                  <Text
                    style={[typography.small, { color: bubbleText }]}
                    numberOfLines={1}
                  >
                    {att.name}
                  </Text>
                  <Text style={[typography.small, { color: timeColor }]}>
                    {fileSize(att.size)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Message text */}
        {message.message ? (
          <Text style={[typography.body, { color: bubbleText }]}>
            {message.message}
          </Text>
        ) : null}

        {/* Timestamp */}
        <Text
          style={[
            typography.small,
            { color: timeColor, textAlign: "right", marginTop: 4 },
          ]}
        >
          {timeStr}
        </Text>
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
    paddingVertical: 9,
    borderRadius: 18,
  },
  attachment: { marginBottom: 6 },
  image: { width: 200, height: 140, borderRadius: 10 },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  fileIcon: { fontSize: 22 },
  fileInfo: { flex: 1 },
});
