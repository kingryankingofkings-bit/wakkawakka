# Codebase Investigation & Implementation Proposals

## 1. Fake Components Cleanup Audit

The codebase currently contains several fake components and in-memory data files designed for mockup previews. Below is the list of these files, where they are imported and rendered, and their corresponding line numbers:

### 1.1. CommerceToolsConsole (CommerceToolsConsole.tsx / batch5Data.ts)

- **Component Location**: `src/components/commerce/CommerceToolsConsole.tsx`
- **Data File Location**: `src/components/commerce/batch5Data.ts`
- **Usage / Import Locations**:
  - `src/app/(main)/analytics/page.tsx`:
    - Line 12: `import CommerceToolsConsole from '@/components/commerce/CommerceToolsConsole';`
    - Line 301: `<CommerceToolsConsole />` (rendered in the analytics page body)
  - `src/app/(main)/shop/page.tsx`:
    - Line 15: `import CommerceToolsConsole from '@/components/commerce/CommerceToolsConsole';`
    - Line 429: `<CommerceToolsConsole />` (rendered in the shop page body)

### 1.2. ProfileCommunityConsole (ProfileCommunityConsole.tsx / featuresBatch2Data.ts)

- **Component Location**: `src/components/profile/ProfileCommunityConsole.tsx`
- **Data File Location**: `src/components/profile/featuresBatch2Data.ts`
- **Usage / Import Locations**:
  - `src/app/(main)/communities/page.tsx`:
    - Line 11: `import ProfileCommunityConsole from '@/components/profile/ProfileCommunityConsole';`
    - Line 70: `<ProfileCommunityConsole />` (rendered in the communities page body)
  - `src/components/profile/EditProfileModal.tsx`:
    - Line 10: `import ProfileCommunityConsole from './ProfileCommunityConsole';`
    - Line 384: `<ProfileCommunityConsole />` (rendered in the edit profile modal body)

### 1.3. ContentFeedConsole (ContentFeedConsole.tsx / batch3Data.ts)

- **Component Location**: `src/components/feed/ContentFeedConsole.tsx`
- **Data File Location**: `src/components/feed/batch3Data.ts`
- **Usage / Import Locations**:
  - `src/app/(main)/explore/page.tsx`:
    - Line 13: `import { ContentFeedConsole } from '@/components/feed/ContentFeedConsole';`
    - Line 161: `<ContentFeedConsole />` (rendered in the explore page body)
  - `src/app/(main)/feed/page.tsx`:
    - Line 12: `import { ContentFeedConsole } from '@/components/feed/ContentFeedConsole';`
    - Line 144: `<ContentFeedConsole />` (rendered in the main feed page layout)

### 1.4. MessagingFeaturesConsole (MessagingFeaturesConsole.tsx / batch4Data.ts)

- **Component Location**: `src/components/messaging/MessagingFeaturesConsole.tsx`
- **Data File Location**: `src/components/messaging/batch4Data.ts`
- **Usage / Import Locations**:
  - `src/app/(main)/messages/page.tsx`:
    - Line 11: `import MessagingFeaturesConsole from '@/components/messaging/MessagingFeaturesConsole';`
    - Line 122: `<MessagingFeaturesConsole />` (rendered in the conversations sidebar / messages list)
  - `src/components/messaging/ChatWindow.tsx`:
    - Line 26: `import MessagingFeaturesConsole from './MessagingFeaturesConsole';`
    - Line 580: `<MessagingFeaturesConsole />` (rendered as side drawer panel for desktop)
    - Line 605: `<MessagingFeaturesConsole />` (rendered as fullscreen panel for mobile)

### 1.5. FeatureRegistry (FeatureRegistry.tsx / featuresData.ts)

- **Component Location**: `src/components/settings/FeatureRegistry.tsx`
- **Data File Location**: `src/components/settings/featuresData.ts`
- **Usage / Import Locations**:
  - `src/app/(main)/settings/page.tsx`:
    - Line 14: `import FeatureRegistry from '@/components/settings/FeatureRegistry';`
    - Line 544: `<FeatureRegistry />` (rendered under settings tab content)

