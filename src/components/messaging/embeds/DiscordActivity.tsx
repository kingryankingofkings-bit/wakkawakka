"use client";

import React, { useState } from "react";

/**
 * Discord-style interactive activity embedded in a message bubble.
 * Includes a demo clicker game with live player indicators.
 */
export function DiscordActivity({ activityData }: { activityData: string }) {
  const [joined, setJoined] = useState(false);
  const [clicks, setClicks] = useState(0);

  return (
    <div className="bg-card text-foreground border border-border rounded-2xl p-3 my-1.5 max-w-[260px] space-y-2 text-xs shadow-sm">
      <div className="font-bold text-purple-500 flex items-center gap-1.5">
        <span>🎮</span> Discord Activity: {activityData || "Social Room"}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Launch in-channel games and screenshares.
      </p>

      {joined ? (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
              Live Players
            </span>
            <div className="flex -space-x-1.5">
              <img
                src="https://i.pravatar.cc/100?img=12"
                alt="avatar"
                className="h-5 w-5 rounded-full border border-background"
              />
              <img
                src="https://i.pravatar.cc/100?img=47"
                alt="avatar"
                className="h-5 w-5 rounded-full border border-background"
              />
            </div>
          </div>
          <div className="bg-muted p-2.5 rounded-xl text-center space-y-1.5 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground">
              Clicker Activity
            </p>
            <p className="font-black text-lg text-purple-500">
              {clicks} Clicks
            </p>
            <button
              onClick={() => setClicks((c) => c + 1)}
              className="px-3 py-1 bg-purple-500 text-white rounded-lg text-[10px] font-bold hover:bg-purple-600 transition-colors"
            >
              Click Here!
            </button>
          </div>
          <button
            onClick={() => setJoined(false)}
            className="w-full py-1 text-muted-foreground hover:text-foreground text-[10px] font-semibold"
          >
            Leave Room
          </button>
        </div>
      ) : (
        <button
          onClick={() => setJoined(true)}
          className="w-full py-2 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors"
        >
          Join Activity
        </button>
      )}
    </div>
  );
}
