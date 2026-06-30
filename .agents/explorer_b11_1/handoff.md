# Batch 11 (Audio & Voice) Exploration & Detailed Implementation Plan

## 1. Observation
In our exploration of the `wakkawakka-local` codebase, we observed the following:
* **Database Schema (`prisma/schema.prisma`)**:
  * Standalone global Live Audio Rooms (Clubhouse-style) are modeled via `AudioRoom` (lines 753-777), `AudioRoomSpeaker` (lines 779-791), and `AudioRoomListener` (lines 793-804).
  * Server Soundboards are modeled via `SoundboardSound` (lines 1708-1722), which contains `id`, `name`, `soundUrl`, `emoji`, `volume`, `serverId`, `userId`, and `createdAt`.
  * Spotify Integration/Profile Anthems are supported by fields in the `User` model: `profileSoundtrack String?` (line 74) and `profileSoundtrackVisible Boolean @default(true)` (line 75).
  * No database models or stubs currently exist for podcasts, playlists, or audio room transcription.
* **UI Components**:
  * `src/app/(main)/audio-rooms/page.tsx` renders a mock client-side interface using `MOCK_AUDIO_ROOMS` and `MOCK_USERS` from `@/lib/mockData`. It lacks server-side API integration and real-time state synchronization.
  * `src/components/profile/ProfileSoundtrack.tsx` parses the user's soundtrack metadata (formatted as `${title} - ${artist} | ${previewUrl}`) and renders a playback control.
  * `src/components/profile/EditProfileModal.tsx` integrates the Spotify search widget, calls the `/api/spotify/search` endpoint, and submits updates via a `PATCH /api/users/${user.id}` request.
* **API Endpoints**:
  * `src/app/api/servers/[id]/soundboard/route.ts` implements `GET` (list sounds) and `POST` (upload sound). However, `DELETE` is not implemented.
  * `src/app/api/spotify/search/route.ts` serves static mock tracks for Spotify queries.
  * There are no API endpoints under `src/app/api/audio-rooms`.
  * `/api/users/[id]` route (lines 48-76 in `src/app/api/users/[id]/route.ts`) handles profile updates dynamically by passing `updates` directly into Prisma, supporting `profileSoundtrack` and `profileSoundtrackVisible` saving out-of-the-box.
* **Socket.IO Server Configuration (`server.ts`)**:
  * Lines 150-160 implement stubs for `join-audio-room` and `audio-speak`.
  * Lines 200-220 contain Voice state (`join-voice`, `leave-voice`, `voice-state-update`, `play-soundboard`) and Stage coordination (`join-stage`, `stage-request-speak`, `stage-moderate-speaker`) events.

---

## 2. Logic Chain
Based on our observations, we determined the following logic for the implementation:
1. **Schema Updates**: To support hand raising in live audio rooms, we must add a boolean `handRaised` field to the `AudioRoomListener` model. To support podcasts, playlists, and transcripts, we should add new models: `Podcast`, `PodcastEpisode`, `AudioPlaylist`, `AudioPlaylistTrack`, `AudioRoomTranscript`, and `AudioRoomTranscriptSegment` to the schema.
2. **API Endpoint Expansion**:
   * For Clubhouse-style Audio Rooms: We need `GET` and `POST` at `/api/audio-rooms`, `/api/audio-rooms/[id]/speakers` (`POST`/`PATCH`/`DELETE`), `/api/audio-rooms/[id]/listeners` (`POST`/`DELETE`), and `/api/audio-rooms/[id]/hand` (`PATCH`).
   * For Soundboard delete operations: We need `DELETE` at `/api/servers/[id]/soundboard/[soundId]`.
   * For Spotify: We can enhance `/api/spotify/search` to fetch live data from the Spotify API using client credentials if configured.
3. **UI Integration**: `src/app/(main)/audio-rooms/page.tsx` must be converted from mock state to utilize `fetch` API requests for listing, creating, joining, and modifying rooms.
4. **Socket.IO Event Sync**: The client and server must coordinate voice active state updates, speaker/listener handshakes, and hand-raise indicators using real-time socket events.
5. **Testing & Verification**: A test runner script `tests/audio_voice_test.js` using `node` or `tsx` can programmatically seed users, spawn the Next.js server, call the endpoints via `fetch`, and verify response status codes and database updates.

