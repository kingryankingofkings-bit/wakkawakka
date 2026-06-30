# Handoff Report: Server/Channel Architecture (Batch 7) Exploration

## 1. Observation

The following details were directly observed in the codebase:

- **Database Engine**: `prisma/schema.prisma` lines 12-15 specifies the SQLite provider:
  ```prisma
  datasource db {
    provider = "sqlite"
    url      = env("DATABASE_URL")
  }
  ```
- **User Model**: `prisma/schema.prisma` lines 42-162 defines the `User` model, which uses CUIDs as primary keys:
  ```prisma
  model User {
    id                 String    @id @default(cuid())
    username           String    @unique
    displayName        String
    avatar             String?
    // ...
  }
  ```
- **API and Auth Paradigms**: `src/lib/currentUser.ts` shows the standard user resolution:
  ```typescript
  export function getRequestUserId(
    req: NextRequest,
    bodyUserId?: string,
  ): string | null {
    const header = req.headers.get("x-user-id");
    if (header) return header;
    const q = req.nextUrl.searchParams.get("userId");
    if (q) return q;
    return bodyUserId ?? null;
  }
  ```
- **REST Endpoints**: In `src/app/api/communities/route.ts` and `src/app/api/communities/[id]/route.ts`, database transactions and nested includes are widely used, returning JSON structures via `NextResponse.json({ data })`.
- **Real-Time Layer**: `server.ts` uses Socket.IO running on a custom server to handle real-time interactions such as chat messages, typing events, and streaming:
  ```typescript
  io.on("connection", (socket: Socket) => {
    socket.on("join-conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });
    // ...
  });
  ```

---

## 2. Logic Chain

- **SQLite Array/Enum Constraint**: Since SQLite does not support native enums or scalar list types (like `String[]`), we must model lists of strings—such as roles permissions (e.g. `['ADMIN', 'SEND_MESSAGES']`) or channel permission overwrites—using serialized JSON strings (`String @default("[]")`) and validate them in the application layer. This matches the existing convention in `prisma/schema.prisma` where list-like fields (such as `mediaUrls` or `tags` in `Post`) are modeled as `String @default("[]")`.
- **Implicit Many-to-Many Relationships**: In SQLite, Prisma supports implicit many-to-many relationships (e.g., between `ServerMember` and `ServerRole`). This generates a clean backing join table without requiring manual join-table models, aligning with Prisma best practices.
- **REST Routing & Authentication**: The proposed endpoints must use Next.js App Router dynamic routes (`/api/servers/[id]/...`). They will retrieve user identity via `getRequestUserId(req)` and verify if the user has corresponding permissions before editing, updating, or deleting resources.
- **Real-Time Integration**: To handle Discord-style real-time features, the Socket.IO setup in `server.ts` should be expanded to listen for events like `join-server-channel`, `send-server-message`, and `voice-state-update`.

---

## 3. Caveats

- **Read-Only Scoping**: No modifications were made to the source code or `prisma/schema.prisma` directly.
- **SQLite Performance under Scale**: SQLite handles concurrent write-locks using database-level locking. Under massive concurrent server message writes, application-level debouncing or socket message batching might be required, though this is out-of-scope for the schema design phase.
- **E2E Testing**: Boundary condition verification is dependent on the E2E runner setup, which will need to be written and tested once the endpoints are implemented.

---

## 4. Conclusion

Below is the complete proposed database schema, relationship mapping, and API specifications for the Discord-style Server/Channel Architecture.

### Proposed Prisma Models

Add the following blocks to `prisma/schema.prisma`.

