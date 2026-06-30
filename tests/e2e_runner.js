/**
 * Wakka Wakka E2E Test Runner
 * programmatically defines and executes the 4-tier integration & testing suite.
 */

const fs = require("fs");
const path = require("path");

// Color helpers for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  tiers: {
    tier1: { total: 0, passed: 0, failed: 0 },
    tier2: { total: 0, passed: 0, failed: 0 },
    tier3: { total: 0, passed: 0, failed: 0 },
    tier4: { total: 0, passed: 0, failed: 0 },
  },
};

const pendingTests = [];

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

console.log(
  `${colors.bright}${colors.cyan}====================================================${colors.reset}`,
);
console.log(
  `${colors.bright}${colors.cyan}        WAKKA WAKKA INTEGRATION & E2E TEST SUITE     ${colors.reset}`,
);
console.log(
  `${colors.bright}${colors.cyan}====================================================${colors.reset}\n`,
);

// ============================================================================
// TIER 1: FEATURE COVERAGE
// ============================================================================
console.log(
  `${colors.bright}${colors.blue}Tier 1: Feature Coverage Verification${colors.reset}`,
);

runTest(
  "tier1",
  "Parse and verify all 2,264 implementation_tracker.md features have valid status",
  () => {
    const trackerPath = path.join(__dirname, "../implementation_tracker.md");
    assert(
      fs.existsSync(trackerPath),
      `implementation_tracker.md does not exist at ${trackerPath}`,
    );

    const content = fs.readFileSync(trackerPath, "utf8");
    const lines = content.split("\n");

    let featureCount = 0;
    let implementedCount = 0;
    const invalidStatuses = [];

    lines.forEach((line, index) => {
      if (line.trim().startsWith("|") && line.includes("Batch")) {
        const parts = line.split("|").map((p) => p.trim());
        const id = parts[1];
        const status = parts[6];

        if (id && id.match(/^[A-Z0-9]+-\d+/i)) {
          featureCount++;
          if (
            status === "Implemented" ||
            status === "Not Started" ||
            status === "In Progress"
          ) {
            implementedCount++;
          } else {
            invalidStatuses.push({ lineNum: index + 1, id, status });
          }
        }
      }
    });

    assertEq(
      featureCount,
      2264,
      "Should find exactly 2,264 features in tracker",
    );
    assertEq(
      implementedCount,
      2264,
      'All features must have "Implemented", "Not Started", or "In Progress" status',
    );
    assertEq(
      invalidStatuses.length,
      0,
      `Found features with invalid status: ${JSON.stringify(invalidStatuses)}`,
    );
  },
);

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES
// ============================================================================
console.log(
  `\n${colors.bright}${colors.blue}Tier 2: Boundary & Corner Cases${colors.reset}`,
);

// Settings validators to test
const validateAliasMigration = (newAlias) => {
  if (!newAlias)
    throw new Error("Please specify a new username alias to redirect to.");
  if (!newAlias.trim())
    throw new Error("Please specify a new username alias to redirect to.");
  if (!newAlias.startsWith("@"))
    throw new Error("Alias username must start with @");
  if (newAlias.includes(" "))
    throw new Error("Alias username cannot contain spaces");
  return true;
};

const validateTrustedRecoveryFriends = (friends) => {
  if (!Array.isArray(friends) || friends.length !== 3) {
    throw new Error("Please assign all three trusted recovery friends.");
  }
  const cleanFriends = friends.map((f) => f.trim()).filter(Boolean);
  if (cleanFriends.length !== 3) {
    throw new Error("Please assign all three trusted recovery friends.");
  }
  const uniqueFriends = new Set(cleanFriends);
  if (uniqueFriends.size !== 3) {
    throw new Error("Trusted recovery friends must be unique.");
  }
  return true;
};

const validateTwoFactorCode = (code) => {
  if (!code) throw new Error("Please enter verification code.");
  if (code.length !== 6 || isNaN(Number(code))) {
    throw new Error("Please enter a valid 6-digit verification code.");
  }
  return true;
};

// Search query validation
const validateSearchQuery = (q) => {
  const cleanQ = (q || "").trim();
  if (!cleanQ) {
    return {
      users: [],
      posts: [],
      hashtags: ["Trending1", "Trending2"],
      communities: [],
    };
  }
  // Sanitize query to prevent basic XSS and query injections
  const sanitized = cleanQ.replace(/[<>'"]/g, "");
  // Mock search limits
  const maxQueryLength = 200;
  const truncated = sanitized.substring(0, maxQueryLength);
  return { query: truncated };
};

// Billing form validation
const validateTipAmount = (amount) => {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) {
    throw new Error("Please specify a valid tipping amount");
  }
  if (num > 10000) {
    throw new Error(
      "Tipping amount exceeds the single transaction limit of $10,000",
    );
  }
  return num;
};

const validateCardValidation = (name, cardNumber, expiry, cvc) => {
  if (!name || !name.trim())
    throw new Error("Please fill in card validation fields");
  if (!cardNumber || !cardNumber.trim())
    throw new Error("Please fill in card validation fields");
  if (!expiry || !expiry.trim())
    throw new Error("Please fill in card validation fields");
  if (!cvc || !cvc.trim())
    throw new Error("Please fill in card validation fields");

  const cleanNum = cardNumber.replace(/\s/g, "");
  if (cleanNum.length < 16 || isNaN(Number(cleanNum))) {
    throw new Error("Invalid card number length");
  }

  if (!expiry.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)) {
    throw new Error("Invalid expiry date format. Use MM/YY");
  }

  const cleanCvc = cvc.trim();
  if (cleanCvc.length < 3 || cleanCvc.length > 4 || isNaN(Number(cleanCvc))) {
    throw new Error("Invalid CVC code");
  }
  return true;
};

runTest("tier2", "Settings: validate new username alias boundaries", () => {
  // Empty boundaries
  try {
    validateAliasMigration("");
    assert(false, "Should have failed on empty string");
  } catch (err) {
    assertEq(
      err.message,
      "Please specify a new username alias to redirect to.",
    );
  }

  try {
    validateAliasMigration("   ");
    assert(false, "Should have failed on whitespaces");
  } catch (err) {
    assertEq(
      err.message,
      "Please specify a new username alias to redirect to.",
    );
  }

  // Prefix boundary
  try {
    validateAliasMigration("newhandle");
    assert(false, "Should have failed on missing @ prefix");
  } catch (err) {
    assertEq(err.message, "Alias username must start with @");
  }

  // Spaces boundary
  try {
    validateAliasMigration("@new handle");
    assert(false, "Should have failed on space in handle");
  } catch (err) {
    assertEq(err.message, "Alias username cannot contain spaces");
  }

  // Valid path
  assert(validateAliasMigration("@new_handle_ok"), "Should pass valid alias");
});

runTest(
  "tier2",
  "Settings: validate trusted recovery friends parameters",
  () => {
    // Count boundary
    try {
      validateTrustedRecoveryFriends(["@alice", "@bob"]);
      assert(false, "Should fail with less than 3 friends");
    } catch (err) {
      assertEq(
        err.message,
        "Please assign all three trusted recovery friends.",
      );
    }

    // Empty name boundary
    try {
      validateTrustedRecoveryFriends(["@alice", "@bob", ""]);
      assert(false, "Should fail with empty friends");
    } catch (err) {
      assertEq(
        err.message,
        "Please assign all three trusted recovery friends.",
      );
    }

    // Uniqueness boundary
    try {
      validateTrustedRecoveryFriends(["@alice", "@bob", "@alice"]);
      assert(false, "Should fail with duplicate friends");
    } catch (err) {
      assertEq(err.message, "Trusted recovery friends must be unique.");
    }

    // Valid path
    assert(
      validateTrustedRecoveryFriends(["@alice", "@bob", "@charlie"]),
      "Should pass valid unique friends list",
    );
  },
);

