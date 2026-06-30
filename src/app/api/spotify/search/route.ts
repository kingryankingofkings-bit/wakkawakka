import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MOCK_TRACKS = [
  { id: '1', title: 'Summer Breeze', artist: 'Lofi Dreams', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '2', title: 'Midnight City', artist: 'Retro Wave', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '3', title: 'Coffee & Books', artist: 'Jazz Cafe', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: '4', title: 'Neon Nights', artist: 'Synth Vibe', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: '5', title: 'Sunny Day', artist: 'Indie Folk', previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();

  if (!q) {
    return NextResponse.json({ data: MOCK_TRACKS });
  }

  const filtered = MOCK_TRACKS.filter(
    t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
  );

  return NextResponse.json({ data: filtered });
}
