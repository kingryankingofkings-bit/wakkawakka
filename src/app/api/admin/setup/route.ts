import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, secret, username, displayName } = await req.json();

    const expectedSecret = process.env.ADMIN_SETUP_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid setup secret" },
        { status: 403 },
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const account = await prisma.account.upsert({
      where: { email },
      update: {
        passwordHash,
        emailVerified: true,
      },
      create: {
        email,
        passwordHash,
        emailVerified: true,
      },
    });

    let user = await prisma.profile.findFirst({ where: { accountId: account.id } });
    if (!user) {
      user = await prisma.profile.create({
        data: {
          accountId: account.id,
          type: "DEFAULT",
          username: username ?? email.split("@")[0],
          displayName: displayName ?? username ?? email.split("@")[0],
          isAdmin: true,
          isVerified: true,
          verificationTier: "PLATINUM",
        },
      });
    } else {
      user = await prisma.profile.update({
        where: { id: user.id },
        data: {
          isAdmin: true,
          isVerified: true,
          verificationTier: "PLATINUM",
        },
      });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      username: user.username,
      message:
        "Admin account created. Sign in with your email via the login page.",
    });
  } catch (err) {
    console.error("[admin/setup]", err);
    return NextResponse.json(
      { error: "Setup failed", detail: String(err) },
      { status: 500 },
    );
  }
}