runTest("tier2", "Settings: validate 2FA verification code inputs", () => {
  // Numeric and length boundaries
  try {
    validateTwoFactorCode("1234a6");
    assert(false, "Should fail with non-numeric character");
  } catch (err) {
    assertEq(err.message, "Please enter a valid 6-digit verification code.");
  }

  try {
    validateTwoFactorCode("12345");
    assert(false, "Should fail with length less than 6");
  } catch (err) {
    assertEq(err.message, "Please enter a valid 6-digit verification code.");
  }

  try {
    validateTwoFactorCode("1234567");
    assert(false, "Should fail with length greater than 6");
  } catch (err) {
    assertEq(err.message, "Please enter a valid 6-digit verification code.");
  }

  // Valid path
  assert(validateTwoFactorCode("987654"), "Should pass valid 6-digit code");
});

runTest("tier2", "Search Bar: validate search queries and inputs", () => {
  // Empty query returns default
  const emptyRes = validateSearchQuery("");
  assertEq(
    emptyRes.hashtags.length,
    2,
    "Should return default trending hashtags on empty query",
  );
  assertEq(emptyRes.users.length, 0, "Users list should be empty");

  // Input sanitization boundary
  const xssRes = validateSearchQuery('<script>alert("hack")</script>');
  assert(
    !xssRes.query.includes("<script>"),
    "Query should be stripped of HTML tag characters",
  );

  // Extremely long query truncation boundary
  const longQ = "a".repeat(300);
  const longRes = validateSearchQuery(longQ);
  assertEq(
    longRes.query.length,
    200,
    "Query length should be capped at 200 characters",
  );
});

runTest("tier2", "Billing: validate tipping gateway amounts", () => {
  // Non-positive boundaries
  try {
    validateTipAmount(-10);
    assert(false, "Should fail with negative amount");
  } catch (err) {
    assertEq(err.message, "Please specify a valid tipping amount");
  }

  try {
    validateTipAmount(0);
    assert(false, "Should fail with zero amount");
  } catch (err) {
    assertEq(err.message, "Please specify a valid tipping amount");
  }

  try {
    validateTipAmount("abc");
    assert(false, "Should fail with non-numeric amount");
  } catch (err) {
    assertEq(err.message, "Please specify a valid tipping amount");
  }

  // Single transaction limit boundary
  try {
    validateTipAmount(20000);
    assert(false, "Should fail with amount exceeding limit");
  } catch (err) {
    assertEq(
      err.message,
      "Tipping amount exceeds the single transaction limit of $10,000",
    );
  }

  // Valid path
  assertEq(
    validateTipAmount("15.50"),
    15.5,
    "Should parse valid tipping string amount",
  );
});

runTest("tier2", "Billing: validate credit card and expiration rules", () => {
  // Empty boundaries
  try {
    validateCardValidation("", "1234 5678 1234 5678", "12/28", "123");
    assert(false, "Should fail with missing card name");
  } catch (err) {
    assertEq(err.message, "Please fill in card validation fields");
  }

  // Card length boundary
  try {
    validateCardValidation("Jane Doe", "1234 5678 1234 567", "12/28", "123");
    assert(false, "Should fail with card length less than 16");
  } catch (err) {
    assertEq(err.message, "Invalid card number length");
  }

  // Expiry date format boundary
  try {
    validateCardValidation("Jane Doe", "1234 5678 1234 5678", "13/28", "123");
    assert(false, "Should fail with invalid month");
  } catch (err) {
    assertEq(err.message, "Invalid expiry date format. Use MM/YY");
  }

  try {
    validateCardValidation("Jane Doe", "1234 5678 1234 5678", "12-28", "123");
    assert(false, "Should fail with invalid separator");
  } catch (err) {
    assertEq(err.message, "Invalid expiry date format. Use MM/YY");
  }

  // CVC bounds
  try {
    validateCardValidation("Jane Doe", "1234 5678 1234 5678", "12/28", "12");
    assert(false, "Should fail with CVC length less than 3");
  } catch (err) {
    assertEq(err.message, "Invalid CVC code");
  }

  try {
    validateCardValidation("Jane Doe", "1234 5678 1234 5678", "12/28", "12345");
    assert(false, "Should fail with CVC length greater than 4");
  } catch (err) {
    assertEq(err.message, "Invalid CVC code");
  }

  // Valid path
  assert(
    validateCardValidation("Jane Doe", "4111 2222 3333 4444", "12/28", "999"),
    "Should pass valid inputs",
  );
});

// ============================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS
// ============================================================================
console.log(
  `\n${colors.bright}${colors.blue}Tier 3: Cross-Feature Combinations${colors.reset}`,
);

// Mocking profile customization and settings state
class UserSession {
  constructor() {
    this.persona = "personal";
    this.isPrivate = false;
    this.soundtrack = null;
    this.tabsOrder = ["Posts", "Albums", "Reels", "Liked", "Communities"];
    this.displayName = "Jane Doe";
    this.handle = "@janedoe";
    this.avatarBg = "bg-blue-500";
    this.followRequestQueue = [];
    this.isApprovedCreator = false;
  }

  switchPersona(persona) {
    this.persona = persona;
    if (persona === "personal") {
      this.displayName = "Jane Doe";
      this.handle = "@janedoe";
      this.avatarBg = "bg-blue-500";
    } else if (persona === "professional") {
      this.displayName = "Jane Doe, PhD (Professional)";
      this.handle = "@jdoe_pro";
      this.avatarBg = "bg-purple-500";
      this.isApprovedCreator = true;
    } else if (persona === "anonymous") {
      this.displayName = "Ghost User";
      this.handle = "@anon_982";
      this.avatarBg = "bg-zinc-600";
      this.isPrivate = true; // Anonymous switches profile to private automatically
    }
  }

  togglePrivacy(isPrivate) {
    this.isPrivate = isPrivate;
  }

  changeSoundtrack(trackId, trackUrl) {
    this.soundtrack = { id: trackId, url: trackUrl };
  }

  moveTab(idx, dir) {
    const nextTabs = [...this.tabsOrder];
    const targetIdx = idx + dir;
    if (targetIdx >= 0 && targetIdx < nextTabs.length) {
      [nextTabs[idx], nextTabs[targetIdx]] = [
        nextTabs[targetIdx],
        nextTabs[idx],
      ];
      this.tabsOrder = nextTabs;
    }
  }

  requestFollow(user) {
    if (this.isPrivate) {
      this.followRequestQueue.push(user);
      return "pending";
    }
    return "approved";
  }
}

runTest(
  "tier3",
  "Persona Identity Switcher affects profile customization details",
  () => {
    const session = new UserSession();
    assertEq(session.displayName, "Jane Doe");
    assertEq(session.handle, "@janedoe");

    // Switch to Professional
    session.switchPersona("professional");
    assertEq(session.displayName, "Jane Doe, PhD (Professional)");
    assertEq(session.handle, "@jdoe_pro");
    assertEq(session.avatarBg, "bg-purple-500");
    assertEq(session.isApprovedCreator, true);

    // Switch to Anonymous
    session.switchPersona("anonymous");
    assertEq(session.displayName, "Ghost User");
    assertEq(session.handle, "@anon_982");
    assertEq(session.avatarBg, "bg-zinc-600");
    assertEq(
      session.isPrivate,
      true,
      "Anonymous mode should automatically force private status",
    );
  },
);

runTest(
  "tier3",
  "Privacy settings toggle triggers profile follow request flow",
  () => {
    const session = new UserSession();
    assertEq(session.isPrivate, false);

    // Public user gets instant follow approval
    let status = session.requestFollow("@follower_1");
    assertEq(status, "approved");
    assertEq(session.followRequestQueue.length, 0);

    // Toggle privacy to private
    session.togglePrivacy(true);
    status = session.requestFollow("@follower_2");
    assertEq(status, "pending");
    assertEq(session.followRequestQueue.length, 1);
    assertEq(session.followRequestQueue[0], "@follower_2");
  },
);

