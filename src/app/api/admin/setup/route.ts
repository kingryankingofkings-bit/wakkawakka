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

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        isAdmin: true,
        isVerified: true,
        verificationTier: "PLATINUM",
        emailVerified: true,
      },
      create: {
        email,
        passwordHash,
        username: username ?? email.split("@")[0],
        displayName: displayName ?? username ?? email.split("@")[0],
        isAdmin: true,
        isVerified: true,
        verificationTier: "PLATINUM",
        emailVerified: true,
      },
    });

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