---

## 3. Caveats
* **Network Access**: The Spotify search integration requires credentials (`SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`) to connect to external endpoints. The implementation plan details a fallback to local mock search results if these keys are absent.
* **Audio Streaming Mechanism**: The audio rooms in this application represent the control plane (speaker roles, mute states, listeners, hand raising). The actual audio stream routing (e.g., via WebRTC, LiveKit, or Agora) is out-of-scope for the DB/API plane, but the control plane must sync these state changes.
* **Background Playback Client Persistence**: Next.js SPA structure allows persisting audio playback during page navigation if the player is mounted in the root layout (`src/app/(main)/layout.tsx`) and managed by a shared store.

---

## 4. Conclusion
We have mapped out a complete design for Batch 11. By applying the schema changes, implementing the Next.js API endpoints, updating the React client state to consume real-time socket updates and REST endpoints, and utilizing a custom test suite, the entire Audio & Voice suite can be successfully implemented.

---

## 5. Verification Method
1. **Prisma Schema Check**: Run `npx prisma db push` or `npx prisma db validate` to verify schema changes compilation.
2. **REST Endpoints & Flow Verification**: Run the proposed script `node tests/audio_voice_test.js` to execute the full integration test flow.
3. **Socket.IO Event Verification**: Run the socket tests inside the verification script using a client-side connection.

---

# Detailed Implementation Plan

## A. Database Schema / Prisma Updates
Add the following models and fields to `prisma/schema.prisma`:

```prisma
// Update existing AudioRoomListener to support hand raising
model AudioRoomListener {
  id          String    @id @default(cuid())
  audioRoomId String
  audioRoom   AudioRoom @relation(fields: [audioRoomId], references: [id], onDelete: Cascade)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  joinedAt    DateTime  @default(now())
  leftAt      DateTime?
  handRaised  Boolean   @default(false) // Added for hand raising tracking

  @@unique([audioRoomId, userId])
  @@index([audioRoomId])
}

// Add Podcast and Episode models
model Podcast {
  id          String           @id @default(cuid())
  title       String
  description String?
  coverUrl    String?
  authorId    String
  author      User             @relation("PodcastAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  category    String?
  episodes    PodcastEpisode[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([authorId])
}

model PodcastEpisode {
  id          String   @id @default(cuid())
  podcastId   String
  podcast     Podcast  @relation(fields: [podcastId], references: [id], onDelete: Cascade)
  title       String
  description String?
  audioUrl    String
  duration    Int      @default(0) // duration in seconds
  publishedAt DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([podcastId])
}

// Add AudioPlaylist and Track models
model AudioPlaylist {
  id          String               @id @default(cuid())
  name        String
  description String?
  coverUrl    String?
  userId      String
  user        User                 @relation("UserPlaylists", fields: [userId], references: [id], onDelete: Cascade)
  tracks      AudioPlaylistTrack[]
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt

  @@index([userId])
}

model AudioPlaylistTrack {
  id         String        @id @default(cuid())
  playlistId String
  playlist   AudioPlaylist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  title      String
  artist     String
  audioUrl   String
  duration   Int           @default(0)
  position   Int
  createdAt  DateTime      @default(now())

  @@index([playlistId])
}

// Add AudioRoomTranscript and Segment models for live/recorded transcripts
model AudioRoomTranscript {
  id          String   @id @default(cuid())
  audioRoomId String   @unique
  audioRoom   AudioRoom @relation(fields: [audioRoomId], references: [id], onDelete: Cascade)
  fullText    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AudioRoomTranscriptSegment {
  id          String    @id @default(cuid())
  audioRoomId String
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  text        String
  timestamp   DateTime  @default(now())

  @@index([audioRoomId])
  @@index([userId])
}
```

*Note: Remember to update the `User` model relations in `prisma/schema.prisma` to include:*
```prisma
podcasts           Podcast[]                    @relation("PodcastAuthor")
playlists          AudioPlaylist[]              @relation("UserPlaylists")
transcriptSegments AudioRoomTranscriptSegment[]
```