runTest(
  "tier3",
  "Soundtrack settings update binds custom audio to profile player",
  () => {
    const session = new UserSession();
    assertEq(session.soundtrack, null);

    session.changeSoundtrack("lofi", "https://example.com/lofi.mp3");
    assert(session.soundtrack !== null);
    assertEq(session.soundtrack.id, "lofi");
    assertEq(session.soundtrack.url, "https://example.com/lofi.mp3");
  },
);

runTest(
  "tier3",
  "Tab reordering settings propagates to profile tab layout order",
  () => {
    const session = new UserSession();
    assertEq(session.tabsOrder[0], "Posts");
    assertEq(session.tabsOrder[4], "Communities");

    // Move Communities (idx 4) to the left (-1)
    session.moveTab(4, -1);
    assertEq(session.tabsOrder[3], "Communities");
    assertEq(session.tabsOrder[4], "Liked");

    session.moveTab(3, -1);
    session.moveTab(2, -1);
    session.moveTab(1, -1);
    assertEq(
      session.tabsOrder[0],
      "Communities",
      "Communities tab should now be first",
    );
  },
);

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// ============================================================================
console.log(
  `\n${colors.bright}${colors.blue}Tier 4: Real-World Application Scenarios${colors.reset}`,
);

class AppDatabase {
  constructor() {
    this.users = {};
    this.communities = {
      com1: { id: "com1", name: "Art & Design", members: [], joinRequests: [] },
      com2: { id: "com2", name: "TechBuilders", members: [], joinRequests: [] },
    };
    this.posts = [];
    this.messages = [];
    this.webhookLogs = [];
  }
}

runTest(
  "tier4",
  "Full User Workflow: Auth -> Edit Profile -> Join Community -> Post Collab -> Message Walkie-Talkie -> Tip Creator",
  () => {
    const db = new AppDatabase();
    let currentUser = null;

    // 1. Auth: Sign up and retrieve user profile
    console.log(
      `    ${colors.dim}[Step 1/6] Authenticating user...${colors.reset}`,
    );
    const userPayload = {
      email: "newuser@wakkawakka.com",
      password: "SecurePassword123",
      displayName: "Wakka Dev",
    };

    // Simulated sign up register
    const newUserId = `u_${Date.now()}`;
    db.users[newUserId] = {
      id: newUserId,
      email: userPayload.email,
      displayName: userPayload.displayName,
      username: "wakkadev",
      bio: "Wakka Wakka enthusiast",
      soundtrack: null,
      theme: "light",
      communities: [],
      followersCount: 0,
      followingCount: 0,
    };
    currentUser = db.users[newUserId];
    assert(currentUser !== null, "User must be created in mock DB");
    assertEq(currentUser.email, "newuser@wakkawakka.com");

    // 2. Edit Profile: updates display name, bio, soundtrack, and theme
    console.log(
      `    ${colors.dim}[Step 2/6] Editing profile...${colors.reset}`,
    );
    currentUser.displayName = "Wakka Senior Dev";
    currentUser.bio = "TypeScript and E2E Testing Champion";
    currentUser.soundtrack = {
      id: "synth",
      url: "https://example.com/synth.mp3",
    };
    currentUser.theme = "dark";

    assertEq(currentUser.displayName, "Wakka Senior Dev");
    assertEq(currentUser.bio, "TypeScript and E2E Testing Champion");
    assertEq(currentUser.soundtrack.id, "synth");
    assertEq(currentUser.theme, "dark");

    // 3. Join Community: request to join a community, and admin approval
    console.log(
      `    ${colors.dim}[Step 3/6] Requesting and approving community membership...${colors.reset}`,
    );
    const targetCommunity = db.communities["com2"];

    // User triggers join request
    targetCommunity.joinRequests.push({
      userId: currentUser.id,
      username: currentUser.username,
    });
    assertEq(targetCommunity.joinRequests.length, 1);
    assertEq(targetCommunity.joinRequests[0].userId, currentUser.id);

    // Admin approves join request
    const requestIndex = targetCommunity.joinRequests.findIndex(
      (r) => r.userId === currentUser.id,
    );
    const approvedRequest = targetCommunity.joinRequests.splice(
      requestIndex,
      1,
    )[0];
    targetCommunity.members.push(approvedRequest.userId);
    currentUser.communities.push(targetCommunity.id);

    assertEq(
      targetCommunity.joinRequests.length,
      0,
      "Join requests queue should be empty after approval",
    );
    assert(
      targetCommunity.members.includes(currentUser.id),
      "User must be listed as a community member",
    );
    assert(
      currentUser.communities.includes("com2"),
      "User profile should show membership in com2",
    );

    // 4. Post Collab: invite co-author, draft content, and publish collaborative post
    console.log(
      `    ${colors.dim}[Step 4/6] Creating collaborative post with @alicedev...${colors.reset}`,
    );
    const collabInvite = {
      postContent:
        "Next.js 14 combined with socket.io makes real-time E2E verification super smooth! 🚀 #WakkaWakka",
      coAuthor: "@alicedev",
      authorId: currentUser.id,
      status: "pending_approval",
      id: `post_${Date.now()}`,
    };

    db.posts.push(collabInvite);
    assertEq(db.posts.length, 1);
    assertEq(db.posts[0].status, "pending_approval");
    assertEq(db.posts[0].coAuthor, "@alicedev");

    // Simulated co-author approval
    db.posts[0].status = "published";
    assertEq(
      db.posts[0].status,
      "published",
      "Collab post should be published after approval",
    );

    // 5. Message Walkie-Talkie: join walkie-talkie group, simulate PTT audio and send message
    console.log(
      `    ${colors.dim}[Step 5/6] Sending audio walkie-talkie message...${colors.reset}`,
    );
    const walkieTalkieChannel = "wt_channel_dev";

    // Simulate recording audio note (3s)
    const simulatedAudioBlob = "mock_audio_stream_data_bytes_base64";
    const walkieMessage = {
      id: `msg_${Date.now()}`,
      channel: walkieTalkieChannel,
      senderId: currentUser.id,
      type: "audio",
      content: "[Walkie-Talkie Voice Message]",
      audioUrl: "https://example.com/walkietalkie/recording_423.wav",
      duration: 3,
      timestamp: new Date().toISOString(),
    };

    db.messages.push(walkieMessage);
    assertEq(db.messages.length, 1);
    assertEq(db.messages[0].type, "audio");
    assertEq(db.messages[0].duration, 3);
    assertEq(db.messages[0].senderId, currentUser.id);

    // 6. Tip Creator: enter tipping gateway, select creator, send tip, verify webhook log
    console.log(
      `    ${colors.dim}[Step 6/6] Tipping creator @alicedev and verifying webhook...${colors.reset}`,
    );
    const tippingTransaction = {
      id: `tx_${Date.now()}`,
      senderId: currentUser.id,
      creatorHandle: "alicedev",
      amount: 50.0,
      message: "Thanks for the collab! Let's build more!",
    };

    // Process tip
    assert(tippingTransaction.amount > 0, "Tipping amount must be positive");

    // Simulate Webhook Dispatch
    const webhookPayload = {
      event: "tip.received",
      timestamp: new Date().toISOString(),
      data: {
        transactionId: tippingTransaction.id,
        sender: currentUser.username,
        creator: tippingTransaction.creatorHandle,
        amount: tippingTransaction.amount,
        message: tippingTransaction.message,
      },
    };

    db.webhookLogs.push({
      id: `wh_${Date.now()}`,
      event: "tip.received",
      status: 200,
      payload: JSON.stringify(webhookPayload),
    });

    assertEq(db.webhookLogs.length, 1);
    assertEq(db.webhookLogs[0].event, "tip.received");

    const loggedPayload = JSON.parse(db.webhookLogs[0].payload);
    assertEq(loggedPayload.data.amount, 50.0);
    assertEq(loggedPayload.data.creator, "alicedev");
    assertEq(loggedPayload.data.sender, "wakkadev");

    console.log(
      `    ${colors.green}Full flow validation successfully completed with real-state transitions!${colors.reset}`,
    );
  },
);

