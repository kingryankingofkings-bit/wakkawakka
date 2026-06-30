import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up database...");
  // Delete in reverse dependency order
  await prisma.clip.deleteMany();
  await prisma.predictionBet.deleteMany();
  await prisma.predictionOption.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.liveStreamGift.deleteMany();
  await prisma.liveStreamCoHost.deleteMany();
  await prisma.liveStream.deleteMany();
  await prisma.webhookDeliveryLog.deleteMany();
  await prisma.webhookSubscription.deleteMany();
  await prisma.adPlacement.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.fundraiserDonation.deleteMany();
  await prisma.fundraiser.deleteMany();
  await prisma.datingProfile.deleteMany();
  await prisma.bounty.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.product.deleteMany();
  await prisma.eventAttendee.deleteMany();
  await prisma.event.deleteMany();
  await prisma.pollVote.deleteMany();
  await prisma.pollOption.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.album.deleteMany();
  await prisma.lifeEvent.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.communityJoinRequest.deleteMany();
  await prisma.pageFollower.deleteMany();
  await prisma.pageMember.deleteMany();
  await prisma.page.deleteMany();
  await prisma.communityPostLike.deleteMany();
  await prisma.communityPostComment.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.community.deleteMany();
  await prisma.postHashtag.deleteMany();
  await prisma.hashtag.deleteMany();
  await prisma.userSavedHashtag.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.storyView.deleteMany();
  await prisma.story.deleteMany();
  await prisma.messageReaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.report.deleteMany();
  await prisma.post.deleteMany();
  await prisma.block.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.closeFriend.deleteMany();
  await prisma.streak.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.analytics.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users...");
  const passwordHash = await bcrypt.hash("SecurePassword123", 12);

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@wakkawakka.com",
      displayName: "Wakka Admin",
      bio: "Platform administrator and moderator.",
      passwordHash,
      isAdmin: true,
      isVerified: true,
      verificationTier: "PLATINUM",
      emailVerified: true,
      channelPoints: 10000,
    },
  });

  const wakkadev = await prisma.user.create({
    data: {
      username: "wakkadev",
      email: "wakkadev@wakkawakka.com",
      displayName: "Wakka Dev",
      bio: "Senior TypeScript Developer. Building real-time social tools.",
      passwordHash,
      isVerified: true,
      verificationTier: "GOLD",
      emailVerified: true,
      profileSoundtrack: "lofi_chill_beat",
      profileSoundtrackVisible: true,
      channelPoints: 5000,
    },
  });

  const alicedev = await prisma.user.create({
    data: {
      username: "alicedev",
      email: "alice@wakkawakka.com",
      displayName: "Alice Developer",
      bio: "Front-end design enthusiast & UI specialist. Profiles are private!",
      passwordHash,
      isPrivate: true,
      isVerified: true,
      verificationTier: "BLUE",
      emailVerified: true,
      channelPoints: 7500,
    },
  });

  const bobdev = await prisma.user.create({
    data: {
      username: "bobdev",
      email: "bob@wakkawakka.com",
      displayName: "Bob Developer",
      bio: "Fullstack builder testing boundaries.",
      passwordHash,
      emailVerified: true,
      channelPoints: 3000,
    },
  });

  console.log("Seeding follows, blocks, and friends...");
  // Follows
  await prisma.follow.create({
    data: {
      followerId: wakkadev.id,
      followingId: alicedev.id,
      status: "ACCEPTED",
    },
  });

  await prisma.follow.create({
    data: {
      followerId: bobdev.id,
      followingId: alicedev.id,
      status: "PENDING",
    },
  });

  // Block
  await prisma.block.create({
    data: {
      blockerId: admin.id,
      blockedId: bobdev.id,
    },
  });

  console.log("Seeding communities...");
  const community = await prisma.community.create({
    data: {
      name: "Tech Builders",
      slug: "tech-builders",
      description:
        "A community for people who love building and launching tech products.",
      creatorId: wakkadev.id,
      category: "TECHNOLOGY",
      visibility: "PUBLIC",
      rules: "1. Be respectful. 2. Share what you build.",
      tags: JSON.stringify(["tech", "builder", "typescript"]),
      memberCount: 3,
    },
  });

  // Community Members
  await prisma.communityMember.create({
    data: { communityId: community.id, userId: wakkadev.id, role: "ADMIN" },
  });
  await prisma.communityMember.create({
    data: { communityId: community.id, userId: alicedev.id, role: "MEMBER" },
  });
  await prisma.communityMember.create({
    data: { communityId: community.id, userId: admin.id, role: "MODERATOR" },
  });

  console.log("Seeding posts and comments...");
  // Normal Post
  const post1 = await prisma.post.create({
    data: {
      content:
        "Building a Next.js application with SQLite database is incredibly fast! 🚀 #sqlite #nextjs",
      authorId: wakkadev.id,
      type: "TEXT",
      hashtags: JSON.stringify(["sqlite", "nextjs"]),
      likesCount: 5,
      commentsCount: 2,
    },
  });

  // Collab Post
  const post2 = await prisma.post.create({
    data: {
      content:
        "Excited to announce our new UI kit! Created in collaboration with @alicedev.",
      authorId: wakkadev.id,
      type: "TEXT",
      collaboratorIds: JSON.stringify([alicedev.id]),
      likesCount: 12,
    },
  });

  // Scheduled Post
  const post3 = await prisma.post.create({
    data: {
      content:
        "This post is scheduled to be published in the future. See you then!",
      authorId: wakkadev.id,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
    },
  });

  // Community Post
  const compost = await prisma.communityPost.create({
    data: {
      communityId: community.id,
      authorId: wakkadev.id,
      content: "Check out the new rules for Tech Builders!",
      flair: "Announcement",
    },
  });

  // Comments
  const comment1 = await prisma.comment.create({
    data: {
      content: "Agreed! Prisma + SQLite makes developer experience top-notch.",
      postId: post1.id,
      authorId: alicedev.id,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: "Absolutely! Glad you like it.",
      postId: post1.id,
      authorId: wakkadev.id,
      parentId: comment1.id, // Nested reply
    },
  });

  console.log("Seeding reactions and reports...");
  // Post Reaction
  await prisma.like.create({
    data: {
      userId: alicedev.id,
      postId: post1.id,
      type: "LOVE",
    },
  });

  // Report
  await prisma.report.create({
    data: {
      reporterId: bobdev.id,
      targetType: "POST",
      targetId: post1.id,
      postId: post1.id,
      reason: "SPAM",
      description: "This is a test report for E2E moderation verification.",
    },
  });

  console.log("Seeding stories...");
  const story = await prisma.story.create({
    data: {
      authorId: alicedev.id,
      mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      type: "IMAGE",
      caption: "Loving the beach vibe today! 🏖️",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
    },
  });

  await prisma.storyView.create({
    data: {
      storyId: story.id,
      viewerId: wakkadev.id,
    },
  });

  console.log("Seeding conversations and messages...");
  const convo = await prisma.conversation.create({
    data: {
      isGroup: false,
    },
  });

  await prisma.conversationMember.create({
    data: { conversationId: convo.id, userId: wakkadev.id },
  });
  await prisma.conversationMember.create({
    data: { conversationId: convo.id, userId: alicedev.id },
  });

  // Text message
  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: wakkadev.id,
      content: "Hey Alice, are the UI designs ready for the chat interface?",
    },
  });

  // Voice message
  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: alicedev.id,
      content: "[Walkie-Talkie Voice Message]",
      type: "AUDIO",
      mediaUrl: "/uploads/audio/alice_voice_msg_123.webm",
    },
  });

  // E2EE encrypted message
  const encryptedPayload = Buffer.from(
    "Here is the secret passcode: 9988",
  ).toString("base64");
  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: wakkadev.id,
      content: `E2EE:${encryptedPayload}`,
    },
  });

  console.log("Seeding products and carts...");
  const product = await prisma.product.create({
    data: {
      sellerId: wakkadev.id,
      name: "Wakka Developer Mug",
      description:
        "The official mug of Wakka Wakka developers. Perfect for coffee, tea, or compiler warnings.",
      price: 19.99,
      images: JSON.stringify(["/images/mug.png"]),
      category: "MERCHANDISE",
      stockCount: 50,
      condition: "NEW",
    },
  });

  // Cart
  const cart = await prisma.cart.create({
    data: {
      userId: alicedev.id,
    },
  });

  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: product.id,
      quantity: 2,
    },
  });

  console.log("Seeding ads and placements...");
  const ad = await prisma.ad.create({
    data: {
      creatorId: admin.id,
      title: "Join the Hackerthon!",
      copy: "Sign up for the annual Wakka Wakka hackathon. Cash prizes up for grabs!",
      targetUrl: "https://wakkawakka.com/hackathon",
      budget: 500,
      bidAmount: 0.25,
      location: "Global",
    },
  });

  await prisma.adPlacement.create({
    data: {
      adId: ad.id,
      type: "CHANNEL_AD",
      page: "/feed",
    },
  });

  console.log("Seeding fundraisers and bounties...");
  await prisma.fundraiser.create({
    data: {
      creatorId: admin.id,
      title: "Support Open Source Social Media",
      description:
        "Help us pay for hosting and developer bounties to keep the platform free.",
      goalAmount: 5000,
      raisedAmount: 250,
    },
  });

  await prisma.bounty.create({
    data: {
      creatorId: wakkadev.id,
      title: "Implement Dark Mode Calendar",
      description:
        "Add Tailwind dark theme classes to the monthly events calendar view.",
      rewardAmount: 100,
    },
  });

  console.log("Seeding dating profiles...");
  await prisma.datingProfile.create({
    data: {
      userId: alicedev.id,
      bio: "Developer looking for a companion to debug life with.",
      prompts: JSON.stringify([
        {
          question: "My favorite programming language is",
          answer: "TypeScript of course.",
        },
      ]),
      lookingFor: "FRIENDS",
    },
  });

  console.log("Seeding events...");
  const event = await prisma.event.create({
    data: {
      creatorId: wakkadev.id,
      communityId: community.id,
      title: "Wakka Wakka Summer Meetup",
      description:
        "An offline meetup for developers in the Tech Builders community.",
      startsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days in future
      location: "San Francisco, CA",
      isOnline: false,
      goingCount: 2,
      interestedCount: 1,
    },
  });

  await prisma.eventAttendee.create({
    data: { eventId: event.id, userId: wakkadev.id, status: "GOING" },
  });
  await prisma.eventAttendee.create({
    data: { eventId: event.id, userId: alicedev.id, status: "GOING" },
  });
  await prisma.eventAttendee.create({
    data: { eventId: event.id, userId: admin.id, status: "INTERESTED" },
  });

  console.log("Seeding webhooks...");
  await prisma.webhookSubscription.create({
    data: {
      userId: alicedev.id,
      url: "https://webhook.site/test-receiver",
      events: JSON.stringify(["post.created", "message.sent"]),
      secret: "whsec_sample_secret_key_123",
    },
  });

  console.log("Seeding search history...");
  await prisma.searchHistory.create({
    data: {
      userId: wakkadev.id,
      query: "Next.js E2E testing",
    },
  });

  console.log("Seeding live streams, VODs, and clips...");
  const liveStream = await prisma.liveStream.create({
    data: {
      hostId: wakkadev.id,
      title: "Coding Wakka Wakka Batch 6 Live!",
      description:
        "Building cool features from scratch with SQLite and Next.js.",
      isActive: true,
      category: "Technology",
      viewerCount: 42,
      tags: JSON.stringify(["programming", "nextjs", "sqlite"]),
    },
  });

  const scheduledStream = await prisma.liveStream.create({
    data: {
      hostId: alicedev.id,
      title: "UI Design AMA & Critique",
      description: "Bring your portfolios and web apps for a UI review.",
      isActive: false,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days in future
      category: "Creative",
      tags: JSON.stringify(["design", "ui", "critique"]),
    },
  });

  const vodStream = await prisma.liveStream.create({
    data: {
      hostId: bobdev.id,
      title: "Retro Gaming Walkthrough",
      description: "Full play of retro classic game.",
      isActive: false,
      isRecorded: true,
      recordingUrl: "https://wakkawakka-vods.s3.amazonaws.com/bobdev-retro.mp4",
      category: "Gaming",
      tags: JSON.stringify(["retro", "gaming", "walkthrough"]),
      endedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });

  await prisma.clip.create({
    data: {
      title: "Epic Boss Defeated!",
      videoUrl: "https://wakkawakka-vods.s3.amazonaws.com/clips/epic-boss.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e",
      duration: 30,
      creatorId: alicedev.id,
      liveStreamId: vodStream.id,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
