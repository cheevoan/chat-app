/**
 * Persistent storage using AsyncStorage with in-memory fallback.
 * Token survives app restarts.
 */

// In-memory fallback (always available immediately)
const mem: Record<string, string> = {};

// Try to import AsyncStorage — works in Expo Go with correct version
let AsyncStorage: any = null;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {
  console.log("AsyncStorage not available, using memory only");
}

export const storage = {
  async set(key: string, value: string): Promise<void> {
    mem[key] = value; // always keep in memory for fast sync access
    try {
      if (AsyncStorage) await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.log("storage.set error:", e);
    }
  },

  async get(key: string): Promise<string | null> {
    // Try AsyncStorage first (persisted)
    try {
      if (AsyncStorage) {
        const val = await AsyncStorage.getItem(key);
        if (val !== null) {
          mem[key] = val; // sync to memory
          return val;
        }
      }
    } catch (e) {
      console.log("storage.get error:", e);
    }
    // Fall back to memory
    return mem[key] ?? null;
  },

  async remove(key: string): Promise<void> {
    delete mem[key];
    try {
      if (AsyncStorage) await AsyncStorage.removeItem(key);
    } catch (e) {
      console.log("storage.remove error:", e);
    }
  },

  getSync(key: string): string | null {
    return mem[key] ?? null;
  },
};
