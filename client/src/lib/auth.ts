import { useEffect, useState, useCallback } from "react";
import { trpc } from "./trpc";

export interface CurrentUser {
  id?: number;
  userId: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  lastSignedIn?: Date | string | null;
  createdAt?: Date | string | null;
}

export const AUTH_TOKEN_KEY = "meetly-auth-token";
export const USER_PROFILE_KEY = "meetly-user-profile";
export const AUTH_CHANGE_EVENT = "meetly:auth-change";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): CurrentUser | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: CurrentUser) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: { user, token } }));
  } catch (err) {
    console.warn("[Auth] Failed to persist session to localStorage:", err);
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: { user: null, token: null } }));
  } catch (err) {
    console.warn("[Auth] Failed to clear session from localStorage:", err);
  }
}

/**
 * High-performance current user hook.
 *
 * Guarantees 0ms initial render:
 * 1. For anonymous users (no token): Never blocks or issues a 30s cold-start query to Render.
 * 2. For logged-in users: Reads cached profile immediately from localStorage on Frame 0,
 *    and validates the session with the server in the background without blocking the UI.
 */
export function useCurrentUser() {
  const [cachedUser, setCachedUser] = useState<CurrentUser | null>(() => getStoredUser());
  const token = getStoredAuthToken();
  const hasToken = Boolean(token);

  // Synchronize state across multiple components or tabs
  useEffect(() => {
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ user: CurrentUser | null }>;
      if (customEvent.detail !== undefined) {
        setCachedUser(customEvent.detail.user);
      } else {
        setCachedUser(getStoredUser());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_PROFILE_KEY || e.key === AUTH_TOKEN_KEY) {
        setCachedUser(getStoredUser());
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Only query the server if we actually have an auth token in storage.
  // Anonymous visitors never fire this query, preventing cold-start delays.
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // When server responds, synchronize cache or clear expired session
  useEffect(() => {
    if (meQuery.data) {
      setCachedUser(meQuery.data);
      try {
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(meQuery.data));
      } catch {}
    } else if (meQuery.isFetched && !meQuery.data && hasToken) {
      // Server rejected or expired token
      clearAuthSession();
      setCachedUser(null);
    }
  }, [meQuery.data, meQuery.isFetched, hasToken]);

  const activeUser = cachedUser ?? (meQuery.data || null);

  const refetch = useCallback(async () => {
    if (getStoredAuthToken()) {
      return meQuery.refetch();
    }
    setCachedUser(null);
    return Promise.resolve();
  }, [meQuery]);

  return {
    user: activeUser,
    isLoading: hasToken && !cachedUser && meQuery.isLoading,
    refetch,
    clearSession: clearAuthSession,
  };
}
