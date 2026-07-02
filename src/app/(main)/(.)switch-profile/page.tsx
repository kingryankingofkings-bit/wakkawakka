"use client";

import { useRouter } from "next/navigation";
import { X, User } from "lucide-react";

export default function SwitchProfileIntercept() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6">
        <button
          onClick={() => router.back()}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
        
        <h2 className="text-xl font-bold mb-4">Switch Profile</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Select one of your profiles to switch contexts.
        </p>
        
        <div className="space-y-3">
          {/* Mocking profile list since we don't have the context setup completely yet */}
          {[1, 2, 3].map((i) => (
            <button
              key={i}
              onClick={() => router.back()}
              className="w-full flex items-center gap-4 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm">Profile {i}</div>
                <div className="text-xs text-muted-foreground">@username_{i}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
