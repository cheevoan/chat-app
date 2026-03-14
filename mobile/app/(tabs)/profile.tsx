import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";
import { userService } from "@/src/services/services";
import Avatar from "@/components/Avatar";

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name ?? "");
  const [nameErr, setNameErr] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAv, setUploadingAv] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passErr, setPassErr] = useState({ current: "", new: "", confirm: "" });
  const [savingPass, setSavingPass] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ── Pick & upload avatar ──────────────────────────────────
  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission required",
        "Allow access to your photos to change avatar.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setUploadingAv(true);
    try {
      const updated = await userService.uploadAvatar(uri);
      updateUser(updated);
      Alert.alert("✅ Done", "Avatar updated!");
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? "Could not upload avatar.",
      );
    } finally {
      setUploadingAv(false);
    }
  };

  // ── Save name ─────────────────────────────────────────────
  const saveName = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setNameErr("Name must be at least 2 characters.");
      return;
    }
    if (name.trim() === user?.name) {
      Alert.alert("No Changes", "Name is unchanged.");
      return;
    }
    setSavingName(true);
    try {
      const updated = await userService.updateProfile({ name: name.trim() });
      updateUser(updated);
      Alert.alert("✅ Saved", "Profile updated.");
    } catch {
      Alert.alert("Error", "Could not update name.");
    } finally {
      setSavingName(false);
    }
  };

  // ── Change password ───────────────────────────────────────
  const savePassword = async () => {
    const errs = { current: "", new: "", confirm: "" };
    let ok = true;
    if (!currentPass) {
      errs.current = "Current password is required.";
      ok = false;
    }
    if (!newPass || newPass.length < 8) {
      errs.new = "Minimum 8 characters.";
      ok = false;
    }
    if (newPass !== confirmPass) {
      errs.confirm = "Passwords do not match.";
      ok = false;
    }
    setPassErr(errs);
    if (!ok) return;
    setSavingPass(true);
    try {
      await userService.updateProfile({
        current_password: currentPass,
        password: newPass,
      });
      Alert.alert("✅ Updated", "Password changed.");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setPassErr({ current: "", new: "", confirm: "" });
      setShowPass(false);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.errors?.current_password?.[0] ??
        "Could not change password.";
      Alert.alert("Error", msg);
    } finally {
      setSavingPass(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 8 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Avatar card ─────────────────────────────────── */}
      <View style={s.card}>
        <View style={s.avatarSection}>
          {/* Avatar with tap to change */}
          <TouchableOpacity
            onPress={pickAvatar}
            disabled={uploadingAv}
            style={s.avatarWrap}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={s.avatarImg} />
            ) : (
              <Avatar name={user?.name ?? "?"} size={90} />
            )}
            {/* Camera badge */}
            <View style={s.cameraBadge}>
              {uploadingAv ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ fontSize: 14 }}>📷</Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={s.avatarInfo}>
            <Text style={s.userName}>{user?.name}</Text>
            <Text style={s.userEmail}>{user?.email}</Text>
            {user?.is_admin && (
              <View style={s.adminBadge}>
                <Text style={s.adminBadgeText}>⭐ Administrator</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={pickAvatar}
              disabled={uploadingAv}
              style={s.changeAvatarBtn}
            >
              <Text style={s.changeAvatarText}>
                {uploadingAv ? "Uploading..." : "Change Photo"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Edit name ───────────────────────────────────── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Profile Information</Text>

        <Text style={s.label}>Display Name</Text>
        <TextInput
          style={[s.input, nameErr ? s.inputErr : null]}
          value={name}
          onChangeText={(v) => {
            setName(v);
            setNameErr("");
          }}
          placeholder="Your full name"
          placeholderTextColor="#999"
          returnKeyType="done"
          onSubmitEditing={saveName}
        />
        {!!nameErr && <Text style={s.errText}>{nameErr}</Text>}

        <Text style={s.label}>Email</Text>
        <TextInput
          style={[s.input, s.inputDisabled]}
          value={user?.email}
          editable={false}
        />
        <Text style={s.hintText}>Email cannot be changed.</Text>

        <TouchableOpacity
          style={[s.btn, savingName && s.btnDisabled]}
          onPress={saveName}
          disabled={savingName}
        >
          {savingName ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.btnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Change password ──────────────────────────────── */}
      <View style={s.card}>
        <TouchableOpacity
          style={s.cardRow}
          onPress={() => setShowPass(!showPass)}
        >
          <Text style={s.cardTitle}>Change Password</Text>
          <Text style={s.chevron}>{showPass ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {showPass && (
          <View style={{ marginTop: 8 }}>
            <Text style={s.label}>Current Password</Text>
            <TextInput
              style={[s.input, passErr.current ? s.inputErr : null]}
              value={currentPass}
              onChangeText={(v) => {
                setCurrentPass(v);
                setPassErr((p) => ({ ...p, current: "" }));
              }}
              secureTextEntry
              placeholder="Enter current password"
              placeholderTextColor="#999"
            />
            {!!passErr.current && (
              <Text style={s.errText}>{passErr.current}</Text>
            )}

            <Text style={s.label}>New Password</Text>
            <TextInput
              style={[s.input, passErr.new ? s.inputErr : null]}
              value={newPass}
              onChangeText={(v) => {
                setNewPass(v);
                setPassErr((p) => ({ ...p, new: "" }));
              }}
              secureTextEntry
              placeholder="Min. 8 characters"
              placeholderTextColor="#999"
            />
            {!!passErr.new && <Text style={s.errText}>{passErr.new}</Text>}

            <Text style={s.label}>Confirm New Password</Text>
            <TextInput
              style={[s.input, passErr.confirm ? s.inputErr : null]}
              value={confirmPass}
              onChangeText={(v) => {
                setConfirmPass(v);
                setPassErr((p) => ({ ...p, confirm: "" }));
              }}
              secureTextEntry
              placeholder="Repeat new password"
              placeholderTextColor="#999"
            />
            {!!passErr.confirm && (
              <Text style={s.errText}>{passErr.confirm}</Text>
            )}
            <TouchableOpacity
              style={[s.btn, s.btnGreen, savingPass && s.btnDisabled]}
              onPress={savePassword}
              disabled={savingPass}
            >
              {savingPass ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.btnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Sign out ────────────────────────────────────── */}
      <TouchableOpacity
        style={[s.logoutBtn, loggingOut && s.btnDisabled]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color="#e74c3c" size="small" />
        ) : (
          <Text style={s.logoutText}>🚪 Sign Out</Text>
        )}
      </TouchableOpacity>

      <Text style={s.version}>ChatApp v1.0.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chevron: { color: "#888", fontSize: 14 },

  // Avatar
  avatarSection: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarWrap: { position: "relative" },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: "700", color: "#111" },
  userEmail: { fontSize: 13, color: "#888", marginTop: 2 },
  adminBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e6f4f8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
  },
  adminBadgeText: { color: "#0a7ea4", fontWeight: "700", fontSize: 11 },
  changeAvatarBtn: { marginTop: 10 },
  changeAvatarText: { color: "#0a7ea4", fontWeight: "600", fontSize: 13 },

  // Form
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#fafafa",
    color: "#111",
  },
  inputErr: { borderColor: "#e74c3c" },
  inputDisabled: { backgroundColor: "#f0f0f0", color: "#999" },
  errText: { color: "#e74c3c", fontSize: 12, marginTop: 4 },
  hintText: { color: "#aaa", fontSize: 12, marginTop: 4 },

  // Buttons
  btn: {
    marginTop: 16,
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnGreen: { backgroundColor: "#27ae60" },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  logoutBtn: {
    borderWidth: 1.5,
    borderColor: "#e74c3c",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  logoutText: { color: "#e74c3c", fontWeight: "700", fontSize: 15 },
  version: {
    textAlign: "center",
    color: "#bbb",
    fontSize: 12,
    marginBottom: 20,
  },
});
