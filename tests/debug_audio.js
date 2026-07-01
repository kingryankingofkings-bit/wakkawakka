// tests/debug_audio.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PORT = 3009;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function main() {
  console.log("=== RUNNING DIAGNOSTIC TEST ===");

  const wakkadev = await prisma.user.findUnique({ where: { username: "wakkadev" } });
  const alicedev = await prisma.user.findUnique({ where: { username: "alicedev" } });

  console.log(`wakkadev ID: ${wakkadev.id}`);
  console.log(`alicedev ID: ${alicedev.id}`);

  // Clean DB
  await prisma.audioRoomSpeaker.deleteMany();
  await prisma.audioRoomListener.deleteMany();
  await prisma.audioRoom.deleteMany();

  // 1. Create Room
  console.log("\n1. Creating room...");
  const createRes = await fetch(`${BASE_URL}/api/audio-rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": wakkadev.id },
    body: JSON.stringify({ title: "Clubhouse Room 2" }),
  });
  console.log(`Create Room status: ${createRes.status}`);
  const createJson = await createRes.json();
  console.log(`Create Room response:`, JSON.stringify(createJson));

  const roomId = createJson.room.id;

  // Verify in DB
  const dbRoom = await prisma.audioRoom.findUnique({ where: { id: roomId } });
  console.log(`Room in DB after creation:`, dbRoom ? "FOUND" : "NOT FOUND");

  // 2. Alice joins as listener (1st time)
  console.log("\n2. Alice joining as listener (1st time)...");
  const join1Res = await fetch(`${BASE_URL}/api/audio-rooms/${roomId}/listeners`, {
    method: "POST",
    headers: { "x-user-id": alicedev.id },
  });
  console.log(`Join 1 status: ${join1Res.status}`);
  const join1Json = await join1Res.json();
  console.log(`Join 1 response:`, JSON.stringify(join1Json));

  // Verify listeners in DB
  const listeners1 = await prisma.audioRoomListener.findMany({ where: { audioRoomId: roomId } });
  console.log(`Listeners in DB after join 1:`, JSON.stringify(listeners1));

  // 3. Alice joins as listener (2nd time)
  console.log("\n3. Alice joining as listener (2nd time)...");
  const join2Res = await fetch(`${BASE_URL}/api/audio-rooms/${roomId}/listeners`, {
    method: "POST",
    headers: { "x-user-id": alicedev.id },
  });
  console.log(`Join 2 status: ${join2Res.status}`);
  const join2Text = await join2Res.text();
  console.log(`Join 2 response text:`, join2Text);

  await prisma.$disconnect();
}

main().catch(console.error);
