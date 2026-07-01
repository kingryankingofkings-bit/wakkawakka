"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { CURRENT_USER } from "@/lib/mockData";
import type { User } from "@/types";

const HAS_FIREBASE_CONFIG =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key";

// ----- helpers ---------------------------------------------------------------

function firebaseUserToAppUser(fbUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): User {
  return {
    id: fbUser.uid,
    username: (fbUser.email ?? fbUser.uid).split("@")[0] ?? fbUser.uid,
    email: fbUser.email ?? "",
    displayName: fbUser.displayName ?? "User",
    avatar: fbUser.photoURL ?? undefined,
    isVerified: false,
    verificationTier: "NONE",
    isPremium: false,
    isPrivate: false,
    twoFactorEnabled: false,
    theme: "system",
    accentColor: "blue",
    language: "en",
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    streakDays: 0,
    badges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    professionalTier: "NONE",
    idVerificationStatus: "UNVERIFIED",
    freeCoursesCreatedThisMonth: 0,
    paidCoursesCreatedThisMonth: 0,
    averageCourseRating: 0,
  };
}

// ----- hook ------------------------------------------------------------------

export function useAuth() {
  const {
    user,
    isLoading,
    isAuthenticated,
    setUser,
    logout: storeLogout,
    setLoading,
  } = useAuthStore();

  // Set up auth listener on mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (HAS_FIREBASE_CONFIG) {
      // Real Firebase auth
      (async () => {
        const { onAuthChange } = await import("@/lib/firebase");
        unsubscribe = onAuthChange((fbUser) => {
          if (fbUser) {
            setUser(firebaseUserToAppUser(fbUser));
          } else {
            storeLogout();
          }
        });
      })();
    } else {
      // Mock auth — use CURRENT_USER from mockData
      const stored = useAuthStore.getState().user;
      if (!stored) {
        setUser(CURRENT_USER);
      } else {
        setLoading(false);
      }
    }

    return () => {
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Login
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true);
      try {
        if (HAS_FIREBASE_CONFIG) {
          const { signInWithEmail } = await import("@/lib/firebase");
          const result = await signInWithEmail(email, password);
          setUser(firebaseUserToAppUser(result.user));
        } else {
          // Mock login — accept any credentials, log in as CURRENT_USER
          await new Promise((r) => setTimeout(r, 600));
          setUser(CURRENT_USER);
        }
      } catch (err) {
        setLoading(false);
        throw err;
      }
    },
    [setUser, setLoading],
  );

  // Register
  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
    ): Promise<void> => {
      setLoading(true);
      try {
        if (HAS_FIREBASE_CONFIG) {
          const { signUpWithEmail } = await import("@/lib/firebase");
          const result = await signUpWithEmail(email, password, displayName);
          setUser(firebaseUserToAppUser(result.user));
        } else {
          // Mock register
          await new Promise((r) => setTimeout(r, 800));
          const mockNewUser: User = {
            ...CURRENT_USER,
            email,
            displayName,
            username: displayName.toLowerCase().replace(/\s+/g, "_"),
          };
          setUser(mockNewUser);
        }
      } catch (err) {
        setLoading(false);
        throw err;
      }
    },
    [setUser, setLoading],
  );

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      if (HAS_FIREBASE_CONFIG) {
        const { signOut } = await import("@/lib/firebase");
        await signOut();
      }
    } finally {
      storeLogout();
    }
  }, [storeLogout]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
  };
}