```prisma
// =============================================================================
// Server/Channel Architecture (Batch 7)
// =============================================================================

model Server {
  id               String            @id @default(cuid())
  name             String
  description      String?
  iconUrl          String?
  bannerUrl        String?
  ownerId          String
  owner            User              @relation("ServerOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  inviteCode       String?           @unique
  isPublic         Boolean           @default(false)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  members          ServerMember[]
  roles            ServerRole[]
  channels         ServerChannel[]
  boosts           ServerBoost[]
  soundboardSounds SoundboardSound[]
  customEmojis     CustomEmoji[]
  messages         ServerMessage[]

  @@index([ownerId])
  @@index([isPublic])
}

model ServerMember {
  id        String       @id @default(cuid())
  serverId  String
  server    Server       @relation(fields: [serverId], references: [id], onDelete: Cascade)
  userId    String
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  nickname  String?
  joinedAt  DateTime     @default(now())
  roles     ServerRole[] @relation("ServerMemberRoles")
  messages  ServerMessage[]

  @@unique([serverId, userId])
  @@index([serverId])
  @@index([userId])
}

model ServerRole {
  id          String         @id @default(cuid())
  name        String
  color       String?
  icon        String?
  position    Int            @default(0)
  permissions String         @default("[]") // JSON string array of permission names
  serverId    String
  server      Server         @relation(fields: [serverId], references: [id], onDelete: Cascade)
  members     ServerMember[] @relation("ServerMemberRoles")
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@index([serverId])
}

model ServerChannel {
  id                  String          @id @default(cuid())
  name                String
  type                String          @default("TEXT") // TEXT | VOICE | FORUM | STAGE | THREAD
  topic               String?
  position            Int             @default(0)
  serverId            String
  server              Server          @relation(fields: [serverId], references: [id], onDelete: Cascade)
  parentId            String?
  parent              ServerChannel?  @relation("ChannelHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children            ServerChannel[] @relation("ChannelHierarchy")
  messages            ServerMessage[]
  permissionOverwrites String          @default("[]") // JSON string array of permission override rules
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([serverId])
  @@index([parentId])
}

model ServerMessage {
  id          String         @id @default(cuid())
  serverId    String
  server      Server         @relation(fields: [serverId], references: [id], onDelete: Cascade)
  channelId   String
  channel     ServerChannel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  memberId    String
  member      ServerMember   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  content     String?
  attachments String         @default("[]") // JSON array of file URL strings
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  replyToId   String?
  replyTo     ServerMessage? @relation("ServerMessageReplies", fields: [replyToId], references: [id], onDelete: Cascade)
  replies     ServerMessage[] @relation("ServerMessageReplies")

  @@index([serverId])
  @@index([channelId])
  @@index([memberId])
  @@index([createdAt])
}

model ServerBoost {
  id        String   @id @default(cuid())
  serverId  String
  server    Server   @relation(fields: [serverId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([serverId])
  @@index([userId])
}

model SoundboardSound {
  id        String   @id @default(cuid())
  name      String
  soundUrl  String
  emoji     String?
  volume    Float    @default(1.0)
  serverId  String
  server    Server   @relation(fields: [serverId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([serverId])
  @@index([userId])
}

model CustomEmoji {
  id        String   @id @default(cuid())
  name      String
  imageUrl  String
  serverId  String
  server    Server   @relation(fields: [serverId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([serverId])
  @@index([userId])
}
```

### Virtual Relations to Add inside `User` model:

```prisma
model User {
  // ... existing fields ...

  // Relations for Server/Channel Architecture (Batch 7)
  ownedServers        Server[]          @relation("ServerOwner")
  serverMemberships   ServerMember[]
  serverBoosts        ServerBoost[]
  soundboardSounds    SoundboardSound[]
  customEmojis        CustomEmoji[]
}
```

---

### Database Relationship Diagrams (ASCII)

```
  +--------------+
  |     User     |
  +-------+------+
          | 1
          |
          | 1..* (Owner)
          +-----------------------------+
          | 1..* (Member)               |
          |                             v
          |                      +------+-------+
          |                      |    Server    +------------------+
          |                      +---+--+---+---+                  | 1
          |                          |  |   |                      |
          |                          |  |   | 1..*                 | 1..*
          |                          |  |   +---------------+      v
          |                     1..* |  | 1..*              |  +---+-----------+
          |      +-------------------+  +------------+      |  | ServerChannel |
          |      |                                   |      |  +---+-----------+
          v      v                                   v      v      | 1
   +------+------+----+                        +-----+------+---+  |
   |   ServerMember   +----------------------->+   ServerRole   |  | 1..*
   +------+------+----+ 1..* (Implicit M:N)    +----------------+  v
          |      |                                             +---+-----------+
          |      | 1                                           | ServerMessage |
          |      |                                             +---------------+
          |      v 1..*
          |  +---+-----------+
          |  | ServerMessage |
          |  +---------------+
          |
          | 1 (Booster / Sound-creator / Emoji-uploader)
          v
  +-------+------+     +-----------------+     +-------------+
  |  ServerBoost |     | SoundboardSound |     | CustomEmoji |
  +--------------+     +-----------------+     +-------------+
```

---

### Draft REST Endpoint Specifications

#### 1. Server Management (`/api/servers` & `/api/servers/[id]`)

- **`POST /api/servers`**: Create a new server.
  - _Payload_: `{ name: string, description?: string, iconUrl?: string, isPublic?: boolean }`
  - _Logic_: Creates the server, sets the creator as owner (`ownerId`), creates a default `@everyone` role (low position) and an `Admin` role, and adds the creator as a `ServerMember` with the `Admin` role.
- **`GET /api/servers`**: List servers.
  - _Query parameters_: `query` (search by name/description), `publicOnly` (boolean).
- **`GET /api/servers/[id]`**: Fetch server configuration and hierarchy.
  - _Includes_: `channels`, `roles`, `members` (paginated or count), `customEmojis`.
- **`PATCH /api/servers/[id]`**: Update server options.
  - _Payload_: `{ name?: string, description?: string, iconUrl?: string, bannerUrl?: string, isPublic?: boolean }`
  - _Auth check_: Requires the caller to be the server owner or have the `ADMIN` / `MANAGE_SERVER` permission.
- **`DELETE /api/servers/[id]`**: Delete a server.
  - _Auth check_: Requires the caller to be the server owner.

#### 2. Membership (`/api/servers/[id]/members`)

