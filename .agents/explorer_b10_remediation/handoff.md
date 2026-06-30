# Batch 10 (Camera & AR) Remediation Plan

Analysis and design report to address the client-side localStorage/Zustand database bypass and the disappearing media authorization leak in the WakkaWakka application.

---

## 1. Observation

### Observation 1: Client-Side localStorage/Zustand Bypasses in Camera UI
In `src/components/camera/CameraCapture.tsx`, when confirming a captured post/media (`handleConfirmPost` function, lines 166-264), the application writes disappearing messages, standard posts, and memories entirely to local mock states:
- Disappearing messages:
```typescript
208:       const newMessage: Message = {
209:         id: `disappearing-msg-${Date.now()}`,
210:         conversationId: selectedConversationId,
211:         sender: mockAuthor as any,
212:         senderId: mockAuthor.id,
213:         content: "Sent a disappearing photo",
214:         mediaUrl: mediaUrl,
215:         mediaType: "image",
216:         type: "disappearing",
217:         isRead: false,
218:         isDeleted: false,
219:         createdAt: new Date().toISOString(),
220:       };
221:       addMessage(newMessage);
```
- Saved memories:
```typescript
248:     const savedMemories = JSON.parse(localStorage.getItem("wakka-memories") || "[]");
249:     savedMemories.unshift({
250:       id: `memory-${Date.now()}`,
251:       url: mediaUrl,
...
258:     });
259:     localStorage.setItem("wakka-memories", JSON.stringify(savedMemories));
```
- Client-side code in `src/app/(main)/memories/page.tsx` reads and updates memories strictly from local storage (lines 68-79):
```typescript
68:     const stored = localStorage.getItem("wakka-memories");
69:     if (stored) {
70:       try {
71:         setMemories(JSON.parse(stored));
```

### Observation 2: Snap Map Hardcoded Locations
In `src/store/mapStore.ts` (lines 30-58), friend locations are statically defined:
```typescript
30:   friendsLocations: [
31:     {
32:       userId: "u1",
33:       username: "alex_creates",
34:       displayName: "Alex Rivera",
35:       avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
36:       latitude: 37.7858,
37:       longitude: -122.4008,
38:       lastUpdated: new Date().toISOString(),
39:     },
...
```
Additionally, `src/app/(main)/map/page.tsx` reads directly from this mock store and does not trigger any update queries (`/api/location/update`) or fetch requests (`/api/location/friends`).

### Observation 3: Disappearing Media Authorization Leak
In `src/app/api/media/disappearing/[id]/route.ts` (lines 7-47), the `GET` route handler retrieves disappearing media records by `id` but does not authorize whether the requesting `userId` is either the `senderId` or the `receiverId`. The route handler returns status `200 OK` (returning the image URL and consuming the view) to any authenticated user:
```typescript
7: export async function GET(
8:   req: NextRequest,
9:   { params }: { params: { id: string } },
10: ) {
11:   const userId = getRequestUserId(req);
...
19:     const media = await prisma.disappearingMedia.findUnique({
20:       where: { id },
21:     });
...
27:     if (media.isViewed) {
28:       return NextResponse.json({ error: "Gone" }, { status: 410 });
29:     }
...
40:     return NextResponse.json({ data: updatedMedia });
```

---

## 2. Logic Chain

1. **Facade System (Integrity Violation)**:
   - Based on Observations 1 and 2, features such as Camera, Memories, and Snap Map operate entirely in-memory or in the browser's `localStorage`.
   - SQLite tables `SavedMemory`, `UserLocation`, and `DisappearingMedia` exist in the Prisma schema but are never written to or read by the UI client.
   - Therefore, the client-side UI is a mockup/facade that bypasses the actual SQLite database models.

2. **Security Vulnerability**:
   - Based on Observation 3, anyone logged in can issue a `GET /api/media/disappearing/[id]` request. The backend code retrieves the record and, if not yet viewed, returns the URL and marks it viewed.
   - Since the backend does not verify if the requesting user's ID matches the media's `senderId` or `receiverId`, third-party users (e.g. `bobdev`) can intercept or read the private `view-once` media sent between other users (e.g. `wakkadev` and `alicedev`), leading to data leakage and pre-mature consumption of the single view.

---

## 3. Caveats

