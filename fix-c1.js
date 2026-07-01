const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fix() {
  const currentId = "current";
  const u1Id = "u1";
  const c1Id = "c1";

  await prisma.user.upsert({
    where: { id: u1Id },
    update: {},
    create: {
      id: u1Id,
      username: "mocku1",
      displayName: "Mock U1",
      email: "mocku1@example.com"
    }
  });

  await prisma.conversation.upsert({
    where: { id: c1Id },
    update: {},
    create: { id: c1Id }
  });

  await prisma.conversationMember.upsert({
    where: { conversationId_userId: { conversationId: c1Id, userId: currentId } },
    update: {},
    create: { conversationId: c1Id, userId: currentId }
  });
  
  await prisma.conversationMember.upsert({
    where: { conversationId_userId: { conversationId: c1Id, userId: u1Id } },
    update: {},
    create: { conversationId: c1Id, userId: u1Id }
  });

  console.log("Seeded mock conversation c1");
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