- **`GET /api/servers/[id]/members`**: List all members.
- **`POST /api/servers/[id]/members`**: Join a server via invite code.
  - _Payload_: `{ inviteCode: string }`
  - _Logic_: Matches server by invite code, adds a `ServerMember` record, and assigns the default `@everyone` role.
- **`PATCH /api/servers/[id]/members`**: Update server member roles or nickname.
  - _Payload_: `{ memberId: string, nickname?: string, roleIds?: string[] }`
  - _Auth check_: Requires `ADMIN`, `MANAGE_ROLES` (for role assignment), or `MANAGE_NICKNAMES` (for nickname updates).
- **`DELETE /api/servers/[id]/members`**: Leave or kick/ban a member.
  - _Query/Payload_: `{ memberId: string }`
  - _Auth check_: Leaving is self-directed; kicking requires `KICK_MEMBERS` or `ADMIN`.

#### 3. Channels (`/api/servers/[id]/channels` & `/api/servers/[id]/channels/[channelId]`)

- **`GET /api/servers/[id]/channels`**: Get server channel list grouped by category.
- **`POST /api/servers/[id]/channels`**: Create a channel.
  - _Payload_: `{ name: string, type: 'TEXT' | 'VOICE' | 'FORUM' | 'STAGE', parentId?: string, topic?: string }`
  - _Auth check_: Requires `MANAGE_CHANNELS` or `ADMIN`.
- **`PATCH /api/servers/[id]/channels/[channelId]`**: Modify channel settings.
  - _Payload_: `{ name?: string, topic?: string, position?: number, permissionOverwrites?: string }`
  - _Auth check_: Requires `MANAGE_CHANNELS` or `ADMIN`.
- **`DELETE /api/servers/[id]/channels/[channelId]`**: Delete a channel.
  - _Auth check_: Requires `MANAGE_CHANNELS` or `ADMIN`.

#### 4. Channel Messages (`/api/servers/[id]/channels/[channelId]/messages`)

- **`GET /api/servers/[id]/channels/[channelId]/messages`**: Fetch paginated messages.
  - _Query_: `cursor` (for infinite scrolling), `limit`.
- **`POST /api/servers/[id]/channels/[channelId]/messages`**: Send a message.
  - _Payload_: `{ content?: string, attachments?: string[], replyToId?: string }`
  - _Auth check_: Requires member to have `SEND_MESSAGES` in their roles or channel overrides.

#### 5. Thread Channels (`/api/servers/[id]/channels/[channelId]/threads`)

- **`POST /api/servers/[id]/channels/[channelId]/threads`**: Start a sub-thread.
  - _Payload_: `{ name: string, messageId?: string }`
  - _Logic_: Creates a `ServerChannel` of type `THREAD` with `parentId` set to the text channel.

#### 6. Stage Channels (`/api/servers/[id]/channels/[channelId]/stage`)

- **`GET /api/servers/[id]/channels/[channelId]/stage`**: Get active speakers and hand-raise queue.
- **`POST /api/servers/[id]/channels/[channelId]/stage`**: Manage speak requests (join speakers, request to speak, clear queue).
  - _Payload_: `{ action: 'REQUEST_TO_SPEAK' | 'APPROVE_SPEAKER' | 'MUTE_SPEAKER' | 'LEAVE_STAGE', targetMemberId?: string }`

#### 7. Server Boosts, Soundboard, Custom Emojis

- **`POST /api/servers/[id]/boosts`**: Boost the server.
- **`GET /api/servers/[id]/soundboard`** & **`POST /api/servers/[id]/soundboard`**: List/Upload soundboard sounds.
- **`GET /api/servers/[id]/emojis`** & **`POST /api/servers/[id]/emojis`**: List/Upload custom emojis.

---

### Socket.IO Real-Time Events (Custom Server Integration)

1. **`join-channel`**: Join Socket.IO channel room (`server-channel:${channelId}`).
2. **`leave-channel`**: Leave Socket.IO channel room.
3. **`send-channel-message`**: Emit to `server-channel:${channelId}` with the newly created message object.
4. **`channel-typing`** / **`channel-stop-typing`**: Broadcast typing state to the channel room.
5. **`voice-state-update`**: Broadcast voice state changes (joined, muted, deafened, screen-sharing) to the voice channel room.
6. **`stage-state-update`**: Broadcast stage queue updates to listeners and speakers.

---

## 5. Verification Method

1. Write the proposed models into `prisma/schema.prisma`.
2. Generate the Prisma Client types:
   ```bash
   npm run db:generate
   ```
3. Sync and push changes to the SQLite database (local development database):
   ```bash
   npm run db:push
   ```
4. Run Next.js type check to verify compilation and typescript safety:
   ```bash
   npm run type-check
   ```
5. Run the linters to verify style rules:
   ```bash
   npm run lint
   ```
6. Invalidation Condition: If any schema compilation errors are thrown by `@prisma/client` or if `prisma db push` reports database mapping conflicts with the existing SQLite constraints.
