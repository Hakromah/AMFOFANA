/**
 * Secure storage abstraction.
 *  - Native (iOS / Android): expo-secure-store (encrypted Keychain/Keystore)
 *  - Web (browser):          localStorage (acceptable for development)
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'amf_access_token';
const ROLE_KEY  = 'amf_user_role';
const USER_KEY  = 'amf_user_data';

// ─── Unified read / write / delete ──────────────────────────────────────────

async function _set(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function _get(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function _delete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

// ─── Public helpers ──────────────────────────────────────────────────────────

export const saveToken  = (token: string)  => _set(TOKEN_KEY, token);
export const getToken   = ()               => _get(TOKEN_KEY);
export const removeToken = ()             => _delete(TOKEN_KEY);

export const saveRole   = (role: string)   => _set(ROLE_KEY, role);
export const getRole    = ()               => _get(ROLE_KEY);

export const saveUser   = async (user: object) => _set(USER_KEY, JSON.stringify(user));
export const getUser    = async (): Promise<object | null> => {
  const raw = await _get(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const clearAll   = () =>
  Promise.all([_delete(TOKEN_KEY), _delete(ROLE_KEY), _delete(USER_KEY)]);
