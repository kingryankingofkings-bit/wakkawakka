"use client";

import { useState } from "react";
import {
  Sparkles,
  Waves,
  Brain,
  Video,
  Smile,
  _Mic,
  Fingerprint
} from "lucide-react";
import { cn } from "@/lib/utils";

const MESSAGING_INNOVATIONS = [
  { id: "holographic-chat", icon: Video, name: "Holographic Chat", desc: "Project 3D volumetric avatars into your physical space." },
  { id: "spatial-audio", icon: Waves, name: "Spatial Audio Engine", desc: "True 3D directional sound for group calls." },
  { id: "haptic-whispers", icon: Fingerprint, name: "Haptic Whispers", desc: "Translate emotional intent into tactile device feedback." },
  { id: "brain-to-text", icon: Brain, name: "Brain-to-Text Drafting", desc: "Neural interface integration for thought-based typing." },
  { id: "emotion-replies", icon: Smile, name: "Emotion-Based Smart Replies", desc: "AI analyzes voice tone to suggest empathetic responses." },
  { id: "ar-filters", icon: Sparkles, name: "AR Message Filters", desc: "Apply real-time world filters to video messages." },
];

export function MessagingFeaturesConsole() {
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
            Advanced Messaging Settings
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Manage experimental and XR messaging features (Batch 4).</p>
        </div>
      </div>

      <div className="p-4 grid gap-6">
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Next-Gen Communication</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {MESSAGING_INNOVATIONS.map((feat) => {
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
