# Batch 6 Analysis & Design Proposal: Live Streaming & Video Platform

## Executive Summary

This report defines the system architecture, database models, and API endpoints for the **Live Streaming & Video Platform (Batch 6)** in the WakkaWakka application. It also provides a frontend design specification and mock layouts/flows for `src/app/(main)/live/page.tsx` to enable seamless Twitch/Kick-style real-time user experiences, including scheduling, co-hosting, chat interactions, virtual gifts, channel points, predictions, clips, and VOD archives.

---

## 1. Prisma Schema Design Projections

To support predictions, channel points, clips, and other streaming features, we propose modifying the existing SQLite schema in `prisma/schema.prisma`.

### Schema Updates

The updates add new relations to the existing `User` and `LiveStream` models, and introduce `Prediction`, `PredictionOption`, `PredictionBet`, and `Clip` models.

```prisma
// =============================================================================
// User Updates (Add to existing model User)
// =============================================================================
// Add the following fields to model User:
//   channelPoints     Int             @default(0)
//   predictionBets    PredictionBet[]
//   clipsCreated      Clip[]          @relation("ClipCreator")

// =============================================================================
// LiveStream Updates (Add to existing model LiveStream)
// =============================================================================
// Add the following fields to model LiveStream:
//   predictions       Prediction[]
//   clips             Clip[]

// =============================================================================
// Predictions & Bets
// =============================================================================
model Prediction {
  id              String             @id @default(cuid())
  liveStreamId    String
  liveStream      LiveStream         @relation(fields: [liveStreamId], references: [id], onDelete: Cascade)
  title           String             // e.g., "Will the streamer win this boss fight?"
  status          String             @default("ACTIVE") // ACTIVE, LOCKED, RESOLVED, CANCELLED
  winningOptionId String?            // Points to the winning PredictionOption.id (null until resolved)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  options         PredictionOption[]
  bets            PredictionBet[]

  @@index([liveStreamId])
}

model PredictionOption {
  id           String          @id @default(cuid())
  predictionId String
  prediction   Prediction      @relation(fields: [predictionId], references: [id], onDelete: Cascade)
  text         String          // e.g., "Yes", "No"
  totalPoints  Int             @default(0)
  bets         PredictionBet[]

  @@index([predictionId])
}

model PredictionBet {
  id           String           @id @default(cuid())
  predictionId String
  prediction   Prediction       @relation(fields: [predictionId], references: [id], onDelete: Cascade)
  optionId     String
  option       PredictionOption @relation(fields: [optionId], references: [id], onDelete: Cascade)
  userId       String
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  points       Int              // Number of channel points betted
  createdAt    DateTime         @default(now())

  @@unique([predictionId, userId]) // Limits users to one bet (one option) per prediction
  @@index([predictionId])
  @@index([userId])
}

// =============================================================================
// Clips & VODs
// =============================================================================
model Clip {
  id           String      @id @default(cuid())
  title        String
  videoUrl     String
  thumbnailUrl String
  duration     Int         // Duration of the clip in seconds
  viewsCount   Int         @default(0)
  creatorId    String
  creator      User        @relation("ClipCreator", fields: [creatorId], references: [id], onDelete: Cascade)
  liveStreamId String?
  liveStream   LiveStream? @relation(fields: [liveStreamId], references: [id], onDelete: SetNull)
  createdAt    DateTime    @default(now())

  @@index([creatorId])
  @@index([liveStreamId])
  @@index([createdAt])
}
```

---

## 2. API Endpoint Architecture

All endpoints follow the REST API design conventions established in `src/app/api` and use client-supplied or header-supplied authenticated session identifiers (`x-user-id`) verified through `getRequestUserId()`.

### 2.1 Live Streams, Co-hosting & Scheduling

#### `GET /api/live/streams`

- **Description**: List active and scheduled streams.
- **Query Params**:
  - `status`: `active` (default) | `scheduled` | `recorded` (VODs)
  - `category`: String (filter by category, e.g., "Gaming", "Music")
  - `limit`: Number (pagination, default: 10)
  - `page`: Number (pagination, default: 1)
- **Response (200 OK)**:
  ```json
  {
    "streams": [
      {
        "id": "str_123",
        "title": "Making beats live, requests welcome! 🎵",
        "host": { "id": "u4", "displayName": "Jordan Blake", "avatar": "..." },
        "viewerCount": 12400,
        "category": "Music",
        "isActive": true,
        "scheduledAt": null,
        "coHosts": []
      }
    ]
  }
  ```

