import { PrismaClient } from "@prisma/client";
import { MOCK_USERS } from "../src/lib/mockData";

const prisma = new PrismaClient();

async function main() {
  console.log("Upserting mock users...");
  
  for (const mockUser of MOCK_USERS) {
    const email = (mockUser as any).email || `${mockUser.username}@example.com`;
    const account = await prisma.account.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: "$2a$12$R.OixS/VdO4sVf5eG1jA/ONi.wK5K6PzR1A6K/5kZpU.fPZ/m3J9.", // dummy hash
        emailVerified: mockUser.isVerified,
      },
    });

    const user = await prisma.profile.upsert({
      where: { id: mockUser.id },
      update: {
        username: mockUser.username,
        displayName: mockUser.displayName,
        avatar: mockUser.avatar,
        bio: mockUser.bio,
        isVerified: mockUser.isVerified,
      },
      create: {
        id: mockUser.id,
        accountId: account.id,
        username: mockUser.username,
        displayName: mockUser.displayName,
        avatar: mockUser.avatar,
        bio: mockUser.bio,
        isVerified: mockUser.isVerified,
      },
    });
    console.log(`Upserted profile: ${user.username} (${user.id}) under account: ${account.email}`);
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
