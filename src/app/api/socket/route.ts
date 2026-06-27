import { NextRequest, NextResponse } from 'next/server';

// Socket.io is set up in a custom server (server.ts)
// This route handles Socket.io upgrade handshake for Next.js
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { message: 'Socket.io endpoint. Use ws:// protocol for real-time connection.' },
    { status: 200 }
  );
}