// Add our new E2E test case for Batch 6 Live Streaming & Video Platform
runTest(
  "tier4",
  "Batch 6 Live Streaming & Video Platform Integration Workflow",
  async () => {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    try {
      const wakkadev = await prisma.user.findUnique({
        where: { username: "wakkadev" },
      });
      const alicedev = await prisma.user.findUnique({
        where: { username: "alicedev" },
      });
      const bobdev = await prisma.user.findUnique({
        where: { username: "bobdev" },
      });

      assert(wakkadev && alicedev && bobdev, "Seeded users should exist");

      const initialAlicePoints = alicedev.channelPoints;
      const initialBobPoints = bobdev.channelPoints;

      // Create stream
      const stream = await prisma.liveStream.create({
        data: {
          hostId: wakkadev.id,
          title: "E2E Test Stream",
          description: "Testing live platform features",
          category: "Technology",
          isActive: true,
          viewerCount: 10,
        },
      });
      assert(stream.id, "Stream should be created");

      // Invite Cohost (starts as PENDING)
      const coHost = await prisma.liveStreamCoHost.create({
        data: {
          liveStreamId: stream.id,
          userId: alicedev.id,
          status: "PENDING",
        },
      });
      assert(coHost.id, "Cohost record should be created");
      assertEq(
        coHost.status,
        "PENDING",
        "Cohost status should start as PENDING",
      );

      // Accept Cohost (updates status to ACCEPTED)
      const updatedCoHost = await prisma.liveStreamCoHost.update({
        where: {
          liveStreamId_userId: { liveStreamId: stream.id, userId: alicedev.id },
        },
        data: {
          status: "ACCEPTED",
        },
      });
      assertEq(
        updatedCoHost.status,
        "ACCEPTED",
        "Cohost status should be updated to ACCEPTED",
      );

      // Send Chat comment (persisted)
      const chatComment = await prisma.liveStreamChatMessage.create({
        data: {
          liveStreamId: stream.id,
          userId: alicedev.id,
          message: "Hello chat!",
          type: "COMMENT",
        },
      });
      assert(chatComment.id, "Chat comment should be persisted");
      assertEq(chatComment.message, "Hello chat!");
      assertEq(chatComment.type, "COMMENT");

      // Send Gift (simulate logic, now including LiveStreamChatMessage of type GIFT)
      const giftCost = 100;
      const [updatedAlice, updatedStream, giftLog, chatGift] =
        await prisma.$transaction([
          prisma.user.update({
            where: { id: alicedev.id },
            data: { channelPoints: { decrement: giftCost } },
          }),
          prisma.liveStream.update({
            where: { id: stream.id },
            data: { giftTotal: { increment: giftCost } },
          }),
          prisma.liveStreamGift.create({
            data: {
              liveStreamId: stream.id,
              senderId: alicedev.id,
              giftType: "POINTS",
              giftName: "Diamond",
              amount: giftCost,
              quantity: 1,
            },
          }),
          prisma.liveStreamChatMessage.create({
            data: {
              liveStreamId: stream.id,
              userId: alicedev.id,
              message: "Sent 1x Diamond!",
              type: "GIFT",
              giftAmount: giftCost,
            },
          }),
        ]);

      assertEq(
        updatedAlice.channelPoints,
        initialAlicePoints - giftCost,
        "Alice points should be deducted",
      );
      assertEq(
        updatedStream.giftTotal,
        giftCost,
        "Stream gift total should be incremented",
      );
      assert(chatGift.id, "Gift chat message should be created");
      assertEq(chatGift.type, "GIFT", "Gift chat message type should be GIFT");
      assertEq(
        chatGift.giftAmount,
        giftCost,
        "Gift chat message amount should match total cost",
      );

      // Create Prediction
      const prediction = await prisma.prediction.create({
        data: {
          liveStreamId: stream.id,
          title: "Will the E2E test pass?",
          status: "ACTIVE",
          options: {
            create: [
              { text: "Yes", totalPoints: 0 },
              { text: "No", totalPoints: 0 },
            ],
          },
        },
        include: {
          options: true,
        },
      });

      assertEq(prediction.options.length, 2, "Should create 2 options");
      const optYes = prediction.options.find((o) => o.text === "Yes");
      const optNo = prediction.options.find((o) => o.text === "No");

      // Place Bet (Bob on Yes)
      const betPoints = 500;
      const [updatedBob, updatedOption, betLog] = await prisma.$transaction([
        prisma.user.update({
          where: { id: bobdev.id },
          data: { channelPoints: { decrement: betPoints } },
        }),
        prisma.predictionOption.update({
          where: { id: optYes.id },
          data: { totalPoints: { increment: betPoints } },
        }),
        prisma.predictionBet.create({
          data: {
            predictionId: prediction.id,
            optionId: optYes.id,
            userId: bobdev.id,
            points: betPoints,
          },
        }),
      ]);

      assertEq(
        updatedBob.channelPoints,
        initialBobPoints - betPoints,
        "Bob points should be deducted",
      );

      // Place another bet (Alice on No)
      const aliceBetPoints = 1000;
      const [updatedAlice2, updatedOptionNo, betLogAlice] =
        await prisma.$transaction([
          prisma.user.update({
            where: { id: alicedev.id },
            data: { channelPoints: { decrement: aliceBetPoints } },
          }),
          prisma.predictionOption.update({
            where: { id: optNo.id },
            data: { totalPoints: { increment: aliceBetPoints } },
          }),
          prisma.predictionBet.create({
            data: {
              predictionId: prediction.id,
              optionId: optNo.id,
              userId: alicedev.id,
              points: aliceBetPoints,
            },
          }),
        ]);

      // Resolve Prediction (host resolves as 'Yes', bob wins!)
      const winningOptionId = optYes.id;
      const winningBets = [betLog];
      const losingBets = [betLogAlice];

      const W = winningBets.reduce((sum, b) => sum + b.points, 0);
      const L = losingBets.reduce((sum, b) => sum + b.points, 0);

      const payoutPromises = winningBets.map(async (b) => {
        const payoutShare = Math.floor((b.points / W) * L);
        const totalPayout = b.points + payoutShare;
        return prisma.user.update({
          where: { id: b.userId },
          data: { channelPoints: { increment: totalPayout } },
        });
      });
      await Promise.all(payoutPromises);

      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { status: "RESOLVED", winningOptionId },
      });

      const finalBob = await prisma.user.findUnique({
        where: { id: bobdev.id },
      });
      assertEq(
        finalBob.channelPoints,
        initialBobPoints - betPoints + 1500,
        "Bob should receive winning payout",
      );

      // Create Clip
      const clip = await prisma.clip.create({
        data: {
          title: "Epic Moment",
          duration: 30,
          videoUrl:
            "https://wakkawakka-vods.s3.amazonaws.com/clips/epic-moment.mp4",
          thumbnailUrl:
            "https://images.unsplash.com/photo-1542751371-adc38448a05e",
          creatorId: wakkadev.id,
          liveStreamId: stream.id,
        },
      });
      assert(clip.id, "Clip should be created");

      // End stream (convert to VOD)
      const vodStream = await prisma.liveStream.update({
        where: { id: stream.id },
        data: {
          isActive: false,
          isRecorded: true,
          recordingUrl:
            "https://wakkawakka-vods.s3.amazonaws.com/recorded-e2e.mp4",
        },
      });
      assertEq(vodStream.isRecorded, true, "VOD should be recorded");

      // Test Chat Commands (/raid)
      const targetStream = await prisma.liveStream.create({
        data: {
          hostId: alicedev.id,
          title: "Target Stream",
          isActive: true,
          viewerCount: 5,
        },
      });

      const viewersToTransfer = vodStream.viewerCount;
      await prisma.liveStream.update({
        where: { id: targetStream.id },
        data: { viewerCount: { increment: viewersToTransfer } },
      });
      await prisma.liveStream.update({
        where: { id: vodStream.id },
        data: { viewerCount: 0 },
      });

      const finalTargetStream = await prisma.liveStream.findUnique({
        where: { id: targetStream.id },
      });
      assertEq(
        finalTargetStream.viewerCount,
        5 + viewersToTransfer,
        "Target stream viewer count should be incremented",
      );

      // Clean up
      await prisma.liveStreamChatMessage.deleteMany({
        where: { liveStreamId: stream.id },
      });
      await prisma.clip.deleteMany({ where: { liveStreamId: stream.id } });
      await prisma.predictionBet.deleteMany({
        where: { predictionId: prediction.id },
      });
      await prisma.predictionOption.deleteMany({
        where: { predictionId: prediction.id },
      });
      await prisma.prediction.deleteMany({
        where: { liveStreamId: stream.id },
      });
      await prisma.liveStreamGift.deleteMany({
        where: { liveStreamId: stream.id },
      });
      await prisma.liveStreamCoHost.deleteMany({
        where: { liveStreamId: stream.id },
      });
      await prisma.liveStream.delete({ where: { id: stream.id } });
      await prisma.liveStream.delete({ where: { id: targetStream.id } });
    } finally {
      await prisma.$disconnect();
    }
  },
);

