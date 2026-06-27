import { NextRequest, NextResponse } from 'next/server';
import { MOCK_USERS } from '@/lib/mockData';

let users = [...MOCK_USERS];

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const user = users.find(u => u.id === params.id || u.username === params.id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ data: user });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const idx = users.findIndex(u => u.id === params.id);
  if (idx === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  try {
    const body = await req.json();
    users[idx] = { ...users[idx], ...body, updatedAt: new Date().toISOString() };
    return NextResponse.json({ data: users[idx] });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
