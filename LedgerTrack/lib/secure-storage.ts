const tryRequire = (name: string): any => {
  try {
    // @ts-ignore
    return require(name);
  } catch {
    return null;
  }
};

let SecureStore: any = tryRequire('expo-secure-store');

export async function setItem(key: string, value: string) {
  if (SecureStore?.setItemAsync) return SecureStore.setItemAsync(key, value);
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
}

export async function getItem(key: string) {
  if (SecureStore?.getItemAsync) return SecureStore.getItemAsync(key);
  if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  return null;
}

export async function deleteItem(key: string) {
  if (SecureStore?.deleteItemAsync) return SecureStore.deleteItemAsync(key);
  if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
}