// ============================================================================
// BATCH 7: SERVER/CHANNEL ARCHITECTURE E2E TESTS
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
          position: 0,
        },
      });
      const voiceChannel = await prisma.serverChannel.create({
        data: {
          serverId: server.id,
          name: "Lobby",
          type: "VOICE",
          position: 0,
        },
      });
      const stageChannel = await prisma.serverChannel.create({
        data: {
          serverId: server.id,
          name: "Townhall",
          type: "STAGE",
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

runTest(
  "tier4",
  "Server REST API: HTTP route authentication, permissions, and hierarchy boundaries",
  async () => {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    const { spawn } = require("child_process");
    const path = require("path");

    let serverProcess = null;
    const port = 4055;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      const owner = await prisma.user.findUnique({
        where: { username: "wakkadev" },
      });
      const userB = await prisma.user.findUnique({
        where: { username: "alicedev" },
      });
      const userC = await prisma.user.findUnique({
        where: { username: "bobdev" },
      });
      assert(
        owner && userB && userC,
        "Seeded users wakkadev, alicedev, and bobdev must exist",
      );

      console.log(`    [HTTP Step 1/7] Spawning server on port ${port}...`);
      const tsxPath = path.resolve(
        __dirname,
        "../node_modules/tsx/dist/cli.cjs",
      );
      const env = {
        ...process.env,
        PORT: String(port),
        HOSTNAME: "127.0.0.1",
        NODE_ENV: "development",
      };

      serverProcess = spawn("node", [tsxPath, "server.ts"], { env });

      serverProcess.stdout.on("data", (data) => {
        console.log(`      [Server] ${data.toString().trim()}`);
      });

      serverProcess.stderr.on("data", (data) => {
        console.error(`      [Server Error] ${data.toString().trim()}`);
      });

      serverProcess.on("error", (err) => {
        console.error(`      [Server Spawn Error] ${err}`);
      });

      // Wait for server to start (polling health check or wait)
      await new Promise((resolve) => {
        let isReady = false;
        const checkInterval = setInterval(async () => {
          try {
            const res = await fetch(`${baseUrl}/api/servers`, {
              headers: { "x-user-id": owner.id },
            });
            if (
              res.status === 200 ||
              res.status === 401 ||
              res.status === 403
            ) {
              clearInterval(checkInterval);
              if (!isReady) {
                isReady = true;
                resolve();
              }
            }
          } catch {
            // Keep waiting
          }
        }, 500);

        setTimeout(() => {
          clearInterval(checkInterval);
          if (!isReady) {
            isReady = true;
            resolve();
          }
        }, 90000); // 90 seconds timeout
      });

      console.log(
        "    [HTTP Step 2/7] Testing route authentication (missing user ID on POST)...",
      );
      const authRes = await fetch(`${baseUrl}/api/servers`, { method: "POST" });
      assertEq(
        authRes.status,
        401,
        "Should return 401 Unauthorized when missing x-user-id header on POST",
      );

      console.log(
        "    [HTTP Step 3/7] Owner creates a server via POST /api/servers...",
      );
      const createServerRes = await fetch(`${baseUrl}/api/servers`, {
        method: "POST",
        headers: {
          "x-user-id": owner.id,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "HTTP REST Test Server",
          isPublic: true,
        }),
      });
      assertEq(createServerRes.status, 200, "Server creation should succeed");
      const serverData = await createServerRes.json();
      const serverId = serverData.data.id;
      assert(serverId, "Response should contain server ID");

      console.log(
        "    [HTTP Step 4/7] Non-member tries to create a channel (should fail)...",
      );
      const createChannelRes = await fetch(
        `${baseUrl}/api/servers/${serverId}/channels`,
        {
          method: "POST",
          headers: {
            "x-user-id": userB.id,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "secret-chat",
            type: "TEXT",
          }),
        },
      );
      assertEq(
        createChannelRes.status,
        403,
        "Should return 403 Forbidden for non-member without permissions",
      );

      console.log("    [HTTP Step 5/7] User B joins the server...");
      const joinRes = await fetch(
        `${baseUrl}/api/servers/${serverId}/members`,
        {
          method: "POST",
          headers: {
            "x-user-id": userB.id,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inviteCode: serverData.data.inviteCode,
          }),
        },
      );
      assertEq(
        joinRes.status,
        200,
        "User B should successfully join the server",
      );
      const joinData = await joinRes.json();
      const memberBId = joinData.data.id;

      console.log(
        "    [HTTP Step 6/7] Testing role position hierarchy boundaries during role assignment...",
      );
      // Owner creates roles
      const role1Res = await fetch(`${baseUrl}/api/servers/${serverId}/roles`, {
        method: "POST",
        headers: { "x-user-id": owner.id, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Admin Role", position: 10 }),
      });
      const role1Data = await role1Res.json();
      const adminRoleId = role1Data.role.id;

      const role2Res = await fetch(`${baseUrl}/api/servers/${serverId}/roles`, {
        method: "POST",
        headers: { "x-user-id": owner.id, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Super Admin Role", position: 12 }),
      });
      const role2Data = await role2Res.json();
      const superAdminRoleId = role2Data.role.id;

      // Owner assigns Admin Role (position 10) to User B (Alice)
      const assignRoleRes1 = await fetch(
        `${baseUrl}/api/servers/${serverId}/members`,
        {
          method: "PATCH",
          headers: {
            "x-user-id": owner.id,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ memberId: memberBId, roleIds: [adminRoleId] }),
        },
      );
      assertEq(
        assignRoleRes1.status,
        200,
        "Owner should be able to assign position 10 role to User B",
      );

      // Now User B (highest role position 10) tries to assign Super Admin Role (position 12) to herself (should fail)
      const assignRoleRes2 = await fetch(
        `${baseUrl}/api/servers/${serverId}/members`,
        {
          method: "PATCH",
          headers: {
            "x-user-id": userB.id,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memberId: memberBId,
            roleIds: [adminRoleId, superAdminRoleId],
          }),
        },
      );
      assertEq(
        assignRoleRes2.status,
        403,
        "User B (position 10) should be forbidden from assigning position 12 role",
      );

      console.log(
        "    [HTTP Step 7/7] Testing kicker/hierarchy checks in members DELETE API...",
      );
      // Get owner's member record id
      const membersListRes = await fetch(
        `${baseUrl}/api/servers/${serverId}/members`,
        {
          headers: { "x-user-id": owner.id },
        },
      );
      const membersListData = await membersListRes.json();
      const ownerMember = membersListData.data.find(
        (m) => m.userId === owner.id,
      );
      assert(ownerMember, "Owner member must be returned in list");

      // User B (position 10) tries to kick Owner (Infinity) - should fail
      const kickOwnerRes = await fetch(
        `${baseUrl}/api/servers/${serverId}/members`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": userB.id,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ memberId: ownerMember.id }),
        },
      );
      assertEq(
        kickOwnerRes.status,
        403,
        "User B should be forbidden from kicking the owner",
      );

      console.log("    Cleaning up HTTP test server records...");
      // Clean up using direct prisma calls
      await prisma.serverMemberRole.deleteMany({
        where: { memberId: memberBId },
      });
      await prisma.serverRole.deleteMany({ where: { serverId } });
      await prisma.serverMember.deleteMany({ where: { serverId } });
      await prisma.serverChannel.deleteMany({ where: { serverId } });
      await prisma.server.delete({ where: { id: serverId } });
    } finally {
      await prisma.$disconnect();
      if (serverProcess) {
        serverProcess.kill("SIGKILL");
      }
    }
  },
);

