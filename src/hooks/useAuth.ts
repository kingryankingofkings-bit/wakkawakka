"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { MOCK_ACCOUNT, MOCK_PROFILES } from "@/lib/mockData";
import type { Account, Profile } from "@/types";

const HAS_FIREBASE_CONFIG =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key" &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your_firebase_api_key";

// ----- helpers ---------------------------------------------------------------

function firebaseUserToAccount(fbUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Account {
  return {
    id: fbUser.uid,
    email: fbUser.email ?? "",
    firebaseUid: fbUser.uid,
    twoFactorEnabled: false,
    emailVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ----- hook ------------------------------------------------------------------

export function useAuth() {
  const {
    account,
    profiles,
    activeProfile,
    isLoading,
    isAuthenticated,
    setAccount,
    setProfiles,
    addProfile,
    setActiveProfile,
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
            setAccount(firebaseUserToAccount(fbUser));
          } else {
            storeLogout();
          }
        });
      })();
    } else {
      // Mock auth
      const stored = useAuthStore.getState().account;
      if (!stored) {
        setAccount(MOCK_ACCOUNT);
        setProfiles(MOCK_PROFILES);
        setActiveProfile(MOCK_PROFILES[4]);
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
          setAccount(firebaseUserToAccount(result.user));
        } else {
          // Mock login
          await new Promise((r) => setTimeout(r, 600));
          setAccount(MOCK_ACCOUNT);
          setProfiles(MOCK_PROFILES);
          setActiveProfile(MOCK_PROFILES[4]);
        }
      } catch (err) {
        setLoading(false);
        throw err;
      }
    },
    [setAccount, setProfiles, setActiveProfile, setLoading],
  );

  // Register Account (Step 1)
  const registerAccount = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true);
      try {
        if (HAS_FIREBASE_CONFIG) {
          const { signUpWithEmail } = await import("@/lib/firebase");
          const result = await signUpWithEmail(email, password, "New User");
          setAccount(firebaseUserToAccount(result.user));
        } else {
          // Mock register account
          await new Promise((r) => setTimeout(r, 800));
          const mockNewAccount: Account = {
            ...MOCK_ACCOUNT,
            id: `acc_${Date.now()}`,
            email,
          };
          setAccount(mockNewAccount);
          setProfiles([]);
          setActiveProfile(null);
        }
      } catch (err) {
        setLoading(false);
        throw err;
      }
    },
    [setAccount, setProfiles, setActiveProfile, setLoading],
  );

  // Register Profile (Step 2)
  const registerProfile = useCallback(
    async (type: string, displayName: string, username: string): Promise<void> => {
      setLoading(true);
      try {
        // Mock register profile
        await new Promise((r) => setTimeout(r, 500));
        
        const currentAccount = useAuthStore.getState().account;
        if (!currentAccount) throw new Error("No account found to attach profile to");

        const newProfile: Profile = {
          ...MOCK_PROFILES[0], // Base template
          id: `prof_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          accountId: currentAccount.id,
          type,
          displayName,
          username,
        };

        addProfile(newProfile);
        setActiveProfile(newProfile);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        throw err;
      }
    },
    [addProfile, setActiveProfile, setLoading],
  );

  // Switch Profile
  const switchProfile = useCallback(
    (profileId: string) => {
      const state = useAuthStore.getState();
      const profile = state.profiles.find((p) => p.id === profileId);
      if (profile) {
        setActiveProfile(profile);
      }
    },
    [setActiveProfile]
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
    account,
    profiles,
    activeProfile,
    isLoading,
    isAuthenticated,
    login,
    logout,
    registerAccount,
    registerProfile,
    switchProfile,
  };
}
