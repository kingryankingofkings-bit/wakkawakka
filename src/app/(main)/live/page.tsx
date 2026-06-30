"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import {
  Radio,
  Users,
  Gift,
  Heart,
  ChevronLeft,
  Send,
  Plus,
  Play,
  Film,
  Lock,
  Coins,
  Check,
  Trash2,
  Tv,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCount } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { useSearchParams, useRouter } from "next/navigation";

const GIFTS = [
  { emoji: "🎁", name: "Gift", cost: 10 },
  { emoji: "🌟", name: "Star", cost: 50 },
  { emoji: "💎", name: "Diamond", cost: 100 },
  { emoji: "👑", name: "Crown", cost: 500 },
  { emoji: "🚀", name: "Rocket", cost: 1000 },
];

const CATEGORIES = [
  "All",
  "Gaming",
  "Music",
  "Talk Shows",
  "Creative",
  "Technology",
];

export default function LivePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading stream platform...</div>}>
      <LivePageInner />
    </Suspense>
  );
}

function LivePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser } = useAuthStore();

  const [activeStatusTab, setActiveStatusTab] = useState<
    "live" | "scheduled" | "recorded"
  >("live");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sidebarTab, setSidebarTab] = useState<"chat" | "clips">("chat");

  // List views state
  const [streams, setStreams] = useState<any[]>([]);
  const [isLoadingStreams, setIsLoadingStreams] = useState(true);

  // Active watching stream state
  const [viewing, setViewing] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showGifts, setShowGifts] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  // Predictions State
  const [prediction, setPrediction] = useState<any>(null);
  const [predTitle, setPredTitle] = useState("");
  const [predOptions, setPredOptions] = useState<string[]>(["Yes", "No"]);
  const [isCreatingPred, setIsCreatingPred] = useState(false);
  const [betAmount, setBetAmount] = useState(100);

  // Clips state
  const [clips, setClips] = useState<any[]>([]);
  const [isCreatingClip, setIsCreatingClip] = useState(false);
  const [newClipTitle, setNewClipTitle] = useState("");

  // Cohosting state
  const [coHosts, setCoHosts] = useState<any[]>([]);
  const [inviteUserId, setInviteUserId] = useState("");

  // Go Live / Schedule Stream Modal State
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");
  const [liveDesc, setLiveDesc] = useState("");
  const [liveCategory, setLiveCategory] = useState("Gaming");
  const [liveScheduledAt, setLiveScheduledAt] = useState("");
  const [createdStreamInfo, setCreatedStreamInfo] = useState<any>(null);

  // Raid redirection state
  const [raidTarget, setRaidTarget] = useState<{
    streamId: string;
    username: string;
  } | null>(null);
  const [raidCountdown, setRaidCountdown] = useState(5);

  const socketRef = useRef<Socket | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const heartId = useRef(0);

  // 1. Fetch Streams
  const fetchStreams = async () => {
    setIsLoadingStreams(true);
    try {
      const catParam =
        selectedCategory !== "All" ? `&category=${selectedCategory}` : "";
      const res = await fetch(
        `/api/live/streams?status=${activeStatusTab}${catParam}`,
      );
      if (res.ok) {
        const data = await res.json();
        setStreams(data.streams || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStreams(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, [activeStatusTab, selectedCategory]);

  // Handle URL query parameters for direct links (e.g. ?stream=id)
  useEffect(() => {
    const streamId = searchParams.get("stream");
    if (streamId) {
      loadStreamDetails(streamId);
    } else {
      setViewing(null);
    }
  }, [searchParams]);

  // Load Single Stream Details (Active Mode)
  const loadStreamDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/live/streams/${id}`);
      if (res.ok) {
        const data = await res.json();
        setViewing(data.stream);
        setViewerCount(data.stream.viewerCount);
        setCoHosts(data.stream.coHosts || []);

        // Fetch Chat history
        const chatRes = await fetch(`/api/live/streams/${id}/chat`);
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          setComments(chatData.comments || []);
        }

        // Fetch predictions
        const predRes = await fetch(`/api/live/streams/${id}/predictions`);
        if (predRes.ok) {
          const predData = await predRes.json();
          setPrediction(predData.prediction);
        }

        // Fetch clips
        const clipsRes = await fetch(`/api/live/streams/${id}/clips`);
        if (clipsRes.ok) {
          const clipsData = await clipsRes.json();
          setClips(clipsData.clips || []);
        }
      } else {
        toast.error("Stream not found");
        setViewing(null);
      }
    } catch (e) {
      console.error(e);
      setViewing(null);
    }
  };

  // Socket.IO Connection Setup
  useEffect(() => {
    if (!viewing) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    socketRef.current = io({ path: "/api/socket" });
    const socket = socketRef.current;

    socket.emit("join-live", viewing.id);

    socket.on("live-comment", (comment: any) => {
      setComments((prev) => [...prev.slice(-99), comment]);
    });

    socket.on("live-gift", (giftData: any) => {
      // Show screen heart/confetti or trigger overlay
      toast.success(`${giftData.senderName} sent a ${giftData.giftName}!`);
      // Trigger floating hearts
      for (let i = 0; i < 5; i++) {
        setTimeout(sendHeart, i * 150);
      }
    });

    socket.on("live-prediction", (data: any) => {
      if (data.event === "CREATE") {
        setPrediction(data.prediction);
        toast.success(`New prediction started: ${data.prediction.title}`);
      } else if (data.event === "LOCK") {
        setPrediction((prev: any) =>
          prev ? { ...prev, status: "LOCKED" } : null,
        );
        toast.success("Prediction locked! No more bets.");
      } else if (data.event === "RESOLVE") {
        setPrediction(null);
        toast.success(`Prediction resolved!`);
        // Refresh balance
        if (user) {
          refreshUserPoints();
        }
      } else if (data.event === "CANCEL") {
        setPrediction(null);
        toast.success("Prediction cancelled. Points refunded.");
        if (user) {
          refreshUserPoints();
        }
      }
    });

    socket.on("live-raid", (data: any) => {
      toast.success(
        `Raid starting! Redirecting to host ${data.targetUsername}...`,
      );
      setRaidTarget({
        streamId: data.targetStreamId,
        username: data.targetUsername,
      });
    });

    socket.on("live-cohost", (data: any) => {
      setCoHosts(data.coHosts || []);
    });

    return () => {
      socket.disconnect();
    };
  }, [viewing]);

  // Countdown timer for Raid redirect
  useEffect(() => {
    if (!raidTarget) return;

    if (raidCountdown === 0) {
      const targetId = raidTarget.streamId;
      setRaidTarget(null);
      setRaidCountdown(5);
      router.push(`/live?stream=${targetId}`);
      return;
    }

    const timer = setTimeout(() => {
      setRaidCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [raidTarget, raidCountdown]);

  const refreshUserPoints = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/ads`); // Quick call to see if auth ok, or we can fetch a specific profile route
      // Let's call /api/live/streams directly to trigger user points reload or inspect state
      // Actually we can get user's channelPoints balance if we had profile API.
      // Alternatively, we can let user state update with payouts returned by the APIs.
    } catch (e) {
      console.error(e);
    }
  };

  // Scroll chat
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // Actions
  const handleGoLive = async () => {
    if (!liveTitle) return;

    try {
      const res = await fetch("/api/live/streams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          title: liveTitle,
          description: liveDesc,
          category: liveCategory,
          scheduledAt: liveScheduledAt || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedStreamInfo(data.stream);
        toast.success(
          liveScheduledAt
            ? "Stream scheduled!"
            : "Stream created! You are live.",
        );
        fetchStreams();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to start stream");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const handleEndStream = async () => {
    if (!viewing) return;
    try {
      const res = await fetch(`/api/live/streams/${viewing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({ isActive: false }),
      });
      if (res.ok) {
        const data = await res.json();
        setViewing(data.stream);
        toast.success("Stream ended. Archived as VOD.");
        router.push("/live");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendComment = async () => {
    if (!commentText.trim() || !viewing) return;

    const messageToSend = commentText.trim();
    setCommentText("");

    try {
      const res = await fetch(`/api/live/streams/${viewing.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (res.ok) {
        const data = await res.json();

        // Check if command response
        if (data.command === "RAID") {
          toast.success(data.message);
          // Broadcast Socket.IO raid redirect
          socketRef.current?.emit("live-raid", {
            streamId: viewing.id,
            targetStreamId: data.targetStreamId,
            targetUsername: data.targetUsername,
          });
          // Redirect the host
          router.push(`/live?stream=${data.targetStreamId}`);
        } else if (data.command === "HOST") {
          toast.success(data.message);
          // Host display embed or just text update
        } else if (data.comment) {
          // Emit socket comment
          socketRef.current?.emit("live-comment", {
            streamId: viewing.id,
            comment: data.comment,
          });
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to send comment");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const sendGift = async (gift: (typeof GIFTS)[0]) => {
    if (!viewing) return;
    try {
      const res = await fetch(`/api/live/streams/${viewing.id}/gifts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          giftName: gift.name,
          amount: gift.cost,
          quantity: 1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update user state points locally
        updateUser({ channelPoints: data.newBalance });
        toast.success(`Sent ${gift.name}!`);
        setShowGifts(false);

        // Emit Socket
        socketRef.current?.emit("live-gift", {
          streamId: viewing.id,
          gift: {
            giftName: gift.name,
            quantity: 1,
            senderName: user?.displayName || "User",
          },
        });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to send gift");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const sendHeart = () => {
    const id = heartId.current++;
    setHearts((h) => [...h, { id, x: Math.random() * 80 + 10 }]);
    setTimeout(
      () => setHearts((h) => h.filter((heart) => heart.id !== id)),
      2000,
    );
  };

  // Prediction Handlers
  const handleCreatePrediction = async () => {
    if (!predTitle || predOptions.length < 2 || !viewing) return;

    try {
      const res = await fetch(`/api/live/streams/${viewing.id}/predictions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          action: "CREATE",
          title: predTitle,
          options: predOptions,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPrediction(data.prediction);
        setIsCreatingPred(false);
        setPredTitle("");

        // Emit Socket
        socketRef.current?.emit("live-prediction", {
          streamId: viewing.id,
          event: "CREATE",
          prediction: data.prediction,
        });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create prediction");
      }
    } catch (e) {
      toast.error("Error");
    }
  };

  const handleBetPrediction = async (optionId: string) => {
    if (!viewing || !prediction) return;

    try {
      const res = await fetch(`/api/live/streams/${viewing.id}/predictions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          action: "BET",
          optionId,
          points: betAmount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        updateUser({ channelPoints: data.newBalance });
        toast.success(`Bet placed on option!`);

        // Refresh local details
        loadStreamDetails(viewing.id);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to place bet");
      }
    } catch (e) {
      toast.error("Error");
    }
  };

  const handleLockPrediction = async () => {
    if (!viewing || !prediction) return;

    try {
      const res = await fetch(`/api/live/streams/${viewing.id}/predictions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({ action: "LOCK" }),
      });

      if (res.ok) {
        const data = await res.json();
        setPrediction(data.prediction);
        toast.success("Prediction locked");

        socketRef.current?.emit("live-prediction", {
          streamId: viewing.id,
          event: "LOCK",
          prediction: data.prediction,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolvePrediction = async (optionId: string) => {
    if (!viewing || !prediction) return;

    try {
      const res = await fetch(`/api/live/streams/${viewing.id}/predictions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          action: "RESOLVE",
          winningOptionId: optionId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPrediction(null);
        toast.success("Prediction resolved!");
        updateUser({ channelPoints: data.newBalance });

        socketRef.current?.emit("live-prediction", {
          streamId: viewing.id,
          event: "RESOLVE",
          winningOptionId: optionId,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelPrediction = async () => {
    if (!viewing || !prediction) return;

    try {
      const res = await fetch(`/api/live/streams/${viewing.id}/predictions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({ action: "CANCEL" }),
      });

      if (res.ok) {
        const data = await res.json();
        setPrediction(null);
        toast.success("Prediction cancelled");
        updateUser({ channelPoints: data.newBalance });

        socketRef.current?.emit("live-prediction", {
          streamId: viewing.id,
          event: "CANCEL",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cohost invite / leave
  const handleCohostAction = async (action: "INVITE" | "ACCEPT" | "LEAVE") => {
    if (!viewing) return;
    try {
      const res = await fetch(`/api/live/streams/${viewing.id}/cohost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          userId: action === "INVITE" ? inviteUserId : user?.id,
          action,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Cohost update successful");
        setInviteUserId("");
        // Reload details
        loadStreamDetails(viewing.id);

        // Emit Socket event to update cohosts list
        const updatedCoHostsRes = await fetch(
          `/api/live/streams/${viewing.id}`,
        );
        if (updatedCoHostsRes.ok) {
          const updatedData = await updatedCoHostsRes.json();
          socketRef.current?.emit("live-cohost", {
            streamId: viewing.id,
            coHosts: updatedData.stream.coHosts || [],
          });
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed cohost action");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Clips creation
  const handleCreateClip = async () => {
    if (!viewing || !newClipTitle) return;
    setIsCreatingClip(true);
    try {
      const res = await fetch(`/api/live/streams/${viewing.id}/clips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          title: newClipTitle,
          duration: 30,
        }),
      });

      if (res.ok) {
        toast.success("Clip created successfully!");
        setNewClipTitle("");
        // Reload clips
        const clipsRes = await fetch(`/api/live/streams/${viewing.id}/clips`);
        if (clipsRes.ok) {
          const clipsData = await clipsRes.json();
          setClips(clipsData.clips || []);
        }
      } else {
        toast.error("Failed to create clip");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingClip(false);
    }
  };

  // WATCH MODE LAYOUT
  if (viewing) {
    const isHost = viewing.hostId === user?.id;
    const isVOD = viewing.isRecorded;
    const acceptedCoHosts = coHosts.filter((ch) => ch.status === "ACCEPTED");
    const myPendingInvite = coHosts.find(
      (ch) => ch.userId === user?.id && ch.status === "PENDING",
    );

    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col lg:flex-row">
        {/* Raid Overlay banner */}
        {raidTarget && (
          <div className="absolute top-0 inset-x-0 z-50 bg-red-600 text-white text-center py-2 font-bold animate-pulse text-sm">
            🚨 RAIDING {raidTarget.username} IN {raidCountdown} SECONDS...
          </div>
        )}

        {/* Video Player Section */}
        <div className="flex-1 flex flex-col bg-black">
          {/* Watch Header */}
          <div className="p-4 flex items-center justify-between border-b border-white/10 text-white bg-background/50">
            <button
              onClick={() => {
                router.push("/live");
                setViewing(null);
              }}
              className="flex items-center gap-1 hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to Browse</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar
                  src={viewing.host.avatar}
                  name={viewing.host.displayName}
                  size="sm"
                />
                <span className="text-sm font-semibold">
                  {viewing.host.displayName}
                </span>
              </div>
              {!isVOD && (
                <div className="bg-red-600 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </div>
              )}
              {isVOD && (
                <div className="bg-muted px-2 py-0.5 rounded text-xs font-bold text-muted-foreground flex items-center gap-1">
                  VOD ARCHIVE
                </div>
              )}
              <div className="text-xs text-white/70 flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{formatCount(viewerCount)} watching</span>
              </div>
            </div>
          </div>

          {/* Main Video Viewport / Splitscreen Co-hosts */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 opacity-80" />

            {/* Split Screen Layout if accepted co-hosts exist */}
            <div
              className={`w-full h-full max-w-5xl aspect-video grid gap-4 p-4 z-10 ${acceptedCoHosts.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              <div className="bg-black/60 rounded-2xl flex flex-col items-center justify-center border border-white/10 relative overflow-hidden">
                <div className="absolute top-4 left-4 bg-black/40 px-2.5 py-1 rounded text-xs text-white">
                  Host Player
                </div>
                <Radio className="h-12 w-12 text-primary animate-pulse mb-2" />
                <span className="text-white text-sm font-semibold">
                  {viewing.host.displayName}
                </span>
              </div>

              {acceptedCoHosts.length > 0 && (
                <div className="bg-black/60 rounded-2xl flex flex-col items-center justify-center border border-white/10 relative overflow-hidden">
                  <div className="absolute top-4 left-4 bg-black/40 px-2.5 py-1 rounded text-xs text-white">
                    Co-Host Split
                  </div>
                  <Users className="h-12 w-12 text-purple-400 mb-2" />
                  <span className="text-white text-sm font-semibold">
                    {acceptedCoHosts[0].user.displayName}
                  </span>
                </div>
              )}
            </div>

            {/* Float Hearts Layer */}
            <AnimatePresence>
              {hearts.map((heart) => (
                <motion.div
                  key={heart.id}
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -200, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2 }}
                  className="absolute bottom-20 text-3xl pointer-events-none z-20"
                  style={{ left: `${heart.x}%` }}
                >
                  ❤️
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Player controls / Clip Creation / Channel Points */}
          <div className="p-4 bg-background border-t border-border flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">{viewing.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {viewing.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isVOD && (
                  <Button
                    size="sm"
                    onClick={sendHeart}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    ❤️ Send Heart
                  </Button>
                )}
                {!isVOD && isHost && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleEndStream}
                  >
                    End Broadcast
                  </Button>
                )}
              </div>
            </div>

            {/* Clips Creation widget */}
            <div className="border-t border-border pt-3 mt-1 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Clip title..."
                  value={newClipTitle}
                  onChange={(e) => setNewClipTitle(e.target.value)}
                  className="flex-1 bg-muted border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                />
                <Button
                  size="xs"
                  onClick={handleCreateClip}
                  disabled={isCreatingClip || !newClipTitle}
                >
                  <Film className="h-3 w-3 mr-1" /> Clip That!
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Category:{" "}
                <span className="font-semibold text-primary">
                  {viewing.category || "Just Chatting"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interaction Panel Sidebar */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border flex flex-col bg-card h-[50vh] min-h-[450px] lg:h-auto lg:min-h-0 lg:max-h-none">
          <div
            className="flex border-b border-border text-xs"
            role="tablist"
            aria-label="Sidebar tabs"
          >
            <button
              role="tab"
              id="tab-chat"
              aria-controls="panel-chat"
              aria-selected={sidebarTab === "chat"}
              onClick={() => setSidebarTab("chat")}
              className={`flex-1 py-3 text-center font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${sidebarTab === "chat" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Chat & Interactive
            </button>
            <button
              role="tab"
              id="tab-clips"
              aria-controls="panel-clips"
              aria-selected={sidebarTab === "clips"}
              onClick={() => setSidebarTab("clips")}
              className={`flex-1 py-3 text-center font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${sidebarTab === "clips" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Clips & VODs
            </button>
          </div>

          <div className="flex-1 flex flex-col p-4 gap-4">
            {sidebarTab === "chat" && (
              <div
                id="panel-chat"
                role="tabpanel"
                aria-labelledby="tab-chat"
                className="flex-1 flex flex-col gap-4"
              >
                {/* User points balance */}
                <div className="bg-muted/50 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Your Channel Points:
                    </span>
                  </div>
                  <span className="text-sm font-bold text-yellow-600">
                    {user?.channelPoints || 0} pts
                  </span>
                </div>

                {/* Cohost Controls */}
                {!isVOD && (
                  <div className="border border-border rounded-xl p-3 bg-muted/20 space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase">
                      Co-Hosting
                    </h3>
                    <div className="space-y-1.5">
                      {coHosts.map((ch) => (
                        <div
                          key={ch.id}
                          className="flex items-center justify-between text-xs bg-muted/40 p-1.5 rounded"
                        >
                          <span>
                            {ch.user.displayName}{" "}
                            {ch.status === "PENDING" && "(Pending)"}
                          </span>
                          {(isHost || ch.userId === user?.id) && (
                            <button
                              onClick={() => handleCohostAction("LEAVE")}
                              className="text-red-500 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {coHosts.length === 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          No active co-hosts.
                        </p>
                      )}
                    </div>
                    {isHost && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Invitee User ID..."
                          value={inviteUserId}
                          onChange={(e) => setInviteUserId(e.target.value)}
                          className="flex-1 bg-muted border border-border rounded-lg px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                        <Button
                          size="xs"
                          onClick={() => handleCohostAction("INVITE")}
                          disabled={!inviteUserId}
                          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          Invite
                        </Button>
                      </div>
                    )}
                    {!isHost && myPendingInvite && (
                      <Button
                        size="xs"
                        className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={() => handleCohostAction("ACCEPT")}
                      >
                        Accept Co-Host Invitation
                      </Button>
                    )}
                  </div>
                )}

                {/* Predictions Widget */}
                {!isVOD && (
                  <div className="border border-border rounded-xl p-3 bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase">
                        Channel Points Prediction
                      </h3>
                      {isHost && !prediction && (
                        <Button
                          size="xs"
                          onClick={() => setIsCreatingPred(true)}
                          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Plus className="h-3 w-3" /> Create
                        </Button>
                      )}
                    </div>

                    {isCreatingPred && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Question (e.g. Will I win?)"
                          value={predTitle}
                          onChange={(e) => setPredTitle(e.target.value)}
                          className="w-full bg-muted border border-border rounded-lg px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={predOptions[0]}
                            onChange={(e) =>
                              setPredOptions([e.target.value, predOptions[1]])
                            }
                            className="flex-1 bg-muted border border-border rounded-lg px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          />
                          <input
                            type="text"
                            value={predOptions[1]}
                            onChange={(e) =>
                              setPredOptions([predOptions[0], e.target.value])
                            }
                            className="flex-1 bg-muted border border-border rounded-lg px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            className="flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            onClick={() => setIsCreatingPred(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="xs"
                            className="flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            onClick={handleCreatePrediction}
                          >
                            Publish
                          </Button>
                        </div>
                      </div>
                    )}

                    {prediction && (
                      <div className="space-y-2">
                        <div className="flex items-start gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold">
                              {prediction.title}
                            </p>
                            <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold uppercase">
                              {prediction.status}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 mt-2">
                          {prediction.options.map((opt: any) => (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold">
                                  {opt.text}
                                </span>
                                <span className="text-muted-foreground">
                                  {opt.totalPoints} pts
                                </span>
                              </div>
                              {prediction.status === "ACTIVE" && !isHost && (
                                <button
                                  onClick={() => handleBetPrediction(opt.id)}
                                  className="w-full py-1 text-center bg-primary/10 hover:bg-primary/20 text-primary text-[10px] rounded font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                  Bet {betAmount} pts on &quot;{opt.text}&quot;
                                </button>
                              )}
                              {prediction.status === "LOCKED" && isHost && (
                                <button
                                  onClick={() =>
                                    handleResolvePrediction(opt.id)
                                  }
                                  className="w-full py-1 text-center bg-green-600 hover:bg-green-700 text-white text-[10px] rounded font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                                >
                                  Resolve with &quot;{opt.text}&quot;
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {prediction.status === "ACTIVE" && !isHost && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-[10px] text-muted-foreground">
                              Bet points:
                            </span>
                            <input
                              type="number"
                              value={betAmount}
                              onChange={(e) =>
                                setBetAmount(Number(e.target.value))
                              }
                              className="w-16 bg-muted border border-border rounded text-[11px] py-0.5 text-center text-foreground font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            />
                          </div>
                        )}

                        {isHost && (
                          <div className="flex gap-2 mt-3 pt-2 border-t border-border">
                            {prediction.status === "ACTIVE" && (
                              <Button
                                size="xs"
                                variant="outline"
                                className="flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                onClick={handleLockPrediction}
                              >
                                Lock Bets
                              </Button>
                            )}
                            <Button
                              size="xs"
                              variant="destructive"
                              className="flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                              onClick={handleCancelPrediction}
                            >
                              Cancel Pred
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {!prediction && !isCreatingPred && (
                      <p className="text-[11px] text-muted-foreground">
                        No active predictions at this time.
                      </p>
                    )}
                  </div>
                )}

                {/* Chat Messages */}
                <div className="flex-1 flex flex-col border border-border rounded-2xl overflow-hidden min-h-[250px] bg-background">
                  <div className="bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border flex items-center justify-between">
                    <span>Live Chat</span>
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-ping" />
                  </div>

                  {/* Comments Scroller */}
                  <div
                    className="flex-1 overflow-y-auto p-3 space-y-2"
                    role="log"
                    aria-live="polite"
                    aria-relevant="additions"
                  >
                    {comments.map((c) => (
                      <div key={c.id} className="text-xs">
                        <span className="font-bold text-primary mr-1.5">
                          {c.user?.displayName || "User"}:
                        </span>
                        <span className="text-foreground">{c.message}</span>
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Gift Overlay drawer */}
                  {showGifts && !isVOD && (
                    <div className="p-3 border-t border-border bg-muted/30 grid grid-cols-5 gap-2">
                      {GIFTS.map((g) => (
                        <button
                          key={g.name}
                          onClick={() => sendGift(g)}
                          className="flex flex-col items-center p-1.5 bg-background rounded-lg border border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <span className="text-lg">{g.emoji}</span>
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            {g.cost} pts
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input field */}
                  {!isVOD && (
                    <div className="p-2 border-t border-border flex items-center gap-1 bg-muted/40">
                      <input
                        type="text"
                        placeholder="Chat message or host command..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendComment()}
                        className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <button
                        onClick={sendComment}
                        className="p-1.5 bg-primary rounded-xl text-white hover:bg-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setShowGifts((g) => !g)}
                        className="p-1.5 bg-yellow-500/10 rounded-xl text-yellow-600 hover:bg-yellow-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Gift className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {sidebarTab === "clips" && (
              /* Clips List for this Stream */
              <div
                id="panel-clips"
                role="tabpanel"
                aria-labelledby="tab-clips"
                className="border border-border rounded-xl p-3 bg-muted/20 space-y-2"
              >
                <h3 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Film className="h-3.5 w-3.5 text-purple-500" />
                  <span>Stream Clips ({clips.length})</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {clips.map((clip) => (
                    <div
                      key={clip.id}
                      className="bg-background border border-border rounded-lg overflow-hidden flex flex-col"
                    >
                      <div className="aspect-video bg-muted relative">
                        <img
                          src={clip.thumbnailUrl}
                          className="object-cover w-full h-full"
                          alt={clip.title}
                        />
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded">
                          {clip.duration}s
                        </div>
                      </div>
                      <span className="text-[10px] p-1.5 font-semibold line-clamp-1 text-foreground">
                        {clip.title}
                      </span>
                    </div>
                  ))}
                  {clips.length === 0 && (
                    <p className="text-[10px] text-muted-foreground col-span-2">
                      No clips created yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // BROWSE MODE LAYOUT
  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-6">
      {/* Title / Broadcast Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-red-500 animate-pulse" /> Live
            Streaming Platform
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Explore channels, join broadcasts, and watch archives.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsGoLiveOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Broadcast Setup
        </Button>
      </div>

      {/* Categories Horizontal Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selectedCategory === cat
                ? "bg-primary text-white border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tabs list: Live vs Scheduled vs VOD */}
      <div
        className="flex border-b border-border text-sm gap-6"
        role="tablist"
        aria-label="Stream Status Tabs"
      >
        <button
          role="tab"
          aria-selected={activeStatusTab === "live"}
          onClick={() => setActiveStatusTab("live")}
          className={`pb-2.5 font-bold transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeStatusTab === "live"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Streams
        </button>
        <button
          role="tab"
          aria-selected={activeStatusTab === "scheduled"}
          onClick={() => setActiveStatusTab("scheduled")}
          className={`pb-2.5 font-bold transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeStatusTab === "scheduled"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Scheduled Schedule
        </button>
        <button
          role="tab"
          aria-selected={activeStatusTab === "recorded"}
          onClick={() => setActiveStatusTab("recorded")}
          className={`pb-2.5 font-bold transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeStatusTab === "recorded"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          VOD Archives
        </button>
      </div>

      {/* Streams list grid */}
      {isLoadingStreams ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          Loading channels...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <div
              key={stream.id}
              onClick={() => {
                router.push(`/live?stream=${stream.id}`);
                setViewing(stream);
              }}
              className="cursor-pointer border border-border bg-card rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="aspect-video bg-muted relative overflow-hidden">
                {stream.thumbnailUrl ? (
                  <img
                    src={stream.thumbnailUrl}
                    className="object-cover w-full h-full"
                    alt={stream.title}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-primary/20 flex items-center justify-center">
                    <Radio className="h-10 w-10 text-primary/40 group-hover:scale-110 transition-transform" />
                  </div>
                )}
                {stream.isActive && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    LIVE
                  </div>
                )}
                {stream.isRecorded && (
                  <div className="absolute top-2 left-2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                    <Play className="h-2.5 w-2.5 fill-current" /> VOD
                  </div>
                )}
                {!stream.isActive &&
                  !stream.isRecorded &&
                  stream.scheduledAt && (
                    <div className="absolute top-2 left-2 bg-yellow-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      SCHEDULED
                    </div>
                  )}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 text-xs rounded-full flex items-center gap-1">
                  <Users className="h-3 w-3" /> {stream.viewerCount}
                </div>
              </div>
              <div className="p-4 flex items-start gap-3">
                <Avatar
                  src={stream.host?.avatar}
                  name={stream.host?.displayName}
                  size="md"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm line-clamp-1 text-foreground group-hover:text-primary transition-colors">
                    {stream.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stream.host?.displayName}
                  </p>
                  {stream.category && (
                    <span className="inline-block mt-2 text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-semibold">
                      {stream.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {streams.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
              <Tv className="h-12 w-12 text-muted-foreground/35 mb-3 animate-pulse" />
              <p className="font-semibold text-muted-foreground">
                No channels found in this tab
              </p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                Check back later or start your own stream!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Broadcast Setup Modal */}
      <Modal
        isOpen={isGoLiveOpen}
        onClose={() => {
          setIsGoLiveOpen(false);
          setCreatedStreamInfo(null);
        }}
        title="Live Stream Setup"
      >
        <div className="p-5 flex flex-col gap-4">
          {!createdStreamInfo ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Stream Title
                </label>
                <input
                  type="text"
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  placeholder="Enter stream title..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Description
                </label>
                <textarea
                  value={liveDesc}
                  onChange={(e) => setLiveDesc(e.target.value)}
                  placeholder="Tell your viewers what the stream is about..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Category
                  </label>
                  <select
                    value={liveCategory}
                    onChange={(e) => setLiveCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Schedule (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={liveScheduledAt}
                    onChange={(e) => setLiveScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none"
                  />
                </div>
              </div>

              <Button
                className="w-full mt-2"
                onClick={handleGoLive}
                disabled={!liveTitle}
              >
                Create Broadcast Session
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-600/10 border border-green-600/20 p-4 rounded-xl text-center">
                <Check className="h-8 w-8 text-green-500 mx-auto mb-1" />
                <h4 className="font-semibold text-green-600">
                  Broadcast Registered!
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use these credentials in your streaming software (OBS,
                  Streamlabs).
                </p>
              </div>

              <div className="p-4 bg-muted/60 rounded-xl space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Server URL
                  </p>
                  <code className="block text-xs bg-background border border-border rounded px-2.5 py-1.5 mt-1 font-mono break-all">
                    rtmp://live.wakkawakka.com/app
                  </code>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Stream Key
                  </p>
                  <code className="block text-xs bg-background border border-border rounded px-2.5 py-1.5 mt-1 font-mono break-all font-bold text-foreground">
                    {createdStreamInfo.streamKey}
                  </code>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setIsGoLiveOpen(false);
                  setCreatedStreamInfo(null);
                  router.push(`/live?stream=${createdStreamInfo.id}`);
                  setViewing(createdStreamInfo);
                }}
              >
                Enter Studio Player
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
