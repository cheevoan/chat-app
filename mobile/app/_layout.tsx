import React, { useEffect, Component, ReactNode } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { AuthProvider, useAuth } from "@/src/context/AuthContext";

// ── Error Boundary ────────────────────────────────────────────
interface EBState {
  hasError: boolean;
  error: string;
}
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state = { hasError: false, error: "" };
  static getDerivedStateFromError(err: any) {
    return { hasError: true, error: err?.message ?? String(err) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>⚠️ App Error</Text>
          <Text style={eb.msg}>{this.state.error}</Text>
          <TouchableOpacity
            style={eb.btn}
            onPress={() => this.setState({ hasError: false, error: "" })}
          >
            <Text style={eb.btnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
const eb = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  msg: {
    fontSize: 13,
    color: "#e53935",
    textAlign: "center",
    marginBottom: 24,
  },
  btn: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});

// ── Auth Gate ─────────────────────────────────────────────────
function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  console.log("AuthGate:", { isAuthenticated, isLoading, segments });

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuth) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuth) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={{ marginTop: 12, color: "#666" }}>Loading...</Text>
      </View>
    );
  }

  return null;
}

// ── Root Layout ───────────────────────────────────────────────
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: true }} />
          <Stack.Screen
            name="chat/search"
            options={{ headerShown: true, title: "New Message" }}
          />
          <Stack.Screen name="group/[id]" options={{ headerShown: true }} />
          <Stack.Screen
            name="group/create"
            options={{ headerShown: true, title: "New Group" }}
          />
          <Stack.Screen
            name="group/detail"
            options={{ headerShown: true, title: "Group Info" }}
          />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
        <AuthGate />
        <StatusBar style="auto" />
      </AuthProvider>
    </ErrorBoundary>
  );
}