- **No Schema Changes Required**: The `SavedMemory` model has a `caption: String?` field. Since we are read-only and cannot change the Prisma schema, we serialize additional metadata fields (e.g., `pipUrl`, `tags`, `location`) as a JSON string inside the `caption` field to store all details cleanly in the existing SQLite table.
- **Mock Geolocation Fallback**: Hardware camera streams and real GPS locations might fail in development/testing environments. Falling back to high-fidelity simulated assets (picsum images, San Francisco default coordinates) is retained to preserve UI usability.

---

## 4. Conclusion

To remediate these issues, we must:
1. Implement a `POST` endpoint in `src/app/api/memories/route.ts` and a `DELETE` endpoint in `src/app/api/memories/[id]/route.ts`.
2. Modify `CameraCapture.tsx` to save memories, BeReal posts, stories, and disappearing messages through their respective API endpoints instead of local storage.
3. Modify `/memories/page.tsx` to fetch and delete memories using the API.
4. Modify `mapStore.ts` and `map/page.tsx` to fetch coordinates from `/api/location/friends` and update locations via `/api/location/update`.
5. Enforce sender/receiver check in `GET /api/media/disappearing/[id]/route.ts`.

---

## 5. Remediation Plan (Concrete Modifications)

### Task A: Enforce Authorization in Disappearing Media Routes

#### File 1: `src/app/api/media/disappearing/[id]/route.ts`
Add the sender/receiver authorization check:
```typescript
// Replace lines 22-26 with:
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Enforce authorization
    if (media.senderId !== userId && media.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
```

#### File 2: `src/app/api/media/disappearing/[id]/view/route.ts`
Enforce authorization in the POST view marker route as well:
```typescript
// Replace lines 23-26 with:
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Enforce authorization
    if (media.senderId !== userId && media.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
```

---

### Task B: Implement Memories DB CRUD Endpoints

#### File 3: `src/app/api/memories/route.ts`
Modify the route to query the `SavedMemory` model and support saving memory records:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const onThisDay = url.searchParams.get("onThisDay") === "true";

    if (onThisDay) {
      const now = new Date();
      const month = now.getUTCMonth();
      const day = now.getUTCDate();
      const thisYear = now.getUTCFullYear();

      const saved = await prisma.savedMemory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      const memories = saved
        .filter((m) => {
          const d = new Date(m.createdAt);
          return d.getUTCMonth() === month && d.getUTCDate() === day && d.getUTCFullYear() < thisYear;
        })
        .map((m) => {
          let metadata = { pipUrl: null, tags: [], location: "" };
          if (m.caption) {
            try {
              metadata = JSON.parse(m.caption);
            } catch (e) {}
          }
          return {
            id: m.id,
            url: m.mediaUrl,
            pipUrl: metadata.pipUrl,
            mode: m.type,
            date: new Date(m.createdAt).toISOString().split("T")[0],
            createdAt: m.createdAt.toISOString(),
            location: metadata.location || "Silicon Valley",
            tags: metadata.tags || [],
            yearsAgo: thisYear - new Date(m.createdAt).getUTCFullYear(),
          };
        });

      return NextResponse.json({ data: memories });
    }

    const saved = await prisma.savedMemory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const memories = saved.map((m) => {
      let metadata = { pipUrl: null, tags: [], location: "" };
      if (m.caption) {
        try {
          metadata = JSON.parse(m.caption);
        } catch (e) {}
      }
      return {
        id: m.id,
        url: m.mediaUrl,
        pipUrl: metadata.pipUrl,
        mode: m.type,
        date: new Date(m.createdAt).toISOString().split("T")[0],
        createdAt: m.createdAt.toISOString(),
        location: metadata.location || "Silicon Valley",
        tags: metadata.tags || [],
      };
    });

    return NextResponse.json({ data: memories });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch memories", detail: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { url, pipUrl, mode, location, tags } = await req.json();

    if (!url || !mode) {
      return NextResponse.json({ error: "url and mode are required" }, { status: 400 });
    }

    const captionJson = JSON.stringify({
      pipUrl: pipUrl || null,
      location: location || "",
      tags: tags || [],
    });

    const memory = await prisma.savedMemory.create({
      data: {
        userId,
        mediaUrl: url,
        type: mode,
        caption: captionJson,
      },
    });

    return NextResponse.json({ data: memory }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save memory", detail: String(err) }, { status: 500 });
  }
}
```

#### File 4: `src/app/api/memories/[id]/route.ts` (New File)
Create a delete handler for memories:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = params;

  try {
    const memory = await prisma.savedMemory.findUnique({
      where: { id },
    });

    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    if (memory.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.savedMemory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete memory", detail: String(err) },
      { status: 500 }
    );
  }
}
```