---

## 2. Prisma Schema & Database Model Analysis

We analyzed the `prisma/schema.prisma` file and verified the state of the database models in relation to the desired features:

### 2.1. Reactions Model

- **Existing Models**:
  - The `Like` model in `prisma/schema.prisma` represents reactions for posts and comments. It features:
    ```prisma
    model Like {
      id        String   @id @default(cuid())
      userId    String
      user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      postId    String?
      post      Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
      commentId String?
      comment   Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
      type      String   @default("LIKE") // Maps to ReactionType: LIKE, LOVE, HAHA, WOW, SAD, ANGRY
      createdAt DateTime @default(now())

      @@unique([userId, postId])
      @@unique([userId, commentId])
      ...
    }
    ```
  - The `MessageReaction` model (lines 350–360) stores reactions for direct messages (DMs):
    ```prisma
    model MessageReaction {
      id        String   @id @default(cuid())
      messageId String
      message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
      userId    String
      emoji     String
      createdAt DateTime @default(now())

      @@unique([messageId, userId, emoji])
    }
    ```
- **Verdict**: The database structure for reactions is **completely pre-defined**. We can leverage the `type` field on the `Like` table to store reaction strings (e.g., `LOVE`, `HAHA`) without adding new database tables.

### 2.2. Voice Messages Model

- **Existing Models**:
  - There is no dedicated `VoiceMessage` model in the schema.
  - However, the `Message` model has a flexible structure that naturally accommodates audio voice messages:
    ```prisma
    model Message {
      id             String       @id @default(cuid())
      conversationId String
      conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
      senderId       String
      sender         User         @relation(fields: [senderId], references: [id], onDelete: Cascade)
      content        String?
      mediaUrl       String?      // Can store the path to the recorded audio file
      type           String       @default("TEXT") // Can be updated to "VOICE" or "AUDIO"
      isRead         Boolean      @default(false)
      isDeleted      Boolean      @default(false)
      ...
    }
    ```
- **Verdict**: No new table is required. Voice messages can be modeled by writing a record to the `Message` table with `type: "VOICE"` (or `mediaType: "audio"` on the frontend) and storing the audio upload path in the `mediaUrl` field.

### 2.3. Content Moderation & Reporting Models

- **Existing Models**:
  - A full `Report` model is already defined in `prisma/schema.prisma` (lines 768–794):
    ```prisma
    model Report {
      id          String    @id @default(cuid())
      reporterId  String
      reporter    User      @relation("ReportSource", fields: [reporterId], references: [id], onDelete: Cascade)
      targetId    String
      targetType  String    // e.g., "POST", "COMMENT", "COMMUNITY", "USER"
      reason      String    // SPAM | HARASSMENT | HATE_SPEECH | NUDITY | VIOLENCE | etc.
      description String?
      status      String    @default("PENDING") // PENDING | REVIEWED | RESOLVED | DISMISSED
      resolvedAt  DateTime?
      resolvedBy  String?
      resolution  String?
      createdAt   DateTime  @default(now())
      updatedAt   DateTime  @updatedAt

      post        Post?      @relation("ReportedPost",      fields: [postId], references: [id])
      postId      String?
      comment     Comment?   @relation("ReportedComment",   fields: [commentId], references: [id])
      commentId   String?
      community   Community? @relation("ReportedCommunity", fields: [communityId], references: [id])
      communityId String?
      ...
    }
    ```
  - The `User` model also supports administrative status flags:
    - `User.isAdmin` (Boolean, defaults to `false`)
    - `User.isBanned` (Boolean, defaults to `false`)
    - `User.bannedAt` (DateTime)
    - `User.bannedReason` (String)
- **Verdict**: The database structure for content moderation and reporting is **already complete**. No new tables or schema changes are needed. We simply need to build the API endpoints and the frontend flow to utilize these fields.

---

## 3. Core Feature Implementation Proposals

