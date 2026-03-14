import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  View,
} from "react-native";
import {
  setNotificationListener,
  clearNotificationListener,
  navigateToChat,
} from "@/src/services/notifications";

interface BannerData {
  title: string;
  body: string;
  conversationId?: number;
  groupId?: number;
  senderName?: string;
}

export default function NotificationBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNotificationListener((params) => {
      // Cancel any previous timer
      if (timer.current) clearTimeout(timer.current);

      setBanner(params);

      // Slide in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();

      // Auto-hide after 4 seconds
      timer.current = setTimeout(() => hideBanner(), 4000);
    });

    return () => {
      clearNotificationListener();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const hideBanner = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setBanner(null));
  };

  const handlePress = () => {
    if (!banner) return;
    hideBanner();
    navigateToChat({
      conversationId: banner.conversationId,
      groupId: banner.groupId,
      senderName: banner.senderName,
    });
  };

  if (!banner) return null;

  return (
    <Animated.View style={[s.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity
        style={s.banner}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={s.iconWrap}>
          <Text style={s.icon}>💬</Text>
        </View>
        <View style={s.textWrap}>
          <Text style={s.title} numberOfLines={1}>
            {banner.title}
          </Text>
          <Text style={s.body} numberOfLines={2}>
            {banner.body}
          </Text>
        </View>
        <TouchableOpacity onPress={hideBanner} style={s.closeBtn}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 10,
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { fontSize: 20 },
  textWrap: { flex: 1 },
  title: { color: "#fff", fontWeight: "700", fontSize: 14, marginBottom: 2 },
  body: { color: "#ccc", fontSize: 13, lineHeight: 18 },
  closeBtn: { padding: 4 },
  closeText: { color: "#888", fontSize: 16, fontWeight: "700" },
});
