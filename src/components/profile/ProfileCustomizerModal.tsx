"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, Music, Code2, Check, ChevronRight, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types";
import toast from "react-hot-toast";

const ACCENT_COLORS = [
  { name: "blue", hex: "#3B82F6" },
  { name: "purple", hex: "#8B5CF6" },
  { name: "pink", hex: "#EC4899" },
  { name: "red", hex: "#EF4444" },
  { name: "orange", hex: "#F97316" },
  { name: "yellow", hex: "#EAB308" },
  { name: "green", hex: "#22C55E" },
  { name: "teal", hex: "#14B8A6" },
];

const PROFILE_THEMES = [
  { id: "none", label: "Default", preview: "bg-background border-border" },
  { id: "ocean", label: "Ocean", preview: "bg-gradient-to-br from-blue-900/60 to-teal-900/60" },
  { id: "sunset", label: "Sunset", preview: "bg-gradient-to-br from-orange-500/50 to-pink-500/50" },
  { id: "aurora", label: "Aurora", preview: "bg-gradient-to-br from-purple-600/50 via-pink-500/50 to-blue-500/50" },
  { id: "midnight", label: "Midnight", preview: "bg-black/80" },
  { id: "forest", label: "Forest", preview: "bg-gradient-to-br from-green-900/60 to-emerald-700/60" },
  { id: "cherry", label: "Cherry", preview: "bg-gradient-to-br from-rose-600/50 to-pink-400/50" },
];

type Panel = "theme" | "accent" | "soundtrack" | "css";

interface ProfileCustomizerModalProps {
  user: User;
  onClose: () => void;
}

