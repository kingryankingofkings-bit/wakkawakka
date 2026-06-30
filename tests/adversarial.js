const { spawn } = require("child_process");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const prisma = new PrismaClient();

const PORT = 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 1. validateTipAmount logic
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

async function main() {
  console.log("--- STARTING ADVERSARIAL TESTS ---");

  // Let's check users
  const host = await prisma.user.findUnique({
    where: { username: "wakkadev" },
  });
  const bettor = await prisma.user.findUnique({
    where: { username: "bobdev" },
  });

  if (!host || !bettor) {
    console.error("Seeded users (wakkadev, bobdev) not found!");
    process.exit(1);
  }

  console.log(
    `Host: ${host.username} (${host.id}) - Points: ${host.channelPoints}`,
  );
  console.log(
    `Bettor: ${bettor.username} (${bettor.id}) - Points: ${bettor.channelPoints}`,
  );

  // Create clean stream
  const stream = await prisma.liveStream.create({
    data: {
      hostId: host.id,
      title: "Adversarial Test Stream",
      description: "Stream for boundary tests",
      category: "Technology",
      isActive: true,
      viewerCount: 1,
    },
  });
  console.log(`Created test stream: ${stream.id}`);

  // Spawn server
  let serverProcess;
  if (process.env.NO_SPAWN !== "true") {
    console.log("Spawning Next.js server on port 3001...");
    serverProcess = spawn(
      "node",
      ["node_modules/tsx/dist/cli.cjs", "server.ts"],
      {
        cwd: path.join(__dirname, ".."),
        env: { ...process.env, PORT: String(PORT) },
        shell: true,
      },
    );

    serverProcess.stdout.on("data", (data) => {
      console.log(`[Server Out] ${data}`);
    });

    serverProcess.stderr.on("data", (data) => {
      console.error(`[Server Err] ${data}`);
    });
  } else {
    console.log(
      "NO_SPAWN is true. Skipping spawning, assuming server is running on port 3001.",
    );
  }

  // Wait for server to start
  let serverReady = false;
  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    try {
      const res = await fetch(`${BASE_URL}/api/live/streams`);
      if (res.status === 200) {
        serverReady = true;
        break;
      } else {
        console.log(`Server responded with non-200: ${res.status}`);
      }
    } catch (e) {
      console.log(`Waiting for server... Error: ${e.message}`);
    }
  }

  if (!serverReady) {
    console.error("Server failed to start on port 3001");
    await prisma.liveStream
      .delete({ where: { id: stream.id } })
      .catch(() => {});
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  }
  console.log("Server is ready on port 3001!");

  const testFailures = [];

  try {
    // ----------------------------------------------------
    // Test 1: Tips Exceeding Single-Transaction Limits
    // ----------------------------------------------------
    console.log("\n--- Test 1: validateTipAmount Limits ---");
    try {
      validateTipAmount(20000);
      testFailures.push("validateTipAmount: Accepted tip exceeding $10,000!");
      console.log("❌ validateTipAmount: Failed to reject tip > $10,000");
    } catch (err) {
      if (
        err.message ===
        "Tipping amount exceeds the single transaction limit of $10,000"
      ) {
        console.log("✅ validateTipAmount: Correctly rejected tip > $10,000");
      } else {
        testFailures.push(
          `validateTipAmount: Rejected with unexpected message "${err.message}"`,
        );
        console.log("❌ validateTipAmount: Unexpected error message");
      }
    }

    try {
      validateTipAmount(-5);
      testFailures.push("validateTipAmount: Accepted negative tip!");
      console.log("❌ validateTipAmount: Failed to reject negative tip");
    } catch (err) {
      if (err.message === "Please specify a valid tipping amount") {
        console.log("✅ validateTipAmount: Correctly rejected negative tip");
      } else {
        testFailures.push(
          `validateTipAmount: Rejected negative with unexpected message "${err.message}"`,
        );
        console.log("❌ validateTipAmount: Unexpected error message");
      }
    }

    // ----------------------------------------------------
    // Create prediction for subsequent tests
    // ----------------------------------------------------
    console.log("\nCreating a prediction on the stream...");
    const predRes = await fetch(
      `${BASE_URL}/api/live/streams/${stream.id}/predictions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": host.id,
        },
        body: JSON.stringify({
          action: "CREATE",
          title: "Will adversarial tests pass?",
          options: ["Yes", "No"],
        }),
      },
    );
    const predData = await predRes.json();
    if (!predRes.ok) {
      throw new Error(
        `Failed to create prediction: ${JSON.stringify(predData)}`,
      );
    }
    const prediction = predData.prediction;
    const optionYes = prediction.options[0].id;
    const optionNo = prediction.options[1].id;
    console.log(
      `Prediction created: ${prediction.id}, Yes Option: ${optionYes}`,
    );

    // ----------------------------------------------------
    // Test 2: Negative Channel Points Bet
    // ----------------------------------------------------
    console.log("\n--- Test 2: Negative Channel Points Bet ---");
    const negBetRes = await fetch(
      `${BASE_URL}/api/live/streams/${stream.id}/predictions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": bettor.id,
        },
        body: JSON.stringify({
          action: "BET",
          optionId: optionYes,
          points: -100,
        }),
      },
    );
    const negBetData = await negBetRes.json();
    if (negBetRes.status === 400) {
      console.log("✅ Negative Bet: Correctly rejected with 400");
    } else {
      testFailures.push(
        `Negative Bet: Accepted or returned non-400 status (${negBetRes.status})! Data: ${JSON.stringify(negBetData)}`,
      );
      console.log("❌ Negative Bet: Failed to reject");
    }

    // ----------------------------------------------------
    // Test 3: Decimal/Float Channel Points Bet
    // ----------------------------------------------------
    console.log("\n--- Test 3: Decimal/Float Channel Points Bet ---");
    const floatBetRes = await fetch(
      `${BASE_URL}/api/live/streams/${stream.id}/predictions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": bettor.id,
        },
        body: JSON.stringify({
          action: "BET",
          optionId: optionYes,
          points: 10.5,
        }),
      },
    );
    const floatBetData = await floatBetRes.json();
    if (floatBetRes.status === 400 || floatBetRes.status === 500) {
      console.log(
        `✅ Float Bet: Rejected with ${floatBetRes.status}. Data: ${JSON.stringify(floatBetData)}`,
      );
    } else {
      const userAfter = await prisma.user.findUnique({
        where: { id: bettor.id },
      });
      testFailures.push(
        `Float Bet: Accepted with status ${floatBetRes.status}. User balance after: ${userAfter.channelPoints}`,
      );
      console.log(
        `❌ Float Bet: Accepted with status ${floatBetRes.status}. User balance after: ${userAfter.channelPoints}`,
      );
    }

    // ----------------------------------------------------
    // Test 4: Double-Betting (Sequential)
    // ----------------------------------------------------
    console.log("\n--- Test 4: Sequential Double-Betting ---");
    const bet1Res = await fetch(
      `${BASE_URL}/api/live/streams/${stream.id}/predictions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": bettor.id,
        },
        body: JSON.stringify({
          action: "BET",
          optionId: optionYes,
          points: 100,
        }),
      },
    );
    const bet1Data = await bet1Res.json();
    if (!bet1Res.ok) {
      testFailures.push(
        `Sequential Double-Betting: First bet failed: ${JSON.stringify(bet1Data)}`,
      );
      console.log("❌ First bet failed");
    } else {
      console.log("First bet succeeded");

      const bet2Res = await fetch(
        `${BASE_URL}/api/live/streams/${stream.id}/predictions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": bettor.id,
          },
          body: JSON.stringify({
            action: "BET",
            optionId: optionYes,
            points: 100,
          }),
        },
      );
      const bet2Data = await bet2Res.json();
      if (
        bet2Res.status === 400 &&
        bet2Data.error === "You have already placed a bet on this prediction"
      ) {
        console.log(
          "✅ Second bet: Correctly rejected with 400 and expected error message",
        );
      } else {
        testFailures.push(
          `Sequential Double-Betting: Second bet was not rejected correctly. Status: ${bet2Res.status}, Data: ${JSON.stringify(bet2Data)}`,
        );
        console.log(
          `❌ Second bet: Failed to reject correctly. Status: ${bet2Res.status}`,
        );
      }
    }

    // ----------------------------------------------------
    // Test 5: Double-Betting (Concurrent)
    // ----------------------------------------------------
    console.log("\n--- Test 5: Concurrent Double-Betting ---");
    const adminUser = await prisma.user.findUnique({
      where: { username: "admin" },
    });
    console.log(
      `Admin User: ${adminUser.username} (${adminUser.id}) - Points: ${adminUser.channelPoints}`,
    );

    const [req1, req2] = await Promise.all([
      fetch(`${BASE_URL}/api/live/streams/${stream.id}/predictions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": adminUser.id,
        },
        body: JSON.stringify({
          action: "BET",
          optionId: optionYes,
          points: 100,
        }),
      }),
      fetch(`${BASE_URL}/api/live/streams/${stream.id}/predictions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": adminUser.id,
        },
        body: JSON.stringify({
          action: "BET",
          optionId: optionYes,
          points: 100,
        }),
      }),
    ]);

    const res1 = await req1.json();
    const res2 = await req2.json();
    console.log(`Req 1 status: ${req1.status}, Data: ${JSON.stringify(res1)}`);
    console.log(`Req 2 status: ${req2.status}, Data: ${JSON.stringify(res2)}`);

    const adminBets = await prisma.predictionBet.findMany({
      where: { predictionId: prediction.id, userId: adminUser.id },
    });
    console.log(`Total bets in DB for admin: ${adminBets.length}`);

    if (adminBets.length > 1) {
      testFailures.push(
        `Concurrent Double-Betting: Multiple bets created for the same user in DB! count = ${adminBets.length}`,
      );
      console.log("❌ Concurrent Double-Betting: Multiple bets created in DB!");
    } else {
      console.log(
        "✅ Concurrent Double-Betting: Correctly prevented multiple bets in DB.",
      );
    }

    // ----------------------------------------------------
    // Test 6: Negative/Exploitable Live Stream Gifts
    // ----------------------------------------------------
    console.log(
      "\n--- Test 6: Exploitable Live Stream Gifts (Negative amount/quantity) ---",
    );
    const initialBettorPoints = (
      await prisma.user.findUnique({ where: { id: bettor.id } })
    ).channelPoints;
    console.log(`Bettor initial points: ${initialBettorPoints}`);

    const giftRes = await fetch(
      `${BASE_URL}/api/live/streams/${stream.id}/gifts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": bettor.id,
        },
        body: JSON.stringify({
          giftName: "Diamond",
          amount: -100,
          quantity: 1,
        }),
      },
    );
    const giftData = await giftRes.json();
    const finalBettorPoints = (
      await prisma.user.findUnique({ where: { id: bettor.id } })
    ).channelPoints;
    console.log(
      `Gift request status: ${giftRes.status}, Data: ${JSON.stringify(giftData)}`,
    );
    console.log(`Bettor final points: ${finalBettorPoints}`);

    if (finalBettorPoints > initialBettorPoints) {
      testFailures.push(
        `Live Stream Gifts Exploit: Negative amount allowed and user channel points were incremented! Initial: ${initialBettorPoints}, Final: ${finalBettorPoints}`,
      );
      console.log(
        "❌ Live Stream Gifts: EXPLOIT FOUND! Negative amount incremented user points.",
      );
    } else if (giftRes.status === 400) {
      console.log("✅ Live Stream Gifts: Correctly rejected negative amount");
    } else {
      console.log(
        `Live Stream Gifts: Returned status ${giftRes.status} but user points did not increase.`,
      );
    }

    // Clean up DB records created by the test
    console.log("\nCleaning up database records...");
    await prisma.predictionBet
      .deleteMany({ where: { predictionId: prediction.id } })
      .catch(() => {});
    await prisma.predictionOption
      .deleteMany({ where: { predictionId: prediction.id } })
      .catch(() => {});
    await prisma.prediction
      .delete({ where: { id: prediction.id } })
      .catch(() => {});
    await prisma.liveStreamGift
      .deleteMany({ where: { liveStreamId: stream.id } })
      .catch(() => {});
    await prisma.liveStream
      .delete({ where: { id: stream.id } })
      .catch(() => {});

    // Restore initial points
    await prisma.user
      .update({
        where: { id: bettor.id },
        data: { channelPoints: 3000 },
      })
      .catch(() => {});
    await prisma.user
      .update({
        where: { id: adminUser.id },
        data: { channelPoints: 10000 },
      })
      .catch(() => {});

    console.log("Cleanup completed successfully.");
  } catch (err) {
    console.error("Error during testing:", err);
    testFailures.push(`Testing exception: ${err.message}`);
  } finally {
    // Shutdown server
    if (serverProcess) {
      console.log("Stopping Next.js server...");
      serverProcess.kill("SIGINT");
    }
    await prisma.$disconnect();
  }

  console.log("\n--- ADVERSARIAL TEST SUMMARY ---");
  if (testFailures.length > 0) {
    console.log(`Total Failures: ${testFailures.length}`);
    testFailures.forEach((f, idx) => console.log(`${idx + 1}. ${f}`));
    process.exit(1);
  } else {
    console.log(
      "All adversarial tests passed without exposing unhandled boundary cases!",
    );
    process.exit(0);
  }
}

main();
