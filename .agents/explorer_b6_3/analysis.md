# Batch 6: Live Streaming & Video Platform — Frontend Codebase Investigation & Proposals

This document analyzes the frontend architecture, state management, components layout, responsive styling, and API integration strategy for Milestone 6 (Live Streaming & Video Platform).

---

## 1. Frontend State Management

To handle the complex, real-time nature of live streaming (chat, viewer counts, co-hosting, gifts, predictions, clipping, and schedules), we propose a dual state management architecture:

1. **React Query** (`@tanstack/react-query`) for server-state synchronization (caching, mutation tracking, data fetching, optimistic updates).
2. **Zustand** (`zustand`) for transient client-only UI state (player controls, fullscreen states, active popovers, websocket comment buffering, and overlay triggers).

### 1.1. Zustand UI Store (`src/store/liveStore.ts`)

We will create a new store `useLiveStore` in `src/store/liveStore.ts` to manage client-side interactive states.

```typescript
import { create } from "zustand";

interface VideoPlayerSettings {
  isPlaying: boolean;
  volume: number; // 0 to 1
  isMuted: boolean;
  quality: "Auto" | "1080p" | "720p" | "480p";
  isFullscreen: boolean;
}

interface LiveState {
  // Navigation / Stream Context
  currentStreamId: string | null;
  selectedCategory: string | null; // Filter for browsing

  // UI Overlays & Modals
  isGoLiveOpen: boolean;
  isSchedulerOpen: boolean;
  isGiftPanelOpen: boolean;
  isPredictionPanelOpen: boolean;
  isClipCaptureOpen: boolean;

  // Simulated Video Player State
  playerSettings: VideoPlayerSettings;

  // Real-time Chat Emotes Drawer
  isEmoteDrawerOpen: boolean;

  // Floating Hearts Buffer (Transient Client Animation)
  hearts: { id: number; x: number }[];
}

interface LiveActions {
  setCurrentStreamId: (id: string | null) => void;
  setSelectedCategory: (category: string | null) => void;
  setGoLiveOpen: (open: boolean) => void;
  setSchedulerOpen: (open: boolean) => void;
  setGiftPanelOpen: (open: boolean) => void;
  setPredictionPanelOpen: (open: boolean) => void;
  setClipCaptureOpen: (open: boolean) => void;

  // Player Actions
  updatePlayerSettings: (updates: Partial<VideoPlayerSettings>) => void;
  toggleFullscreen: () => void;

  // Chat / Animation Actions
  setEmoteDrawerOpen: (open: boolean) => void;
  addHeart: (x: number) => void;
  clearHeart: (id: number) => void;
  resetUIState: () => void;
}

type LiveStore = LiveState & LiveActions;

export const useLiveStore = create<LiveStore>((set) => ({
  currentStreamId: null,
  selectedCategory: null,
  isGoLiveOpen: false,
  isSchedulerOpen: false,
  isGiftPanelOpen: false,
  isPredictionPanelOpen: false,
  isClipCaptureOpen: false,
  isEmoteDrawerOpen: false,
  hearts: [],
  playerSettings: {
    isPlaying: true,
    volume: 0.8,
    isMuted: false,
    quality: "Auto",
    isFullscreen: false,
  },

  setCurrentStreamId: (currentStreamId) => set({ currentStreamId }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setGoLiveOpen: (isGoLiveOpen) => set({ isGoLiveOpen }),
  setSchedulerOpen: (isSchedulerOpen) => set({ isSchedulerOpen }),
  setGiftPanelOpen: (isGiftPanelOpen) => set({ isGiftPanelOpen }),
  setPredictionPanelOpen: (isPredictionPanelOpen) =>
    set({ isPredictionPanelOpen }),
  setClipCaptureOpen: (isClipCaptureOpen) => set({ isClipCaptureOpen }),
  setEmoteDrawerOpen: (isEmoteDrawerOpen) => set({ isEmoteDrawerOpen }),

  updatePlayerSettings: (updates) =>
    set((state) => ({
      playerSettings: { ...state.playerSettings, ...updates },
    })),

  toggleFullscreen: () =>
    set((state) => ({
      playerSettings: {
        ...state.playerSettings,
        isFullscreen: !state.playerSettings.isFullscreen,
      },
    })),

  addHeart: (x) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      hearts: [...state.hearts, { id, x }],
    }));
  },

  clearHeart: (id) =>
    set((state) => ({
      hearts: state.hearts.filter((h) => h.id !== id),
    })),

  resetUIState: () =>
    set({
      isGiftPanelOpen: false,
      isPredictionPanelOpen: false,
      isClipCaptureOpen: false,
      isEmoteDrawerOpen: false,
      hearts: [],
    }),
}));
```

