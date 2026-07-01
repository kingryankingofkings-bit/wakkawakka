"use client";

import { useEffect, useRef, useState } from "react";
import { useCameraStore } from "@/store/cameraStore";
import { useFeedStore } from "@/store/feedStore";
import { useMessageStore } from "@/store/messageStore";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

// UI Components
import { CameraPreview } from "./components/CameraPreview";
import { CapturedMediaPreview } from "./components/CapturedMediaPreview";
import { CameraSimulatedFeed } from "./components/CameraSimulatedFeed";
import { CameraTopControls } from "./components/CameraTopControls";
import { CameraBottomControls } from "./components/CameraBottomControls";
import { CameraPostConfirmation } from "./components/CameraPostConfirmation";

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
            <CameraSimulatedFeed setHasCameraPermission={setHasCameraPermission} />
          ) : (
            <CameraPreview
              hasCameraPermission={hasCameraPermission}
              videoRef={videoRef}
              pipVideoRef={pipVideoRef}
              filterStyle={filterStyle}
              cameraMode={cameraMode}
              showGeofilter={showGeofilter}
              userLocation={userLocation}
            />
          )}
        </div>
      ) : (
        /* Captured Media Preview */
        <CapturedMediaPreview
          capturedImage={capturedImage}
          capturedPipImage={capturedPipImage}
          cameraMode={cameraMode}
          showGeofilter={showGeofilter}
          userLocation={userLocation}
        />
      )}

      {/* TOP CONTROLS (Floating) */}
      <CameraTopControls
        capturedImage={capturedImage}
        hasCameraPermission={hasCameraPermission}
        showGeofilter={showGeofilter}
        setShowGeofilter={setShowGeofilter}
        toggleCamera={toggleCamera}
        handleDiscard={handleDiscard}
      />

      {/* BOTTOM CONTROL CONTAINER */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-12 pb-6 px-4 z-35 flex flex-col items-center gap-4">
        
        {/* Post confirm menu (Visible only when media is captured) */}
        {capturedImage && (
          <CameraPostConfirmation
            cameraMode={cameraMode}
            conversations={conversations as any}
            user={user as any}
            selectedConversationId={selectedConversationId}
            setSelectedConversationId={setSelectedConversationId}
            isPosting={isPosting}
            handleDiscard={handleDiscard}
            handleConfirmPost={handleConfirmPost}
          />
        )}

        {/* Carousel & Trigger (Visible only when no media captured) */}
        {!capturedImage && (
          <CameraBottomControls
            availableLenses={availableLenses}
            activeLensId={activeLensId}
            cameraMode={cameraMode}
            setActiveLensId={setActiveLensId}
            setCameraMode={setCameraMode}
            handleCapture={handleCapture}
          />
        )}
      </div>
    </div>
  );
}
