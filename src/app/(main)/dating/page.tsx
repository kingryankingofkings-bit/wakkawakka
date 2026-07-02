"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { Heart, X, User, Sparkles, Calendar, Send } from "lucide-react";
import toast from "react-hot-toast";

const MOCK_EVENTS = [
  {
    id: "1",
    title: "Tech Singles Coffee Mixer",
    date: "2026-07-05",
    time: "18:00",
    location: "Seattle DownTown Coffee",
    type: "Physical",
  },
  {
    id: "2",
    title: "Virtual Speed Dating (Tech & Creative)",
    date: "2026-07-12",
    time: "19:30",
    location: "Zoom Video Mixer",
    type: "Online",
  },
  {
    id: "3",
    title: "Board Games & Singles Mixer",
    date: "2026-07-19",
    time: "17:00",
    location: "Metropolitan Boardroom",
    type: "Physical",
  },
];

export default function DatingPage() {
  const [datingTab, setDatingTab] = useState<
    "discover" | "profile" | "crush" | "events"
  >("discover");

  // Discover/Swipe States
  const [discoverList, setDiscoverList] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchTriggered, setMatchTriggered] = useState<any>(null);

  // Profile States
  const [bio, setBio] = useState("");
  const [lookingFor, setLookingFor] = useState("ANY");
  const [prompts, setPrompts] = useState<any[]>([]);
  const [_myProfile, setMyProfile] = useState<any>(null);

  // Crush States
  const [crushUsername, setCrushUsername] = useState("");
  const [myCrushes, setMyCrushes] = useState<string[]>([]);
  const [myMatches, setMyMatches] = useState<any[]>([]);

  // Load Data
  const loadDatingData = async () => {
    const userId = useAuthStore.getState().activeProfile?.id;
    const headers: Record<string, string> = userId
      ? { "x-user-id": userId }
      : {};

    try {
      // Load Profile
      const profRes = await fetch("/api/dating/profile", { headers });
      const profJson = await profRes.json();
      if (profJson.data) {
        setMyProfile(profJson.data);
        setBio(profJson.data.bio || "");
        setLookingFor(profJson.data.lookingFor || "ANY");
        try {
          setPrompts(JSON.parse(profJson.data.prompts || "[]"));
          setMyCrushes(JSON.parse(profJson.data.crushes || "[]"));
          // Matches logic: will fetch matched profiles
          const parsedMatches = JSON.parse(profJson.data.matches || "[]");
          if (parsedMatches.length > 0) {
            // Retrieve matched user objects
            const matchesData = await Promise.all(
              parsedMatches.map(async (mId: string) => {
                const uRes = await fetch(`/api/users/${mId}`, { headers });
                const uJson = await uRes.json();
                return uJson.data;
              }),
            );
            setMyMatches(matchesData.filter(Boolean));
          } else {
            setMyMatches([]);
          }
        } catch {}
      }

      // Load Discover List
      const discRes = await fetch("/api/dating/discover", { headers });
      const discJson = await discRes.json();
      if (discJson.data) {
        setDiscoverList(discJson.data);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dating platform");
    }
  };

  useEffect(() => {
    loadDatingData();
  }, []);

  // Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = useAuthStore.getState().activeProfile?.id;
    try {
      const res = await fetch("/api/dating/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({ bio, lookingFor, prompts }),
      });
      if (res.ok) {
        toast.success("Dating profile updated!");
        loadDatingData();
      }
    } catch {
      toast.error("Failed to update profile");
    }
  };

  // Swipe Action
  const handleSwipe = async (action: "like" | "pass") => {
    if (currentIndex >= discoverList.length) return;
    const currentCard = discoverList[currentIndex];

    const userId = useAuthStore.getState().activeProfile?.id;
    try {
      const res = await fetch("/api/dating/swipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({ targetUserId: currentCard.id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.match) {
          setMatchTriggered(currentCard);
          toast.success(`You matched with ${currentCard.displayName}!`, {
            icon: "❤️",
          });
        } else if (action === "like") {
          toast.success(`Crushed on ${currentCard.displayName}!`);
        }
      }
    } catch {
      toast.error("Connection issue swiping");
    }
    setCurrentIndex((c) => c + 1);
  };

  // Secret Crush Submission
  const handleSecretCrush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crushUsername) return;

    // Find the user by username to get their ID
    const userId = useAuthStore.getState().activeProfile?.id;
    const headers: Record<string, string> = userId
      ? { "x-user-id": userId }
      : {};

    try {
      // Find user
      const searchRes = await fetch(`/api/search?q=${crushUsername}`, {
        headers,
      });
      const searchJson = await searchRes.json();
      const matchedUser = searchJson.data?.users?.find(
        (u: any) => u.username.toLowerCase() === crushUsername.toLowerCase(),
      );

      if (!matchedUser) {
        toast.error("User not found. Make sure spelling is correct.");
        return;
      }

      if (matchedUser.id === userId) {
        toast.error("You cannot crush on yourself!");
        return;
      }

      // Add as crush (calls swipe action: like)
      const swipeRes = await fetch("/api/dating/swipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({ targetUserId: matchedUser.id, action: "like" }),
      });

      const swipeData = await swipeRes.json();
      if (swipeRes.ok) {
        if (swipeData.match) {
          setMatchTriggered(matchedUser);
          toast.success(
            `Secret Crush Match! You and ${matchedUser.displayName} crushed each other!`,
            { icon: "❤️" },
          );
        } else {
          toast.success(
            `Added @${crushUsername} to your Secret Crush list. It remains confidential.`,
          );
        }
        setCrushUsername("");
        loadDatingData();
      }
    } catch (err) {
      toast.error("Failed to submit secret crush");
    }
  };

  const currentDiscover = discoverList[currentIndex];

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2 text-pink-500">
          <Heart className="h-5 w-5 fill-current" /> Dating Platform
        </h1>
        <div className="flex bg-muted rounded-xl p-0.5 border border-border">
          {["discover", "profile", "crush", "events"].map((t) => (
            <button
              key={t}
              onClick={() => setDatingTab(t as any)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all",
                datingTab === t
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
        {/* Match celebration banner */}
        {matchTriggered && (
          <Card className="border-pink-500 bg-pink-500/10 text-center p-6 space-y-4 animate-bounce-subtle">
            <Sparkles className="h-10 w-10 text-pink-500 mx-auto fill-current animate-pulse" />
            <div className="space-y-1">
              <h3 className="font-extrabold text-lg text-foreground">
                It&apos;s a Match!
              </h3>
              <p className="text-xs text-muted-foreground">
                You and {matchTriggered.displayName} liked each other.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Avatar
                src={useAuthStore.getState().activeProfile?.avatar}
                name={useAuthStore.getState().activeProfile?.displayName || ""}
                size="lg"
              />
              <Avatar
                src={matchTriggered.avatar}
                name={matchTriggered.displayName}
                size="lg"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-pink-500 text-pink-500 hover:bg-pink-500/20"
              onClick={() => setMatchTriggered(null)}
            >
              Keep Swiping
            </Button>
          </Card>
        )}

        {datingTab === "discover" && (
          <div className="space-y-6">
            <h2 className="font-bold text-base">Discover Singles</h2>

            {currentDiscover ? (
              <Card
                padding="none"
                className="overflow-hidden border border-border relative"
              >
                {currentDiscover.avatar ? (
                  <img
                    src={currentDiscover.avatar}
                    alt={currentDiscover.displayName}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground">
                    <User className="h-20 w-20" />
                  </div>
                )}

                <div className="p-4 space-y-2 bg-gradient-to-t from-background/90 to-background/20 pt-10 absolute bottom-0 inset-x-0">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="font-extrabold text-lg text-foreground">
                        {currentDiscover.displayName}
                      </h3>
                      {currentDiscover.location && (
                        <p className="text-xs text-muted-foreground">
                          {currentDiscover.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-foreground bg-black/40 p-2 rounded-xl backdrop-blur-sm">
                    {currentDiscover.bio || "Hey! Let's connect."}
                  </p>

                  {/* Swipe controls */}
                  <div className="flex justify-center gap-6 pt-3">
                    <button
                      onClick={() => handleSwipe("pass")}
                      className="h-12 w-12 rounded-full border border-border bg-card shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
                    >
                      <X className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => handleSwipe("like")}
                      className="h-12 w-12 rounded-full bg-pink-500 shadow-lg flex items-center justify-center text-white hover:bg-pink-600 active:scale-95 transition-all"
                    >
                      <Heart className="h-6 w-6 fill-current" />
                    </button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="text-center py-20 text-muted-foreground text-sm bg-card border border-border border-dashed rounded-3xl">
                No more discoverable profiles right now. Check back later!
              </div>
            )}

            {/* Matches List */}
            {myMatches.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-foreground">
                  Your Matches ({myMatches.length})
                </h3>
                <div className="flex gap-3 overflow-x-auto py-1">
                  {myMatches.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-col items-center shrink-0"
                    >
                      <Avatar src={m.avatar} name={m.displayName} size="md" />
                      <span className="text-[10px] text-muted-foreground mt-1 max-w-[60px] truncate">
                        {m.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {datingTab === "profile" && (
          <Card padding="md" className="space-y-4">
            <h2 className="font-bold text-base text-foreground">
              Dating Profile Setup
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Bio
                </label>
                <Input
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Looking For
                </label>
                <select
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-xl bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="ANY">Any Connection</option>
                  <option value="FRIENDS">Just Friends</option>
                  <option value="RELATIONSHIP">Long Term Relationship</option>
                  <option value="CASUAL">Casual Dating</option>
                </select>
              </div>

              {/* Prompts list */}
              <div className="border-t border-border pt-3 space-y-3">
                <h4 className="font-bold text-muted-foreground text-[10px] uppercase">
                  Dating Prompts
                </h4>
                {prompts.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/40 p-2.5 rounded-xl space-y-1.5 border border-border"
                  >
                    <p className="font-bold text-foreground">{p.question}</p>
                    <Input
                      placeholder="Your answer..."
                      value={p.answer}
                      onChange={(e) => {
                        const newPrompts = [...prompts];
                        newPrompts[idx].answer = e.target.value;
                        setPrompts(newPrompts);
                      }}
                    />
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full">
                Save Dating Profile
              </Button>
            </form>
          </Card>
        )}

        {datingTab === "crush" && (
          <div className="space-y-4">
            <Card padding="md" className="space-y-3 border-pink-500/20">
              <h2 className="font-bold text-base text-foreground">
                Secret Crush
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add usernames of friends or other creators to your Secret Crush
                list. They won&apos;t know you added them, but if they add you
                to their list too, it will trigger a MATCH!
              </p>

              <form onSubmit={handleSecretCrush} className="flex gap-2 text-xs">
                <Input
                  placeholder="Enter username (e.g. alicedev)..."
                  value={crushUsername}
                  onChange={(e) => setCrushUsername(e.target.value)}
                />
                <Button type="submit" size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Card>

            {/* Secret crush count */}
            {myCrushes.length > 0 && (
              <Card padding="sm" className="bg-muted/30">
                <p className="text-xs text-muted-foreground font-semibold">
                  You have{" "}
                  <span className="text-pink-500 font-bold">
                    {myCrushes.length}
                  </span>{" "}
                  secret crushes listed.
                </p>
              </Card>
            )}
          </div>
        )}

        {datingTab === "events" && (
          <div className="space-y-4">
            <h2 className="font-bold text-base">Local Mixers & Events</h2>
            <div className="space-y-3">
              {MOCK_EVENTS.map((event) => (
                <Card
                  key={event.id}
                  padding="md"
                  className="space-y-2 border border-border"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {event.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {event.date} at {event.time}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-600 text-[10px] font-bold">
                      {event.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                    Location: {event.location}
                  </p>
                  <Button
                    size="xs"
                    className="w-full text-pink-500 border border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10"
                    onClick={() =>
                      toast.success("Successfully RSVP'd to mixer!")
                    }
                  >
                    RSVP Mingle
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
