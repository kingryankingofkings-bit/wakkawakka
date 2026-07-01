"use client";

import { useState } from "react";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { cn, formatCount } from "@/lib/utils";

interface ThreadVotingProps {
  initialScore: number;
  initialUserVote?: "up" | "down" | null;
  onVote?: (newScore: number, voteType: "up" | "down" | null) => void;
  className?: string;
  horizontal?: boolean;
}

export function ThreadVoting({
  initialScore,
  initialUserVote = null,
  onVote,
  className,
  horizontal = false,
}: ThreadVotingProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(
    initialUserVote
  );

  const handleVote = (type: "up" | "down") => {
    let newScore = score;
    let newVoteType: "up" | "down" | null = type;

    if (userVote === type) {
      // Toggle off
      newScore += type === "up" ? -1 : 1;
      newVoteType = null;
    } else {
      // Switching vote or new vote
      if (userVote === "up" && type === "down") {
        newScore -= 2;
      } else if (userVote === "down" && type === "up") {
        newScore += 2;
      } else {
        newScore += type === "up" ? 1 : -1;
      }
    }

    setScore(newScore);
    setUserVote(newVoteType);
    if (onVote) onVote(newScore, newVoteType);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-muted/40 rounded-full p-1 border border-border/50",
        horizontal ? "flex-row" : "flex-col",
        className
      )}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleVote("up");
        }}
        className={cn(
          "p-1.5 rounded-full hover:bg-muted transition-colors group",
          userVote === "up" ? "text-orange-500" : "text-muted-foreground"
        )}
      >
        <ArrowBigUp
          className={cn(
            "w-5 h-5 transition-transform group-hover:-translate-y-0.5",
            userVote === "up" && "fill-orange-500"
          )}
        />
      </button>
      
      <span
        className={cn(
          "text-xs font-bold min-w-[2ch] text-center",
          userVote === "up" && "text-orange-500",
          userVote === "down" && "text-blue-500",
          !userVote && "text-foreground"
        )}
      >
        {formatCount(score)}
      </span>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleVote("down");
        }}
        className={cn(
          "p-1.5 rounded-full hover:bg-muted transition-colors group",
          userVote === "down" ? "text-blue-500" : "text-muted-foreground"
        )}
      >
        <ArrowBigDown
          className={cn(
            "w-5 h-5 transition-transform group-hover:translate-y-0.5",
            userVote === "down" && "fill-blue-500"
          )}
        />
      </button>
    </div>
  );
}
