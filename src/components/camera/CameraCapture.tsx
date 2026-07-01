"use client";

import { useEffect, useRef, useState } from "react";
import { useCameraStore, CameraMode } from "@/store/cameraStore";
import { useFeedStore } from "@/store/feedStore";
import { useMessageStore } from "@/store/messageStore";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { 
  RotateCw, 
  Sparkles, 
  MapPin, 
  X, 
  Send 
} from "lucide-react";
import type { Post, Message } from "@/types";

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { 
    activeLensId, 
    availableLenses, 
    cameraMode, 
    setActiveLensId, 
    setCameraMode,
    addCapturedMediaUrl
  } = useCameraStore();

  const { addPost, unlockDailySnapFeed } = useFeedStore();
  const { conversations, addMessage } = useMessageStore();
  const { userLocation } = useUIStore();
  const { user, updateUser } = useAuthStore();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [pipStream, setPipStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedPipImage, setCapturedPipImage] = useState<string | null>(null);
  const [showGeofilter, setShowGeofilter] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Initialize camera
  useEffect(() => {
    async function startCamera() {
      try {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1080 },
            height: { ideal: 1920 },
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setHasCameraPermission(true);

        // If DailySnap, start secondary stream for front camera
        if (cameraMode === "BE_REAL") {
          try {
            const pipConstraints = {
              video: {
                facingMode: facingMode === "user" ? "environment" : "user",
                width: { ideal: 480 },
                height: { ideal: 640 },
              },
              audio: false,
            };
            const secondaryStream = await navigator.mediaDevices.getUserMedia(pipConstraints);
            setPipStream(secondaryStream);
            if (pipVideoRef.current) {
              pipVideoRef.current.srcObject = secondaryStream;
            }
          } catch (err) {
            console.log("Could not start PIP dual camera, using main stream as preview cloning", err);
            if (pipVideoRef.current) {
              pipVideoRef.current.srcObject = mediaStream;
            }
          }
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (pipStream) {
        pipStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, cameraMode]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleCapture = () => {
    // If permission or hardware isn't available, we create a beautiful mockup graphic so we don't break the user experience
    if (hasCameraPermission === false || !videoRef.current || !canvasRef.current) {
      // Simulate capture
      const randomSeed = Math.floor(Math.random() * 1000);
      const mockImage = `https://picsum.photos/seed/capture-${randomSeed}/1080/1920`;
      setCapturedImage(mockImage);
      if (cameraMode === "BE_REAL") {
        setCapturedPipImage(`https://api.dicebear.com/7.x/avataaars/svg?seed=selfie-${randomSeed}`);
      }
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 1136;

      const activeLens = availableLenses.find((l) => l.id === activeLensId);
      if (activeLens) {
        ctx.filter = activeLens.effect;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);

      if (cameraMode === "BE_REAL") {
        if (pipVideoRef.current) {
          const pipCanvas = document.createElement("canvas");
          const pipVideo = pipVideoRef.current;
          pipCanvas.width = pipVideo.videoWidth || 320;
          pipCanvas.height = pipVideo.videoHeight || 420;
          const pipCtx = pipCanvas.getContext("2d");
          if (pipCtx) {
            pipCtx.translate(pipCanvas.width, 0);
            pipCtx.scale(-1, 1);
            pipCtx.drawImage(pipVideo, 0, 0, pipCanvas.width, pipCanvas.height);
            setCapturedPipImage(pipCanvas.toDataURL("image/jpeg"));
          }
        } else {
          setCapturedPipImage("https://api.dicebear.com/7.x/avataaars/svg?seed=selfie");
        }
      }
    }
  };

  const handleConfirmPost = async () => {
    if (!capturedImage) return;

    setIsPosting(true);
    const mediaUrl = capturedImage;

    try {
      if (cameraMode === "BE_REAL") {
        const res = await fetch("/api/posts/bereal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
          },
          body: JSON.stringify({
            mainImageUrl: mediaUrl,
            btsImageUrl: capturedPipImage || "",
            visibility: "PUBLIC",
          }),
        });
        if (!res.ok) {
          throw new Error("Failed to post DailySnap");
        }
        const responseData = await res.json();
        unlockDailySnapFeed();
        addPost(responseData.data);
        addCapturedMediaUrl(mediaUrl);
      } else if (cameraMode === "DISAPPEARING") {
        if (!selectedConversationId) {
          alert("Please select a recipient first");
          setIsPosting(false);
          return;
        }
        const conversation = conversations.find((c) => c.id === selectedConversationId);
        const otherUser = conversation?.members.find((m) => m.id !== user?.id) || conversation?.members[0];
        if (!otherUser) {
          throw new Error("No recipient found in conversation");
        }
        
        const mediaRes = await fetch("/api/media/disappearing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
          },
          body: JSON.stringify({
            receiverId: otherUser.id,
            mediaUrl: mediaUrl,
            type: "IMAGE",
          }),
        });
        if (!mediaRes.ok) {
          throw new Error("Failed to save disappearing media");
        }
        
        const msgRes = await fetch(`/api/messages/conversations/${selectedConversationId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
          },
          body: JSON.stringify({
            content: "Sent a disappearing photo",
            mediaUrl: mediaUrl,
            mediaType: "image",
            type: "DISAPPEARING",
          }),
        });
        if (!msgRes.ok) {
          throw new Error("Failed to send message");
        }
        const msgData = await msgRes.json();
        addMessage(msgData.data);
        addCapturedMediaUrl(mediaUrl);
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
          },
          body: JSON.stringify({
            content: "Captured with Wakka Lens 📸",
            mediaUrls: [mediaUrl],
            type: "STORY",
            visibility: "PUBLIC",
            isEphemeral: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            hashtags: [],
          }),
        });
        if (!res.ok) {
          throw new Error("Failed to post story");
        }
        const responseData = await res.json();
        addPost(responseData.data);
        addCapturedMediaUrl(mediaUrl);
      }

      // Save to memories in the database
      try {
        await fetch("/api/memories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
          },
          body: JSON.stringify({
            url: mediaUrl,
            pipUrl: capturedPipImage || null,
            mode: cameraMode,
            location: userLocation ? "San Francisco, CA" : "Silicon Valley",
            tags: cameraMode === "BE_REAL" ? ["bereal"] : activeLensId ? [activeLensId] : ["camera"],
            latitude: userLocation?.latitude || null,
            longitude: userLocation?.longitude || null,
          }),
        });
      } catch (err) {
        console.error("Failed to save memory to database:", err);
      }

      // Trigger the activity streak
      try {
        const streakRes = await fetch("/api/streaks/activity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
          },
        });
        if (streakRes.ok) {
          const streakData = await streakRes.json();
          const streakValue = streakData.data?.currentStreak;
          if (typeof streakValue === "number") {
            updateUser({ streakDays: streakValue });
          }
        }
      } catch (err) {
        console.error("Failed to trigger activity streak:", err);
      }

      setCapturedImage(null);
      setCapturedPipImage(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to post");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDiscard = () => {
    setCapturedImage(null);
    setCapturedPipImage(null);
  };

  const activeLens = availableLenses.find((l) => l.id === activeLensId);
  const filterStyle = activeLens ? activeLens.effect : "none";

  return (
    <div className="relative flex flex-col justify-between w-full h-[calc(100vh)] bg-black text-white overflow-hidden select-none">
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Preview */}
      {!capturedImage ? (
        <div className="absolute inset-0 w-full h-full bg-neutral-950 flex items-center justify-center">
          {hasCameraPermission === false ? (
            <div className="p-6 text-center max-w-sm flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-4 animate-pulse">
                <RotateCw className="h-8 w-8" />
              </div>
              <p className="font-semibold text-lg mb-2">Simulated Camera Feed</p>
              <p className="text-sm text-neutral-400 mb-6">
                Hardware camera permissions are unavailable. We will simulate a camera capture with high-fidelity random visual generation.
              </p>
              <button 
                onClick={() => setHasCameraPermission(true)}
                className="px-6 py-2.5 bg-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition active:scale-95"
              >
                Use Real-time Mock Capture
              </button>
            </div>
          ) : (
            <>
              {/* Actual Video Tag or Simulated Visualizer */}
              {hasCameraPermission === true ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ filter: filterStyle }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-neutral-400">Requesting camera access...</p>
                </div>
              )}

              {/* Dual Camera PIP Container */}
              {cameraMode === "BE_REAL" && (
                <div className="absolute top-4 left-4 w-28 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-2xl bg-neutral-900 z-10 animate-fade-in touch-none">
                  {hasCameraPermission === true ? (
                    <video
                      ref={pipVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                      <span className="text-[10px] text-neutral-400">Selfie Feed</span>
                    </div>
                  )}
                </div>
              )}

              {/* Geofilter Overlay */}
              {showGeofilter && (
                <div className="absolute top-20 left-0 right-0 pointer-events-none flex flex-col items-center text-center select-none z-10 drop-shadow-md">
                  <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center gap-1.5 animate-pulse">
                    <MapPin className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      {userLocation ? "San Francisco, CA" : "Silicon Valley"}
                    </span>
                  </div>
                  <h1 className="font-display font-extrabold text-4xl mt-3 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-100 bg-clip-text text-transparent italic tracking-tight uppercase leading-none font-serif">
                    WAKKA LIFE
                  </h1>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Captured Media Preview */
        <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center z-20">
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-full object-cover" 
          />

          {/* PIP Image Overlaid for DailySnap preview */}
          {cameraMode === "BE_REAL" && capturedPipImage && (
            <div className="absolute top-4 left-4 w-28 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-2xl bg-neutral-900 z-30">
              <img 
                src={capturedPipImage} 
                alt="Selfie" 
                className="w-full h-full object-cover" 
              />
            </div>
          )}

          {/* Geofilter overlay on preview */}
          {showGeofilter && (
            <div className="absolute top-20 left-0 right-0 pointer-events-none flex flex-col items-center text-center select-none z-30 drop-shadow-md">
              <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  {userLocation ? "San Francisco, CA" : "Silicon Valley"}
                </span>
              </div>
              <h1 className="font-display font-extrabold text-4xl mt-3 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-100 bg-clip-text text-transparent italic tracking-tight uppercase leading-none font-serif">
                WAKKA LIFE
              </h1>
            </div>
          )}
        </div>
      )}

      {/* TOP CONTROLS (Floating) */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-30 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          {capturedImage && (
            <button 
              onClick={handleDiscard}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/75 transition"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {!capturedImage && (
            <>
              {hasCameraPermission && (
                <button 
                  onClick={toggleCamera}
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/75 transition"
                  title="Flip Camera"
                >
                  <RotateCw className="h-5 w-5 text-white" />
                </button>
              )}
              <button 
                onClick={() => setShowGeofilter(prev => !prev)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 transition ${showGeofilter ? "bg-primary text-white" : "bg-black/50 text-white hover:bg-black/75"}`}
                title="Toggle Geofilter"
              >
                <MapPin className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM CONTROL CONTAINER */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-12 pb-6 px-4 z-35 flex flex-col items-center gap-4">
        
        {/* Post confirm menu (Visible only when media is captured) */}
        {capturedImage && (
          <div className="w-full max-w-sm bg-neutral-900/95 border border-neutral-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-center text-neutral-300">
              {cameraMode === "BE_REAL" && "⚡ Share Daily DailySnap"}
              {cameraMode === "NORMAL" && "📸 Share to Feed & Story"}
              {cameraMode === "DISAPPEARING" && "🔒 Send Disappearing Photo"}
            </h3>

            {cameraMode === "DISAPPEARING" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400 font-medium">Select Friend / Chat</label>
                <select
                  value={selectedConversationId}
                  onChange={(e) => setSelectedConversationId(e.target.value)}
                  className="w-full text-sm bg-neutral-800 text-white rounded-xl py-2 px-3 focus:outline-none border border-neutral-700/50"
                >
                  <option value="">-- Choose recipient --</option>
                  {conversations.map((c) => {
                    const otherUser = c.members.find((m) => m.id !== user?.id) || c.members[0];
                    return (
                      <option key={c.id} value={c.id}>
                        {c.isGroup ? `👥 ${c.name}` : `👤 ${otherUser.displayName}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDiscard}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-neutral-800 bg-neutral-800/50 hover:bg-neutral-850 transition text-neutral-400"
              >
                Discard
              </button>
              <button
                onClick={handleConfirmPost}
                disabled={isPosting || (cameraMode === "DISAPPEARING" && !selectedConversationId)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/95 transition text-white flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Send className="h-4 w-4" />
                {isPosting ? "Posting..." : "Share"}
              </button>
            </div>
          </div>
        )}

        {/* Carousel & Trigger (Visible only when no media captured) */}
        {!capturedImage && (
          <>
            {/* AR Lens selector carousel */}
            <div className="w-full flex justify-center py-1">
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-6 max-w-full">
                <button
                  onClick={() => setActiveLensId(null)}
                  className={`w-12 h-12 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-all ${
                    activeLensId === null
                      ? "border-primary bg-primary/20 scale-110"
                      : "border-white/20 bg-neutral-900/60 text-neutral-300"
                  }`}
                >
                  Normal
                </button>

                {availableLenses.map((lens) => (
                  <button
                    key={lens.id}
                    onClick={() => setActiveLensId(lens.id)}
                    className={`w-12 h-12 rounded-full border-2 flex-shrink-0 flex flex-col items-center justify-center text-[10px] font-bold leading-none p-1 transition-all ${
                      activeLensId === lens.id
                        ? "border-primary bg-primary/20 scale-110 text-white"
                        : "border-white/20 bg-neutral-900/60 text-neutral-400"
                    }`}
                  >
                    <Sparkles className="h-3 w-3 mb-0.5 text-yellow-400" />
                    <span className="text-[8px] text-center truncate w-full">{lens.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shutter capture button */}
            <div className="flex items-center justify-center gap-8 py-2">
              <div className="w-10 h-10" />

              <button
                onClick={handleCapture}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-90 transition-transform relative group"
              >
                <div className="w-16 h-16 rounded-full bg-white group-hover:scale-95 transition-transform" />
              </button>

              <div className="w-10 h-10" />
            </div>

            {/* Mode toggles */}
            <div className="flex justify-center border-t border-white/10 w-full pt-4">
              <div className="flex items-center gap-6 text-xs font-semibold tracking-wider text-neutral-400">
                {(["NORMAL", "BE_REAL", "DISAPPEARING"] as CameraMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCameraMode(mode)}
                    className={`pb-1 transition-all uppercase ${
                      cameraMode === mode
                        ? "text-primary border-b-2 border-primary"
                        : "hover:text-white"
                    }`}
                  >
                    {mode.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
