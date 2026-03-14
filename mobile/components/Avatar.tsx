import React from "react";
import { View, Text, Image, StyleSheet, ViewStyle } from "react-native";

interface Props {
  name: string;
  uri?: string | null;
  size?: number;
  style?: ViewStyle;
  isOnline?: boolean;
}

const COLORS = [
  "#0a7ea4",
  "#3ab4d4",
  "#7c4dff",
  "#e91e63",
  "#009688",
  "#ff5722",
  "#43a047",
  "#f57c00",
  "#1565c0",
  "#6a1b9a",
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return COLORS[hash % COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({
  name,
  uri,
  size = 44,
  style,
  isOnline,
}: Props) {
  const bg = colorFor(name);
  const initls = initials(name || "?");
  const fs = size * 0.38;
  const dotSize = Math.max(10, size * 0.28);
  const dotOffset = size * 0.04;

  return (
    <View style={[{ width: size, height: size }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: fs,
              fontWeight: "700",
              letterSpacing: 0.5,
            }}
          >
            {initls}
          </Text>
        </View>
      )}
      {isOnline && (
        <View
          style={[
            s.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              bottom: dotOffset,
              right: dotOffset,
              borderWidth: dotSize * 0.2,
            },
          ]}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  dot: {
    position: "absolute",
    backgroundColor: "#52c41a",
    borderColor: "#fff",
  },
});
