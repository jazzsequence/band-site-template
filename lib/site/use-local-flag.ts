import { useSyncExternalStore } from "react";

const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
};

/**
 * Whether `key` is set in localStorage: false on the server and while hydrating, then the real value. Reading it in an
 * effect and calling setState (the old way) renders twice and trips react-hooks/set-state-in-effect.
 */
export function useLocalFlag(key: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return !!localStorage.getItem(key);
      } catch {
        return false; // storage blocked
      }
    },
    () => false,
  );
}