#### `POST /api/live/streams`

- **Description**: Create a new stream session or schedule one.
- **Body**:
  ```json
  {
    "title": "My Epic Coding Session",
    "description": "Building a full-stack Next.js app",
    "category": "Technology",
    "scheduledAt": "2026-07-02T18:00:00.000Z" // Null for immediate live
  }
  ```
- **Response (201 Created)**: Returns stream details, including the generated `streamKey` (e.g. `live_sk_abcdef123`) and `playbackUrl` (`rtmp://live.wakkawakka.com/app`).

#### `PATCH /api/live/streams/[id]`

- **Description**: Update stream status/details. Used by the host to go live from a schedule or end a stream.
- **Body**:
  ```json
  {
    "title": "Updated Stream Title",
    "isActive": false, // Triggers stream termination
    "isRecorded": true // Converts to VOD
  }
  ```
- **Response (200 OK)**: Returns the updated stream object, including `endedAt` timestamp and `recordingUrl` (mocked).

#### `POST /api/live/streams/[id]/cohost`

- **Description**: Invite a user to join as co-host (Host only) or respond to invite (Co-host).
- **Body**:
  ```json
  {
    "userId": "u2",
    "action": "INVITE" // INVITE | ACCEPT | REJECT | LEAVE
  }
  ```
- **Response (200 OK)**: Updates `LiveStreamCoHost` table. Triggers socket event `live-cohost-update` to update co-hosting status for connected users.

---

### 2.2 Stream Chat with Emotes, Raids, and Hosts

#### `GET /api/live/streams/[id]/chat`

- **Description**: Fetch chat history for the stream.
- **Response (200 OK)**:
  ```json
  {
    "comments": [
      {
        "id": "c1",
        "user": { "displayName": "Alex" },
        "message": "Let's go!",
        "type": "COMMENT"
      },
      {
        "id": "c2",
        "user": { "displayName": "Sam" },
        "message": "Kappa",
        "type": "COMMENT"
      }
    ]
  }
  ```

#### `POST /api/live/streams/[id]/chat`

- **Description**: Post message to stream chat. Handles commands `/raid [username]` and `/host [username]` if sender is the stream host.
- **Body**:
  ```json
  {
    "message": "/raid ninja_coder", // Or plain text comments
    "type": "CHAT"
  }
  ```
- **Response (201 Created)**:
  - For plain chat: Parses content for emote codes (e.g., replacement of `:hype:` with emote image URL) and saves.
  - For `/raid`: Resolves target user's stream ID, updates target stream viewer count by host's current viewer count, triggers socket broadcast to redirect viewers, and creates a system chat entry in the target channel.
  - For `/host`: Embeds the target streamer's playback channel into the current channel player.

---

### 2.3 Tips, Bits, and Virtual Gifts

#### `POST /api/live/streams/[id]/gifts`

- **Description**: Send virtual gifts (utilizing bits or simulated payment).
- **Body**:
  ```json
  {
    "giftName": "Diamond", // Gift | Star | Diamond | Crown | Rocket
    "giftType": "BITS",
    "amount": 100, // Cost in bits/points
    "quantity": 1
  }
  ```
- **Response (200 OK)**:
  - Deducts points/wallet balance.
  - Logs entry in `LiveStreamGift` and increments `giftTotal` on stream.
  - Creates special system chat notification.
  - Emits Socket.IO `live-gift` event containing `{ giftName, quantity, sender: { displayName } }` for frontend overlay animations.

---

### 2.4 Channel Points & Predictions

#### `GET /api/live/streams/[id]/predictions`

- **Description**: Retrieve current stream prediction state.
- **Response (200 OK)**:
  ```json
  {
    "prediction": {
      "id": "pred_xyz",
      "title": "Will Sam complete the level under 5 minutes?",
      "status": "ACTIVE", // ACTIVE | LOCKED | RESOLVED | CANCELLED
      "options": [
        { "id": "opt_yes", "text": "Yes", "totalPoints": 15000 },
        { "id": "opt_no", "text": "No", "totalPoints": 5000 }
      ]
    }
  }
  ```

#### `POST /api/live/streams/[id]/predictions`

- **Description**: Unified action handler for predictions.
- **Body (Host creating prediction)**:
  ```json
  {
    "action": "CREATE",
    "title": "Will Sam beat the boss?",
    "options": ["Yes", "No"]
  }
  ```