### 3.1. REAL "Reactions" Feature

The goal is to replace the current client-side-only reaction flow (which updates a local Zustand store) with database persistence.

#### A. API Route Setup: `POST /api/posts/[id]/react/route.ts`

This API handler will toggle or update reactions on a post. It executes in a database transaction to keep the post's cached `likesCount` consistent.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";
import { ReactionType } from "@/types";

const VALID_REACTIONS: ReactionType[] = [
  "LIKE",
  "LOVE",
  "HAHA",
  "WOW",
  "SAD",
  "ANGRY",
];

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const postId = params.id;
  const userId = getRequestUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type } = await req.json();

    if (!type || !VALID_REACTIONS.includes(type)) {
      return NextResponse.json(
        { error: "Invalid reaction type" },
        { status: 400 },
      );
    }

    // Check if post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if reaction already exists
    const existing = await prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    let updatedPost;

    if (existing) {
      if (existing.type === type) {
        // Toggle off: Delete the reaction and decrement likesCount
        await prisma.$transaction([
          prisma.like.delete({
            where: { id: existing.id },
          }),
          prisma.post.update({
            where: { id: postId },
            data: { likesCount: { decrement: 1 } },
          }),
        ]);
      } else {
        // Change reaction type: Update existing type, likesCount stays same
        await prisma.like.update({
          where: { id: existing.id },
          data: { type },
        });
      }
    } else {
      // Create new reaction: Create row and increment likesCount
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            postId,
            type,
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
    }

    // Fetch final updated post details to return
    updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        collaborators: true,
        likes: {
          where: { userId },
          select: { type: true },
        },
      },
    });

    const responseData = {
      ...updatedPost,
      userReaction: updatedPost?.likes[0]?.type || null,
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error("Failed to react:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

#### B. Frontend Integration

1.  **Zustand Store (`src/store/feedStore.ts`)**: Add a method to load posts from the database via `/api/posts` instead of local mock arrays.
2.  **Hook Update (`src/hooks/usePosts.ts`)**: Refactor `reactToPost` to perform a real network request:
    ```typescript
    const reactToPost = useCallback(
      async (postId: string, reaction: ReactionType) => {
        // Optimistically update frontend store
        const originalPost = posts.find((p) => p.id === postId);
        if (!originalPost) return;

        const wasReacted = originalPost.userReaction === reaction;
        updatePost(postId, {
          userReaction: wasReacted ? undefined : reaction,
          likesCount: wasReacted
            ? originalPost.likesCount - 1
            : originalPost.likesCount + 1,
        });

        // Call API
        try {
          const res = await fetch(`/api/posts/${postId}/react`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": CURRENT_USER.id, // Auth header fallback
            },
            body: JSON.stringify({ type: reaction }),
          });

          if (!res.ok) throw new Error("API failed");

          const { data } = await res.json();
          // Sync post data returned from the server
          updatePost(postId, {
            likesCount: data.likesCount,
            userReaction: data.userReaction,
          });
        } catch (err) {
          // Rollback optimistic update
          updatePost(postId, {
            userReaction: originalPost.userReaction,
            likesCount: originalPost.likesCount,
          });
          toast.error("Failed to register reaction");
        }
      },
      [posts, updatePost],
    );
    ```

---

### 3.2. REAL "Voice Messages" Feature

Enables capturing microphone audio in chats, uploading it to the server, and rendering an interactive playback UI.

#### A. Audio Upload API: `POST /api/upload/route.ts`

Handles uploading the recorded `.webm` or `.mp3` blob to the local filesystem under the `public/` directory.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public directory
    const uploadDir = join(process.cwd(), "public", "uploads", "audio");
    await mkdir(uploadDir, { recursive: true });

    const filename = `voice-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webm`;
    const filePath = join(uploadDir, filename);

    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/audio/${filename}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Audio upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

#### B. Messaging API Endpoint: `POST /api/messages/route.ts`

When the client successfully uploads the audio, it sends a request to save the message with `type: "VOICE"` (or `mediaType: "audio"`) and the file URL:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { conversationId, mediaUrl, content } = await req.json();

    const newMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content || "",
        mediaUrl,
        type: mediaUrl ? "VOICE" : "TEXT",
      },
      include: {
        sender: true,
      },
    });

    // Update conversation metadata
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ data: newMessage }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

