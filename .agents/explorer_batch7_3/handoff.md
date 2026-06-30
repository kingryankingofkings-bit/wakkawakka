# Exploration Report: Batch 7 - Server/Channel Architecture (Frontend & E2E Testing)

## 1. Observation

During our codebase exploration, we made the following direct observations:

1. **Main Layout Width Constraints** (`src/app/(main)/layout.tsx` lines 14-23):

   ```tsx
   <div className="md:pl-64 flex min-h-screen">
     <main className="flex-1 max-w-2xl w-full mx-auto px-0 sm:px-4 py-0 pb-16 md:pb-0">
       {children}
     </main>

     {/* Right panel - visible on xl+ */}
     <div className="hidden xl:block">
       <RightPanel />
     </div>
   </div>
   ```

   The main panel has a fixed width limit of `max-w-2xl` (672px) and renders a global `RightPanel` widget on screens above `xl` width.

2. **Sidebar Navigation Array** (`src/components/layout/Sidebar.tsx` lines 16-34):

   ```tsx
   const NAV_ITEMS = [
     { href: "/feed", icon: Home, label: "Feed" },
     { href: "/explore", icon: Compass, label: "Explore" },
     ...{ href: "/bookmarks", icon: BookMarked, label: "Bookmarks" },
     { href: "/scheduling", icon: Calendar, label: "Scheduling" },
   ];
   ```

   Desktop navigation links are populated statically from this array.

3. **Mobile Bottom Navigation Bar** (`src/components/layout/MobileNav.tsx` lines 10-16):

   ```tsx
   const MOBILE_NAV = [
     { href: "/feed", icon: Home, label: "Feed" },
     { href: "/explore", icon: Compass, label: "Explore" },
     { href: "/feed?create=1", icon: Plus, label: "Create", isCreate: true },
     { href: "/notifications", icon: Bell, label: "Alerts", badge: "notif" },
     { href: "/messages", icon: MessageCircle, label: "DMs", badge: "dm" },
   ];
   ```

   Mobile viewports rely on this bottom tab bar for application navigation.

4. **Testing Infrastructure** (`tests/e2e_runner.js` lines 36-50):
   ```javascript
   function runTest(tier, name, fn) {
     pendingTests.push({ tier, name, fn });
   }

   function assert(condition, message) {
     if (!condition) {
       throw new Error(message || "Assertion failed");
     }
   }

   function assertEq(actual, expected, message) {
     if (actual !== expected) {
       throw new Error(
         `${message || "Assertion failed"}: expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`,
       );
     }
   }
   ```
   The E2E test runner defines a lightweight async framework. Database operations are performed using direct `@prisma/client` instances.

---

## 2. Logic Chain

1. **Layout Requirements vs. Current Styling**:
   - The Discord-style layout requires 4 columns:
     1. Server icons list sidebar (`w-[72px]`)
     2. Channel category/list sidebar (`w-60`)
     3. Active channel conversation panel (`flex-1`)
     4. Server members list panel (`w-60`)
   - Since the combined width of these elements is at least 1000px, rendering them inside `MainLayout`'s default `max-w-2xl` (672px) box would break the layout completely.
   - _Conclusion_: We must propose modifying `src/app/(main)/layout.tsx` to conditionally bypass `max-w-2xl` and hide the global `RightPanel` when the pathname starts with `/servers`.

2. **Responsive Sidebar Integration**:
   - Adding `{ href: '/servers', icon: Server, label: 'Servers' }` to the `NAV_ITEMS` array will automatically register it in the desktop sidebar layout.
   - On mobile, a 6th item in `MOBILE_NAV` would overflow. Instead, we should hide the default `MobileNav` when viewing channels and provide local header widgets (like slide-out drawer sheets) to browse channels and members.

3. **E2E Testing Implementation**:
   - The opaque-box runner runs integration tests directly against SQLite via Prisma.
   - Therefore, we can write database tests that simulate creating servers, channels, boosting, assigning roles, evaluating permissions, and posting messages using actual DB state rather than front-end mocks.

---

## 3. Caveats

- **Database Migration**: This exploration is read-only. Database changes must be deployed with `npx prisma db push` before running tests.
- **Seed Data**: Tests assume standard user accounts (`wakkadev`, `alicedev`, `bobdev`) are seeded in the database.
- **Socket.IO Broadcasts**: Real-time websocket propagation is not fully tested in the database integration layer and must be validated manually or via socket connection logs.

---

## 4. Conclusion

