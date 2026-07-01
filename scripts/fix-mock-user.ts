import { PrismaClient } from "@prisma/client";
import { MOCK_USERS } from "../src/lib/mockData";

const prisma = new PrismaClient();

async function main() {
  console.log("Upserting mock users...");
  
  for (const mockUser of MOCK_USERS) {
    const user = await prisma.user.upsert({
      where: { id: mockUser.id },
      update: {
        username: mockUser.username,
        email: mockUser.email || `${mockUser.username}@example.com`,
        displayName: mockUser.displayName,
        avatar: mockUser.avatar,
        bio: mockUser.bio,
        isVerified: mockUser.isVerified,
      },
      create: {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email || `${mockUser.username}@example.com`,
        displayName: mockUser.displayName,
        avatar: mockUser.avatar,
        bio: mockUser.bio,
        isVerified: mockUser.isVerified,
        passwordHash: "$2a$12$R.OixS/VdO4sVf5eG1jA/ONi.wK5K6PzR1A6K/5kZpU.fPZ/m3J9.", // dummy hash
      },
    });
    console.log(`Upserted user: ${user.username} (${user.id})`);
  }
  
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