#### C. Frontend Recording UI (`src/components/messaging/ChatWindow.tsx`)

Create a recording state that records chunks from the microphone when clicking/holding a microphone button:

```typescript
const [isRecording, setIsRecording] = useState(false);
const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
const [recordingDuration, setRecordingDuration] = useState(0);
const timerRef = useRef<NodeJS.Timeout | null>(null);

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: "audio/webm" });
      // Stop stream tracks
      stream.getTracks().forEach((track) => track.stop());

      // Send to server
      await uploadVoiceMessage(audioBlob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    setRecordingDuration(0);

    timerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  } catch (err) {
    toast.error("Microphone access denied");
  }
};

const stopRecording = (shouldSend = true) => {
  if (!mediaRecorder) return;
  if (timerRef.current) clearInterval(timerRef.current);

  if (!shouldSend) {
    // Cancel recording: discard chunks
    mediaRecorder.onstop = () => {
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    };
  }

  mediaRecorder.stop();
  setIsRecording(false);
  setMediaRecorder(null);
};

const uploadVoiceMessage = async (blob: Blob) => {
  const formData = new FormData();
  formData.append("file", blob, "voice.webm");

  try {
    // 1. Upload audio file
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!uploadRes.ok) throw new Error("Upload failed");
    const { url } = await uploadRes.json();

    // 2. Post message metadata
    const msgRes = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": CURRENT_USER.id,
      },
      body: JSON.stringify({ conversationId, mediaUrl: url }),
    });

    if (!msgRes.ok) throw new Error("Message posting failed");
    const { data } = await msgRes.json();

    // 3. Emit via socket and update local messages
    addMessage(data);
    if (socket) socket.emit("send-message", { conversationId, message: data });
  } catch {
    toast.error("Failed to send voice message");
  }
};
```

#### D. Voice Playback Component (`src/components/messaging/MessageBubble.tsx`)

Render a custom playback container with controls styled via Tailwind:

```typescript
function VoicePlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-2.5 min-w-[200px] border border-border">
      <button onClick={togglePlay} className="p-2 bg-primary text-primary-foreground rounded-full hover:scale-105 transition-transform">
        {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex flex-col flex-1 gap-1">
        {/* Progress Slider */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => {
            if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
          }}
          className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
```

---

### 3.3. REAL "Content Moderation/Reporting" Feature

Provides a report submission overlay for users and a review dashboard queue for admins.

#### A. Submit Report API: `POST /api/reports/route.ts`