### 1.2. React Query Hooks for Server State

We will integrate React Query hooks directly into the components to fetch and mutate live streaming data. This will coordinate with the new database models:

1. `User` (adding `channelPoints: Int @default(1000)`)
2. `LiveStream` (active streaming state, host, VOD indicator)
3. `LiveStreamCoHost` (linking multi-streamers)
4. `LiveStreamGift` (persisted gift transactions)
5. `LivePrediction`, `LivePredictionOption`, `LivePredictionBet` (voting engine)
6. `LiveStreamClip` (trimmed video clips metadata)

#### Query Hooks:

- `useActiveStreams()`: Queries `/api/live/streams?active=true` using React Query. Caches list of streams, triggers background updates.
- `useScheduledStreams()`: Queries `/api/live/streams?scheduled=true`.
- `useVODArchive()`: Queries `/api/live/streams?vod=true`.
- `useStreamDetails(streamId)`: Queries `/api/live/streams/[id]`. Enabled only if `streamId` is set.
- `useStreamPredictions(streamId)`: Queries `/api/live/streams/[id]/predictions` to load active bets.

#### Mutation Hooks:

- `useCreateStreamMutation()`: Sends a `POST` request to `/api/live/streams` to create a new session (sets title, category, schedules or triggers live, and returns the stream key).
- `useEndStreamMutation(id)`: Sends a `PUT` request to `/api/live/streams/[id]` to end live streaming and save the recording as a VOD.
- `useSendGiftMutation(id)`: Sends a `POST` request to `/api/live/streams/[id]/gifts` with the gift model (deducts points from user, increments streamer balance, and returns transaction details).
- `useCreatePredictionMutation(id)`: Sends a `POST` to `/api/live/streams/[id]/predictions` to launch a new bet event.
- `useBetPredictionMutation(id)`: Sends a `POST` to `/api/live/streams/[id]/predictions` with option ID and wager amount.
- `useResolvePredictionMutation(id)`: Resolves the event by updating database state and distributing points.
- `useCreateClipMutation(id)`: Sends a `POST` to `/api/live/streams/[id]/clips` capturing the exact timestamp range.

---

## 2. Real-time Communication Integration (Socket.IO)

All dynamic overlays (hearts, chats, gift popovers, prediction state updates) require instant synchronization.
We will interface with the Socket.IO setup (already integrated via server script).

```typescript
// Proposed Socket Hook in src/hooks/useLiveSocket.ts
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useLiveStore } from "@/store/liveStore";

let socket: Socket;

export function useLiveSocket(streamId: string | null) {
  const queryClient = useQueryClient();
  const addHeart = useLiveStore((s) => s.addHeart);

  useEffect(() => {
    if (!streamId) return;

    // Establish Socket.IO connection
    socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000", {
      path: "/api/socket",
    });

    // Join the room specific to the active stream
    socket.emit("live:join", { streamId });

    // Handle incoming chat comment
    socket.on("live:chat_message", (message) => {
      // Optimistically add to React Query comments cache
      queryClient.setQueryData(["liveChat", streamId], (old: any) => {
        return old ? [...old, message] : [message];
      });
    });

    // Handle heart animations
    socket.on("live:heart", () => {
      addHeart(Math.random() * 80 + 10);
    });

    // Handle prediction updates
    socket.on("live:prediction_update", (prediction) => {
      queryClient.setQueryData(["predictions", streamId], prediction);
    });

    // Handle stream end event
    socket.on("live:stream_ended", () => {
      queryClient.invalidateQueries({ queryKey: ["stream", streamId] });
    });

    return () => {
      socket.emit("live:leave", { streamId });
      socket.disconnect();
    };
  }, [streamId, queryClient, addHeart]);

  const sendSocketMessage = (text: string) => {
    if (socket && streamId) {
      socket.emit("live:send_message", { streamId, text });
    }
  };

  const sendSocketHeart = () => {
    if (socket && streamId) {
      socket.emit("live:send_heart", { streamId });
    }
  };

  return { sendSocketMessage, sendSocketHeart };
}
```

---

## 3. Specific UI Proposals & Layout Mapping in `src/app/(main)/live/page.tsx`

We propose splitting `src/app/(main)/live/page.tsx` into a cleanly separated grid. We will replace the current file structure with a layout that handles both **Stream Index View (Category Browse, Scheduler, VODs)** and **Active Stream View (Player, Chat, Widgets)**.

### 3.1. Directory Structure Organization

