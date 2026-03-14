import * as SecureStore from "expo-secure-store";

// In-memory fallback for Expo Go
const memoryStore: Record<string, string> = {};

export const storage = {
  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      memoryStore[key] = value;
    }
    // Always keep in memory for fast synchronous access
    memoryStore[key] = value;
  },

  async get(key: string): Promise<string | null> {
    // Try SecureStore first
    try {
      const val = await SecureStore.getItemAsync(key);
      if (val) {
        memoryStore[key] = val; // sync to memory
        return val;
      }
    } catch {}
    // Fall back to memory
    return memoryStore[key] ?? null;
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
    delete memoryStore[key];
  },

  // Synchronous memory read — use after async get has been called once
  getSync(key: string): string | null {
    return memoryStore[key] ?? null;
  },
};
