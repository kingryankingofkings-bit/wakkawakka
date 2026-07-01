"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface MediaGridProps {
  urls: string[];
  type: string;
}

export function MediaGrid({ urls, type }: MediaGridProps) {
  const [activeVideo, setActiveVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoToggle = useCallback(() => {
    if (!videoRef.current) return;
    if (activeVideo) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setActiveVideo(!activeVideo);
  }, [activeVideo]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setProgress(
      (videoRef.current.currentTime / videoRef.current.duration) * 100,
    );
  };

  if (type === "VIDEO") {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black group">
        <div
          className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 cursor-pointer"
          onClick={handleVideoToggle}
        >
          {urls[0] && (
            <img
              src={urls[0]}
              alt="Video thumbnail"
              className="w-full h-full object-cover opacity-80"
            />
          )}
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20"
            >
              {activeVideo ? (
                <Pause className="w-7 h-7 text-white fill-white" />
              ) : (
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              )}
            </motion.div>
          </div>
          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        <video
          ref={videoRef}
          src={urls[0]}
          muted={isMuted}
          loop
          className="hidden"
          onTimeUpdate={handleTimeUpdate}
        />
      </div>
    );
  }

  if (!urls || urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div className="rounded-xl overflow-hidden">
        <img
          src={urls[0]}
          alt="Post media"
          className="w-full object-cover max-h-[500px]"
          loading="lazy"
        />
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
        {urls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`Media ${i + 1}`}
            className="w-full h-64 object-cover"
            loading="lazy"
          />
        ))}
      </div>
    );
  }

  if (urls.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
        <img
          src={urls[0]}
          alt="Media 1"
          className="w-full h-72 object-cover row-span-2"
          loading="lazy"
        />
        <img
          src={urls[1]}
          alt="Media 2"
          className="w-full h-[142px] object-cover"
          loading="lazy"
        />
        <img
          src={urls[2]}
          alt="Media 3"
          className="w-full h-[142px] object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  if (urls.length === 4) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
        {urls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`Media ${i + 1}`}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        ))}
      </div>
    );
  }

  // 5+ images: mosaic
  return (
    <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
      <img
        src={urls[0]}
        alt="Media 1"
        className="col-span-2 row-span-2 w-full h-64 object-cover"
        loading="lazy"
      />
      {urls.slice(1, 5).map((url, i) => (
        <div key={i} className="relative">
          <img
            src={url}
            alt={`Media ${i + 2}`}
            className="w-full h-32 object-cover"
            loading="lazy"
          />
          {i === 3 && urls.length > 5 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                +{urls.length - 5}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