While `PROJECT.md` permits placing UI files under `src/app/(main)/live/page.tsx`, we propose structuring the sub-components locally in the same directory to prevent file bloatedness (e.g. creating `src/app/(main)/live/components/` for smaller sub-parts).

- `src/app/(main)/live/components/VideoPlayer.tsx` - Handles simulator canvas, controls overlay, co-host PiP.
- `src/app/(main)/live/components/LiveChat.tsx` - Handles comment items, Custom Emotes popover, gifts list.
- `src/app/(main)/live/components/PredictionWidget.tsx` - Handles user betting card, results tracker.
- `src/app/(main)/live/components/BrowseCategories.tsx` - Handles categories filter.
- `src/app/(main)/live/components/SchedulerInterface.tsx` - Handles setup, calendar of upcoming broadcasts.
- `src/app/(main)/live/components/VODArchive.tsx` - Handles replay recordings browsing.

---

### 3.2. Detailed Component Mockups & Specific UI Changes

#### 3.2.1. Video Player Simulator (`VideoPlayer.tsx`)

Currently, the live screen is a flat gradient with a pulsating icon. We will replace this with a comprehensive Player Simulator:

- **Visual Simulator Canvas**: Renders a simulated canvas with custom visual looping effects (e.g., drawing animated waveform graphs or shifting gradients to mimic a stream feed).
- **Co-Hosting Grid Overlay**: A split-screen overlay. If the stream has active co-hosts (queried from `/api/live/streams/[id]`), the main player partitions into two side-by-side streams or a Picture-in-Picture card at the bottom-right.
- **Controls Overlay**: Appears on hover (and taps on mobile).
  - _Play/Pause Button_ (toggles Zustand store `playerSettings.isPlaying`).
  - _Volume & Mute Slider_ (adjusts Zustand store `volume` with speaker icons changing from mute to max).
  - _Resolution Picker_ (Radix dropdown menu with Auto, 1080p, 720p, 480p).
  - _Fullscreen Button_ (triggers element level RequestFullscreen api).
  - _Clip Capture Button_: An overlay icon (represented by standard scissor/film icon). When clicked, it opens a trimming dialogue panel displaying a progress bar of the "Last 30 Seconds".
- **Raid Alert Overlay**: If a raid event is triggered via Websocket, a centered overlay slides down saying `"INCOMING RAID FROM [USER] - [X] VIEWERS JOINING"` with a 5-second animated countdown bar.

#### 3.2.2. Interactive Chat & Custom Emotes (`LiveChat.tsx`)

The chat sidebar must display real-time feeds, gift purchases, raids, and prediction alerts.

- **Message Items rendering**:
  - _Normal Chat_: Small user avatar, name, and comment text.
  - _Gift Message_: Yellow/Gold bordered card containing gift icon (`🎁`, `💎`, `🚀`), name, quantity, and a flashy gradient background.
  - _Prediction Alert_: Purple bordered alert with prediction title.
  - _Co-host / Join alerts_: Grayed text notifying connection status.
- **Custom Emotes Popover**:
  - An Emote icon (e.g., Smiley face) next to the chat text input.
  - Triggering it displays a Popover containing a grid of custom emojis (e.g., `:wakkaHypers:`, `:wakkaSad:`, `:wakkaCrown:`, `:wakkaGG:`). Clicking an emote appends the shortcode to the input field, which will render as animated images in the chat feed.
- **Gift Popover Button**:
  - A Gift Icon triggers a popover showing the user's current channel points (`channelPoints` queried from user profile) and a grid of custom gifts:
    - `🎁 Gift` (Cost: 10)
    - `🌟 Star` (Cost: 50)
    - `💎 Diamond` (Cost: 100)
    - `👑 Crown` (Cost: 500)
    - `🚀 Rocket` (Cost: 1000)
  - Clicking a gift initiates the `/api/live/streams/[id]/gifts` mutation. If successful, it triggers a temporary animated element floating upwards on screen (using framer-motion sprites) and updates chat.
- **Heart Trigger Button**:
  - A floating heart icon button. When clicked, it fires the Socket event `live:send_heart` and adds a heart to the local Zustand state to animate immediately on the clicker's player.

#### 3.2.3. Prediction Widget (`PredictionWidget.tsx`)

A crucial engagement feature. Displays below the video player (or in a sidebar card).

- **Creation Panel (For Hosts)**:
  - Only visible to the channel host.
  - A form to input prediction title (e.g., "Will we win this match?") and duration (1m, 2m, 5m).
  - Two fields for Option A ("Yes / Blue") and Option B ("No / Pink").
  - "Start Prediction" button sends `POST` request to create the event.
