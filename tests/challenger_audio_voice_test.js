// tests/challenger_audio_voice_test.js
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
  console.log("=== STARTING CHALLENGER BATCH 11 AUDIO & VOICE TESTS ===");

  // 1. Resolve seed test users
  const wakkadev = await prisma.user.findUnique({ where: { username: "wakkadev" } });
  const alicedev = await prisma.user.findUnique({ where: { username: "alicedev" } });
  const bobdev = await prisma.user.findUnique({ where: { username: "bobdev" } });

  if (!wakkadev || !alicedev || !bobdev) {
    console.error("❌ Seed users wakkadev, alicedev, and bobdev must exist in the database.");
    process.exit(1);
  }

  // 2. Determine if server is already running on port 3009
  let serverReady = false;
  try {
    const res = await fetch(`${BASE_URL}/api/spotify/search?q=lofi`);
    if (res.status === 200) {
      serverReady = true;
      console.log("✅ Next.js server is already running on port 3009. Skipping spawning.");
    }
  } catch (e) {
    // not running
  }

  let serverProcess = null;
  if (!serverReady) {
    console.log(`\nSpawning Next.js server on port ${PORT}...`);
    serverProcess = spawn(
      "npx",
      ["tsx", "server.ts"],
      {
        cwd: path.join(__dirname, ".."),
        env: { ...process.env, PORT: String(PORT), HOSTNAME: "127.0.0.1" },
        shell: true,
      }
    );

    serverProcess.stdout.on("data", (data) => {
      console.log(`[Server Out] ${data.toString().trim()}`);
    });

    serverProcess.stderr.on("data", (data) => {
      console.error(`[Server Err] ${data.toString().trim()}`);
    });

    // Wait for server to start
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
  }

  if (!serverReady) {
    console.error(`❌ Server failed to start on port ${PORT}`);
    if (serverProcess) serverProcess.kill();
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
      console.error(`❌ Failed: ${name}`);
      console.error(err);
      if (err.cause) {
        console.error("Cause:", err.cause);
      }
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

  // Test Case 2: Join, Promote, and Hand Raising Toggles (with Edge Cases)
  await runTest("Audio Room Speakers, Listeners, and Hands Management (with Edge Cases)", async () => {
    // Create new test room
    const createRes = await fetch(`${BASE_URL}/api/audio-rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": wakkadev.id },
      body: JSON.stringify({ title: "Clubhouse Room 2" }),
    });
    const createJson = await createRes.json();
    const room = createJson.room;
    console.log(`[Test Debug] Created room with ID: ${room.id}`);

    // 1. Alice joins as Listener
    const joinRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/listeners`, {
      method: "POST",
      headers: { "x-user-id": alicedev.id },
    });
    console.log(`[Test Debug] Alice join 1 status: ${joinRes.status}`);
    if (joinRes.status !== 200 && joinRes.status !== 201) throw new Error(`Alice failed to join room: status ${joinRes.status}`);

    // Edge Case: Alice double joins as listener (should return 200 message "Already in room as listener")
    const doubleJoinRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/listeners`, {
      method: "POST",
      headers: { "x-user-id": alicedev.id },
    });
    console.log(`[Test Debug] Alice double join status: ${doubleJoinRes.status}`);
    const doubleJoinJson = await doubleJoinRes.json();
    console.log(`[Test Debug] Alice double join body:`, JSON.stringify(doubleJoinJson));
    if (doubleJoinRes.status !== 200) throw new Error(`Alice double join failed: status ${doubleJoinRes.status}`);
    assertEq(doubleJoinJson.message, "Already in room as listener");

    // 2. Alice raises hand
    const handRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/hand`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": alicedev.id },
      body: JSON.stringify({ handRaised: true }),
    });
    console.log(`[Test Debug] Alice hand raise status: ${handRes.status}`);
    if (handRes.status !== 200) throw new Error(`Failed to raise hand: status ${handRes.status}`);

    const listenerRecord = await prisma.audioRoomListener.findUnique({
      where: { audioRoomId_userId: { audioRoomId: room.id, userId: alicedev.id } },
    });
    if (!listenerRecord.handRaised) throw new Error("Hand raise flag not updated in database");

    // Edge Case: Unauthorized hand-raising (Bob tries to raise hand in Room without joining)
    const unauthorizedHandRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/hand`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": bobdev.id },
      body: JSON.stringify({ handRaised: true }),
    });
    console.log(`[Test Debug] Bob unauthorized hand raise status: ${unauthorizedHandRes.status}`);
    // Should return 404 (or 403) because Bob is not a listener in this room
    if (unauthorizedHandRes.status !== 404) throw new Error(`Expected 404 for unauthorized hand-raise, got ${unauthorizedHandRes.status}`);

    // 3. Host promotes Alice to Speaker
    const promoteRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/speakers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": wakkadev.id },
      body: JSON.stringify({ userId: alicedev.id }),
    });
    console.log(`[Test Debug] Alice promote status: ${promoteRes.status}`);
    if (promoteRes.status !== 200) throw new Error(`Host failed to promote Alice: status ${promoteRes.status}`);

    const isSpeaker = await prisma.audioRoomSpeaker.findUnique({
      where: { audioRoomId_userId: { audioRoomId: room.id, userId: alicedev.id } },
    });
    if (!isSpeaker) throw new Error("Alice is not registered as a speaker in the database");

    // Alice is now speaker. Let's test promoting Alice again (should fail with 400 User is already a speaker)
    const doublePromoteRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/speakers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": wakkadev.id },
      body: JSON.stringify({ userId: alicedev.id }),
    });
    console.log(`[Test Debug] Alice double promote status: ${doublePromoteRes.status}`);
    if (doublePromoteRes.status !== 400) throw new Error(`Expected 400 for double promote, got ${doublePromoteRes.status}`);

    // Edge Case: Alice is speaker, but joins listeners again (should demote speaker to listener)
    const listenerRejoinRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/listeners`, {
      method: "POST",
      headers: { "x-user-id": alicedev.id },
    });
    console.log(`[Test Debug] Alice rejoin listener status: ${listenerRejoinRes.status}`);
    if (listenerRejoinRes.status !== 200) throw new Error(`Failed to rejoin as listener: status ${listenerRejoinRes.status}`);
    const checkSpeakerDeleted = await prisma.audioRoomSpeaker.findUnique({
      where: { audioRoomId_userId: { audioRoomId: room.id, userId: alicedev.id } },
    });
    if (checkSpeakerDeleted) throw new Error("Alice should have been removed from speakers after rejoining as listener");
    const checkListenerCreated = await prisma.audioRoomListener.findUnique({
      where: { audioRoomId_userId: { audioRoomId: room.id, userId: alicedev.id } },
    });
    if (!checkListenerCreated) throw new Error("Alice should be a listener again in the DB");

    // Re-promote Alice to Speaker for subsequent tests
    const promoteAgainRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/speakers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": wakkadev.id },
      body: JSON.stringify({ userId: alicedev.id }),
    });
    console.log(`[Test Debug] Alice promote again status: ${promoteAgainRes.status}`);
    if (promoteAgainRes.status !== 200) throw new Error(`Host failed to promote Alice again`);

    // 4. Bob (unauthorized) tries to demote Alice
    const badDemoteRes = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/speakers`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-user-id": bobdev.id },
      body: JSON.stringify({ userId: alicedev.id }),
    });
    console.log(`[Test Debug] Bob demote Alice status: ${badDemoteRes.status}`);
    if (badDemoteRes.status !== 403) throw new Error(`Expected 403 for unauthorized demote, got ${badDemoteRes.status}`);
  });

  // Test Case 3: Soundboard Sound Deletion & Permission checks
  await runTest("Soundboard Deletion Permissions", async () => {
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

    // 2. Server Owner (wakkadev) deletes -> 200
    // Create another sound uploaded by Alice to test Server Owner deletion
    const sound2 = await prisma.soundboardSound.create({
      data: {
        name: "Airhorn 2",
        soundUrl: "http://example.com/airhorn2.mp3",
        serverId: server.id,
        userId: alicedev.id,
      },
    });
    const ownerDelete = await fetch(`${BASE_URL}/api/servers/${server.id}/soundboard/${sound2.id}`, {
      method: "DELETE",
      headers: { "x-user-id": wakkadev.id },
    });
    if (ownerDelete.status !== 200) throw new Error(`Expected 200 for server owner delete, got ${ownerDelete.status}`);

    // 3. Alice (uploader) deletes the first sound -> 200
    const goodDelete = await fetch(`${BASE_URL}/api/servers/${server.id}/soundboard/${sound.id}`, {
      method: "DELETE",
      headers: { "x-user-id": alicedev.id },
    });
    if (goodDelete.status !== 200) throw new Error(`Expected 200 for uploader delete, got ${goodDelete.status}`);
  });

  // Test Case 4: Spotify Search Mock Fallback
  await runTest("Spotify Search Mock Fallback", async () => {
    const res = await fetch(`${BASE_URL}/api/spotify/search?q=Midnight`);
    const json = await res.json();
    if (json.data.length === 0 || json.data[0].title !== "Midnight City") {
      throw new Error("Spotify search fallback did not return matching mock data");
    }
  });

  // Test Case 5: Speaker Muting / Unmuting Permissions
  await runTest("Speaker Mute/Unmute Permission Verification", async () => {
    // Create new test room
    const createRes = await fetch(`${BASE_URL}/api/audio-rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": wakkadev.id },
      body: JSON.stringify({ title: "Muting Test Room" }),
    });
    const { room } = await createRes.json();

    // Bob joins as listener, promoted to speaker
    await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/listeners`, {
      method: "POST",
      headers: { "x-user-id": bobdev.id },
    });
    await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/speakers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": wakkadev.id },
      body: JSON.stringify({ userId: bobdev.id }),
    });

    // 1. Bob mutes himself (allowed)
    const selfMute = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/speakers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": bobdev.id },
      body: JSON.stringify({ userId: bobdev.id, isMuted: true }),
    });
    if (selfMute.status !== 200) throw new Error(`Failed to mute self: status ${selfMute.status}`);

    let speakerRec = await prisma.audioRoomSpeaker.findUnique({
      where: { audioRoomId_userId: { audioRoomId: room.id, userId: bobdev.id } },
    });
    assert(speakerRec.isMuted, "Mute flag should be true in database");

    // 2. Host (wakkadev) unmutes Bob (allowed)
    const hostUnmute = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/speakers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": wakkadev.id },
      body: JSON.stringify({ userId: bobdev.id, isMuted: false }),
    });
    if (hostUnmute.status !== 200) throw new Error(`Host failed to unmute speaker: status ${hostUnmute.status}`);

    speakerRec = await prisma.audioRoomSpeaker.findUnique({
      where: { audioRoomId_userId: { audioRoomId: room.id, userId: bobdev.id } },
    });
    assert(!speakerRec.isMuted, "Mute flag should be false in database");

    // 3. Alice (unauthorized third-party) tries to mute Bob (forbidden -> 403)
    const badMute = await fetch(`${BASE_URL}/api/audio-rooms/${room.id}/speakers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": alicedev.id },
      body: JSON.stringify({ userId: bobdev.id, isMuted: true }),
    });
    if (badMute.status !== 403) throw new Error(`Expected 403 for unauthorized mute, got ${badMute.status}`);
  });

  // Test Case 6: Socket.IO Real-Time Notifications
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
  
  if (serverProcess) {
    console.log("Stopping Next.js server...");
    serverProcess.kill();
  }
  await prisma.$disconnect();

  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} tests failed!`);
    process.exit(1);
  } else {
    console.log("\n✅ All Batch 11 Integration & Edge Case tests passed!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Unhandled rejection in test runner:", err);
  process.exit(1);
});
