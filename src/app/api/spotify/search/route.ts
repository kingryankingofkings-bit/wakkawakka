import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MOCK_TRACKS = [
  {
    id: "1",
    title: "Summer Breeze",
    artist: "Lofi Dreams",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "2",
    title: "Midnight City",
    artist: "Retro Wave",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "3",
    title: "Coffee & Books",
    artist: "Jazz Cafe",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "4",
    title: "Neon Nights",
    artist: "Synth Vibe",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    id: "5",
    title: "Sunny Day",
    artist: "Indie Folk",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (clientId && clientSecret && q) {
    try {
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      if (!tokenRes.ok) {
        throw new Error(`Failed to fetch Spotify token: ${tokenRes.statusText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error("No access token returned from Spotify");
      }

      const searchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!searchRes.ok) {
        throw new Error(`Spotify search failed: ${searchRes.statusText}`);
      }

      const searchData = await searchRes.json();
      const tracks = searchData.tracks?.items?.map((item: any) => ({
        id: item.id,
        title: item.name,
        artist: item.artists?.map((a: any) => a.name).join(", "),
        previewUrl: item.preview_url || "",
      })) || [];

      return NextResponse.json({ data: tracks });
    } catch (error) {
      console.error("Spotify API error, falling back to mock search:", error);
    }
  }

  if (!q) {
    return NextResponse.json({ data: MOCK_TRACKS });
  }

  const filtered = MOCK_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
  );

  return NextResponse.json({ data: filtered });
}