---

### Task C: Integrate UI with API & DB

#### File 5: `src/components/camera/CameraCapture.tsx`
Replace mock logic in `handleConfirmPost` with API requests to create standard posts/stories, BeReal posts, disappearing media, memories, and update user activity streaks:
```typescript
// Replace handleConfirmPost (lines 166-264) with:
  const handleConfirmPost = async () => {
    if (!capturedImage) return;

    setIsPosting(true);
    const mediaUrl = capturedImage;

    try {
      // 1. Send via DB / API
      if (cameraMode === "BE_REAL") {
        unlockBeRealFeed();
        const res = await fetch("/api/posts/bereal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mainImageUrl: mediaUrl,
            btsImageUrl: capturedPipImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=selfie",
            visibility: "FOLLOWERS",
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to create BeReal post");

        addPost(json.data);
        addCapturedMediaUrl(mediaUrl);

      } else if (cameraMode === "DISAPPEARING") {
        if (!selectedConversationId) {
          alert("Please select a recipient first");
          setIsPosting(false);
          return;
        }

        const conversation = conversations.find((c) => c.id === selectedConversationId);
        const otherUser = conversation?.members.find((m) => m.id !== user?.id) || conversation?.members[0];
        if (!otherUser) {
          alert("Recipient not found");
          setIsPosting(false);
          return;
        }

        // Create disappearing media entry in DB
        const mediaRes = await fetch("/api/media/disappearing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiverId: otherUser.id,
            mediaUrl: mediaUrl,
            type: "IMAGE",
          }),
        });
        const mediaJson = await mediaRes.json();
        if (!mediaRes.ok) throw new Error(mediaJson.error || "Failed to create disappearing media");
        const disappearingMedia = mediaJson.data;

        // Send chat message containing disappearing media ID reference
        const msgRes = await fetch(`/api/messages/conversations/${selectedConversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "Sent a disappearing photo",
            mediaUrl: disappearingMedia.id,
            type: "disappearing",
          }),
        });
        const msgJson = await msgRes.json();
        if (!msgRes.ok) throw new Error(msgJson.error || "Failed to send message");

        addMessage(msgJson.data);
        addCapturedMediaUrl(mediaUrl);

      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "Captured with Wakka Lens 📸",
            type: "STORY",
            visibility: "PUBLIC",
            mediaUrls: [mediaUrl],
            isEphemeral: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to create story post");

        addPost(json.data);
        addCapturedMediaUrl(mediaUrl);
      }

      // 2. Save memory in Database
      await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: mediaUrl,
          pipUrl: capturedPipImage,
          mode: cameraMode,
          location: userLocation ? "San Francisco, CA" : "Silicon Valley",
          tags: cameraMode === "BE_REAL" ? ["bereal"] : activeLensId ? [activeLensId] : ["camera"],
        }),
      });

      // 3. Log user activity for hour-based streak increments
      const streakRes = await fetch("/api/streaks/activity", { method: "POST" });
      const streakJson = await streakRes.json();
      if (streakJson.data) {
        useAuthStore.getState().updateUser({ streakDays: streakJson.data.currentStreak });
      }

      setCapturedImage(null);
      setCapturedPipImage(null);
    } catch (err: any) {
      console.error("Error during capture post flow:", err);
      alert(err.message || "An error occurred while posting.");
    } finally {
      setIsPosting(false);
    }
  };
```

#### File 6: `src/app/(main)/memories/page.tsx`
Update memories feed to fetch/delete from database:
```typescript
// Replace lines 66-80 with:
  useEffect(() => {
    async function loadMemories() {
      try {
        const res = await fetch("/api/memories");
        const json = await res.json();
        if (json.data) {
          setMemories(json.data);
        }
      } catch (err) {
        console.error("Failed to load memories", err);
      }
    }
    loadMemories();
  }, []);