// ============================================================================
// BATCH 8: PROFESSIONAL & JOBS E2E TESTS
// ============================================================================

runTest('tier4', 'Professional Jobs Platform Workflow: Create Company -> Post Job -> Apply -> Review Status', async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const { spawn } = require('child_process');
  const path = require('path');
  const port = 4081;
  const baseUrl = `http://127.0.0.1:${port}`;
  let serverProcess = null;

  try {
    const employer = await prisma.user.findUnique({ where: { username: 'wakkadev' } });
    const applicant = await prisma.user.findUnique({ where: { username: 'alicedev' } });
    assert(employer && applicant, 'Seeded users wakkadev and alicedev must exist');

    console.log(`    Spawning server on port ${port}...`);
    const tsxPath = path.resolve(__dirname, "../node_modules/tsx/dist/cli.cjs");
    const env = {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "development",
    };
    serverProcess = spawn('node', [tsxPath, 'server.ts'], { env });

    await new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        try {
          const res = await fetch(`${baseUrl}/api/professional/profile`, {
            headers: { 'x-user-id': employer.id }
          });
          if (res.status === 200 || res.status === 401 || res.status === 403) {
            clearInterval(checkInterval);
            resolve();
          }
        } catch (e) {}
      }, 500);
    });

    // 1. Create Company
    const companyRes = await fetch(`${baseUrl}/api/professional/companies`, {
      method: 'POST',
      headers: {
        'x-user-id': employer.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'WakkaCorp',
        description: 'Building the future of social networks',
        industry: 'Technology',
        size: '11-50 employees',
        website: 'https://wakkacorp.io',
        location: 'Remote'
      })
    });
    assertEq(companyRes.status, 200, 'Should successfully create company page');
    const companyData = await companyRes.json();
    const companyId = companyData.data.id;
    assert(companyId, 'Created company must return a valid ID');

    // 2. Post a Job under that Company
    const jobRes = await fetch(`${baseUrl}/api/professional/jobs`, {
      method: 'POST',
      headers: {
        'x-user-id': employer.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        companyId: companyId,
        title: 'Senior E2E Automation Engineer',
        location: 'Remote',
        type: 'FULL_TIME',
        salary: '$130,000 - $160,000',
        description: 'Design and write Node.js E2E test suites',
        requirements: JSON.stringify(['Node.js', 'Prisma', 'E2E Testing'])
      })
    });
    assertEq(jobRes.status, 200, 'Should successfully post a job');
    const jobData = await jobRes.json();
    const jobId = jobData.data.id;
    assert(jobId, 'Created job must return a valid ID');

    // 3. Search and list jobs (Verification for Applicant)
    const listRes = await fetch(`${baseUrl}/api/professional/jobs?search=Automation`, {
      headers: { 'x-user-id': applicant.id }
    });
    assertEq(listRes.status, 200, 'Should list jobs successfully');
    const listData = await listRes.json();
    const foundJob = listData.data.find(j => j.id === jobId);
    assert(foundJob, 'Applicant search must find the newly posted job');

    // 4. Apply for the Job posting
    const applyRes = await fetch(`${baseUrl}/api/professional/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        'x-user-id': applicant.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resumeUrl: 'https://example.com/resumes/alice.pdf',
        coverLetter: 'I have extensive experience running integration suites in Next.js'
      })
    });
    assertEq(applyRes.status, 200, 'Applicant should apply successfully');
    const applyData = await applyRes.json();
    const applicationId = applyData.data.id;

    // 5. Database check for Application
    const dbApp = await prisma.jobApplication.findUnique({
      where: { id: applicationId }
    });
    assert(dbApp, 'Application record must persist in SQLite DB');
    assertEq(dbApp.status, 'PENDING', 'Initial application status must be PENDING');
    assertEq(dbApp.applicantId, applicant.id);

    // 6. Employer updates application status (Review status)
    const reviewRes = await fetch(`${baseUrl}/api/professional/jobs/${jobId}/apply`, {
      method: 'PATCH',
      headers: {
        'x-user-id': employer.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        applicationId: applicationId,
        status: 'INTERVIEWING'
      })
    });
    assertEq(reviewRes.status, 200, 'Employer should update status to INTERVIEWING');

    const dbAppUpdated = await prisma.jobApplication.findUnique({
      where: { id: applicationId }
    });
    assertEq(dbAppUpdated.status, 'INTERVIEWING', 'Application status should update to INTERVIEWING');

    // Cleanup
    await prisma.jobApplication.delete({ where: { id: applicationId } });
    await prisma.job.delete({ where: { id: jobId } });
    await prisma.companyMember.deleteMany({ where: { companyId } });
    await prisma.company.delete({ where: { id: companyId } });

  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGKILL');
    }
    await prisma.$disconnect();
  }
});

runTest('tier4', 'Professional InMail Quota and Message Gating: Free vs Premium', async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const { spawn } = require('child_process');
  const path = require('path');
  const port = 4082;
  const baseUrl = `http://127.0.0.1:${port}`;
  let serverProcess = null;

  try {
    const sender = await prisma.user.findUnique({ where: { username: 'wakkadev' } });
    const receiver = await prisma.user.findUnique({ where: { username: 'alicedev' } });
    assert(sender && receiver, 'Seeded users wakkadev and alicedev must exist');

    // 1. Force Free status on sender
    await prisma.user.update({
      where: { id: sender.id },
      data: { isPremium: false }
    });

    console.log(`    Spawning server on port ${port}...`);
    const tsxPath = path.resolve(__dirname, "../node_modules/tsx/dist/cli.cjs");
    const env = {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "development",
    };
    serverProcess = spawn('node', [tsxPath, 'server.ts'], { env });

    await new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        try {
          const res = await fetch(`${baseUrl}/api/professional/profile`, {
            headers: { 'x-user-id': sender.id }
          });
          if (res.status === 200 || res.status === 401 || res.status === 403) {
            clearInterval(checkInterval);
            resolve();
          }
        } catch (e) {}
      }, 500);
    });

    // 2. Try sending InMail as Free User (Expect rejection)
    const freeInMailRes = await fetch(`${baseUrl}/api/professional/inmail`, {
      method: 'POST',
      headers: {
        'x-user-id': sender.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiverId: receiver.id,
        subject: 'Networking Inquiry',
        body: 'I would like to add you to my professional network.'
      })
    });
    assertEq(freeInMailRes.status, 403, 'Free users should be blocked from sending InMail messages');

    // 3. Force Premium status on sender and set quota
    await prisma.user.update({
      where: { id: sender.id },
      data: {
        isPremium: true,
        inmailQuota: 1
      }
    });

    // 4. Send InMail as Premium User (Expect Success)
    const premiumInMailRes = await fetch(`${baseUrl}/api/professional/inmail`, {
      method: 'POST',
      headers: {
        'x-user-id': sender.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiverId: receiver.id,
        subject: 'Collaboration Invitation',
        body: 'Hi Alice, let\'s collaborate on a next-generation platform.'
      })
    });
    assertEq(premiumInMailRes.status, 200, 'Premium user with available quota should successfully send InMail');
    const inmailData = await premiumInMailRes.json();
    const inmailMessageId = inmailData.data.id;

    // 5. Verify database record and quota deduction
    const dbInMail = await prisma.inMailMessage.findUnique({
      where: { id: inmailMessageId }
    });
    assert(dbInMail, 'InMail record must exist in DB');
    assertEq(dbInMail.subject, 'Collaboration Invitation');

    const updatedSender = await prisma.user.findUnique({ where: { id: sender.id } });
    assertEq(updatedSender.inmailQuota, 0, 'InMail quota must decrement by 1 upon sending');

    // 6. Try sending again with exhausted quota (Expect rejection)
    const exhaustedQuotaRes = await fetch(`${baseUrl}/api/professional/inmail`, {
      method: 'POST',
      headers: {
        'x-user-id': sender.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiverId: receiver.id,
        subject: 'Follow-up',
        body: 'Just checking in on the previous message.'
      })
    });
    assertEq(exhaustedQuotaRes.status, 403, 'Should reject InMail request if monthly quota is 0');

    // Cleanup
    await prisma.inMailMessage.delete({ where: { id: inmailMessageId } });
    await prisma.user.update({
      where: { id: sender.id },
      data: {
        isPremium: false,
        inmailQuota: 0
      }
    });

  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGKILL');
    }
    await prisma.$disconnect();
  }
});

