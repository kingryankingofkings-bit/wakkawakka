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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertEq(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message || "Assertion failed"}: expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
    );
  }
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
  await prisma.audioRoomSpeaker.deleteMany();
  await prisma.audioRoomListener.deleteMany();
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
    const roomId = createJson.room.id;
    if (!roomId) throw new Error("Created room ID is missing");

    // 2. Fetch active rooms
    const fetchRes = await fetch(`${BASE_URL}/api/audio-rooms`);
    const fetchJson = await fetchRes.json();
    const room = fetchJson.rooms.find((r) => r.id === roomId);
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
    const { room } = await createRes.json();

    // 1. Alice joins as Listener
    const joinRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/listeners`, {
      method: "POST",
      headers: { "x-user-id": alicedev.id },
    });
    if (joinRes.status !== 200 && joinRes.status !== 201) throw new Error(`Alice failed to join room: status ${joinRes.status}`);

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
      body: JSON.stringify({ userId: alicedev.id }),
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
      body: JSON.stringify({ userId: alicedev.id }),
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

  // Test Case 5: Socket.IO Real-Time Notifications
  await runTest("Socket.IO Room Events", async () => {
    const socket = io(`${BASE_URL}`, {
      path: "/api/socket",
      transports: ["websocket"],
      forceNew: true,
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error("Socket connection timed out"));
      }, 5000);

      socket.on("connect", () => {
        clearTimeout(timeout);
        resolve();
      });
      socket.on("connect_error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    const roomId = "test-socket-room-id";
    socket.emit("join-audio-room", roomId);

    let joinedReceived = false;
    let stateChangedReceived = false;
    let leftReceived = false;

    socket.on("audio-user-joined", (data) => {
      if (data.roomId === roomId && data.userId === alicedev.id) {
        joinedReceived = true;
      }
    });

    socket.on("audio-state-changed", (data) => {
      if (data.roomId === roomId && data.userId === alicedev.id && data.handRaised) {
        stateChangedReceived = true;
      }
    });

    socket.on("audio-user-left", (data) => {
      if (data.roomId === roomId && data.userId === alicedev.id) {
        leftReceived = true;
      }
    });

    // Create a second socket to represent Alice joining and updating
    const aliceSocket = io(`${BASE_URL}`, {
      path: "/api/socket",
      transports: ["websocket"],
      forceNew: true,
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        aliceSocket.disconnect();
        reject(new Error("Alice Socket connection timed out"));
      }, 5000);

      aliceSocket.on("connect", () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    aliceSocket.emit("join-audio-room", roomId);
    await sleep(200);

    aliceSocket.emit("audio-join", {
      roomId,
      userId: alicedev.id,
      user: { id: alicedev.id, displayName: alicedev.displayName },
      isSpeaker: false,
    });
    await sleep(200);

    aliceSocket.emit("audio-state-update", {
      roomId,
      userId: alicedev.id,
      handRaised: true,
    });
    await sleep(200);

    aliceSocket.emit("audio-leave", {
      roomId,
      userId: alicedev.id,
    });
    await sleep(200);

    aliceSocket.disconnect();
    socket.disconnect();

    assert(joinedReceived, "Should receive audio-user-joined event");
    assert(stateChangedReceived, "Should receive audio-state-changed event");
    assert(leftReceived, "Should receive audio-user-left event");
  });

  // Cleanup & Termination
  console.log("\nCleaning up database records...");
  await prisma.audioRoomSpeaker.deleteMany().catch(() => {});
  await prisma.audioRoomListener.deleteMany().catch(() => {});
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

main().catch((err) => {
  console.error("Unhanlded rejection in test runner:", err);
  process.exit(1);
});