Allows any logged-in user to report a post, comment, or community.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { targetId, targetType, reason, description } = await req.json();

    if (!targetId || !targetType || !reason) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        targetId,
        targetType,
        reason,
        description,
        // Map to explicit schema relationships
        postId: targetType === "POST" ? targetId : null,
        commentId: targetType === "COMMENT" ? targetId : null,
        communityId: targetType === "COMMUNITY" ? targetId : null,
      },
    });

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    console.error("Reporting error:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 },
    );
  }
}
```

#### B. Moderation Queue API: `GET & PATCH /api/admin/reports/route.ts`

Enables administrators to view pending flags and resolve them (which updates report status and takes actions like removing posts or banning creators).

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/currentUser";

// Helper to check admin access
async function verifyAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  return user?.isAdmin === true;
}

// GET: Fetch reports list (Admin only)
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: { id: true, username: true, displayName: true },
        },
        post: {
          include: { author: true },
        },
        comment: {
          include: { author: true },
        },
        community: true,
      },
    });
    return NextResponse.json({ data: reports });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}

// PATCH: Resolve or Dismiss report (Admin only)
export async function PATCH(req: NextRequest) {
  const admin = await getRequestUser(req);
  if (!admin || !admin.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { reportId, status, action, resolution } = await req.json();

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report)
      return NextResponse.json({ error: "Report not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // 1. Update report resolution status
      await tx.report.update({
        where: { id: reportId },
        data: {
          status, // 'RESOLVED' or 'DISMISSED'
          resolvedAt: new Date(),
          resolvedBy: admin.id,
          resolution: resolution || `Resolved with action: ${action}`,
        },
      });

      // 2. If content removal is requested, perform action
      if (status === "RESOLVED" && action === "REMOVE_CONTENT") {
        if (report.targetType === "POST") {
          await tx.post.update({
            where: { id: report.targetId },
            data: { isDeleted: true, deletedAt: new Date() },
          });
        } else if (report.targetType === "COMMENT") {
          await tx.comment.update({
            where: { id: report.targetId },
            data: { isDeleted: true, deletedAt: new Date() },
          });
        }
      }

      // 3. If user ban is requested, ban content owner
      if (status === "RESOLVED" && action === "BAN_USER") {
        let userIdToBan = "";
        if (report.targetType === "POST") {
          const p = await tx.post.findUnique({
            where: { id: report.targetId },
          });
          if (p) userIdToBan = p.authorId;
        } else if (report.targetType === "COMMENT") {
          const c = await tx.comment.findUnique({
            where: { id: report.targetId },
          });
          if (c) userIdToBan = c.authorId;
        }

        if (userIdToBan) {
          await tx.user.update({
            where: { id: userIdToBan },
            data: {
              isBanned: true,
              bannedAt: new Date(),
              bannedReason: resolution || "Violated community guidelines",
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Moderation action failed:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
```

#### C. Moderation Dashboard Queue UI (`src/app/(admin)/moderation/page.tsx`)

Create a dashboard to manage reports using clean grid cards:

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function ModerationQueue() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    try {
      const res = await fetch('/api/admin/reports', {
        headers: { 'x-user-id': 'admin-user-id' } // Admin auth identifier
      });
      const data = await res.json();
      setReports(data.data || []);
    } catch {
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQueue(); }, []);

  const handleAction = async (reportId: string, status: 'RESOLVED' | 'DISMISSED', action: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'admin-user-id' },
        body: JSON.stringify({ reportId, status, action }),
      });
      if (res.ok) {
        toast.success(`Action applied successfully`);
        loadQueue();
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Failed to perform moderation action');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading queue...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin Moderation Queue</h1>
      <div className="grid gap-4">
        {reports.length === 0 ? (
          <p className="text-muted-foreground text-sm">No items in the moderation queue.</p>
        ) : (
          reports.map((report: any) => (
            <div key={report.id} className="p-4 border rounded-xl bg-card space-y-3 flex justify-between items-start">
              <div>
                <span className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-600 rounded-full font-bold uppercase">
                  {report.status}
                </span>
                <p className="text-sm font-semibold mt-1">Reported {report.targetType} ({report.reason})</p>
                <p className="text-xs text-muted-foreground">By @{report.reporter.username} · {new Date(report.createdAt).toLocaleString()}</p>
                {report.description && <p className="text-sm text-muted-foreground bg-muted p-2.5 rounded-lg mt-2 italic">"{report.description}"</p>}

                {/* Content previews */}
                {report.postId && report.post && (
                  <div className="border-l-4 border-primary pl-3 text-sm text-foreground/80 mt-2 bg-muted/20 py-1">
                    <strong>Post Content:</strong> {report.post.content}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleAction(report.id, 'DISMISSED', 'NONE')} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted font-semibold">
                  Dismiss
                </button>
                <button onClick={() => handleAction(report.id, 'RESOLVED', 'REMOVE_CONTENT')} className="px-3 py-1.5 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold">
                  Remove Content
                </button>
                <button onClick={() => handleAction(report.id, 'RESOLVED', 'BAN_USER')} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
                  Ban Creator
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```