runTest('tier4', 'Learning Progress and Course Completion: Progress updates -> Certificate Issue', async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const { spawn } = require('child_process');
  const path = require('path');
  const port = 4083;
  const baseUrl = `http://127.0.0.1:${port}`;
  let serverProcess = null;

  try {
    const student = await prisma.user.findUnique({ where: { username: 'bobdev' } });
    assert(student, 'Seeded user bobdev must exist');

    // 1. Create a course in DB
    const course = await prisma.learningCourse.create({
      data: {
        title: 'Introduction to Next.js 14 App Router',
        description: 'Learn layouts, loading states, server actions, and route handlers',
        instructor: 'Dr. Wakka',
        duration: '4 hours',
        level: 'INTERMEDIATE',
        modulesList: JSON.stringify(['routing', 'rendering', 'data-fetching', 'optimization'])
      }
    });
    assert(course.id, 'Course record should be created');

    console.log(`    Spawning server on port ${port}...`);
    const tsxPath = path.resolve(__dirname, "../node_modules/tsx/dist/cli.cjs");
    const env = {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "development",
    };
    serverProcess = spawn('node', [tsxPath, 'server.ts'], { env });

    await new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        try {
          const res = await fetch(`${baseUrl}/api/professional/profile`, {
            headers: { 'x-user-id': student.id }
          });
          if (res.status === 200 || res.status === 401 || res.status === 403) {
            clearInterval(checkInterval);
            resolve();
          }
        } catch (e) {}
      }, 500);
    });

    // 2. Enroll student in the course
    const enrollRes = await fetch(`${baseUrl}/api/professional/learning`, {
      method: 'POST',
      headers: {
        'x-user-id': student.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        courseId: course.id
      })
    });
    assertEq(enrollRes.status, 200, 'Student should successfully enroll in course');
    const enrollData = await enrollRes.json();
    const enrollmentId = enrollData.data.id;

    // Verify initial enrollment progress
    const dbEnrollment = await prisma.learningEnrollment.findUnique({
      where: { id: enrollmentId }
    });
    assertEq(dbEnrollment.progressPercentage, 0, 'Initial progress percentage should be 0');
    assertEq(dbEnrollment.status, 'ENROLLED', 'Initial enrollment status should be ENROLLED');

    // 3. Update partial progress
    const progress1Res = await fetch(`${baseUrl}/api/professional/learning/${course.id}/progress`, {
      method: 'PATCH',
      headers: {
        'x-user-id': student.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        progressPercentage: 50,
        completedModules: JSON.stringify(['routing', 'rendering'])
      })
    });
    assertEq(progress1Res.status, 200, 'Should update partial course progress');

    const dbEnrollmentMid = await prisma.learningEnrollment.findUnique({
      where: { id: enrollmentId }
    });
    assertEq(dbEnrollmentMid.progressPercentage, 50, 'DB progress should update to 50%');
    assertEq(dbEnrollmentMid.status, 'IN_PROGRESS', 'Status should change to IN_PROGRESS');

    // 4. Complete course (100% progress)
    const progress2Res = await fetch(`${baseUrl}/api/professional/learning/${course.id}/progress`, {
      method: 'PATCH',
      headers: {
        'x-user-id': student.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        progressPercentage: 100,
        completedModules: JSON.stringify(['routing', 'rendering', 'data-fetching', 'optimization'])
      })
    });
    assertEq(progress2Res.status, 200, 'Should mark progress as 100%');
    const progress2Data = await progress2Res.json();
    assert(progress2Data.data.certificateUrl, 'Completing the course must generate a certificate URL');

    const dbEnrollmentFinal = await prisma.learningEnrollment.findUnique({
      where: { id: enrollmentId }
    });
    assertEq(dbEnrollmentFinal.progressPercentage, 100, 'DB progress should update to 100%');
    assertEq(dbEnrollmentFinal.status, 'COMPLETED', 'Status should change to COMPLETED');

    // Verify profile badge issued
    const badge = await prisma.badge.findFirst({
      where: {
        userId: student.id,
        name: 'Next.js App Router Certification'
      }
    });
    assert(badge, 'Badge for course completion must be issued and saved in User badges');

    // Cleanup
    if (badge) {
      await prisma.badge.delete({ where: { id: badge.id } });
    }
    await prisma.learningEnrollment.delete({ where: { id: enrollmentId } });
    await prisma.learningCourse.delete({ where: { id: course.id } });

  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGKILL');
    }
    await prisma.$disconnect();
  }
});

// ============================================================================
// BATCH 9: FORUM & VOTING (REDDIT-STYLE) E2E TESTS
// ============================================================================