- **User Betting Widget**:
  - Active predictions appear as a prominent purple banner above/beside the chat.
  - Displays prediction title and countdown timer.
  - Option A and Option B select buttons.
  - A points input slider/preset buttons (100, 500, 1000, Max) showing user's current points.
  - "Place Bet" button invokes the React Query bet mutation.
  - Once a bet is placed, the card transitions to show the user's bet amount and current ratios (e.g., "60% Option A - 40% Option B") with colored progress bars.
- **Resolution Panel (For Hosts)**:
  - Once the timer runs out, the host sees a resolution widget to pick the winning option (Option A or Option B). Selecting one triggers the `/api/live/streams/[id]/predictions/resolve` mutation, clearing the banner and triggering success overlays.

#### 3.2.4. Clip Button & Trimmer Dialogue (`ClipButton.tsx`)

Allows users to capture highlight moments.

- A clip button is fixed on the bottom control bar of the player.
- Clicking it opens a Modal showing a 30-second duration loading/simulation loop.
- Users can fill in a "Clip Title" (validated: 3-100 characters).
- Clicking "Save Clip" sends a `POST` request to `/api/live/streams/[id]/clips` saving clip coordinates, title, and creator ID in the sqlite database. Displays a success message with a shareable mock link.

#### 3.2.5. Category Browse (`BrowseCategories.tsx`)

To explore different genres of content, we replace the empty dashboard space with a category browse bar:

- A scrollable horizontal list of categories: `All`, `Gaming 🎮`, `Coding 💻`, `Music 🎵`, `Art 🎨`, `Talk Shows 💬`, `IRL 🌲`.
- Clicking a category updates Zustand store `selectedCategory` which filters the active streams list via React Query variables.
- Shows a count badge on each category (e.g., "Coding (3)").

#### 3.2.6. Scheduler Interface (`SchedulerInterface.tsx`)

Allows scheduling and registering for upcoming streams.

- **For Broadcasters**: A "Schedule Stream" button in the broadcast setup modal. Opens a date-time picker and title form. Submitting writes to the DB as a scheduled inactive stream.
- **For Viewers**: An "Upcoming Streams" tab on the live page listing all scheduled records. Each item displays: Creator avatar, stream title, scheduled start time (formatted as relative e.g., "Starting in 2 hours"), and a "Remind Me" bell button. Clicking the reminder bell schedules a local notification / browser toast alert when the stream goes live.

#### 3.2.7. VOD Watch Archive (`VODArchive.tsx`)

To view past broadcasts:

- A carousel/grid component labeled "Past Broadcasts (VODs)".
- Loads inactive streams where `isRecorded = true` (queried from `/api/live/streams?vod=true`).
- Displays a play icon overlay on hover, video duration, host avatar, and stream title.
- Clicking a VOD loads the simulated recording player page (similar layout, but chat is replayed asynchronously or static, and predictions are read-only).

---

## 4. Responsive Layout Styling (Tailwind Grid)

The streaming interface must adjust perfectly to various viewport sizes. We propose a full flex-grid setup that optimizes desktop sidebar placement while collapsing correctly on mobile devices.

### 4.1. Desktop Viewport Layout (>= 1024px)

- **Main Container**: `grid grid-cols-12 h-[calc(100vh-64px)] overflow-hidden w-full`
- **Player & Stream Metadata (Left Panel)**: `col-span-8 xl:col-span-9 flex flex-col h-full overflow-y-auto border-r border-border`
  - _Video Screen Wrapper_: `relative w-full aspect-video bg-black flex-shrink-0`
  - _Information Row_: Flex row with host avatar, follow/subscribe buttons, stream stats, prediction panels.
  - _Extra Tabs Section (Browse/Schedule/VODs)_: Rendered under the video details for comprehensive browsing without cluttering the screen.
- **Interactive Chat (Right Panel)**: `col-span-4 xl:col-span-3 flex flex-col h-full bg-card`
  - _Header_: Chat settings, moderation shortcuts.
  - _Messages Feed_: `flex-1 overflow-y-auto px-4 py-2`
  - _Input Area_: Sticky panel at bottom with emoji popovers, gift selectors, and floating hearts.

### 4.2. Tablet Viewport Layout (768px - 1023px)

- **Main Container**: `flex flex-col h-screen overflow-y-auto`
- **Player Area**: Fills width, standard `aspect-video` scale.
- **Chat Area**: Docked below the video player. Height set to `400px` scrollable.
- **Metadata & Browse Grid**: Appears below the chat panel.

### 4.3. Mobile Viewport Layout (< 768px)