---

## B. REST API Endpoints to Implement

### 1. Audio Room Management: `src/app/api/audio-rooms/route.ts`
Handles fetching active rooms and creating new rooms.
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const rooms = await prisma.audioRoom.findMany({
      where: { isActive: true },
      include: {
        host: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        speakers: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
          },
        },
        listeners: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedRooms = rooms.map((room) => ({
      id: room.id,
      title: room.title,
      description: room.description,
      isActive: room.isActive,
      host: room.host,
      speakers: room.speakers.map((s) => ({ ...s.user, isMuted: s.isMuted })),
      listeners: room.listeners.map((l) => ({ ...l.user, handRaised: l.handRaised })),
      listenerCount: room.listeners.length,
      createdAt: room.createdAt,
    }));

    return NextResponse.json({ data: formattedRooms });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch audio rooms", detail: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, maxSpeakers } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const room = await prisma.audioRoom.create({
      data: {
        hostId: userId,
        title,
        description,
        isActive: true,
        startedAt: new Date(),
        maxSpeakers: maxSpeakers || 10,
        speakers: {
          create: {
            userId: userId,
            isMuted: false,
          },
        },
      },
      include: {
        host: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        speakers: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      data: {
        ...room,
        speakers: room.speakers.map((s) => ({ ...s.user, isMuted: s.isMuted })),
        listeners: [],
        listenerCount: 0,
      },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create audio room", detail: String(err) }, { status: 500 });
  }
}
```

### 2. Audio Room Speakers: `src/app/api/audio-rooms/[id]/speakers/route.ts`
Manages speaker promotions, mutations (mute states), and demotions.
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST - Promote listener to speaker
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: roomId } = await params;
  const actingUserId = getRequestUserId(req);
  if (!actingUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { targetUserId } = await req.json();
    const userIdToPromote = targetUserId || actingUserId;

    // Verify room
    const room = await prisma.audioRoom.findUnique({ where: { id: roomId } });
    if (!room || !room.isActive) {
      return NextResponse.json({ error: "Active audio room not found" }, { status: 404 });
    }

    // Security check: only the host can promote another user
    if (userIdToPromote !== actingUserId && room.hostId !== actingUserId) {
      return NextResponse.json({ error: "Only the host can promote other users" }, { status: 403 });
    }

    // Atomic promotion
    const result = await prisma.$transaction(async (tx) => {
      // Remove from listeners
      await tx.audioRoomListener.deleteMany({
        where: { audioRoomId: roomId, userId: userIdToPromote },
      });
      // Add to speakers
      return tx.audioRoomSpeaker.upsert({
        where: { audioRoomId_userId: { audioRoomId: roomId, userId: userIdToPromote } },
        create: { audioRoomId: roomId, userId: userIdToPromote, isMuted: false },
        update: { leftAt: null },
      });
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json({ error: "Failed to promote speaker", detail: String(err) }, { status: 500 });
  }
}

// PATCH - Mute / Unmute speaker
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id: roomId } = await params;
  const actingUserId = getRequestUserId(req);
  if (!actingUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { isMuted, targetUserId } = await req.json();
    const userIdToUpdate = targetUserId || actingUserId;

    const room = await prisma.audioRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: "Audio room not found" }, { status: 404 });

    if (userIdToUpdate !== actingUserId && room.hostId !== actingUserId) {
      return NextResponse.json({ error: "Only the host can mute other speakers" }, { status: 403 });
    }

    const speaker = await prisma.audioRoomSpeaker.update({
      where: { audioRoomId_userId: { audioRoomId: roomId, userId: userIdToUpdate } },
      data: { isMuted: !!isMuted },
    });

    return NextResponse.json({ data: speaker });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update mute state", detail: String(err) }, { status: 500 });
  }
}

// DELETE - Leave speakers / Demote to listener
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id: roomId } = await params;
  const actingUserId = getRequestUserId(req);
  if (!actingUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { targetUserId, demoteToListener } = await req.json().catch(() => ({}));
    const userIdToDemote = targetUserId || actingUserId;

    const room = await prisma.audioRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: "Audio room not found" }, { status: 404 });

    if (userIdToDemote !== actingUserId && room.hostId !== actingUserId) {
      return NextResponse.json({ error: "Only the host can demote other speakers" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Remove from speakers
      await tx.audioRoomSpeaker.deleteMany({
        where: { audioRoomId: roomId, userId: userIdToDemote },
      });
      // Add back to listeners if specified
      if (demoteToListener) {
        await tx.audioRoomListener.upsert({
          where: { audioRoomId_userId: { audioRoomId: roomId, userId: userIdToDemote } },
          create: { audioRoomId: roomId, userId: userIdToDemote, handRaised: false },
          update: { leftAt: null, handRaised: false },
        });
      }
    });

    return NextResponse.json({ message: "Speaker removed successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to remove speaker", detail: String(err) }, { status: 500 });
  }
}
```

