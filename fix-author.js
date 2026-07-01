const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fix() {
  const authorId = "current";
  
  // mock user data
  const mockUser = {
    username: "you_user",
    email: "you@example.com",
    displayName: "You",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
  };

  const user = await prisma.user.upsert({
    where: { id: authorId },
    update: {
      username: mockUser.username,
      email: mockUser.email,
      displayName: mockUser.displayName,
      avatar: mockUser.avatar,
    },
    create: {
      id: authorId,
      username: mockUser.username,
      email: mockUser.email,
      displayName: mockUser.displayName,
      avatar: mockUser.avatar,
    }
  });

  console.log("Fixed user:", user);
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