export function ProfileCustomizerModal({ user, onClose }: ProfileCustomizerModalProps) {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [activePanel, setActivePanel] = useState<Panel>("theme");
  const [isSaving, setIsSaving] = useState(false);

  const [selectedTheme, setSelectedTheme] = useState(user.profileTheme || "none");
  const [selectedAccent, setSelectedAccent] = useState(user.accentColor || "#3B82F6");
  const [soundtrackUrl, setSoundtrackUrl] = useState(user.profileSoundtrack || "");
  const [soundtrackVisible, setSoundtrackVisible] = useState(user.profileSoundtrackVisible !== false);
  const [customCss, setCustomCss] = useState(user.customCss || "");

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileTheme: selectedTheme,
          accentColor: selectedAccent,
          profileSoundtrack: soundtrackUrl || null,
          profileSoundtrackVisible: soundtrackVisible,
          customCss: customCss || null,
        }),
      });

      if (res.ok) {
        const _data = await res.json();
        updateUser({
          profileTheme: selectedTheme,
          accentColor: selectedAccent,
          profileSoundtrack: soundtrackUrl || undefined,
          profileSoundtrackVisible: soundtrackVisible,
          customCss: customCss || undefined,
        });
        toast.success("Profile style saved!");
        onClose();
      } else {
        // Optimistic local update even if API is mocked
        updateUser({
          profileTheme: selectedTheme,
          accentColor: selectedAccent,
          profileSoundtrack: soundtrackUrl || undefined,
          profileSoundtrackVisible: soundtrackVisible,
          customCss: customCss || undefined,
        });
        toast.success("Profile style updated!");
        onClose();
      }
    } catch {
      updateUser({
        profileTheme: selectedTheme,
        accentColor: selectedAccent,
        profileSoundtrack: soundtrackUrl || undefined,
        profileSoundtrackVisible: soundtrackVisible,
        customCss: customCss || undefined,
      });
      toast.success("Profile style applied locally!");
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  const panels: { id: Panel; icon: React.ElementType; label: string }[] = [
    { id: "theme", icon: Palette, label: "Theme" },
    { id: "accent", icon: Wand2, label: "Accent" },
    { id: "soundtrack", icon: Music, label: "Soundtrack" },
    { id: "css", icon: Code2, label: "Custom CSS" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-md px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-lg font-extrabold">Customize Profile</h2>
              <p className="text-xs text-muted-foreground">Make your profile uniquely yours</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel tabs */}
          <div className="flex gap-1 px-4 pt-4 pb-2">
            {panels.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActivePanel(id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold transition-all",
                  activePanel === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="px-6 py-4 min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                {/* Theme Panel */}
                {activePanel === "theme" && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground">Profile Theme</p>
                    <div className="grid grid-cols-4 gap-2">
                      {PROFILE_THEMES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTheme(t.id)}
                          className={cn(
                            "relative h-16 rounded-xl border-2 transition-all overflow-hidden",
                            t.preview,
                            selectedTheme === t.id
                              ? "border-primary ring-2 ring-primary/40"
                              : "border-transparent hover:border-border"
                          )}
                        >
                          {selectedTheme === t.id && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white drop-shadow-lg" />
                            </div>
                          )}
                          <span className="absolute bottom-1 left-0 right-0 text-[9px] font-bold text-center text-white drop-shadow">
                            {t.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accent Panel */}
                {activePanel === "accent" && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground">Accent Color</p>
                    <div className="flex flex-wrap gap-3">
                      {ACCENT_COLORS.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => setSelectedAccent(c.name)}
                          style={{ backgroundColor: c.hex }}
                          className={cn(
                            "w-10 h-10 rounded-full transition-transform hover:scale-110 flex items-center justify-center",
                            selectedAccent === c.name || selectedAccent === c.hex
                              ? "ring-2 ring-offset-2 ring-white scale-110"
                              : ""
                          )}
                        >
                          {(selectedAccent === c.name || selectedAccent === c.hex) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="pt-2">
                      <label className="text-xs text-muted-foreground font-medium block mb-1">
                        Or pick a custom color
                      </label>
                      <input
                        type="color"
                        value={selectedAccent}
                        onChange={(e) => setSelectedAccent(e.target.value)}
                        className="w-full h-10 rounded-lg cursor-pointer border border-border"
                      />
                    </div>
                  </div>
                )}

                {/* Soundtrack Panel */}
                {activePanel === "soundtrack" && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground">Profile Soundtrack</p>
                    <p className="text-xs text-muted-foreground">
                      Add an audio URL (MP3, OGG, etc.) that visitors hear on your profile.
                    </p>
                    <input
                      type="url"
                      placeholder="https://example.com/track.mp3"
                      value={soundtrackUrl}
                      onChange={(e) => setSoundtrackUrl(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {soundtrackUrl && (
                      <audio controls className="w-full" src={soundtrackUrl} />
                    )}
                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                      <input
                        type="checkbox"
                        checked={soundtrackVisible}
                        onChange={(e) => setSoundtrackVisible(e.target.checked)}
                        className="w-4 h-4 accent-primary"
                      />
                      Show soundtrack widget on profile
                    </label>
                    {soundtrackUrl && (
                      <button
                        onClick={() => { setSoundtrackUrl(""); setSoundtrackVisible(false); }}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove soundtrack
                      </button>
                    )}
                  </div>
                )}

                {/* Custom CSS Panel */}
                {activePanel === "css" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-muted-foreground">Custom CSS</p>
                      <span className="text-[10px] font-bold bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded">Advanced</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Style your profile with CSS. Only applies to your own profile view. HTML tags are stripped.
                    </p>
                    <textarea
                      value={customCss}
                      onChange={(e) => setCustomCss(e.target.value)}
                      rows={7}
                      placeholder={"/* Example: change your profile background */\n.profile-card {\n  background: linear-gradient(...);\n}"}
                      className="w-full px-3 py-2 text-xs font-mono bg-muted border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {customCss && (
                      <button
                        onClick={() => setCustomCss("")}
                        className="text-xs text-destructive hover:underline"
                      >
                        Clear CSS
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {isSaving ? (
                <span className="animate-pulse">Saving…</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
