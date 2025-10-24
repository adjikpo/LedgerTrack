import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isNative = Platform.OS !== 'web' && !!SecureStore && typeof (SecureStore as any).getItemAsync === 'function';

export async function setItem(key: string, value: string) {
  if (isNative) return (SecureStore as any).setItemAsync(key, value);
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
}

export async function getItem(key: string) {
  if (isNative) return (SecureStore as any).getItemAsync(key);
  if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  return null;
}

export async function deleteItem(key: string) {
  if (isNative) return (SecureStore as any).deleteItemAsync(key);
  if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
}