// Replace handleDeleteMemory (lines 88-96) with:
  const handleDeleteMemory = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/memories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        if (activeMemory?.id === id) {
          setActiveMemory(null);
        }
      } else {
        alert("Failed to delete memory");
      }
    } catch (err) {
      console.error("Failed to delete memory", err);
    }
  };
```

#### File 7: `src/store/mapStore.ts`
Implement real location API fetch and update actions:
```typescript
// Modify interfaces and createMapStore (lines 13-69):
interface MapState {
  userLocation: { latitude: number; longitude: number } | null;
  isSharingLocation: boolean;
  friendsLocations: FriendLocation[];
}

interface MapActions {
  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
  setSharingLocation: (share: boolean) => void;
  updateFriendLocation: (userId: string, latitude: number, longitude: number) => void;
  fetchFriendsLocations: () => Promise<void>;
  updateUserLocation: (latitude: number, longitude: number, shareLocation: boolean) => Promise<void>;
}

export const useMapStore = create<MapStore>((set, get) => ({
  userLocation: { latitude: 37.7749, longitude: -122.4194 },
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
  fetchFriendsLocations: async () => {
    try {
      const res = await fetch("/api/location/friends");
      const json = await res.json();
      if (json.data) {
        const locations = json.data.map((loc: any) => ({
          userId: loc.userId,
          username: loc.user.username,
          displayName: loc.user.displayName,
          avatar: loc.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${loc.user.username}`,
          latitude: loc.latitude,
          longitude: loc.longitude,
          lastUpdated: loc.updatedAt,
        }));
        set({ friendsLocations: locations });
      }
    } catch (err) {
      console.error("Failed to fetch friends locations", err);
    }
  },
  updateUserLocation: async (latitude: number, longitude: number, shareLocation: boolean) => {
    try {
      const res = await fetch("/api/location/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, shareLocation }),
      });
      const json = await res.json();
      if (json.data) {
        set({
          userLocation: { latitude: json.data.latitude, longitude: json.data.longitude },
          isSharingLocation: json.data.shareLocation,
        });
      }
    } catch (err) {
      console.error("Failed to update user location", err);
    }
  },
}));
```

#### File 8: `src/app/(main)/map/page.tsx`
Trigger location fetching on Snap Map:
```typescript
// Replace lines 10-13 with:
  const { 
    friendsLocations, 
    isSharingLocation, 
    setSharingLocation, 
    userLocation,
    fetchFriendsLocations,
    updateUserLocation 
  } = useMapStore();
  const [selectedFriend, setSelectedFriend] = useState<FriendLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchFriendsLocations();
    const interval = setInterval(fetchFriendsLocations, 10000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateUserLocation(
            position.coords.latitude,
            position.coords.longitude,
            isSharingLocation
          );
        },
        (error) => {
          console.warn("Geolocation failed, updating with default SF location", error);
          updateUserLocation(37.7749, -122.4194, isSharingLocation);
        }
      );
    } else {
      updateUserLocation(37.7749, -122.4194, isSharingLocation);
    }

    return () => clearInterval(interval);
  }, [fetchFriendsLocations, updateUserLocation, isSharingLocation]);

// Replace lines 66-75 (button action) with:
          <button
            onClick={() => {
              const newShare = !isSharingLocation;
              setSharingLocation(newShare);
              if (userLocation) {
                updateUserLocation(userLocation.latitude, userLocation.longitude, newShare);
              }
            }}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
              isSharingLocation 
                ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700" 
                : "bg-primary text-white hover:bg-primary/95"
            }`}
          >
            {isSharingLocation ? "Enable" : "Disable"}
          </button>
```

---

## 6. Verification Method

1. **Run Integration Test Script**:
   Execute the suite from the project root:
   ```bash
   node tests/camera_ar_test.js
   ```
   All 4 test scenarios should output green checkmarks (`Passed`), including the previously failing **Disappearing Media Single-View Restriction** test (which expects `403 Forbidden` when `bobdev` tries to access `wakkadev`'s media).

2. **Verify Database Records**:
   To ensure facade implementations have been fully removed and the SQLite database is being updated:
   - Capture a BeReal post in the Camera tab, check that a new record is added to the `Post` table.
   - Capture a memory, verify a record exists in `SavedMemory` table.
   - Access the map, verify that a location record is updated in `UserLocation` table.
   - Run simple SQL checks or inspect using Prisma studio:
     ```bash
     npx prisma studio
     ```