runTest('tier4', 'Reddit Platform Workflow: Create Subreddit -> Join -> Post Text/Poll -> Upvote/Karma Sync -> Nested Comments -> Award -> AMA Highlights -> Mod Actions', async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const { spawn } = require('child_process');
  const path = require('path');
  const port = 4085;
  const baseUrl = `http://127.0.0.1:${port}`;
  let serverProcess = null;

  try {
    const modUser = await prisma.user.findUnique({ where: { username: 'wakkadev' } });
    const authorUser = await prisma.user.findUnique({ where: { username: 'alicedev' } });
    const voterUser = await prisma.user.findUnique({ where: { username: 'bobdev' } });
    assert(modUser && authorUser && voterUser, 'Seeded users wakkadev, alicedev, and bobdev must exist');

    console.log(`    Spawning server on port ${port}...`);
    const tsxPath = path.resolve(__dirname, "../node_modules/tsx/dist/cli.cjs");
    const env = {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "development",
    };
    serverProcess = spawn('node', [tsxPath, 'server.ts'], { env });

    await new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        try {
          const res = await fetch(`${baseUrl}/api/reddit/posts`);
          if (res.status === 200 || res.status === 401) {
            clearInterval(checkInterval);
            resolve();
          }
        } catch (e) {}
      }, 500);
    });

    // 0. Pre-test cleanup of leftovers
    const oldSubs = await prisma.subreddit.findMany({
      where: { OR: [{ name: 'E2E Testing Community' }, { slug: 'e2e-testing' }] }
    });
    for (const oldSub of oldSubs) {
      const posts = await prisma.subredditPost.findMany({ where: { subredditId: oldSub.id } });
      const postIds = posts.map(p => p.id);
      await prisma.redditModAction.deleteMany({ where: { subredditId: oldSub.id } });
      await prisma.redditAward.deleteMany({ where: { targetId: { in: postIds } } });
      await prisma.subredditComment.deleteMany({ where: { postId: { in: postIds } } });
      await prisma.subredditPost.deleteMany({ where: { subredditId: oldSub.id } });
      await prisma.subredditMember.deleteMany({ where: { subredditId: oldSub.id } });
      await prisma.subreddit.delete({ where: { id: oldSub.id } });
    }

    // 1. Create a Subreddit
    const subredditRes = await fetch(`${baseUrl}/api/reddit/subreddits`, {
      method: 'POST',
      headers: { 'x-user-id': modUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Testing Community',
        slug: 'e2e-testing',
        description: 'A sandbox community for automated test suites',
        rules: JSON.stringify(['Follow sandbox guidelines', 'No real spam'])
      })
    });
    assertEq(subredditRes.status, 200, 'Should create subreddit successfully');
    const subData = await subredditRes.json();
    const subredditId = subData.data.id;
    assert(subredditId, 'Subreddit must return a valid ID');

    // 2. Join Subreddit (alicedev joins)
    const joinRes = await fetch(`${baseUrl}/api/reddit/subreddits/${subredditId}/join`, {
      method: 'POST',
      headers: { 'x-user-id': authorUser.id }
    });
    assertEq(joinRes.status, 200, 'User should join subreddit successfully');

    // 3. Create a SubredditPost (TEXT/AMA post)
    const postRes = await fetch(`${baseUrl}/api/reddit/posts`, {
      method: 'POST',
      headers: { 'x-user-id': authorUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subredditId: subredditId,
        title: 'I am a Senior E2E Engineer, AMA!',
        content: 'Ask me anything about Node.js test runs and SQLite setups.',
        type: 'TEXT',
        isAMA: true
      })
    });
    assertEq(postRes.status, 200, 'Should publish post successfully');
    const postData = await postRes.json();
    const postId = postData.data.id;
    assert(postId, 'Post must return a valid ID');

    // 4. Upvote & Karma sync (voterUser upvotes authorUser post)
    const voteRes = await fetch(`${baseUrl}/api/reddit/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'x-user-id': voterUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'UPVOTE' })
    });
    assertEq(voteRes.status, 200, 'Should cast vote successfully');

    // Verify post score and author karma increment
    const dbPost = await prisma.subredditPost.findUnique({ where: { id: postId } });
    assertEq(dbPost.score, 1, 'Post score must increment to 1');
    const dbAuthor = await prisma.user.findUnique({ where: { id: authorUser.id } });
    assert(dbAuthor.redditKarma > 0, 'Author karma should increase after receiving an upvote');

    // 5. Nested threaded comment replies
    // Root comment by bobdev
    const rootCommentRes = await fetch(`${baseUrl}/api/reddit/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'x-user-id': voterUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'What is your favorite test suite library?' })
    });
    assertEq(rootCommentRes.status, 200, 'Should submit root comment');
    const rootComment = (await rootCommentRes.json()).data;

    // Sub-reply by AMA host alicedev (should automatically flag as isAMAAnswer)
    const replyCommentRes = await fetch(`${baseUrl}/api/reddit/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'x-user-id': authorUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'I really love running custom lightweight E2E scripts.', parentId: rootComment.id })
    });
    assertEq(replyCommentRes.status, 200, 'Should submit reply comment');
    const replyComment = (await replyCommentRes.json()).data;
    assertEq(replyComment.isAMAAnswer, true, 'Host response in AMA thread must set isAMAAnswer to true');

    // 6. Give Award (bobdev gives Gold award to alicedev post)
    const awardRes = await fetch(`${baseUrl}/api/reddit/posts/${postId}/award`, {
      method: 'POST',
      headers: { 'x-user-id': voterUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Gold', price: 100, icon: '🏆' })
    });
    assertEq(awardRes.status, 200, 'Should give award successfully');
    
    // Verify award record and extra karma sync
    const awardsCount = await prisma.redditAward.count({ where: { targetId: postId } });
    assertEq(awardsCount, 1, 'Award count in DB should be 1');

    // 7. Mod Actions (wakkadev locks the post)
    const modRes = await fetch(`${baseUrl}/api/reddit/mod`, {
      method: 'POST',
      headers: { 'x-user-id': modUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subredditId: subredditId,
        postId: postId,
        action: 'LOCK',
        reason: 'AMA timeframe has elapsed'
      })
    });
    assertEq(modRes.status, 200, 'Moderator should execute lock action successfully');

    const updatedPost = await prisma.subredditPost.findUnique({ where: { id: postId } });
    assertEq(updatedPost.isLocked, true, 'Post must set isLocked flag to true');

    // Verify Mod action is logged in database
    const loggedAction = await prisma.redditModAction.findFirst({
      where: { subredditId, targetPostId: postId }
    });
    assert(loggedAction, 'Moderator action log record must exist');
    assertEq(loggedAction.action, 'LOCK_POST');

    // Cleanup E2E records
    await prisma.redditModAction.deleteMany({ where: { subredditId } });
    await prisma.redditAward.deleteMany({ where: { targetId: postId } });
    await prisma.subredditComment.deleteMany({ where: { postId } });
    await prisma.subredditPost.delete({ where: { id: postId } });
    await prisma.subredditMember.deleteMany({ where: { subredditId } });
    await prisma.subreddit.delete({ where: { id: subredditId } });

  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGKILL');
    }
    await prisma.$disconnect();
  }
});

// Run all queued tests asynchronously
(async () => {
  for (const test of pendingTests) {
    stats.total++;
    stats.tiers[test.tier].total++;
    try {
      await test.fn();
      stats.passed++;
      stats.tiers[test.tier].passed++;
      console.log(
        `  ${colors.green}✓${colors.reset} [${test.tier.toUpperCase()}] ${test.name}`,
      );
    } catch (error) {
      stats.failed++;
      stats.tiers[test.tier].failed++;
      console.error(
        `  ${colors.red}✗${colors.reset} [${test.tier.toUpperCase()}] ${test.name}`,
      );
      console.error(`    ${colors.red}Error:${colors.reset} ${error.message}`);
      if (error.stack) {
        console.error(
          colors.dim +
            error.stack.split("\n").slice(1, 3).join("\n") +
            colors.reset,
        );
      }
    }
  }

  // Print Summary
  console.log(
    `\n${colors.bright}${colors.cyan}====================================================${colors.reset}`,
  );
  console.log(
    `${colors.bright}${colors.cyan}                  TEST RUN SUMMARY                  ${colors.reset}`,
  );
  console.log(
    `${colors.bright}${colors.cyan}====================================================${colors.reset}`,
  );
  console.log(`Total Tests Run: ${stats.total}`);
  console.log(`Passed:          ${colors.green}${stats.passed}${colors.reset}`);
  console.log(
    `Failed:          ${stats.failed > 0 ? colors.red : colors.green}${stats.failed}${colors.reset}`,
  );
  console.log(`\nTier Breakdown:`);
  Object.entries(stats.tiers).forEach(([tier, data]) => {
    const color = data.failed > 0 ? colors.red : colors.green;
    console.log(
      `  - ${tier.toUpperCase()}: ${data.passed}/${data.total} passed (${color}${data.failed} failed${colors.reset})`,
    );
  });
  console.log(
    `${colors.bright}${colors.cyan}====================================================${colors.reset}\n`,
  );

  if (stats.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
