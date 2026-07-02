"use client";

import { useEffect } from "react";
import { Hand, Sparkles, Radio } from "lucide-react";
import { useStage } from "@/hooks/useStage";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/Avatar";

export function ChannelStageView({
  _serverId,
  channelId,
  hasMod,
}: {
  serverId: string;
  channelId: string;
  hasMod: boolean;
}) {
  const {
    speakers,
    requestedToSpeak,
    requestToSpeak,
    moderateUser,
    fetchStageQueue,
  } = useStage(channelId);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchStageQueue();
  }, [channelId, fetchStageQueue]);

  const isCurrentUserSpeaker = currentUser
    ? speakers.includes(currentUser.id)
    : false;
  const isCurrentUserRequested = currentUser
    ? requestedToSpeak.includes(currentUser.id)
    : false;

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
      {/* On Stage Speakers */}
      <div>
        <div className="flex items-center gap-2 mb-3 border-b border-border pb-1.5">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-bold uppercase text-muted-foreground">
            On Stage Speakers
          </h3>
        </div>
        {speakers.length === 0 ? (
          <p className="text-xs text-muted-foreground italic pl-2">
            Stage is currently quiet.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pl-2">
            {speakers.map((userId) => (
              <div
                key={userId}
                className="flex flex-col items-center text-center p-2 rounded-xl bg-card border border-border shadow-sm"
              >
                <Avatar className="h-12 w-12 mb-2 border-2 border-primary" />
                <span className="text-xs font-semibold block truncate w-full text-foreground">
                  User {userId.substring(0, 5)}
                </span>
                {hasMod && (
                  <button
                    onClick={() => moderateUser(userId, "DEMOTE")}
                    className="text-[10px] text-red-500 mt-2 hover:underline"
                  >
                    Demote to Audience
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audience Controls */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center max-w-md mx-auto w-full shadow-md text-center">
        <Radio className="h-14 w-14 mb-3 text-primary animate-pulse" />
        <h4 className="text-sm font-bold mb-1">Stage Discussion Session</h4>
        <p className="text-xs text-muted-foreground mb-6">
          {isCurrentUserSpeaker
            ? "You are active speaker on stage. Speak freely."
            : isCurrentUserRequested
              ? "Your request to speak is pending approval"
              : "Listen in or request to speak"}
        </p>
        {!isCurrentUserSpeaker && !isCurrentUserRequested && (
          <button
            onClick={requestToSpeak}
            className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/95 transition-colors shadow-md active:scale-95"
          >
            <Hand className="h-4 w-4" />
            Request to Speak
          </button>
        )}
      </div>

      {/* Hand Raise queue (Moderators only) */}
      {hasMod && (
        <div className="border border-border rounded-2xl p-6">
          <h4 className="text-sm font-bold mb-3 uppercase text-muted-foreground">
            Speaker Requests
          </h4>
          {requestedToSpeak.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No requests to speak right now.
            </p>
          ) : (
            <div className="space-y-2">
              {requestedToSpeak.map((userId) => (
                <div
                  key={userId}
                  className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8" />
                    <span className="text-sm font-semibold">
                      User {userId.substring(0, 5)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moderateUser(userId, "PROMOTE")}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg font-semibold transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => moderateUser(userId, "REMOVE")}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg font-semibold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
