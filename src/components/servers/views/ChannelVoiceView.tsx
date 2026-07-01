"use client";

import { useState, useEffect } from "react";
import {
  PhoneOff,
  Music,
  Mic,
  MicOff,
  Volume2 as VolumeIcon,
} from "lucide-react";
import { useVoice } from "@/hooks/useVoice";
import { cn } from "@/lib/utils";

export function ChannelVoiceView({
  serverId,
  channelId,
}: {
  serverId: string;
  channelId: string;
}) {
  const { isConnected, isMuted, join, leave, toggleMute, playSound } =
    useVoice(channelId);
  const [sounds, setSounds] = useState<any[]>([]);

  useEffect(() => {
    const fetchSounds = async () => {
      try {
        const res = await fetch(`/api/servers/${serverId}/soundboard`);
        if (res.ok) {
          const data = await res.json();
          setSounds(data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSounds();
  }, [serverId]);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
      {/* Connection Panel */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center shadow-md">
        <VolumeIcon
          className={cn(
            "h-16 w-16 mb-4 text-muted-foreground animate-pulse",
            isConnected && "text-green-500",
          )}
        />
        <h3 className="text-lg font-bold mb-1">Voice Connection</h3>
        <p className="text-xs text-muted-foreground mb-6">
          {isConnected
            ? "You are connected to the voice channel"
            : "Connect to join the voice chat room"}
        </p>
        <div className="flex gap-4">
          {!isConnected ? (
            <button
              onClick={join}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/95 transition-colors active:scale-95 shadow-md"
            >
              Join Voice
            </button>
          ) : (
            <>
              <button
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                className={cn(
                  "p-3 rounded-xl border border-border text-sm font-semibold transition-colors flex items-center justify-center gap-2",
                  isMuted
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={leave}
                className="px-6 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-colors flex items-center gap-2 active:scale-95 shadow-md shadow-red-500/15"
              >
                <PhoneOff className="h-4 w-4" />
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Soundboard Section */}
      {isConnected && (
        <div className="border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Music className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-bold">Soundboard</h3>
          </div>
          {sounds.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No soundboard sounds uploaded to this server yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sounds.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => playSound(sound.soundUrl)}
                  className="p-3 bg-muted hover:bg-primary hover:text-primary-foreground border border-border hover:border-transparent rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all duration-200"
                >
                  <span className="text-lg">{sound.emoji || "🔊"}</span>
                  <span>{sound.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