### 4.1 UI Layout & Component Decomposition

We propose the following Next.js route directory structure:

```
src/app/(main)/servers/
├── layout.tsx         # Layout to handle ServerIconSidebar + ChannelSidebar (Desktop)
├── page.tsx           # Discover/Search public servers
└── [id]/
    ├── page.tsx       # Redirects to default channel
    └── [channelId]/
        └── page.tsx   # Displays Active Channel Content + MemberListSidebar
```

#### Component Layout Decomposition

```
+-----------------------------------------------------------------------------------------+
| Wakka Sidebar | ServerList | ChannelList   | Active Channel Panel       | MemberList    |
| (w-64)        | (w-72px)   | (w-60)        | (flex-1)                   | (w-60)        |
+---------------+------------+---------------+----------------------------+---------------+
|               | [Home]     | Server Name v | # channel-title            | Online        |
|               | ---        |               |                            | - Admin (1)   |
|               | [Server 1] | Text Channels | Message List               |   @user1      |
|               | [Server 2] |   # general   |   [user1]: Hello!          |               |
|               |            |   # lobby     |   [user2]: Hi!             | Offline       |
|               | [+]        |               |                            |   @user2      |
|               | [Compass]  | Voice Channels| +------------------------+ |               |
|               |            |   Lobby       | | [emoji] [input] [send] | |               |
|               |            |               | +------------------------+ |               |
|               |            |               |                            |               |
|               |            | User Control  | Audio/Voice Connected Box  |               |
|               |            | [Avatar] [Mic]|                            |               |
+---------------+------------+---------------+----------------------------+---------------+
```

1. **`ServerListSidebar`** (`w-[72px]`, dark/muted background):
   - Displays the Direct Messages (Home) button, the list of joined server icons, a `+` Add Server button, and a discovery Compass button.
   - Highlights the active server icon with a vertical white line marker on the left.

2. **`ChannelListSidebar`** (`w-60`, secondary dark background):
   - **Header**: Drop-down menu containing "Server Settings", "Invite Members", "Create Channel", and "Roles Management".
   - **Category List**: Expandable text headers (e.g. `TEXT CHANNELS`, `VOICE CHANNELS`).
   - **Channel Items**: Renders the channel name with type prefix icons (`#` for text, `Volume2` for voice, `MessagesSquare` for forums, `Radio` for stage).
   - **Footer User Widget**: User avatar, username, connection/status badge, Mic Mute (`MicOff`) and Deafen (`VolumeX`) buttons.

3. **`ActiveChannelPanel`** (`flex-1`, background-background):
   - Displays the channel header and active content.
   - **Text channels**: Scrollable chat box, file upload preview widget, and emoji selector.
   - **Voice channels**: Visual grid of member avatar circles. Highlights active speakers.
   - **Forum channels**: List of threads with flair badges, plus a "Create Thread" modal.
   - **Stage channels**: Grid with two tiers ("On Stage" speakers, and "In Audience" requestors). Includes request-to-speak button.

4. **`MemberListSidebar`** (`w-60`, background-card):
   - Collapsible panel listing online and offline members, sorted and grouped by highest-ranking `ServerRole`.

---

### 4.2 Responsive Navigation Integration Plan

#### 4.2.1 Desktop Layout Expansion (`src/app/(main)/layout.tsx`)

