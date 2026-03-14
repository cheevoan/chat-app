import api from "./api";
import { storage } from "./storage";
import {
  AuthResponse,
  User,
  Group,
  Conversation,
  Message,
  PaginatedResponse,
} from "@/src/types";

// ─── Auth ─────────────────────────────────────────────────────
export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post("/login", { email, password });
    console.log("authService.login:", JSON.stringify(data).substring(0, 100));
    await storage.set("auth_token", data.token);
    await storage.set("auth_user", JSON.stringify(data.user));
    return data;
  },
  register: async (
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    const { data } = await api.post("/register", {
      name,
      email,
      password,
      password_confirmation: password,
    });
    await storage.set("auth_token", data.token);
    await storage.set("auth_user", JSON.stringify(data.user));
    return data;
  },
  logout: async (): Promise<void> => {
    try {
      await api.post("/logout");
    } catch {}
    await storage.remove("auth_token");
    await storage.remove("auth_user");
  },
  getStoredToken: async (): Promise<string | null> => storage.get("auth_token"),
  getStoredUser: async (): Promise<User | null> => {
    const json = await storage.get("auth_user");
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  },
  me: async (): Promise<User> => {
    const { data } = await api.get("/me");
    return data.data;
  },
};

// ─── Users ────────────────────────────────────────────────────
export const userService = {
  list: async (search?: string, page = 1): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get("/users", { params: { search, page } });
    return data;
  },
  get: async (id: number): Promise<User> => {
    const { data } = await api.get(`/users/${id}`);
    return data.data;
  },
  updateProfile: async (
    fields: Partial<{ name: string; password: string }>,
  ): Promise<User> => {
    const { data } = await api.put("/users/profile", fields);
    const user = data.data ?? data;
    await storage.set("auth_user", JSON.stringify(user));
    return user;
  },
  uploadAvatar: async (imageUri: string): Promise<User> => {
    console.log("uploadAvatar uri:", imageUri);
    const form = new FormData();
    const filename = imageUri.split("/").pop() ?? "avatar.jpg";
    const ext = (filename.split(".").pop() ?? "jpg").toLowerCase();
    const mime = ext === "png" ? "image/png" : "image/jpeg";
    form.append("avatar", { uri: imageUri, name: filename, type: mime } as any);
    const { data } = await api.post("/users/profile/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log(
      "uploadAvatar response:",
      JSON.stringify(data).substring(0, 150),
    );
    const user = data.data ?? data;
    await storage.set("auth_user", JSON.stringify(user));
    return user;
  },
  block: async (id: number) => {
    await api.post(`/users/${id}/block`);
  },
  unblock: async (id: number) => {
    await api.post(`/users/${id}/unblock`);
  },
};

// ─── Groups ───────────────────────────────────────────────────
export const groupService = {
  list: async (page = 1): Promise<PaginatedResponse<Group>> => {
    const { data } = await api.get("/groups", { params: { page } });
    return data;
  },
  get: async (id: number): Promise<Group> => {
    const { data } = await api.get(`/groups/${id}`);
    return data.data;
  },
  create: async (
    name: string,
    description?: string,
    userIds?: number[],
  ): Promise<Group> => {
    const { data } = await api.post("/groups", {
      name,
      description,
      user_ids: userIds ?? [],
    });
    return data.data;
  },
  update: async (
    id: number,
    fields: Partial<{ name: string; description: string }>,
  ): Promise<Group> => {
    const { data } = await api.put(`/groups/${id}`, fields);
    return data.data;
  },
  uploadAvatar: async (groupId: number, imageUri: string): Promise<Group> => {
    console.log("group uploadAvatar uri:", imageUri);
    const form = new FormData();
    const filename = imageUri.split("/").pop() ?? "avatar.jpg";
    const ext = (filename.split(".").pop() ?? "jpg").toLowerCase();
    const mime = ext === "png" ? "image/png" : "image/jpeg";
    form.append("avatar", { uri: imageUri, name: filename, type: mime } as any);
    const { data } = await api.post(`/groups/${groupId}/avatar`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log(
      "group uploadAvatar response:",
      JSON.stringify(data).substring(0, 150),
    );
    return data.data ?? data;
  },
  delete: async (id: number) => {
    await api.delete(`/groups/${id}`);
  },
  addMembers: async (groupId: number, userIds: number[]) => {
    const { data } = await api.post(`/groups/${groupId}/members`, {
      user_ids: userIds,
    });
    return data.data;
  },
  removeMember: async (groupId: number, userId: number) => {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  },
  leave: async (groupId: number) => {
    await api.post(`/groups/${groupId}/leave`);
  },
};

// ─── Conversations ────────────────────────────────────────────
export const conversationService = {
  list: async (page = 1): Promise<PaginatedResponse<Conversation>> => {
    const { data } = await api.get("/conversations", { params: { page } });
    return data;
  },
  findOrCreate: async (userId: number): Promise<Conversation> => {
    const { data } = await api.post("/conversations", { user_id: userId });
    return data.data;
  },
  get: async (id: number): Promise<Conversation> => {
    const { data } = await api.get(`/conversations/${id}`);
    return data.data;
  },
  delete: async (id: number) => {
    await api.delete(`/conversations/${id}`);
  },
};

// ─── Messages ─────────────────────────────────────────────────
export const messageService = {
  getConversationMessages: async (
    conversationId: number,
    page = 1,
  ): Promise<PaginatedResponse<Message>> => {
    const { data } = await api.get("/messages", {
      params: { conversation_id: conversationId, page },
    });
    return data;
  },
  getGroupMessages: async (
    groupId: number,
    page = 1,
  ): Promise<PaginatedResponse<Message>> => {
    const { data } = await api.get("/messages", {
      params: { group_id: groupId, page },
    });
    return data;
  },
  sendToConversation: async (
    conversationId: number,
    message: string,
  ): Promise<Message> => {
    const { data } = await api.post("/messages", {
      message,
      conversation_id: conversationId,
    });
    console.log(
      "sendToConversation raw:",
      JSON.stringify(data).substring(0, 150),
    );
    return data.data ?? data;
  },
  sendToGroup: async (groupId: number, message: string): Promise<Message> => {
    const { data } = await api.post("/messages", {
      message,
      group_id: groupId,
    });
    return data.data ?? data;
  },
  edit: async (messageId: number, message: string): Promise<Message> => {
    const { data } = await api.put(`/messages/${messageId}`, { message });
    return data.data ?? data;
  },
  delete: async (id: number) => {
    await api.delete(`/messages/${id}`);
  },
};
