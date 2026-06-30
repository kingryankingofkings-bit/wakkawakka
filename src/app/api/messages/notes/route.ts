import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';

// In-memory status notes store
// Map of userId -> { note: string, username: string, displayName: string, avatar: string | null, createdAt: Date }
const notesStore = new Map<string, { note: string, username: string, displayName: string, avatar: string | null, createdAt: Date }>();

// Seed a couple of mock notes for other users on startup
notesStore.set('mock-note-1', {
  note: 'Listening to lofi beats 🎧',
  username: 'alicedev',
  displayName: 'Alice Dev',
  avatar: 'https://i.pravatar.cc/150?img=47',
  createdAt: new Date()
});
notesStore.set('mock-note-2', {
  note: 'Busy coding Batch 5 gaps!',
  username: 'bobbuilder',
  displayName: 'Bob Builder',
  avatar: 'https://i.pravatar.cc/150?img=12',
  createdAt: new Date()
});

export async function GET(req: NextRequest) {
  // Clear notes older than 24 hours
  const now = Date.now();
  for (const [key, val] of notesStore.entries()) {
    if (now - val.createdAt.getTime() > 24 * 60 * 60 * 1000) {
      notesStore.delete(key);
    }
  }

  return NextResponse.json({ data: Array.from(notesStore.entries()).map(([userId, note]) => ({ userId, ...note })) });
}

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { note } = await req.json();
    if (!note || note.trim().length === 0) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    if (note.length > 60) {
      return NextResponse.json({ error: 'Note cannot exceed 60 characters' }, { status: 400 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, username: true, avatar: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    notesStore.set(userId, {
      note: note.trim(),
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, note: notesStore.get(userId) });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to publish note', detail: String(err) }, { status: 500 });
  }
}