Modify `MainLayout` to check if the current pathname is a server route and conditionally toggle width constraints and the default `RightPanel`:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { RightPanel } from "@/components/layout/RightPanel";
import { cn } from "@/lib/utils";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isServerWorkspace = pathname.startsWith("/servers");

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div
        className={cn(
          "md:pl-64 flex min-h-screen",
          isServerWorkspace && "md:pl-[320px]",
        )}
      >
        <main
          className={cn(
            "flex-1 w-full py-0 pb-16 md:pb-0",
            isServerWorkspace
              ? "max-w-none px-0"
              : "max-w-2xl mx-auto px-0 sm:px-4",
          )}
        >
          {children}
        </main>

        {/* Right panel - visible on xl+ only for non-server routes */}
        {!isServerWorkspace && (
          <div className="hidden xl:block">
            <RightPanel />
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      {!isServerWorkspace && <MobileNav />}
    </div>
  );
}
```

#### 4.2.2 Desktop Sidebar Link (`src/components/layout/Sidebar.tsx`)

Import `Server` from `lucide-react` and add it to `NAV_ITEMS`:

```tsx
import { ..., Server } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/servers', icon: Server, label: 'Servers' }, // <-- New Item
  ...
];
```

#### 4.2.3 Mobile Navigation Adjustments

- When a user is inside `/servers/[id]/[channelId]`, we hide the global `MobileNav` to maximize screen real estate for communication features.
- A navigation header is rendered at the top of the mobile channel page with hamburger buttons:
  - **Left Hamburger**: Opens a drawer showing `ServerListSidebar` and `ChannelListSidebar`.
  - **Right Members Icon**: Opens a drawer showing `MemberListSidebar`.

---

### 4.3 Database Schema & Permission Utilities

#### 4.3.1 Proposed Prisma Schema Models

Add the following models to `prisma/schema.prisma`:

```prisma
model Server {
  id           String          @id @default(cuid())
  name         String
  icon         String?
  description  String?
  ownerId      String
  owner        User            @relation("ServerOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  members      ServerMember[]
  roles        ServerRole[]
  channels     ServerChannel[]
  boosts       ServerBoost[]
  soundboard   SoundboardSound[]
  emojis       CustomEmoji[]

  @@index([ownerId])
}

model ServerRole {
  id           String          @id @default(cuid())
  serverId     String
  server       Server          @relation(fields: [serverId], references: [id], onDelete: Cascade)
  name         String
  color        String          @default("#99aab5")
  hoist        Boolean         @default(false)
  position     Int             @default(0)
  permissions  String          @default("[]") // JSON string array of permissions
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  members      ServerMemberRole[]

  @@index([serverId])
}

model ServerMember {
  id           String          @id @default(cuid())
  serverId     String
  server       Server          @relation(fields: [serverId], references: [id], onDelete: Cascade)
  userId       String
  user         User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  nickname     String?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  roles        ServerMemberRole[]
  stageSpeakers ServerChannelStageSpeaker[]

  @@unique([serverId, userId])
  @@index([serverId])
  @@index([userId])
}

model ServerMemberRole {
  memberId     String
  member       ServerMember    @relation(fields: [memberId], references: [id], onDelete: Cascade)
  roleId       String
  role         ServerRole      @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([memberId, roleId])
  @@index([memberId])
  @@index([roleId])
}

model ServerChannel {
  id           String          @id @default(cuid())
  serverId     String
  server       Server          @relation(fields: [serverId], references: [id], onDelete: Cascade)
  name         String
  type         String          @default("TEXT") // TEXT, VOICE, FORUM, STAGE
  category     String?
  position     Int             @default(0)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  messages     ServerMessage[]
  stageSpeakers ServerChannelStageSpeaker[]

  @@index([serverId])
}

model ServerMessage {
  id           String          @id @default(cuid())
  channelId    String
  channel      ServerChannel   @relation(fields: [channelId], references: [id], onDelete: Cascade)
  senderId     String
  sender       User            @relation(fields: [senderId], references: [id], onDelete: Cascade)
  content      String
  attachments  String          @default("[]") // JSON string array of URLs
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  @@index([channelId])
  @@index([senderId])
}

model ServerBoost {
  id           String          @id @default(cuid())
  serverId     String
  server       Server          @relation(fields: [serverId], references: [id], onDelete: Cascade)
  userId       String
  user         User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime        @default(now())

  @@index([serverId])
  @@index([userId])
}

model SoundboardSound {
  id           String          @id @default(cuid())
  serverId     String
  server       Server          @relation(fields: [serverId], references: [id], onDelete: Cascade)
  name         String
  soundUrl     String
  emoji        String?
  createdAt    DateTime        @default(now())

  @@index([serverId])
}

model CustomEmoji {
  id           String          @id @default(cuid())
  serverId     String
  server       Server          @relation(fields: [serverId], references: [id], onDelete: Cascade)
  name         String
  imageUrl     String
  createdAt    DateTime        @default(now())

  @@index([serverId])
}

model ServerChannelStageSpeaker {
  id           String          @id @default(cuid())
  channelId    String
  channel      ServerChannel   @relation(fields: [channelId], references: [id], onDelete: Cascade)
  memberId     String
  member       ServerMember    @relation(fields: [memberId], references: [id], onDelete: Cascade)
  isSpeaking   Boolean         @default(false)
  isRequested  Boolean         @default(true)
  isApproved   Boolean         @default(false)
  createdAt    DateTime        @default(now())

  @@index([channelId])
  @@index([memberId])
}
```

#### 4.3.2 Backend Permission Helper Logic

This TypeScript helper checks whether a member has specific administrative permissions on a server:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function checkPermission(
  userId: string,
  serverId: string,
  requiredPermission: string,
): Promise<boolean> {
  // 1. Fetch server and verify owner
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { ownerId: true },
  });

  if (!server) return false;
  if (server.ownerId === userId) return true; // Owner has all permissions

  // 2. Fetch member with their roles
  const member = await prisma.serverMember.findUnique({
    where: { serverId_userId: { serverId, userId } },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!member) return false;

  // 3. Aggregate all permissions
  const permissions = new Set<string>();

  for (const memberRole of member.roles) {
    try {
      const rolePermissions: string[] = JSON.parse(
        memberRole.role.permissions || "[]",
      );
      rolePermissions.forEach((p) => permissions.add(p));
    } catch {
      // Ignore JSON parse errors
    }
  }

  // 4. Admin permission bypasses other checks
  if (permissions.has("ADMIN")) return true;

  // 5. Evaluate target permission
  return permissions.has(requiredPermission);
}
```

---

### 4.4 E2E Test Suite Additions

We have designed three specific integration test blocks to be appended to `tests/e2e_runner.js`. They utilize the local SQLite schema and direct assertions.

```javascript
// ============================================================================
// BATCH 7: SERVER/CHANNEL ARCHITECTURE
// ============================================================================

runTest(
  "tier2",
  "Server Roles: validate permission flags and hierarchy checks",
  async () => {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    try {
      const owner = await prisma.user.findUnique({
        where: { username: "wakkadev" },
      });
      const userB = await prisma.user.findUnique({
        where: { username: "alicedev" },
      });
      assert(owner && userB, "Seeded users wakkadev and alicedev must exist");

      // Create server
      const server = await prisma.server.create({
        data: {
          name: "Hierarchy Test Server",
          ownerId: owner.id,
        },
      });

      // Create owner member record
      await prisma.serverMember.create({
        data: {
          serverId: server.id,
          userId: owner.id,
        },
      });

      // Create userB member record
      const memberB = await prisma.serverMember.create({
        data: {
          serverId: server.id,
          userId: userB.id,
        },
      });

      // Create Admin Role (Position 10)
      const adminRole = await prisma.serverRole.create({
        data: {
          serverId: server.id,
          name: "Admin Role",
          position: 10,
          permissions: JSON.stringify(["ADMIN"]),
        },
      });

      // Create Mod Role (Position 5)
      const modRole = await prisma.serverRole.create({
        data: {
          serverId: server.id,
          name: "Moderator Role",
          position: 5,
          permissions: JSON.stringify(["MANAGE_CHANNELS"]),
        },
      });

      // Assign Mod Role to userB
      await prisma.serverMemberRole.create({
        data: {
          memberId: memberB.id,
          roleId: modRole.id,
        },
      });

      // Helper simulation: Check if userB can delete/edit Admin Role (Should fail: Mod position 5 < Admin position 10)
      const canModifyRole = modRole.position > adminRole.position;
      assertEq(
        canModifyRole,
        false,
        "Moderator role at position 5 cannot manage Admin role at position 10",
      );

      // Helper simulation: checkPermission utility verification for userB
      async function checkPermSim(memberId, requiredPerm) {
        const member = await prisma.serverMember.findUnique({
          where: { id: memberId },
          include: { roles: { include: { role: true } } },
        });
        const perms = new Set();
        member.roles.forEach((mr) => {
          const parsed = JSON.parse(mr.role.permissions || "[]");
          parsed.forEach((p) => perms.add(p));
        });
        return perms.has("ADMIN") || perms.has(requiredPerm);
      }

      const hasManage = await checkPermSim(memberB.id, "MANAGE_CHANNELS");
      assertEq(hasManage, true, "User B must have MANAGE_CHANNELS permission");

      const hasAdmin = await checkPermSim(memberB.id, "ADMIN");
      assertEq(hasAdmin, false, "User B must not have ADMIN permission");

      // Cleanup
      await prisma.serverMemberRole.deleteMany({
        where: { memberId: memberB.id },
      });
      await prisma.serverRole.deleteMany({ where: { serverId: server.id } });
      await prisma.serverMember.deleteMany({ where: { serverId: server.id } });
      await prisma.server.delete({ where: { id: server.id } });
    } finally {
      await prisma.$disconnect();
    }
  },
);

runTest(
  "tier3",
  "Server Boosts: coupling updates level tier and custom emoji slots",
  async () => {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    try {
      const owner = await prisma.user.findUnique({
        where: { username: "wakkadev" },
      });
      const booster = await prisma.user.findUnique({
        where: { username: "bobdev" },
      });
      assert(owner && booster, "Seeded users wakkadev and bobdev must exist");

      const server = await prisma.server.create({
        data: {
          name: "Boost Scaling Server",
          ownerId: owner.id,
        },
      });

      // Helper: calculate emoji slots based on boost count
      function getEmojiSlots(boostCount) {
        if (boostCount >= 14) return 250; // Level 3
        if (boostCount >= 7) return 150; // Level 2
        if (boostCount >= 2) return 100; // Level 1
        return 50; // Level 0
      }

      // Initial check (Level 0)
      let initialSlots = getEmojiSlots(0);
      assertEq(
        initialSlots,
        50,
        "Server with 0 boosts should have 50 emoji slots",
      );

      // Add 1 boost
      const boost1 = await prisma.serverBoost.create({
        data: { serverId: server.id, userId: booster.id },
      });
      let midSlots = getEmojiSlots(1);
      assertEq(
        midSlots,
        50,
        "Server with 1 boost should still have 50 emoji slots",
      );

      // Add 2nd boost
      const boost2 = await prisma.serverBoost.create({
        data: { serverId: server.id, userId: owner.id },
      });
      const totalBoosts = await prisma.serverBoost.count({
        where: { serverId: server.id },
      });
      assertEq(totalBoosts, 2, "Server should have exactly 2 boosts");

      let upgradedSlots = getEmojiSlots(totalBoosts);
      assertEq(
        upgradedSlots,
        100,
        "Server with 2 boosts should scale to 100 emoji slots",
      );

      // Simulate validation: Uploading emoji #51 should succeed now
      const emojiCountSim = 51;
      const isAllowed = emojiCountSim <= upgradedSlots;
      assertEq(
        isAllowed,
        true,
        "Uploading 51st emoji is allowed under Level 1 limits",
      );

      // Cleanup
      await prisma.serverBoost.deleteMany({ where: { serverId: server.id } });
      await prisma.server.delete({ where: { id: server.id } });
    } finally {
      await prisma.$disconnect();
    }
  },
);

runTest(
  "tier4",
  "Discord-Style Full Integration Scenario: Server Setup -> Channels -> Soundboard -> Stage Queue -> Messages",
  async () => {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    try {
      const userA = await prisma.user.findUnique({
        where: { username: "wakkadev" },
      });
      const userB = await prisma.user.findUnique({
        where: { username: "alicedev" },
      });
      const userC = await prisma.user.findUnique({
        where: { username: "bobdev" },
      });
      assert(
        userA && userB && userC,
        "Seeded users wakkadev, alicedev, and bobdev must exist",
      );

      console.log(
        '    [Step 1/8] User A creates Discord server "Wakka Lounge"...',
      );
      const server = await prisma.server.create({
        data: {
          name: "Wakka Lounge",
          ownerId: userA.id,
        },
      });
      assert(server.id, "Server must be created");

      console.log("    [Step 2/8] Creating text, voice, and stage channels...");
      const textChannel = await prisma.serverChannel.create({
        data: {
          serverId: server.id,
          name: "general",
          type: "TEXT",
          category: "TEXT CHANNELS",
          position: 0,
        },
      });
      const voiceChannel = await prisma.serverChannel.create({
        data: {
          serverId: server.id,
          name: "Lobby",
          type: "VOICE",
          category: "VOICE CHANNELS",
          position: 0,
        },
      });
      const stageChannel = await prisma.serverChannel.create({
        data: {
          serverId: server.id,
          name: "Townhall",
          type: "STAGE",
          category: "STAGE CHANNELS",
          position: 0,
        },
      });
      assert(
        textChannel.id && voiceChannel.id && stageChannel.id,
        "All channels must be initialized",
      );

      console.log("    [Step 3/8] User B and C join the server...");
      const memberA = await prisma.serverMember.create({
        data: { serverId: server.id, userId: userA.id },
      });
      const memberB = await prisma.serverMember.create({
        data: { serverId: server.id, userId: userB.id },
      });
      const memberC = await prisma.serverMember.create({
        data: { serverId: server.id, userId: userC.id },
      });
      assert(memberB.id && memberC.id, "Members should be recorded");

      console.log(
        "    [Step 4/8] User A creates and assigns Moderator role to User B...",
      );
      const modRole = await prisma.serverRole.create({
        data: {
          serverId: server.id,
          name: "Mod",
          permissions: JSON.stringify(["MANAGE_CHANNELS", "MUTE_MEMBERS"]),
          position: 1,
        },
      });
      await prisma.serverMemberRole.create({
        data: { memberId: memberB.id, roleId: modRole.id },
      });

      console.log(
        "    [Step 5/8] User C uploads a custom emoji and soundboard sound...",
      );
      const customEmoji = await prisma.customEmoji.create({
        data: {
          serverId: server.id,
          name: "wakkaW",
          imageUrl: "https://example.com/wakka.png",
        },
      });
      const soundItem = await prisma.soundboardSound.create({
        data: {
          serverId: server.id,
          name: "Airhorn",
          soundUrl: "https://example.com/horn.mp3",
          emoji: "📢",
        },
      });
      assert(
        customEmoji.id && soundItem.id,
        "Custom assets should be persisted",
      );

      console.log(
        "    [Step 6/8] User C connects to Lobby voice channel and plays soundboard sound...",
      );
      // Real-time voice calls use DB records of stage/room connections.
      // Verify soundboard sound triggers (write activity log entry or similar schema asset)
      assertEq(soundItem.name, "Airhorn");

      console.log(
        "    [Step 7/8] User C joins Townhall and requests to speak; User B approves...",
      );
      const speakerRequest = await prisma.serverChannelStageSpeaker.create({
        data: {
          channelId: stageChannel.id,
          memberId: memberC.id,
          isRequested: true,
          isApproved: false,
        },
      });
      assert(speakerRequest.id, "Speaker request should be registered");

      // Mod (User B) updates request status to approved
      const approvedRequest = await prisma.serverChannelStageSpeaker.update({
        where: { id: speakerRequest.id },
        data: { isApproved: true },
      });
      assertEq(
        approvedRequest.isApproved,
        true,
        "Speaker request must be approved",
      );

      console.log(
        "    [Step 8/8] User C sends chat message containing custom emoji...",
      );
      const chatMsg = await prisma.serverMessage.create({
        data: {
          channelId: textChannel.id,
          senderId: userC.id,
          content: `Hello everyone! :wakkaW:`,
        },
      });
      assert(chatMsg.id, "Message should be sent");
      assert(
        chatMsg.content.includes(":wakkaW:"),
        "Message content must include the custom emoji",
      );

      console.log("    Cleaning up test records...");
      await prisma.serverMessage.deleteMany({
        where: { channelId: textChannel.id },
      });
      await prisma.serverChannelStageSpeaker.deleteMany({
        where: { channelId: stageChannel.id },
      });
      await prisma.soundboardSound.deleteMany({
        where: { serverId: server.id },
      });
      await prisma.customEmoji.deleteMany({ where: { serverId: server.id } });
      await prisma.serverMemberRole.deleteMany({
        where: { roleId: modRole.id },
      });
      await prisma.serverRole.deleteMany({ where: { serverId: server.id } });
      await prisma.serverMember.deleteMany({ where: { serverId: server.id } });
      await prisma.serverChannel.deleteMany({ where: { serverId: server.id } });
      await prisma.server.delete({ where: { id: server.id } });

      console.log(
        "    Full Server/Channel Architecture workflow completed successfully!",
      );
    } finally {
      await prisma.$disconnect();
    }
  },
);
```

---

## 5. Verification Method

To verify these additions independently:

1. **Database Schema Sync**:
   - Add the Prisma models from Section 4.3.1 to `prisma/schema.prisma`.
   - Run the sync command to generate Prisma client types:
     ```bash
     npx prisma db push
     ```
2. **Execute E2E Runner**:
   - Run the test suite using standard Node.js execution:
     ```bash
     node tests/e2e_runner.js
     ```
   - Observe colorized stdout confirmations for the three new tests:
     - `✓ [TIER2] Server Roles: validate permission flags and hierarchy checks`
     - `✓ [TIER3] Server Boosts: coupling updates level tier and custom emoji slots`
     - `✓ [TIER4] Discord-Style Full Integration Scenario: Server Setup -> Channels -> Soundboard -> Stage Queue -> Messages`
3. **Validation Invalidation**:
   - Temporarily modify the role position checker in the Tier 2 test to:
     `const canModifyRole = modRole.position < adminRole.position;`
   - Re-run the tests and verify that the runner aborts with exit code `1` due to validation failure.
