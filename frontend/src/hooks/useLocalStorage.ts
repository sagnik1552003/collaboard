import { useState } from "react";

export function useLocalStorage(key: string, initialValue: string) {
  const [value, setValue] = useState(() => {
    try {
      return window.localStorage.getItem(key) ?? initialValue;
    } catch {
      return initialValue;
    }
  });

  function set(next: string) {
    setValue(next);
    try {
      window.localStorage.setItem(key, next);
    } catch {
      // storage unavailable (private browsing, etc.) — value still lives in state
    }
  }

  return [value, set] as const;
}
