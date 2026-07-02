"use client";

import { useAuthStore } from "@/store/authStore";
import { CURRENT_USER } from "@/lib/mockData";

/**
 * fetch wrapper that automatically attaches the current user id as `x-user-id`
 * so API routes can resolve the acting user. Falls back to the mock current
 * user when no one is signed in (keeps the app usable in demo mode).
 */
export async function apiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const activeProfile = useAuthStore.getState().activeProfile ?? CURRENT_USER;
  const headers = new Headers(init.headers);
  if (activeProfile?.id) headers.set("x-profile-id", activeProfile.id);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers });
}

/** Convenience: GET JSON, returning a fallback value on any failure. */
export async function apiGet<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await apiFetch(url);
    if (!res.ok) return fallback;
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch {
    return fallback;
  }
}
