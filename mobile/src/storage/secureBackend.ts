import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { KeyValueBackend } from "./typedStorage";

/**
 * `KeyValueBackend` over the OS keychain (`expo-secure-store`) on native, with
 * a `sessionStorage` fallback on the web target — the same platform branch the
 * auth store relied on before, generalized so any secure key can use it.
 */
export const secureBackend: KeyValueBackend = {
  getItem(key) {
    if (Platform.OS === "web") {
      return Promise.resolve(globalThis.sessionStorage?.getItem(key) ?? null);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem(key, value) {
    if (Platform.OS === "web") {
      globalThis.sessionStorage?.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem(key) {
    if (Platform.OS === "web") {
      globalThis.sessionStorage?.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};