- **Main Container**: `flex flex-col h-screen overflow-hidden`
- **Video Player**: Fixed to top `relative aspect-video w-full z-10 bg-black flex-shrink-0`.
- **Tabs Interface (Below Video)**: To fit all modules within a small layout, we employ tab buttons spanning full width:
  - `[ Chat ]` | `[ Prediction ]` | `[ Stream Info ]`
  - _Chat Tab_: Takes up remaining vertical space (`flex-1 overflow-y-auto`) with a compact input bar. Emotes popover expands as a bottom drawer overlay.
  - _Prediction Tab_: Shows the current active bet widget.
  - _Stream Info Tab_: Displays category browse cards, upcoming schedules, and VODs.

---

## 5. UI Layout Walkthrough Schema

Below is a proposed TSX outline for the fully refactored `src/app/(main)/live/page.tsx` integrating all requirements:

```tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLiveStore } from "@/store/liveStore";
import { useLiveSocket } from "@/hooks/useLiveSocket";

// Component Imports
import { VideoPlayer } from "./components/VideoPlayer";
import { LiveChat } from "./components/LiveChat";
import { PredictionWidget } from "./components/PredictionWidget";
import { BrowseCategories } from "./components/BrowseCategories";
import { SchedulerInterface } from "./components/SchedulerInterface";
import { VODArchive } from "./components/VODArchive";

export default function LivePage() {
  const { currentStreamId, setCurrentStreamId, selectedCategory } =
    useLiveStore();
  const [mobileTab, setMobileTab] = useState<"chat" | "prediction" | "info">(
    "chat",
  );

  // React Query: Fetch active streams (filtered by selected category)
  const { data: streams, isLoading } = useQuery({
    queryKey: ["activeStreams", selectedCategory],
    queryFn: () =>
      fetch(
        `/api/live/streams?active=true&category=${selectedCategory || ""}`,
      ).then((r) => r.json()),
  });

  if (!currentStreamId) {
    // -------------------------------------------------------------
    // STREAM INDEX / BROWSE VIEW
    // -------------------------------------------------------------
    return (
      <div className="min-h-screen p-4 space-y-6 max-w-7xl mx-auto pb-24">
        {/* Header & Broadcast button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Live Streaming</h1>
            <p className="text-sm text-muted-foreground">
              Watch, interact, and chat with creators
            </p>
          </div>
          <button
            onClick={() => useLiveStore.getState().setGoLiveOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-sm transition-colors"
          >
            Go Live
          </button>
        </div>

        {/* Categories Bar */}
        <BrowseCategories />

        {/* Active Streams Grid */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Live Channels
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-video bg-muted animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams?.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStreamId(s.id)}
                  className="group rounded-2xl overflow-hidden border border-border bg-card text-left transition-all hover:shadow-md"
                >
                  {/* Stream Card Details */}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Streams Section */}
        <SchedulerInterface />

        {/* VOD Archives Section */}
        <VODArchive />
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE BROADCAST VIEWER VIEW
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col lg:flex-row h-screen overflow-hidden">
      {/* Left side: Video Player + Metadata details (Desktop layout) */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Video simulation layer */}
        <div className="relative aspect-video lg:flex-1 bg-black overflow-hidden flex items-center justify-center">
          <VideoPlayer streamId={currentStreamId} />
        </div>

        {/* Stream Metadata Description Bar (Hidden/Folded on mobile tabs) */}
        <div className="hidden lg:block p-4 border-t border-border bg-card">
          <div className="flex justify-between items-start">
            {/* Stream title, tags, host, viewer count */}
          </div>
          {/* Prediction widget slot */}
          <PredictionWidget streamId={currentStreamId} />
        </div>
      </div>

      {/* Right side: Chat & Interactions (Collapses into bottom-tabs on mobile) */}
      <div className="w-full lg:w-[350px] xl:w-[400px] border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col h-[350px] lg:h-full">
        {/* Mobile Tabs Controller */}
        <div className="flex lg:hidden border-b border-border bg-muted/30">
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 ${mobileTab === "chat" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
          >
            Chat
          </button>
          <button
            onClick={() => setMobileTab("prediction")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 ${mobileTab === "prediction" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
          >
            Predictions
          </button>
          <button
            onClick={() => setMobileTab("info")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 ${mobileTab === "info" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
          >
            Stream Info
          </button>
        </div>

        {/* Tab Switcher Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {mobileTab === "chat" && <LiveChat streamId={currentStreamId} />}
          {mobileTab === "prediction" && (
            <div className="p-4 flex-1 overflow-y-auto">
              <PredictionWidget streamId={currentStreamId} />
            </div>
          )}
          {mobileTab === "info" && (
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {/* Stream Title, Streamer name, Category browse trigger */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```