### 3. Audio Room Listeners: `src/app/api/audio-rooms/[id]/listeners/route.ts`
Manages joining or leaving the room as a listener.
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST - Join as listener
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: roomId } = await params;
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const room = await prisma.audioRoom.findUnique({ where: { id: roomId } });
    if (!room || !room.isActive) {
      return NextResponse.json({ error: "Active audio room not found" }, { status: 404 });
    }

    const listener = await prisma.$transaction(async (tx) => {
      // Ensure user is not speaker
      await tx.audioRoomSpeaker.deleteMany({
        where: { audioRoomId: roomId, userId },
      });
      // Upsert listener
      return tx.audioRoomListener.upsert({
        where: { audioRoomId_userId: { audioRoomId: roomId, userId } },
        create: { audioRoomId: roomId, userId, handRaised: false },
        update: { leftAt: null, handRaised: false },
      });
    });

    return NextResponse.json({ data: listener }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to join room", detail: String(err) }, { status: 500 });
  }
}

// DELETE - Leave room / Remove listener
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id: roomId } = await params;
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.audioRoomListener.deleteMany({
      where: { audioRoomId: roomId, userId },
    });
    return NextResponse.json({ message: "Left room successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to leave room", detail: String(err) }, { status: 500 });
  }
}
```

### 4. Audio Room Hand Requests: `src/app/api/audio-rooms/[id]/hand/route.ts`
Manages hand-raising toggle state.
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id: roomId } = await params;
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { handRaised } = await req.json();

    const listener = await prisma.audioRoomListener.update({
      where: { audioRoomId_userId: { audioRoomId: roomId, userId } },
      data: { handRaised: !!handRaised },
    });

    return NextResponse.json({ data: listener });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update hand status", detail: String(err) }, { status: 500 });
  }
}
```