- **Body (User placing bet)**:
  ```json
  {
    "action": "BET",
    "optionId": "opt_yes",
    "points": 500
  }
  ```
- **Body (Host resolving prediction)**:
  ```json
  {
    "action": "RESOLVE", // RESOLVE | LOCK | CANCEL
    "winningOptionId": "opt_yes"
  }
  ```
- **Response (200 OK)**:
  - `CREATE`: Inserts prediction/options records. Emits `prediction-start`.
  - `BET`: Verifies user has sufficient `channelPoints`, deducts points, adds to option pool, writes to `PredictionBet`. Emits `prediction-bet-update`.
  - `LOCK`: Prevents further betting. Sets status to `LOCKED`. Emits `prediction-lock`.
  - `RESOLVE`: Calculates payouts based on relative contributions:
    $$\text{Payout} = \text{User Bet} + \left( \frac{\text{User Bet}}{\text{Total Winning Bets}} \times \text{Total Losing Pool} \right)$$
    Updates all winners' balances in the database, sets prediction status to `RESOLVED`. Emits `prediction-resolve`.
  - `CANCEL`: Refunds all points, deletes prediction. Emits `prediction-cancel`.

---

### 2.5 Clips and VOD Archives

#### `GET /api/live/streams/[id]/clips`

- **Description**: Get all clips created from this stream.
- **Response (200 OK)**: List of clip records.

#### `POST /api/live/streams/[id]/clips`

- **Description**: Slice a clip from the stream playback.
- **Body**:
  ```json
  {
    "title": "Unbelievable headshot!",
    "duration": 30, // in seconds
    "offsetSeconds": 1200 // offset from stream start
  }
  ```
- **Response (201 Created)**: Generates a mock clip object, stores it in `Clip` model, and returns it.

---

## 3. Frontend Layout & State Architecture

We will implement a responsive layout in `src/app/(main)/live/page.tsx`. The page alternates between **Browse Mode** and **Watch Mode** using React state.

### 3.1 Directory Layout Guidelines

To conform to project standards:

- All state operations must connect to the database via API requests (no fake-only states).
- Any custom subcomponents will be co-located or placed inside `src/components` depending on global reusability.

---

### 3.2 Mock Layout & UI Design

Below is a text-based mockup of the Watch and Browse layouts.

#### 1. Browse Mode Layout

```
+--------------------------------------------------------------------------------+
|  LIVE PLATFORM                                        [ + Broadcast Setup ]    |
|                                                                                |
|  [ Gaming ] [ Music ] [ Just Chatting ] [ Talk Shows ] [ Creative ]            |
|                                                                                |
|  ACTIVE STREAMS (2)                                                            |
|  +---------------------------------+  +---------------------------------+      |
|  | [LIVE]                    12.4k |  | [LIVE]                     2.3k |      |
|  |                                 |  |                                 |      |
|  |           Streamer-A            |  |           Streamer-B            |      |
|  |                                 |  |                                 |      |
|  | Beat Making Session             |  | Coding NextJS App               |      |
|  +---------------------------------+  +---------------------------------+      |
|                                                                                |
|  SCHEDULED STREAMS (1)                VOD ARCHIVE                              |
|  * Retro Gaming Night - 8:00 PM EST    * Art Stream VOD (2h 15m)                |
+--------------------------------------------------------------------------------+
```

#### 2. Watch Mode Layout

```
+-------------------------------------------------------------+------------------+
| <- Back to Browse                  [ Host Profile Info ] [V]| Live Chat    [X] |
+-------------------------------------------------------------+------------------+
|                                                             | [Host] Hey!      |
|                                                             | [Sub] epic!      |
|      +-----------------------------------------------+      | [Sys] Gift Sent! |
|      |                                               |      |                  |
|      |               MOCK VIDEO PLAYER               |      |                  |
|      |                                               |      |                  |
|      |          [ Co-hosting overlay split ]         |      |                  |
|      |                                               |      |                  |
|      +-----------------------------------------------+      |                  |
|      | |>|  00:00 / 02:30                  [Clip That!]     |                  |
|      +-----------------------------------------------+      |                  |
|                                                             |                  |
|  PREDICTIONS WIDGET                                         |                  |
|  +--------------------------------------------------------+ |                  |
|  | "Will host win?"  [ YES: 75% ] [ NO: 25% ]             | |                  |
|  | Bet Points: [ 500  ] [ BET YES ] [ BET NO ]            | |                  |
|  +--------------------------------------------------------+ |                  |
|                                                             |------------------+
|  GIFT DRAWER: [🎁 Gift (10)] [🌟 Star (50)] [💎 Crown (500)] | [Say something..]|
+-------------------------------------------------------------+------------------+
```

