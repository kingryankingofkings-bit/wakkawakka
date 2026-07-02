import { create } from "zustand";

export interface FriendLocation {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
}

interface MapState {
  userLocation: { latitude: number; longitude: number } | null;
  isSharingLocation: boolean;
  friendsLocations: FriendLocation[];
}

interface MapActions {
  setUserLocation: (_location: { latitude: number; longitude: number } | null) => void;
  setSharingLocation: (_share: boolean) => void;
  updateFriendLocation: (_userId: string, _latitude: number, _longitude: number) => void;
  fetchFriendsLocations: (_userId: string) => Promise<void>;
  updateUserLocation: (_userId: string, _latitude: number, _longitude: number, _shareLocation: boolean) => Promise<void>;
}

type MapStore = MapState & MapActions;

export const useMapStore = create<MapStore>((set) => ({
  userLocation: { latitude: 37.7749, longitude: -122.4194 }, // Default SF
  isSharingLocation: true,
  friendsLocations: [],
  setUserLocation: (userLocation) => set({ userLocation }),
  setSharingLocation: (isSharingLocation) => set({ isSharingLocation }),
  updateFriendLocation: (userId, latitude, longitude) =>
    set((state) => ({
      friendsLocations: state.friendsLocations.map((loc) =>
        loc.userId === userId
          ? { ...loc, latitude, longitude, lastUpdated: new Date().toISOString() }
          : loc
      ),
    })),
  fetchFriendsLocations: async (userId) => {
    try {
      const res = await fetch("/api/location/friends", {
        headers: {
          "x-user-id": userId,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        const friendsLocations = data.map((item: any) => ({
          userId: item.userId,
          username: item.user?.username || "",
          displayName: item.user?.displayName || "",
          avatar: item.user?.avatar || "",
          latitude: item.latitude,
          longitude: item.longitude,
          lastUpdated: item.updatedAt,
        }));
        set({ friendsLocations });
      }
    } catch (err) {
      console.error("Failed to fetch friends' locations:", err);
    }
  },
  updateUserLocation: async (userId, latitude, longitude, shareLocation) => {
    try {
      const res = await fetch("/api/location/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          latitude,
          longitude,
          shareLocation,
        }),
      });
      if (res.ok) {
        set({
          userLocation: { latitude, longitude },
          isSharingLocation: shareLocation,
        });
      }
    } catch (err) {
      console.error("Failed to update user location:", err);
    }
  },
}));
