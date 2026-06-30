const { spawn } = require("child_process");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const prisma = new PrismaClient();

const PORT = 3002;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("--- STARTING REDDIT FIXES INTEGRATION TESTS ---");

  // Get user for authentication
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found in database!");
    process.exit(1);
  }
  console.log(`Using test user: ${user.username} (${user.id})`);

  // Ensure user has enough channel points for testing
  await prisma.user.update({
    where: { id: user.id },
    data: { channelPoints: 5000 }
  });

  // Get or create subreddit
  let subreddit = await prisma.subreddit.findFirst();
  if (!subreddit) {
    subreddit = await prisma.subreddit.create({
      data: {
        name: "Test Subreddit",
        slug: "test-sub",
        creatorId: user.id
      }
    });
  }

  // Create a test post
  const post = await prisma.subredditPost.create({
    data: {
      title: "Test Post for Fixes",
      type: "TEXT",
      content: "This is a test post.",
      authorId: user.id,
      subredditId: subreddit.id,
      mediaUrls: "[]"
    }
  });
  console.log(`Created test post: ${post.id}`);

  // Create another post (to test parentId mismatched postId)
  const otherPost = await prisma.subredditPost.create({
    data: {
      title: "Other Post",
      type: "TEXT",
      content: "Other content.",
      authorId: user.id,
      subredditId: subreddit.id,
      mediaUrls: "[]"
    }
  });

  // Create a comment on the other post
  const commentOnOtherPost = await prisma.subredditComment.create({
    data: {
      content: "Comment on other post",
      postId: otherPost.id,
      authorId: user.id,
      score: 1,
      upvotes: 1,
      downvotes: 0
    }
  });

  // Create a comment on our main post to act as a valid parent
  const validParentComment = await prisma.subredditComment.create({
    data: {
      content: "Valid parent comment",
      postId: post.id,
      authorId: user.id,
      score: 1,
      upvotes: 1,
      downvotes: 0
    }
  });

  // Spawn Next.js server on port 3002
  console.log("Spawning Next.js server on port 3002...");
  const serverProcess = spawn(
    "node",
    ["node_modules/tsx/dist/cli.cjs", "server.ts"],
    {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, PORT: String(PORT) },
      shell: true,
    }
  );

  serverProcess.stdout.on("data", (data) => {
    console.log(`[Server Out] ${data}`);
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`[Server Err] ${data}`);
  });

  // Wait for server to start
  let serverReady = false;
  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    try {
      const res = await fetch(`${BASE_URL}/api/reddit/posts`);
      if (res.status === 200) {
        serverReady = true;
        break;
      }
    } catch (e) {
      // console.log(`Waiting for server...`);
    }
  }

  if (!serverReady) {
    console.error("Server failed to start on port 3002");
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  }
  console.log("Server is ready on port 3002!");

  const testFailures = [];

  try {
    // ----------------------------------------------------
    // Test 1: Post Award Negative Price Check
    // ----------------------------------------------------
    console.log("\n--- Test 1: Post Award price <= 0 check ---");
    const awardRes1 = await fetch(`${BASE_URL}/api/reddit/posts/${post.id}/award`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id
      },
      body: JSON.stringify({
        name: "Gold",
        icon: "gold-icon",
        price: -50
      })
    });
    const awardData1 = await awardRes1.json();
    if (awardRes1.status === 400) {
      console.log("✅ Post Award price <= 0 correctly rejected with 400");
    } else {
      testFailures.push(`Post Award negative price was not rejected (status: ${awardRes1.status})`);
      console.log(`❌ Post Award price <= 0 failed to reject (status: ${awardRes1.status})`);
    }

    // ----------------------------------------------------
    // Test 2: Post Award Float/Decimal Price Check
    // ----------------------------------------------------
    console.log("\n--- Test 2: Post Award price float check ---");
    const awardRes2 = await fetch(`${BASE_URL}/api/reddit/posts/${post.id}/award`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id
      },
      body: JSON.stringify({
        name: "Gold",
        icon: "gold-icon",
        price: 15.5
      })
    });
    if (awardRes2.status === 400) {
      console.log("✅ Post Award float price correctly rejected with 400");
    } else {
      testFailures.push(`Post Award float price was not rejected (status: ${awardRes2.status})`);
      console.log(`❌ Post Award float price failed to reject (status: ${awardRes2.status})`);
    }

    // ----------------------------------------------------
    // Test 3: Comment Award Negative Price Check
    // ----------------------------------------------------
    console.log("\n--- Test 3: Comment Award price <= 0 check ---");
    const commentAwardRes1 = await fetch(`${BASE_URL}/api/reddit/comments/${validParentComment.id}/award`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id
      },
      body: JSON.stringify({
        name: "Silver",
        icon: "silver-icon",
        price: 0
      })
    });
    if (commentAwardRes1.status === 400) {
      console.log("✅ Comment Award price <= 0 correctly rejected with 400");
    } else {
      testFailures.push(`Comment Award zero/negative price was not rejected (status: ${commentAwardRes1.status})`);
      console.log(`❌ Comment Award price <= 0 failed to reject (status: ${commentAwardRes1.status})`);
    }

    // ----------------------------------------------------
    // Test 4: Comment Award Float/Decimal Price Check
    // ----------------------------------------------------
    console.log("\n--- Test 4: Comment Award price float check ---");
    const commentAwardRes2 = await fetch(`${BASE_URL}/api/reddit/comments/${validParentComment.id}/award`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id
      },
      body: JSON.stringify({
        name: "Silver",
        icon: "silver-icon",
        price: 2.22
      })
    });
    if (commentAwardRes2.status === 400) {
      console.log("✅ Comment Award float price correctly rejected with 400");
    } else {
      testFailures.push(`Comment Award float price was not rejected (status: ${commentAwardRes2.status})`);
      console.log(`❌ Comment Award float price failed to reject (status: ${commentAwardRes2.status})`);
    }

    // ----------------------------------------------------
    // Test 5: Comment Post Match - Non-existent parentComment
    // ----------------------------------------------------
    console.log("\n--- Test 5: Comment POST non-existent parentId check ---");
    const commentRes1 = await fetch(`${BASE_URL}/api/reddit/posts/${post.id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id
      },
      body: JSON.stringify({
        content: "Reply to ghost comment",
        parentId: "non-existent-comment-id"
      })
    });
    const commentData1 = await commentRes1.json();
    if (commentRes1.status === 400 && commentData1.error === "Invalid parent comment ID") {
      console.log("✅ Comment POST non-existent parentId correctly rejected with 400");
    } else {
      testFailures.push(`Comment POST non-existent parentId was not rejected correctly. Status: ${commentRes1.status}, Error: ${commentData1.error}`);
      console.log(`❌ Comment POST non-existent parentId failed to reject. Status: ${commentRes1.status}`);
    }

    // ----------------------------------------------------
    // Test 6: Comment Post Match - Mismatched postId parentComment
    // ----------------------------------------------------
    console.log("\n--- Test 6: Comment POST mismatched postId parentId check ---");
    const commentRes2 = await fetch(`${BASE_URL}/api/reddit/posts/${post.id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id
      },
      body: JSON.stringify({
        content: "Reply to mismatched parent comment",
        parentId: commentOnOtherPost.id
      })
    });
    const commentData2 = await commentRes2.json();
    if (commentRes2.status === 400 && commentData2.error === "Invalid parent comment ID") {
      console.log("✅ Comment POST mismatched postId parentId correctly rejected with 400");
    } else {
      testFailures.push(`Comment POST mismatched postId parentId was not rejected correctly. Status: ${commentRes2.status}, Error: ${commentData2.error}`);
      console.log(`❌ Comment POST mismatched postId parentId failed to reject. Status: ${commentRes2.status}`);
    }

    // ----------------------------------------------------
    // Test 7: Comment Post Match - Valid parentComment
    // ----------------------------------------------------
    console.log("\n--- Test 7: Comment POST valid parentId check ---");
    const commentRes3 = await fetch(`${BASE_URL}/api/reddit/posts/${post.id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id
      },
      body: JSON.stringify({
        content: "Reply to valid parent comment",
        parentId: validParentComment.id
      })
    });
    const commentData3 = await commentRes3.json();
    if (commentRes3.ok) {
      console.log("✅ Comment POST valid parentId succeeded");
    } else {
      testFailures.push(`Comment POST valid parentId failed. Status: ${commentRes3.status}, Error: ${commentData3.error}`);
      console.log(`❌ Comment POST valid parentId failed. Status: ${commentRes3.status}`);
    }

  } catch (err) {
    console.error("Error during testing:", err);
    testFailures.push(`Testing exception: ${err.message}`);
  } finally {
    // Clean up DB records
    console.log("\nCleaning up database records...");
    await prisma.redditAward.deleteMany({
      where: { senderId: user.id }
    }).catch(() => {});

    await prisma.subredditComment.deleteMany({
      where: { postId: { in: [post.id, otherPost.id] } }
    }).catch(() => {});

    await prisma.subredditPost.deleteMany({
      where: { id: { in: [post.id, otherPost.id] } }
    }).catch(() => {});

    if (serverProcess) {
      console.log("Stopping Next.js server...");
      serverProcess.kill("SIGINT");
    }
    await prisma.$disconnect();
  }

  console.log("\n--- REDDIT FIXES TEST SUMMARY ---");
  if (testFailures.length > 0) {
    console.log(`Total Failures: ${testFailures.length}`);
    testFailures.forEach((f, idx) => console.log(`${idx + 1}. ${f}`));
    process.exit(1);
  } else {
    console.log("All reddit fixes tests passed successfully!");
    process.exit(0);
  }
}

main();
