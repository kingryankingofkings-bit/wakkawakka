// tests/check_db.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== DB COUNTS ===");
  console.log("Users:", await prisma.user.count());
  console.log("AudioRooms:", await prisma.audioRoom.count());
  console.log("AudioRoomSpeakers:", await prisma.audioRoomSpeaker.count());
  console.log("AudioRoomListeners:", await prisma.audioRoomListener.count());
  console.log("SoundboardSounds:", await prisma.soundboardSound.count());
  
  console.log("\n=== ALL AUDIO ROOMS ===");
  const rooms = await prisma.audioRoom.findMany({
    include: {
      host: true,
      speakers: true,
      listeners: true,
    }
  });
  console.log(JSON.stringify(rooms, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
