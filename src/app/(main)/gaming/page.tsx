"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Play, Trophy, Users, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const MOCK_STREAMS = [
  {
    id: "1",
    title: "Wakka Championship Finals!",
    streamer: "GamerGod",
    game: "League of Legends",
    viewers: "5.2K",
  },
  {
    id: "2",
    title: "Speedrun Any% Glitchless",
    streamer: "SonicSpeedy",
    game: "Super Mario Odyssey",
    viewers: "1.4K",
  },
  {
    id: "3",
    title: "Minecraft Survival Chill Session",
    streamer: "PixelCraft",
    game: "Minecraft",
    viewers: "840",
  },
];

const MOCK_TOURNAMENTS = [
  {
    id: "1",
    name: "Wakka Valorant Summer Cup",
    game: "Valorant",
    date: "2026-07-10",
    prize: "$1,000",
    teams: "12/16",
  },
  {
    id: "2",
    name: "Minecraft Build-Off Tournament",
    game: "Minecraft",
    date: "2026-07-15",
    prize: "Custom Badge",
    teams: "8/10",
  },
];

export default function GamingPage() {
  const [gamingTab, setGamingTab] = useState<
    "streams" | "tournaments" | "games"
  >("games");

  // Tic-Tac-Toe States
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  // Tournament Form States
  const [tournaments, setTournaments] = useState(MOCK_TOURNAMENTS);
  const [showCreateTourney, setShowCreateTourney] = useState(false);
  const [tName, setTName] = useState("");
  const [tGame, setTGame] = useState("");
  const [tPrize, setTPrize] = useState("");

  // Handle Tic-Tac-Toe cell click
  const handleCellClick = (idx: number) => {
    if (board[idx] || winner) return;

    const newBoard = [...board];
    const player = isXNext ? "X" : "O";
    newBoard[idx] = player;
    setBoard(newBoard);
    setIsXNext(!isXNext);

    // Check winner
    const winningLines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // cols
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    for (const line of winningLines) {
      const [a, b, c] = line;
      if (
        newBoard[a] &&
        newBoard[a] === newBoard[b] &&
        newBoard[a] === newBoard[c]
      ) {
        setWinner(newBoard[a]);
        toast.success(`Player ${newBoard[a]} wins!`, { icon: "🎉" });
        return;
      }
    }

    if (newBoard.every((cell) => cell !== null)) {
      setWinner("Draw");
      toast("It is a Draw!", { icon: "🤝" });
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  // Tournament Create
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName || !tGame) return;

    const newT = {
      id: String(tournaments.length + 1),
      name: tName,
      game: tGame,
      date: new Date().toISOString().split("T")[0],
      prize: tPrize || "Honor",
      teams: "1/16",
    };

    setTournaments([newT, ...tournaments]);
    setShowCreateTourney(false);
    setTName("");
    setTGame("");
    setTPrize("");
    toast.success("Gaming Tournament created!");
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-500">
          <Trophy className="h-5 w-5" /> Gaming Platform
        </h1>
        <div className="flex bg-muted rounded-xl p-0.5 border border-border">
          {["games", "streams", "tournaments"].map((t) => (
            <button
              key={t}
              onClick={() => setGamingTab(t as any)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all",
                gamingTab === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {gamingTab === "games" && (
          <Card padding="md" className="space-y-4 text-center">
            <div>
              <h2 className="font-extrabold text-base text-foreground">
                Wakka Instant Games
              </h2>
              <p className="text-xs text-muted-foreground">
                Play a quick match of Tic-Tac-Toe directly in your browser.
              </p>
            </div>

            {/* Tic-Tac-Toe Board */}
            <div className="grid grid-cols-3 gap-2 w-48 h-48 mx-auto mt-4">
              {board.map((cell, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  className="bg-muted text-foreground font-black text-xl flex items-center justify-center rounded-xl hover:bg-muted/80 transition-colors border border-border"
                >
                  <span
                    className={cn(
                      cell === "X" ? "text-indigo-500" : "text-rose-500",
                    )}
                  >
                    {cell}
                  </span>
                </button>
              ))}
            </div>

            {winner && (
              <p className="text-xs font-bold text-primary mt-2">
                {winner === "Draw"
                  ? "It's a Draw!"
                  : `Winner: Player ${winner}`}
              </p>
            )}

            <Button
              size="sm"
              variant="outline"
              className="mx-auto flex items-center gap-1.5"
              onClick={resetGame}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Restart Game
            </Button>
          </Card>
        )}

        {gamingTab === "streams" && (
          <div className="space-y-4">
            <h2 className="font-bold text-base">Live Streams</h2>
            <div className="grid grid-cols-1 gap-3">
              {MOCK_STREAMS.map((stream) => (
                <Card
                  key={stream.id}
                  padding="md"
                  className="space-y-2 border border-border hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {stream.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {stream.streamer} · playing {stream.game}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 text-[10px] font-bold flex items-center gap-1">
                      <Play className="h-2.5 w-2.5 fill-current animate-pulse" />{" "}
                      {stream.viewers}
                    </span>
                  </div>
                  <Button
                    size="xs"
                    className="w-full"
                    onClick={() =>
                      toast.success("Launching stream view player...")
                    }
                  >
                    Watch Live
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {gamingTab === "tournaments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-base">E-Sports Tournaments</h2>
              <Button size="xs" onClick={() => setShowCreateTourney(true)}>
                Host Cup
              </Button>
            </div>

            {showCreateTourney && (
              <Card padding="md" className="border-indigo-500/20 space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <h3 className="font-bold text-xs">Host Tournament</h3>
                  <button
                    onClick={() => setShowCreateTourney(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
                <form
                  onSubmit={handleCreateTournament}
                  className="space-y-3 text-xs"
                >
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">
                      Tournament Name *
                    </label>
                    <Input
                      required
                      placeholder="E.g., Wakka Smash Open"
                      value={tName}
                      onChange={(e) => setTName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">
                      Game *
                    </label>
                    <Input
                      required
                      placeholder="E.g., Smash Ultimate"
                      value={tGame}
                      onChange={(e) => setTGame(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">
                      Prize Pool
                    </label>
                    <Input
                      placeholder="E.g., $500.00"
                      value={tPrize}
                      onChange={(e) => setTPrize(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setShowCreateTourney(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="xs">
                      Create
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="space-y-3">
              {tournaments.map((t) => (
                <Card
                  key={t.id}
                  padding="md"
                  className="space-y-2 border border-border"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {t.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Game: {t.game} · Date: {t.date}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 text-[10px] font-bold">
                      Prize: {t.prize}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Teams: {t.teams}
                    </span>
                    <Button
                      size="xs"
                      variant="outline"
                      className="border-indigo-500 text-indigo-500"
                      onClick={() =>
                        toast.success("Joined tournament team signup!")
                      }
                    >
                      Register Team
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
