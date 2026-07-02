"use client";

import { useState } from "react";
import {
  Sparkles,
  Camera,
  Bot,
  Type,
  CalendarClock,
  Wand2,
  Bell,
  Focus,
  BrainCircuit,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADVANCED_FEATURES = [
  { id: "ai-assist", icon: Bot, name: "AI Assist Content Generator", desc: "Auto-draft posts based on your recent activity." },
  { id: "ar-effects", icon: Camera, name: "AR Camera Effects", desc: "Immersive 3D environments and face filters." },
  { id: "3d-bitmoji", icon: Sparkles, name: "3D Bitmojis In Snaps", desc: "Volumetric avatar rendering in the camera view." },
  { id: "auto-captions", icon: Type, name: "Auto-Generated Captions", desc: "Live speech-to-text for all video uploads." },
  { id: "smart-queue", icon: CalendarClock, name: "Auto-Scheduling & Queue", desc: "Predictive posting times for maximum engagement." },
  { id: "dynamic-style", icon: Wand2, name: "Dynamic Text Stylizer", desc: "AI-driven typography that reacts to image content." },
];

const NOTIFICATION_FEATURES = [
  { id: "focus-mode", icon: Focus, name: "Focus Mode Feed Filters", desc: "Hide distractive posts during work hours." },
  { id: "context-pacing", icon: BrainCircuit, name: "Context-Aware Pacing", desc: "Batch notifications when you are busy." },
  { id: "sentiment-preview", icon: Bell, name: "Notification Sentiment", desc: "Pre-screen alerts for emotional tone." },
];

export function ContentFeedConsole() {
  const [activeFeatures, setActiveFeatures] = useState<Record<string, boolean>>({});

  const toggleFeature = (id: string) => {
    setActiveFeatures(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
      <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Advanced Creator Tools
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Manage experimental and AI-powered feed features (Batch 3).</p>
        </div>
      </div>

      <div className="p-4 grid gap-6">
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Content Creation</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {ADVANCED_FEATURES.map((feat) => {
              const Icon = feat.icon;
              const isActive = activeFeatures[feat.id];
              return (
                <div 
                  key={feat.id} 
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    isActive ? "bg-primary/5 border-primary/30" : "bg-background border-border hover:bg-muted/50"
                  )}
                  onClick={() => toggleFeature(feat.id)}
                >
                  <div className={cn("p-2 rounded-md", isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none mb-1">{feat.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{feat.desc}</p>
                  </div>
                  <div className="pt-1">
                    <div className={cn("w-8 h-4 rounded-full transition-colors relative", isActive ? "bg-primary" : "bg-muted-foreground/30")}>
                      <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform", isActive && "translate-x-4")} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Time Management</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {NOTIFICATION_FEATURES.map((feat) => {
              const Icon = feat.icon;
              const isActive = activeFeatures[feat.id];
              return (
                <div 
                  key={feat.id} 
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    isActive ? "bg-primary/5 border-primary/30" : "bg-background border-border hover:bg-muted/50"
                  )}
                  onClick={() => toggleFeature(feat.id)}
                >
                  <div className={cn("p-2 rounded-md", isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none mb-1">{feat.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{feat.desc}</p>
                  </div>
                  <div className="pt-1">
                    <div className={cn("w-8 h-4 rounded-full transition-colors relative", isActive ? "bg-primary" : "bg-muted-foreground/30")}>
                      <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform", isActive && "translate-x-4")} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