### 5. Soundboard Sound Delete: `src/app/api/servers/[id]/soundboard/[soundId]/route.ts`
Allows deleting a custom server soundboard clip.
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string; soundId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id: serverId, soundId } = await params;
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sound = await prisma.soundboardSound.findFirst({
      where: { id: soundId, serverId },
      include: { server: true },
    });

    if (!sound) {
      return NextResponse.json({ error: "Sound not found on this server" }, { status: 404 });
    }

    // Security check: Only the sound uploader or server owner can delete it
    if (sound.userId !== userId && sound.server.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.soundboardSound.delete({
      where: { id: soundId },
    });

    return NextResponse.json({ message: "Sound deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete sound", detail: String(err) }, { status: 500 });
  }
}
```

### 6. Spotify Real API Integration: `src/app/api/spotify/search/route.ts`
Enhances search to hit Spotify Web API or fall back on mock data.
```typescript
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MOCK_TRACKS = [
  { id: "1", title: "Summer Breeze", artist: "Lofi Dreams", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "2", title: "Midnight City", artist: "Retro Wave", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "3", title: "Coffee & Books", artist: "Jazz Cafe", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "4", title: "Neon Nights", artist: "Synth Vibe", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: "5", title: "Sunny Day", artist: "Indie Folk", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!q) {
    return NextResponse.json({ data: [] });
  }

  // Fallback if keys are missing
  if (!clientId || !clientSecret) {
    const filtered = MOCK_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q.toLowerCase()) || t.artist.toLowerCase().includes(q.toLowerCase())
    );
    return NextResponse.json({ data: filtered });
  }

  try {
    // 1. Fetch Client Credentials Access Token
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      throw new Error("Spotify Auth failed");
    }

    const { access_token } = await tokenRes.json();

    // 2. Query Spotify Track Search
    const searchRes = await fetch(`https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!searchRes.ok) {
      throw new Error("Spotify Search API failed");
    }

    const searchJson = await searchRes.json();
    const tracks = (searchJson.tracks?.items || []).map((item: any) => ({
      id: item.id,
      title: item.name,
      artist: item.artists.map((a: any) => a.name).join(", "),
      previewUrl: item.preview_url, // Spotify preview URLs are MP3 clips
      coverUrl: item.album?.images?.[0]?.url,
    }));

    return NextResponse.json({ data: tracks });
  } catch (err) {
    // Fail gracefully back to mock data
    const filtered = MOCK_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q.toLowerCase()) || t.artist.toLowerCase().includes(q.toLowerCase())
    );
    return NextResponse.json({ data: filtered, warning: "Spotify credentials failed, returning mocks" });
  }
}
```

---

## C. UI Component Changes in `src/app/(main)/audio-rooms/page.tsx`
Replace the mock state machines with Server API fetches and Socket hooks:

1. **State Management**:
   ```typescript
   const [rooms, setRooms] = useState<AudioRoom[]>([]);
   const [activeRoom, setActiveRoom] = useState<AudioRoom | null>(null);
   const [isMuted, setIsMuted] = useState(true);
   const [handRaised, setHandRaised] = useState(false);
   const [currentUserRole, setCurrentUserRole] = useState<"SPEAKER" | "LISTENER" | null>(null);
   ```

2. **Fetching Active Rooms**:
   ```typescript
   const fetchRooms = async () => {
     try {
       const res = await fetch("/api/audio-rooms");
       if (res.ok) {
         const json = await res.json();
         setRooms(json.data || []);
       }
     } catch (e) {
       console.error("Failed to load audio rooms", e);
     }
   };

   useEffect(() => {
     fetchRooms();
   }, []);
   ```

3. **Room Creation Form Handler**:
   ```typescript
   const handleCreateRoom = async (e: React.FormEvent) => {
     e.preventDefault();
     try {
       const res = await fetch("/api/audio-rooms", {
         method: "POST",
         headers: { "Content-Type": "application/json", "x-user-id": currentUser.id },
         body: JSON.stringify({ title: newTitle, description: newDesc }),
       });
       if (res.ok) {
         const json = await res.json();
         setActiveRoom(json.data);
         setCurrentUserRole("SPEAKER");
         setIsMuted(false);
         setIsCreateOpen(false);
         fetchRooms();
       }
     } catch (e) {
       console.error(e);
     }
   };
   ```

4. **Joining a Room**:
   ```typescript
   const joinRoom = async (room: AudioRoom) => {
     try {
       const isHost = room.hostId === currentUser.id;
       const endpoint = isHost 
         ? `/api/audio-rooms/${room.id}/speakers` 
         : `/api/audio-rooms/${room.id}/listeners`;
         
       const res = await fetch(endpoint, {
         method: "POST",
         headers: { "Content-Type": "application/json", "x-user-id": currentUser.id }
       });

       if (res.ok) {
         setActiveRoom(room);
         setCurrentUserRole(isHost ? "SPEAKER" : "LISTENER");
         setIsMuted(isHost ? false : true);
         setHandRaised(false);
       }
     } catch (e) {
       console.error(e);
     }
   };
   ```

5. **Leaving a Room**:
   ```typescript
   const leaveRoom = async () => {
     if (!activeRoom) return;
     try {
       const endpoint = currentUserRole === "SPEAKER" 
         ? `/api/audio-rooms/${activeRoom.id}/speakers` 
         : `/api/audio-rooms/${activeRoom.id}/listeners`;

       await fetch(endpoint, {
         method: "DELETE",
         headers: { "Content-Type": "application/json", "x-user-id": currentUser.id }
       });
       
       socket?.emit("leave-audio-room", { roomId: activeRoom.id, userId: currentUser.id });
       setActiveRoom(null);
       setCurrentUserRole(null);
       fetchRooms();
     } catch (e) {
       console.error(e);
     }
   };
   ```

---

## D. Real-Time Socket.IO Synchronization Details

### 1. Client Side Event Emits & Listeners:
When the user connects to a room:
```typescript
const { socket } = useSocket();

useEffect(() => {
  if (!socket || !activeRoom) return;

  // Join the Socket.IO room channel
  socket.emit("join-audio-room", activeRoom.id);

  // Listeners for dynamic updates
  const handleUserJoined = (data: { userId: string; user: any; isSpeaker: boolean }) => {
    // Add user dynamically to local speakers or listeners array
    setActiveRoom((prev) => {
      if (!prev) return null;
      if (data.isSpeaker) {
        return {
          ...prev,
          speakers: [...prev.speakers.filter(s => s.id !== data.userId), data.user]
        };
      } else {
        return {
          ...prev,
          listeners: [...prev.listeners.filter(l => l.id !== data.userId), data.user]
        };
      }
    });
  };

  const handleUserLeft = (data: { userId: string }) => {
    setActiveRoom((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        speakers: prev.speakers.filter((s) => s.id !== data.userId),
        listeners: prev.listeners.filter((l) => l.id !== data.userId),
      };
    });
  };

  const handleStateChanged = (data: { userId: string; isMuted?: boolean; handRaised?: boolean; isSpeaker?: boolean }) => {
    setActiveRoom((prev) => {
      if (!prev) return null;
      
      // Update speakers mute state
      let updatedSpeakers = prev.speakers.map((s) => 
        s.id === data.userId ? { ...s, isMuted: data.isMuted ?? s.isMuted } : s
      );

      // Update listeners hand raise state
      let updatedListeners = prev.listeners.map((l) =>
        l.id === data.userId ? { ...l, handRaised: data.handRaised ?? l.handRaised } : l
      );

      // Handle promotion/demotion dynamically
      if (data.isSpeaker !== undefined) {
        const user = prev.speakers.find(s => s.id === data.userId) || prev.listeners.find(l => l.id === data.userId);
        if (user) {
          updatedSpeakers = updatedSpeakers.filter(s => s.id !== data.userId);
          updatedListeners = updatedListeners.filter(l => l.id !== data.userId);
          if (data.isSpeaker) {
            updatedSpeakers.push({ ...user, isMuted: data.isMuted ?? false });
          } else {
            updatedListeners.push({ ...user, handRaised: false });
          }
        }
      }

      return {
        ...prev,
        speakers: updatedSpeakers,
        listeners: updatedListeners,
      };
    });
  };

  socket.on("audio-user-joined", handleUserJoined);
  socket.on("audio-user-left", handleUserLeft);
  socket.on("audio-state-changed", handleStateChanged);

  return () => {
    socket.off("audio-user-joined", handleUserJoined);
    socket.off("audio-user-left", handleUserLeft);
    socket.off("audio-state-changed", handleStateChanged);
  };
}, [socket, activeRoom]);
```

### 2. Server Side Additions in `server.ts`:
Extend `server.ts` to handle these events:
```typescript
socket.on("join-audio-room", (roomId: string) => {
  socket.join(`audio:${roomId}`);
});

socket.on("audio-join", (data: { roomId: string; userId: string; user: any; isSpeaker: boolean }) => {
  socket.to(`audio:${data.roomId}`).emit("audio-user-joined", data);
});

socket.on("audio-leave", (data: { roomId: string; userId: string }) => {
  socket.to(`audio:${data.roomId}`).emit("audio-user-left", data);
});

socket.on("audio-state-update", (data: { roomId: string; userId: string; isMuted?: boolean; handRaised?: boolean; isSpeaker?: boolean }) => {
  socket.to(`audio:${data.roomId}`).emit("audio-state-changed", data);
});
```

---

## E. Background Playback Architecture (Optional Detail)
Since audio rooms require background playback support:
1. Propose building an `AudioPlayerProvider` or `useAudioStore` using Zustand.
2. Embed the actual HTML `<audio>` elements globally in the `src/app/(main)/layout.tsx` file:
   ```typescript
   export default function MainLayout({ children }) {
     return (
       <div className="min-h-screen bg-background">
         <Sidebar />
         <div className="md:pl-64 flex min-h-screen">
           <main className="flex-1 max-w-2xl mx-auto px-4 pb-16">{children}</main>
         </div>
         {/* Persistent Background playback player */}
         <GlobalAudioPlayer />
       </div>
     );
   }
   ```
3. When users navigate, the `GlobalAudioPlayer` stays mounted, enabling seamless playback of podcasts or anthems.

---

## F. Testing Strategy & `tests/audio_voice_test.js`
The following test script validates both API endpoint return status, authorization bounds, and model coordination.

```javascript
// tests/audio_voice_test.js
const { spawn } = require("child_process");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const io = require("socket.io-client");
const prisma = new PrismaClient();

const PORT = 3009;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== STARTING BATCH 11 AUDIO & VOICE TESTS ===");

  // 1. Resolve seed test users
  const wakkadev = await prisma.user.findUnique({ where: { username: "wakkadev" } });
  const alicedev = await prisma.user.findUnique({ where: { username: "alicedev" } });
  const bobdev = await prisma.user.findUnique({ where: { username: "bobdev" } });

  if (!wakkadev || !alicedev || !bobdev) {
    console.error("❌ Seed users wakkadev, alicedev, and bobdev must exist in the database.");
    process.exit(1);
  }

  // 2. Spawn Next.js server
  console.log(`\nSpawning Next.js server on port ${PORT}...`);
  const serverProcess = spawn(
    "npx",
    ["tsx", "server.ts"],
    {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, PORT: String(PORT), HOSTNAME: "127.0.0.1" },
      shell: true,
    }
  );

  serverProcess.stdout.on("data", (data) => {
    // console.log(`[Server Out] ${data.toString().trim()}`);
  });

  // Wait for server to start
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    try {
      const res = await fetch(`${BASE_URL}/api/spotify/search?q=lofi`);
      if (res.status === 200) {
        serverReady = true;
        break;
      }
    } catch (e) {
      // waiting
    }
  }

  if (!serverReady) {
    console.error(`❌ Server failed to start on port ${PORT}`);
    serverProcess.kill();
    process.exit(1);
  }
  console.log(`✅ Server is ready on port ${PORT}!`);

  const failures = [];

  const runTest = async (name, fn) => {
    try {
      console.log(`\nRunning test: ${name}`);
      await fn();
      console.log(`✅ Passed: ${name}`);
    } catch (err) {
      console.error(`❌ Failed: ${name}\nReason: ${err.message}`);
      failures.push({ name, error: err.message });
    }
  };

  // Ensure DB clean state before tests
  await prisma.audioRoom.deleteMany();

  // Test Case 1: Audio Room CRUD
  await runTest("Audio Room CRUD", async () => {
    // 1. Create a room
    const createRes = await fetch(`${BASE_URL}/api/audio-rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": wakkadev.id },
      body: JSON.stringify({ title: "Developers Townhall", description: "All things Next.js & Prisma" }),
    });

    if (createRes.status !== 201) {
      throw new Error(`Expected 201 Created, got ${createRes.status}`);
    }
    const createJson = await createRes.json();
    const roomId = createJson.data.id;
    if (!roomId) throw new Error("Created room ID is missing");

    // 2. Fetch active rooms
    const fetchRes = await fetch(`${BASE_URL}/api/audio-rooms`);
    const fetchJson = await fetchRes.json();
    const room = fetchJson.data.find((r) => r.id === roomId);
    if (!room || room.title !== "Developers Townhall") {
      throw new Error("Created room was not found in active rooms list");
    }
  });

  // Test Case 2: Join, Promote, and Hand Raising Toggles
  await runTest("Audio Room Speakers, Listeners, and Hands Management", async () => {
    // Create new test room
    const createRes = await fetch(`${BASE_URL}/api/audio-rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": wakkadev.id },
      body: JSON.stringify({ title: "Clubhouse Room 2" }),
    });
    const { data: room } = await createRes.json();

    // 1. Alice joins as Listener
    const joinRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/listeners`, {
      method: "POST",
      headers: { "x-user-id": alicedev.id },
    });
    if (joinRes.status !== 201) throw new Error(`Alice failed to join room: status ${joinRes.status}`);

    // 2. Alice raises hand
    const handRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/hand`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": alicedev.id },
      body: JSON.stringify({ handRaised: true }),
    });
    if (handRes.status !== 200) throw new Error(`Failed to raise hand: status ${handRes.status}`);

    const listenerRecord = await prisma.audioRoomListener.findUnique({
      where: { audioRoomId_userId: { audioRoomId: room.id, userId: alicedev.id } },
    });
    if (!listenerRecord.handRaised) throw new Error("Hand raise flag not updated in database");

    // 3. Host promotes Alice to Speaker
    const promoteRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/speakers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": wakkadev.id },
      body: JSON.stringify({ targetUserId: alicedev.id }),
    });
    if (promoteRes.status !== 200) throw new Error(`Host failed to promote Alice: status ${promoteRes.status}`);

    const isSpeaker = await prisma.audioRoomSpeaker.findUnique({
      where: { audioRoomId_userId: { audioRoomId: room.id, userId: alicedev.id } },
    });
    if (!isSpeaker) throw new Error("Alice is not registered as a speaker in the database");

    // 4. Bob (unauthorized) tries to demote Alice
    const badDemoteRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/speakers`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-user-id": bobdev.id },
      body: JSON.stringify({ targetUserId: alicedev.id }),
    });
    if (badDemoteRes.status !== 403) throw new Error(`Expected 403 for unauthorized demote, got ${badDemoteRes.status}`);
  });

  // Test Case 3: Soundboard Sound Deletion
  await runTest("Soundboard Deletion", async () => {
    // Resolve/Create server
    let server = await prisma.server.findFirst();
    if (!server) {
      server = await prisma.server.create({
        data: { name: "Test Server", ownerId: wakkadev.id },
      });
    }

    // Create a soundboard sound uploaded by Alice
    const sound = await prisma.soundboardSound.create({
      data: {
        name: "Airhorn",
        soundUrl: "http://example.com/airhorn.mp3",
        serverId: server.id,
        userId: alicedev.id,
      },
    });

    // 1. Bob (non-owner, non-uploader) tries to delete -> 403
    const badDelete = await fetch(`${BASE_URL}/api/servers/${server.id}/soundboard/${sound.id}`, {
      method: "DELETE",
      headers: { "x-user-id": bobdev.id },
    });
    if (badDelete.status !== 403) throw new Error(`Expected 403, got ${badDelete.status}`);

    // 2. Alice (uploader) deletes -> 200
    const goodDelete = await fetch(`${BASE_URL}/api/servers/${server.id}/soundboard/${sound.id}`, {
      method: "DELETE",
      headers: { "x-user-id": alicedev.id },
    });
    if (goodDelete.status !== 200) throw new Error(`Expected 200, got ${goodDelete.status}`);
  });

  // Test Case 4: Spotify Search Mock Fallback
  await runTest("Spotify Search Mock Fallback", async () => {
    const res = await fetch(`${BASE_URL}/api/spotify/search?q=Midnight`);
    const json = await res.json();
    if (json.data.length === 0 || json.data[0].title !== "Midnight City") {
      throw new Error("Spotify search fallback did not return matching mock data");
    }
  });

  // Cleanup & Termination
  console.log("\nCleaning up database records...");
  await prisma.audioRoom.deleteMany().catch(() => {});
  
  console.log("Stopping Next.js server...");
  serverProcess.kill();
  await prisma.$disconnect();

  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} tests failed!`);
    process.exit(1);
  } else {
    console.log("\n✅ All Batch 11 Integration tests passed!");
    process.exit(0);
  }
}

main();
```
