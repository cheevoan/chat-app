import React, { useState, useRef } from "react";
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
  TextInput as RNTextInput,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/constants/theme";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const { colors, typography } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const emailRef = useRef<RNTextInput>(null);
  const passRef = useRef<RNTextInput>(null);
  const confirmRef = useRef<RNTextInput>(null);

  const clear = (f: keyof typeof errors) =>
    setErrors((p) => ({ ...p, [f]: "" }));

  const validate = () => {
    const e = { name: "", email: "", password: "", confirm: "" };
    let ok = true;
    if (!name.trim() || name.trim().length < 2) {
      e.name = "Name must be at least 2 characters.";
      ok = false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      e.email = "Enter a valid email.";
      ok = false;
    }
    if (!password || password.length < 8) {
      e.password = "Minimum 8 characters.";
      ok = false;
    }
    if (password !== confirm) {
      e.confirm = "Passwords do not match.";
      ok = false;
    }
    setErrors(e);
    return ok;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        setErrors({
          name: apiErrors.name?.[0] ?? "",
          email: apiErrors.email?.[0] ?? "",
          password: apiErrors.password?.[0] ?? "",
          confirm: "",
        });
      } else {
        Alert.alert(
          "Failed",
          err.response?.data?.message ?? "Something went wrong.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label,
    value,
    setter,
    field,
    secureEntry,
    toggle,
    showToggle,
    ref: fRef,
    next,
  }: any) => (
    <View>
      <Text style={[s.label, { color: colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          s.passRow,
          {
            borderColor: errors[field] ? colors.danger : colors.inputBorder,
            backgroundColor: colors.inputBg,
          },
        ]}
      >
        <TextInput
          ref={fRef}
          style={[s.passInput, { color: colors.text }]}
          placeholder={label}
          placeholderTextColor={colors.textPlaceholder}
          value={value}
          onChangeText={(v: string) => {
            setter(v);
            clear(field);
          }}
          secureTextEntry={secureEntry}
          returnKeyType={next ? "next" : "done"}
          onSubmitEditing={next ? () => next.current?.focus() : handleRegister}
          autoCapitalize={field === "name" ? "words" : "none"}
          keyboardType={field === "email" ? "email-address" : "default"}
        />
        {showToggle && (
          <TouchableOpacity onPress={toggle} style={s.eye}>
            <Text style={s.eyeIcon}>{secureEntry ? "👁️" : "🙈"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {errors[field] ? (
        <Text style={[s.err, { color: colors.danger }]}>{errors[field]}</Text>
      ) : null}
    </View>
  );

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
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={[s.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[typography.h2, { color: colors.text }]}>
          Create Account
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, marginTop: 4, marginBottom: 4 },
          ]}
        >
          Join the chat today
        </Text>

        {/* Name */}
        <Text style={[s.label, { color: colors.textSecondary }]}>
          Full Name
        </Text>
        <TextInput
          style={[
            s.input,
            {
              borderColor: errors.name ? colors.danger : colors.inputBorder,
              backgroundColor: colors.inputBg,
              color: colors.text,
            },
          ]}
          placeholder="User Name"
          placeholderTextColor={colors.textPlaceholder}
          value={name}
          onChangeText={(v) => {
            setName(v);
            clear("name");
          }}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        {errors.name ? (
          <Text style={[s.err, { color: colors.danger }]}>{errors.name}</Text>
        ) : null}

        {/* Email */}
        <Text style={[s.label, { color: colors.textSecondary }]}>Email</Text>
        <TextInput
          ref={emailRef}
          style={[
            s.input,
            {
              borderColor: errors.email ? colors.danger : colors.inputBorder,
              backgroundColor: colors.inputBg,
              color: colors.text,
            },
          ]}
          placeholder="example@mail.com"
          placeholderTextColor={colors.textPlaceholder}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            clear("email");
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => passRef.current?.focus()}
        />
        {errors.email ? (
          <Text style={[s.err, { color: colors.danger }]}>{errors.email}</Text>
        ) : null}

        {/* Password */}
        <Text style={[s.label, { color: colors.textSecondary }]}>Password</Text>
        <View
          style={[
            s.passRow,
            {
              borderColor: errors.password ? colors.danger : colors.inputBorder,
              backgroundColor: colors.inputBg,
            },
          ]}
        >
          <TextInput
            ref={passRef}
            style={[s.passInput, { color: colors.text }]}
            placeholder="Minimum 8 characters"
            placeholderTextColor={colors.textPlaceholder}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              clear("password");
            }}
            secureTextEntry={!showPass}
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          <TouchableOpacity
            onPress={() => setShowPass(!showPass)}
            style={s.eye}
          >
            <Text style={s.eyeIcon}>{showPass ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
        {errors.password ? (
          <Text style={[s.err, { color: colors.danger }]}>
            {errors.password}
          </Text>
        ) : null}

        {/* Confirm */}
        <Text style={[s.label, { color: colors.textSecondary }]}>
          Confirm Password
        </Text>
        <View
          style={[
            s.passRow,
            {
              borderColor: errors.confirm ? colors.danger : colors.inputBorder,
              backgroundColor: colors.inputBg,
            },
          ]}
        >
          <TextInput
            ref={confirmRef}
            style={[s.passInput, { color: colors.text }]}
            placeholder="Re-enter your password"
            placeholderTextColor={colors.textPlaceholder}
            value={confirm}
            onChangeText={(v) => {
              setConfirm(v);
              clear("confirm");
            }}
            secureTextEntry={!showConfirm}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm(!showConfirm)}
            style={s.eye}
          >
            <Text style={s.eyeIcon}>{showConfirm ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
        {errors.confirm ? (
          <Text style={[s.err, { color: colors.danger }]}>
            {errors.confirm}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            s.btn,
            { backgroundColor: colors.primary, opacity: loading ? 0.65 : 1 },
          ]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[typography.button, { color: "#fff" }]}>
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={s.loginLink}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Already have an account?{"  "}
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 28, paddingTop: 60, paddingBottom: 40 },
  backBtn: { marginBottom: 24, alignSelf: "flex-start" },
  backIcon: { fontSize: 22 },
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
    marginTop: 28,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  loginLink: { marginTop: 20, alignItems: "center" },
});
