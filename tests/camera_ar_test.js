const { spawn } = require("child_process");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const prisma = new PrismaClient();

const PORT = 3004;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== STARTING BATCH 10 CAMERA & AR INTEGRATION TESTS ===");

  // 1. Resolve test users
  const wakkadev = await prisma.user.findUnique({ where: { username: "wakkadev" } });
  const alicedev = await prisma.user.findUnique({ where: { username: "alicedev" } });
  const bobdev = await prisma.user.findUnique({ where: { username: "bobdev" } });

  if (!wakkadev || !alicedev || !bobdev) {
    console.error("❌ Seed users wakkadev, alicedev, and bobdev must exist in the database.");
    process.exit(1);
  }

  console.log(`Loaded test users:`);
  console.log(`- wakkadev: ${wakkadev.id}`);
  console.log(`- alicedev: ${alicedev.id}`);
  console.log(`- bobdev: ${bobdev.id}`);

  // 2. Spawn Next.js server on port 3004
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
    console.log(`[Server Out] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`[Server Err] ${data.toString().trim()}`);
  });

  // Wait for server to start
  let serverReady = false;
  for (let i = 0; i < 180; i++) {
    await sleep(1000);
    try {
      const res = await fetch(`${BASE_URL}/api/streaks/status`, {
        headers: { "x-user-id": wakkadev.id },
      });
      console.log(`[Health check] status: ${res.status}`);
      if (res.status === 200 || res.status === 201 || res.status === 401 || res.status === 403) {
        serverReady = true;
        break;
      }
    } catch (e) {
      console.log(`[Health check] waiting... ${e.message}`);
    }
  }

  if (!serverReady) {
    console.error(`❌ Server failed to start on port ${PORT}`);
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  }
  console.log(`✅ Server is ready on port ${PORT}!`);

  const testFailures = [];
  const testSuccesses = [];

  const runTestCase = async (name, fn) => {
    console.log(`\n--- Running: ${name} ---`);
    try {
      await fn();
      console.log(`✅ Passed: ${name}`);
      testSuccesses.push(name);
    } catch (err) {
      console.error(`❌ Failed: ${name}\nReason: ${err.message}`);
      testFailures.push({ name, error: err.message });
    }
  };

  try {
    // =========================================================================
    // Scenario 1: Coordinate boundary validations
    // =========================================================================
    await runTestCase("Coordinate Boundary Validations", async () => {
      // Test valid coordinates
      const resValid = await fetch(`${BASE_URL}/api/location/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": wakkadev.id,
        },
        body: JSON.stringify({
          latitude: 45.1234,
          longitude: -93.5678,
          shareLocation: true,
        }),
      });
      if (resValid.status !== 200 && resValid.status !== 201) {
        throw new Error(`Valid coordinate request failed with status: ${resValid.status}`);
      }

      // Test invalid latitude too high (>90)
      const resLatHigh = await fetch(`${BASE_URL}/api/location/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": wakkadev.id,
        },
        body: JSON.stringify({
          latitude: 90.1,
          longitude: 0.0,
          shareLocation: true,
        }),
      });
      if (resLatHigh.status !== 400) {
        throw new Error(`Expected 400 for latitude 90.1, but got: ${resLatHigh.status}`);
      }

      // Test invalid latitude too low (<-90)
      const resLatLow = await fetch(`${BASE_URL}/api/location/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": wakkadev.id,
        },
        body: JSON.stringify({
          latitude: -90.1,
          longitude: 0.0,
          shareLocation: true,
        }),
      });
      if (resLatLow.status !== 400) {
        throw new Error(`Expected 400 for latitude -90.1, but got: ${resLatLow.status}`);
      }

      // Test invalid longitude too high (>180)
      const resLngHigh = await fetch(`${BASE_URL}/api/location/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": wakkadev.id,
        },
        body: JSON.stringify({
          latitude: 0.0,
          longitude: 180.1,
          shareLocation: true,
        }),
      });
      if (resLngHigh.status !== 400) {
        throw new Error(`Expected 400 for longitude 180.1, but got: ${resLngHigh.status}`);
      }

      // Test invalid longitude too low (<-180)
      const resLngLow = await fetch(`${BASE_URL}/api/location/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": wakkadev.id,
        },
        body: JSON.stringify({
          latitude: 0.0,
          longitude: -180.1,
          shareLocation: true,
        }),
      });
      if (resLngLow.status !== 400) {
        throw new Error(`Expected 400 for longitude -180.1, but got: ${resLngLow.status}`);
      }
    });

    // =========================================================================
    // Scenario 2: Disappearing media single-view restriction
    // =========================================================================
    await runTestCase("Disappearing Media Single-View Restriction", async () => {
      // 1. Create disappearing media from wakkadev to alicedev
      const createRes = await fetch(`${BASE_URL}/api/media/disappearing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": wakkadev.id,
        },
        body: JSON.stringify({
          receiverId: alicedev.id,
          mediaUrl: "http://example.com/snap1.jpg",
          type: "IMAGE",
        }),
      });
      if (createRes.status !== 201) {
        throw new Error(`Failed to create disappearing media, status: ${createRes.status}`);
      }
      const createData = await createRes.json();
      const mediaId = createData.data.id;
      if (!mediaId) {
        throw new Error("Created disappearing media response did not contain ID");
      }

      // 2. First GET from receiver (alicedev) should work (200)
      const getFirstRes = await fetch(`${BASE_URL}/api/media/disappearing/${mediaId}`, {
        headers: { "x-user-id": alicedev.id },
      });
      if (getFirstRes.status !== 200) {
        throw new Error(`First GET for receiver returned status ${getFirstRes.status}, expected 200`);
      }
      const getFirstData = await getFirstRes.json();
      if (!getFirstData.data || getFirstData.data.isViewed !== true) {
        throw new Error(`Expected media isViewed to be true, got: ${JSON.stringify(getFirstData.data)}`);
      }

      // 3. Second GET from receiver (alicedev) should return 410 (Gone)
      const getSecondRes = await fetch(`${BASE_URL}/api/media/disappearing/${mediaId}`, {
        headers: { "x-user-id": alicedev.id },
      });
      if (getSecondRes.status !== 410) {
        throw new Error(`Second GET for receiver returned status ${getSecondRes.status}, expected 410`);
      }

      // 4. Create another disappearing media to test other users' access
      const createRes2 = await fetch(`${BASE_URL}/api/media/disappearing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": wakkadev.id,
        },
        body: JSON.stringify({
          receiverId: alicedev.id,
          mediaUrl: "http://example.com/snap2.jpg",
          type: "IMAGE",
        }),
      });
      const createData2 = await createRes2.json();
      const mediaId2 = createData2.data.id;

      // 5. GET from bobdev (other user) should return 403
      const getOtherRes = await fetch(`${BASE_URL}/api/media/disappearing/${mediaId2}`, {
        headers: { "x-user-id": bobdev.id },
      });
      if (getOtherRes.status !== 403) {
        throw new Error(`GET from other user (bobdev) returned status ${getOtherRes.status}, expected 403`);
      }

      // 6. GET non-existent should return 404
      const getNonexistentRes = await fetch(`${BASE_URL}/api/media/disappearing/non_existent_id`, {
        headers: { "x-user-id": alicedev.id },
      });
      if (getNonexistentRes.status !== 404) {
        throw new Error(`GET for non-existent media returned status ${getNonexistentRes.status}, expected 404`);
      }
    });

    // =========================================================================
    // Scenario 3: Hour-based streak increment/resets
    // =========================================================================
    await runTestCase("Hour-based Streak Increment and Resets", async () => {
      // Reset wakkadev's streak first
      await prisma.streak.deleteMany({ where: { userId: wakkadev.id } });

      // 1. Initial streak log (should create streak with currentStreak: 1)
      const postInitial = await fetch(`${BASE_URL}/api/streaks/activity`, {
        method: "POST",
        headers: { "x-user-id": wakkadev.id },
      });
      if (postInitial.status !== 200 && postInitial.status !== 201) {
        throw new Error(`Initial streak creation failed: status ${postInitial.status}`);
      }
      const initialData = await postInitial.json();
      if (initialData.data.currentStreak !== 1) {
        throw new Error(`Expected initial currentStreak to be 1, got ${initialData.data.currentStreak}`);
      }

      // 2. Case: < 24 hours (simulate lastActivityAt 10 hours ago)
      const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
      await prisma.streak.update({
        where: { userId: wakkadev.id },
        data: { lastActivityAt: tenHoursAgo },
      });

      const postSub24 = await fetch(`${BASE_URL}/api/streaks/activity`, {
        method: "POST",
        headers: { "x-user-id": wakkadev.id },
      });
      const sub24Data = await postSub24.json();
      if (sub24Data.data.currentStreak !== 1) {
        throw new Error(`Expected currentStreak to remain 1 after <24h, got ${sub24Data.data.currentStreak}`);
      }

      // 3. Case: 24 to 48 hours (simulate lastActivityAt 30 hours ago)
      const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);
      await prisma.streak.update({
        where: { userId: wakkadev.id },
        data: { lastActivityAt: thirtyHoursAgo },
      });

      const post24To48 = await fetch(`${BASE_URL}/api/streaks/activity`, {
        method: "POST",
        headers: { "x-user-id": wakkadev.id },
      });
      const mid24Data = await post24To48.json();
      if (mid24Data.data.currentStreak !== 2) {
        throw new Error(`Expected currentStreak to increment to 2 after 24-48h, got ${mid24Data.data.currentStreak}`);
      }

      // 4. Case: > 48 hours (simulate lastActivityAt 50 hours ago)
      const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
      await prisma.streak.update({
        where: { userId: wakkadev.id },
        data: { lastActivityAt: fiftyHoursAgo },
      });

      const postOver48 = await fetch(`${BASE_URL}/api/streaks/activity`, {
        method: "POST",
        headers: { "x-user-id": wakkadev.id },
      });
      const over48Data = await postOver48.json();
      if (over48Data.data.currentStreak !== 1) {
        throw new Error(`Expected currentStreak to reset to 1 after >48h, got ${over48Data.data.currentStreak}`);
      }
    });

    // =========================================================================
    // Scenario 4: BeReal gating check
    // =========================================================================
    await runTestCase("BeReal Gating Check", async () => {
      // Clear wakkadev's BeReal posts first
      await prisma.post.deleteMany({
        where: { authorId: wakkadev.id, isEphemeral: true },
      });

      // 1. Fetching feed when no post is uploaded in last 24 hours -> feedLocked should be true
      const getFeedLockedRes = await fetch(`${BASE_URL}/api/posts/bereal/feed`, {
        headers: { "x-user-id": wakkadev.id },
      });
      if (getFeedLockedRes.status !== 200) {
        throw new Error(`Feed request failed: status ${getFeedLockedRes.status}`);
      }
      const feedLockedData = await getFeedLockedRes.json();
      if (feedLockedData.feedLocked !== true) {
        throw new Error(`Expected feedLocked to be true, got: ${JSON.stringify(feedLockedData)}`);
      }

      // 2. Upload a BeReal post
      const createBerealRes = await fetch(`${BASE_URL}/api/posts/bereal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": wakkadev.id,
        },
        body: JSON.stringify({
          mainImageUrl: "http://example.com/main_img.png",
          btsImageUrl: "http://example.com/bts_img.png",
          visibility: "PUBLIC",
        }),
      });
      if (createBerealRes.status !== 201) {
        throw new Error(`Failed to upload BeReal post, status: ${createBerealRes.status}`);
      }

      // 3. Fetching feed after upload -> feedLocked should be false
      const getFeedUnlockedRes = await fetch(`${BASE_URL}/api/posts/bereal/feed`, {
        headers: { "x-user-id": wakkadev.id },
      });
      if (getFeedUnlockedRes.status !== 200) {
        throw new Error(`Feed request failed after upload: status ${getFeedUnlockedRes.status}`);
      }
      const feedUnlockedData = await getFeedUnlockedRes.json();
      if (feedUnlockedData.feedLocked !== false) {
        throw new Error(`Expected feedLocked to be false, got: ${JSON.stringify(feedUnlockedData)}`);
      }
    });

    // =========================================================================
    // Scenario 5: Memories CRUD and security checks
    // =========================================================================
    await runTestCase("Memories CRUD and security checks", async () => {
      // Clean up any old memories for wakkadev / alicedev / bobdev first
      await prisma.savedMemory.deleteMany({
        where: { userId: { in: [wakkadev.id, alicedev.id] } },
      });

      // 1. Create a memory (POST)
      const postRes = await fetch(`${BASE_URL}/api/memories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": wakkadev.id,
        },
        body: JSON.stringify({
          url: "http://example.com/mem1.jpg",
          pipUrl: "http://example.com/mem1_pip.jpg",
          mode: "BE_REAL",
          location: "New York, NY",
          tags: ["travel", "city"],
        }),
      });

      if (postRes.status !== 201) {
        throw new Error(`Failed to create memory, status: ${postRes.status}`);
      }
      const postData = await postRes.json();
      const memId = postData.data.id;
      if (!memId) {
        throw new Error("Created memory did not contain an ID");
      }
      if (postData.data.location !== "New York, NY" || !postData.data.tags.includes("city")) {
        throw new Error(`Memory creation returned incorrect metadata: ${JSON.stringify(postData.data)}`);
      }

      // 2. Fetch memories (GET)
      const getRes = await fetch(`${BASE_URL}/api/memories`, {
        headers: { "x-user-id": wakkadev.id },
      });
      if (getRes.status !== 200) {
        throw new Error(`GET memories failed, status: ${getRes.status}`);
      }
      const getData = await getRes.json();
      if (getData.data.length !== 1 || getData.data[0].id !== memId) {
        throw new Error(`Expected 1 memory with id ${memId}, got: ${JSON.stringify(getData.data)}`);
      }
      const mem = getData.data[0];
      if (mem.pipUrl !== "http://example.com/mem1_pip.jpg" || mem.location !== "New York, NY" || mem.tags.length !== 2) {
        throw new Error(`Parsed memory contains incorrect metadata: ${JSON.stringify(mem)}`);
      }

      // 3. Test onThisDay filtering
      // Let's create an older memory from last year (2025)
      const lastYear = new Date();
      lastYear.setUTCFullYear(lastYear.getUTCFullYear() - 1);
      const captionJson = JSON.stringify({
        pipUrl: "http://example.com/old_pip.jpg",
        location: "Paris, France",
        tags: ["europe"],
      });
      const oldMemory = await prisma.savedMemory.create({
        data: {
          userId: wakkadev.id,
          mediaUrl: "http://example.com/old.jpg",
          type: "NORMAL",
          caption: captionJson,
          createdAt: lastYear,
        },
      });

      // GET with onThisDay=true should return only the old memory (from last year), not the one from this year
      const getOnThisDayRes = await fetch(`${BASE_URL}/api/memories?onThisDay=true`, {
        headers: { "x-user-id": wakkadev.id },
      });
      if (getOnThisDayRes.status !== 200) {
        throw new Error(`GET memories onThisDay failed, status: ${getOnThisDayRes.status}`);
      }
      const getOnThisDayData = await getOnThisDayRes.json();
      if (getOnThisDayData.data.length !== 1 || getOnThisDayData.data[0].id !== oldMemory.id) {
        throw new Error(`Expected exactly 1 memory (the one from last year) for onThisDay=true, got: ${JSON.stringify(getOnThisDayData.data)}`);
      }

      // 4. Test DELETE authorization (should return 403 Forbidden if deleting other's memory)
      const deleteOtherRes = await fetch(`${BASE_URL}/api/memories/${memId}`, {
        method: "DELETE",
        headers: { "x-user-id": alicedev.id }, // Alice trying to delete Wakka's memory
      });
      if (deleteOtherRes.status !== 403) {
        throw new Error(`Expected 403 for unauthorized delete, got: ${deleteOtherRes.status}`);
      }

      // 5. Test DELETE non-existent (404)
      const deleteNonExistentRes = await fetch(`${BASE_URL}/api/memories/nonexistent_id`, {
        method: "DELETE",
        headers: { "x-user-id": wakkadev.id },
      });
      if (deleteNonExistentRes.status !== 404) {
        throw new Error(`Expected 404 for deleting non-existent memory, got: ${deleteNonExistentRes.status}`);
      }

      // 6. Test DELETE success (200)
      const deleteRes = await fetch(`${BASE_URL}/api/memories/${memId}`, {
        method: "DELETE",
        headers: { "x-user-id": wakkadev.id },
      });
      if (deleteRes.status !== 200) {
        throw new Error(`Expected 200 for successful delete, got: ${deleteRes.status}`);
      }

      // Verify it was deleted from DB
      const dbCheck = await prisma.savedMemory.findUnique({
        where: { id: memId },
      });
      if (dbCheck) {
        throw new Error("Memory was not deleted from the database");
      }
    });

  } catch (err) {
    console.error("Unexpected error during test execution:", err);
  } finally {
    // Cleanup created test data
    console.log("\nCleaning up created test database records...");

    await prisma.userLocation.deleteMany({
      where: { userId: wakkadev.id },
    }).catch(() => {});

    await prisma.disappearingMedia.deleteMany({
      where: {
        OR: [
          { senderId: wakkadev.id },
          { receiverId: alicedev.id },
        ],
      },
    }).catch(() => {});

    await prisma.streak.deleteMany({
      where: { userId: wakkadev.id },
    }).catch(() => {});

    await prisma.post.deleteMany({
      where: { authorId: wakkadev.id, isEphemeral: true },
    }).catch(() => {});

    await prisma.savedMemory.deleteMany({
      where: { userId: { in: [wakkadev.id, alicedev.id] } },
    }).catch(() => {});

    if (serverProcess) {
      console.log("Stopping Next.js server...");
      serverProcess.kill("SIGINT");
    }

    await prisma.$disconnect();
  }

  console.log("\n=== TEST EXECUTION COMPLETE ===");
  console.log(`Passed: ${testSuccesses.length}`);
  console.log(`Failed: ${testFailures.length}`);

  if (testFailures.length > 0) {
    testFailures.forEach((f, index) => {
      console.error(`${index + 1}. [${f.name}]: ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log("All integration tests passed successfully!");
    process.exit(0);
  }
}

main();
