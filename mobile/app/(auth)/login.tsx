import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/constants/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors, typography, spacing, radius } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [passErr, setPassErr] = useState("");

  const validate = () => {
    let ok = true;
    setEmailErr("");
    setPassErr("");
    if (!email.trim()) {
      setEmailErr("Email is required.");
      ok = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailErr("Enter a valid email.");
      ok = false;
    }
    if (!password) {
      setPassErr("Password is required.");
      ok = false;
    }
    return ok;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Something went wrong.";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: colors.surface }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={s.logoWrap}>
          <View
            style={[s.logoCircle, { backgroundColor: colors.primaryLight }]}
          >
            <Text style={s.logoIcon}>💬</Text>
          </View>
          <Text style={[typography.h1, { color: colors.text }]}>ChatApp</Text>
          <Text
            style={[
              typography.caption,
              { color: colors.textMuted, marginTop: 4 },
            ]}
          >
            Stay connected with everyone
          </Text>
        </View>

        {/* Email */}
        <Text style={[s.label, { color: colors.textSecondary }]}>Email</Text>
        <TextInput
          style={[
            s.input,
            {
              borderColor: emailErr ? colors.danger : colors.inputBorder,
              backgroundColor: colors.inputBg,
              color: colors.text,
            },
          ]}
          placeholder="example@mail.com"
          placeholderTextColor={colors.textPlaceholder}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setEmailErr("");
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />
        {emailErr ? (
          <Text style={[s.err, { color: colors.danger }]}>{emailErr}</Text>
        ) : null}

        {/* Password */}
        <Text style={[s.label, { color: colors.textSecondary }]}>Password</Text>
        <View
          style={[
            s.passRow,
            {
              borderColor: passErr ? colors.danger : colors.inputBorder,
              backgroundColor: colors.inputBg,
            },
          ]}
        >
          <TextInput
            style={[s.passInput, { color: colors.text }]}
            placeholder="Password"
            placeholderTextColor={colors.textPlaceholder}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setPassErr("");
            }}
            secureTextEntry={!showPass}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity
            onPress={() => setShowPass(!showPass)}
            style={s.eye}
          >
            <Text style={s.eyeIcon}>{showPass ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
        {passErr ? (
          <Text style={[s.err, { color: colors.danger }]}>{passErr}</Text>
        ) : null}

        {/* Sign In */}
        <TouchableOpacity
          style={[
            s.btn,
            { backgroundColor: colors.primary, opacity: loading ? 0.65 : 1 },
          ]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[typography.button, { color: "#fff" }]}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={s.dividerRow}>
          <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          <Text
            style={[
              typography.caption,
              { color: colors.textMuted, marginHorizontal: 12 },
            ]}
          >
            or
          </Text>
          <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Register */}
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity
            style={[s.outlineBtn, { borderColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[typography.button, { color: colors.primary }]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 28,
    paddingBottom: 40,
  },
  logoWrap: { alignItems: "center", marginBottom: 40 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  logoIcon: { fontSize: 38 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  err: { fontSize: 12, marginTop: 4 },
  passRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
  },
  passInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  eye: { paddingHorizontal: 14 },
  eyeIcon: { fontSize: 18 },
  btn: {
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1 },
  outlineBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  hint: { textAlign: "center", fontSize: 12, marginTop: 32 },
});