---

### 3.3 Mock Frontend Code Structure for `live/page.tsx`

Below is a skeleton implementation design showing state management, API fetches, and Socket.IO integration.

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Radio, Users, Gift, MessageCircle, Heart, Send, Award, Film, Play, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

export default function LivePage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'watch' | 'vods' | 'clips'>('browse');
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [streams, setStreams] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [giftOverlay, setGiftOverlay] = useState<any>(null);
  const [channelPoints, setChannelPoints] = useState(1000);
  const socketRef = useRef<Socket | null>(null);

  // 1. Fetch Active & Scheduled Streams
  useEffect(() => {
    fetch('/api/live/streams')
      .then(res => res.json())
      .then(data => setStreams(data.streams || []));
  }, [activeTab]);

  // 2. Setup Socket.IO connection for real-time live page updates
  useEffect(() => {
    if (!selectedStream) return;

    socketRef.current = io({ path: '/api/socket' });
    const socket = socketRef.current;

    socket.emit('join-live', selectedStream.id);

    socket.on('live-comment', (comment: any) => {
      setComments(prev => [...prev, comment]);
    });

    socket.on('live-gift', (gift: any) => {
      setGiftOverlay(gift);
      setTimeout(() => setGiftOverlay(null), 3000);
    });

    socket.on('prediction-start', (pred: any) => {
      setPredictions(pred);
      toast.success('A new prediction has started!');
    });

    socket.on('prediction-resolve', (data: any) => {
      setPredictions(null);
      setChannelPoints(data.newBalance);
      toast.success(`Prediction resolved! Winning option: ${data.winningOptionText}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedStream]);

  // Interaction Handlers
  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    const res = await fetch(`/api/live/streams/${selectedStream.id}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: commentText }),
    });
    if (res.ok) {
      const data = await res.json();
      socketRef.current?.emit('live-comment', { streamId: selectedStream.id, comment: data.comment });
      setCommentText('');
    }
  };

  const handleSendGift = async (gift: any) => {
    const res = await fetch(`/api/live/streams/${selectedStream.id}/gifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ giftName: gift.name, amount: gift.cost }),
    });
    if (res.ok) {
      const data = await res.json();
      socketRef.current?.emit('live-gift', { streamId: selectedStream.id, gift: data.gift });
    }
  };

  const handlePlaceBet = async (optionId: string) => {
    const res = await fetch(`/api/live/streams/${selectedStream.id}/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'BET', optionId, points: betAmount }),
    });
    if (res.ok) {
      const data = await res.json();
      setChannelPoints(data.newBalance);
      toast.success('Bet placed successfully!');
    } else {
      toast.error('Failed to place bet. Check points balance.');
    }
  };

  const handleClipStream = async () => {
    const res = await fetch(`/api/live/streams/${selectedStream.id}/clips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Clip by User - ${new Date().toLocaleTimeString()}`, duration: 30 }),
    });
    if (res.ok) {
      toast.success('Clip created and archived successfully!');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Dynamic view switcher based on activeTab and selectedStream */}
      {selectedStream ? (
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Main Video View & Interactive Widgets */}
          <div className="flex-1 p-4 flex flex-col gap-4">
            <div className="aspect-video bg-black rounded-3xl relative overflow-hidden flex items-center justify-center">
              <span className="text-white text-lg">Stream Playback Window</span>
              {/* Co-hosting Split View overlay */}
              {selectedStream.coHosts && selectedStream.coHosts.length > 0 && (
                <div className="absolute inset-y-0 right-0 w-1/2 border-l border-white/20 bg-muted/40 backdrop-blur flex items-center justify-center">
                  <span className="text-white text-sm">Co-Host Split View</span>
                </div>
              )}
            </div>

            {/* Controls & Actions Row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">{selectedStream.title}</h1>
                <p className="text-sm text-muted-foreground">{selectedStream.host.displayName}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleClipStream}>
                  <Film className="h-4 w-4 mr-2" /> Clip That!
                </Button>
              </div>
            </div>

            {/* Predictions Widget */}
            {predictions && (
              <div className="p-4 bg-muted/40 border border-border rounded-2xl">
                <h3 className="font-semibold text-sm mb-2">{predictions.title}</h3>
                <div className="flex gap-4 mb-3">
                  {predictions.options.map((opt: any) => (
                    <Button key={opt.id} className="flex-1" onClick={() => handlePlaceBet(opt.id)}>
                      Bet {opt.text} ({opt.totalPoints} pts)
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Bet points:</span>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="w-20 bg-background border border-border rounded p-1 text-sm text-center"
                  />
                  <span className="text-xs text-muted-foreground ml-auto">Balance: {channelPoints} pts</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Chat panel */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border flex flex-col h-[500px] lg:h-auto">
            <div className="p-3 border-b border-border font-semibold flex items-center justify-between">
              <span>Stream Chat</span>
              <Button size="xs" variant="ghost" onClick={() => setSelectedStream(null)}>Close</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {comments.map((cmt) => (
                <div key={cmt.id} className="text-sm">
                  <span className="font-bold mr-1.5">{cmt.user.displayName}:</span>
                  <span>{cmt.message}</span>
                </div>
              ))}
            </div>
            {/* Input form */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Send chat..."
                className="flex-1 bg-muted border border-border rounded-xl px-3 py-1.5 text-sm"
              />
              <Button size="sm" onClick={handleSendComment}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* Main Browse Dashboard */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Radio className="h-6 w-6 text-red-500 animate-pulse" /> Live Streaming
            </h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <div
                key={stream.id}
                onClick={() => setSelectedStream(stream)}
                className="cursor-pointer border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-muted relative">
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 text-xs rounded-full font-bold">LIVE</div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 text-xs rounded-full flex items-center gap-1">
                    <Users className="h-3 w-3" /> {stream.viewerCount}
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3">
                  <Avatar src={stream.host.avatar} name={stream.host.displayName} size="sm" />
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1">{stream.title}</h3>
                    <p className="text-xs text-muted-foreground">{stream.host.displayName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 4. Workflows & State Flows (Detailed)

### 4.1 Predictions Workflow

```
[Host Creates Prediction]
    |
    v
API: POST /api/live/streams/[id]/predictions (action: CREATE)
    |
    +---> DB: Inserts Prediction & Options. Deducts points if wagered.
    +---> Socket: Emits `prediction-start` to all viewers.
    |
[Viewer Views Widget & Bets]
    |
    v
API: POST /api/live/streams/[id]/predictions (action: BET)
    |
    +---> DB: Checks viewer channelPoints. Deducts points. Updates option totalPoints.
    +---> Socket: Emits `prediction-bet-update` (re-calculates current split).
    |
[Host Resolves Prediction]
    |
    v
API: POST /api/live/streams/[id]/predictions (action: RESOLVE)
    |
    +---> DB: Computes payouts. Adds points to winners' balance. Sets status to RESOLVED.
    +---> Socket: Emits `prediction-resolve` to update UI and client point balances.
```

### 4.2 Stream Raid Workflow

```
[Host issues command: /raid TARGET_USER]
    |
    v
API: POST /api/live/streams/[id]/chat (message: "/raid TARGET_USER", type: CHAT)
    |
    +---> DB: Retrieves target user's stream ID (TARGET_STREAM_ID).
    +---> DB: Transfers host stream viewers count to TARGET_STREAM_ID.
    +---> DB: Writes "RAID" system comment in TARGET_STREAM_ID chat.
    |
[Redirect Viewers]
    |
    v
Socket: Broadcasts `live-raid-start` event to current room containing TARGET_STREAM_ID.
    |
    +---> Client: Connected clients display a countdown "Raiding TARGET_USER in 5s...".
    +---> Client: Auto-redirects client path to `?stream=TARGET_STREAM_ID`.
```

---

## 5. Verification Plan

To verify the implementation once applied:

1. **Database push**: Run `npm run db:push` followed by `npm run db:generate` to ensure new schema compiling is clean and SQLite is updated.
2. **API Endpoint Verification**:
   - Use the opaque-box e2e runner or mock HTTP requests to verify API routes.
   - Verify points are correctly deducted on bet and paid out on resolution.
3. **Socket IO Event validation**:
   - Inspect Socket.IO connection logs and verify broadcast messages (chat, gifts, predictions) are emitted properly.
