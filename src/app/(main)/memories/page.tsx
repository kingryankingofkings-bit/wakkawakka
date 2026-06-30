"use client";

import { useEffect, useState } from "react";
import { 
  Clock, 
  Calendar, 
  Tag, 
  Trash2, 
  MapPin, 
  X, 
  Eye, 
  Info, 
  Camera 
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuthStore } from "@/store/authStore";

interface Memory {
  id: string;
  url: string;
  pipUrl?: string | null;
  mode: string;
  date: string;
  createdAt: string;
  location: string;
  tags: string[];
}

const MOCK_DEFAULT_MEMORIES: Memory[] = [
  {
    id: "mem-1",
    url: "https://picsum.photos/seed/sfmem1/1080/1920",
    pipUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=selfie1",
    mode: "BE_REAL",
    date: "2026-06-29",
    createdAt: "2026-06-29T18:32:00.000Z",
    location: "San Francisco, CA",
    tags: ["bereal", "goldengate"],
  },
  {
    id: "mem-2",
    url: "https://picsum.photos/seed/sfmem2/1080/1920",
    mode: "NORMAL",
    date: "2026-06-28",
    createdAt: "2026-06-28T22:15:00.000Z",
    location: "Silicon Valley",
    tags: ["smooth-skin", "neon-glow", "tech"],
  },
  {
    id: "mem-3",
    url: "https://picsum.photos/seed/sfmem3/1080/1920",
    mode: "DISAPPEARING",
    date: "2026-06-27",
    createdAt: "2026-06-27T10:04:00.000Z",
    location: "Oakland, CA",
    tags: ["dog-ears", "friends"],
  },
];

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null);
  const { user } = useAuthStore();

  // Initialize and load memories from backend API
  useEffect(() => {
    async function loadMemories() {
      try {
        const headers: Record<string, string> = {};
        if (user?.id) {
          headers["x-user-id"] = user.id;
        }
        const res = await fetch("/api/memories", { headers });
        if (res.ok) {
          const result = await res.json();
          setMemories(result.data || []);
        }
      } catch (err) {
        console.error("Failed to load memories:", err);
      }
    }
    loadMemories();
  }, [user?.id]);

  // Get all unique geofilter tags from saved memories
  const allTags = Array.from(
    new Set(memories.flatMap((m) => m.tags || []))
  );

  // Handle deleting a memory
  const handleDeleteMemory = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id;
      }
      const res = await fetch(`/api/memories/${id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        const updated = memories.filter((m) => m.id !== id);
        setMemories(updated);
        if (activeMemory?.id === id) {
          setActiveMemory(null);
        }
      } else {
        alert("Failed to delete memory");
      }
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  };

  // Format date helper with fallback
  const formatDateSafe = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "PPP");
    } catch {
      return dateStr;
    }
  };

  // Filtered Memories List
  const filteredMemories = memories.filter((memory) => {
    const matchesTag = selectedTag ? memory.tags?.includes(selectedTag) : true;
    const matchesDate = selectedDate ? memory.date === selectedDate : true;
    return matchesTag && matchesDate;
  });

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 bg-neutral-950/20 rounded-3xl min-h-screen text-white">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Memories Vault
          </h1>
          <p className="text-sm text-neutral-400">
            A secure archive of your stories, BeReals, and captured moments.
          </p>
        </div>
        <div className="text-xs bg-neutral-800/80 px-3 py-1.5 rounded-full border border-neutral-700/50 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-neutral-400" />
          <span>{memories.length} saved</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Date Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar className="h-4 w-4 text-neutral-400 flex-shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full md:w-44 bg-neutral-800 text-sm py-1.5 px-3 rounded-xl focus:outline-none border border-neutral-700/50 text-white"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="text-xs text-primary hover:underline font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tags filter carousel */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-hidden">
          <Tag className="h-4 w-4 text-neutral-400 flex-shrink-0" />
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition flex-shrink-0 ${
                selectedTag === null
                  ? "bg-primary border-primary text-white"
                  : "bg-neutral-800 border-neutral-700/50 text-neutral-400 hover:text-white"
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition flex-shrink-0 ${
                  selectedTag === tag
                    ? "bg-primary border-primary text-white"
                    : "bg-neutral-800 border-neutral-700/50 text-neutral-400 hover:text-white"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Grid of Memories */}
      {filteredMemories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-neutral-800 rounded-3xl p-6 bg-neutral-900/10">
          <Camera className="h-12 w-12 text-neutral-500 mb-3 animate-pulse" />
          <h3 className="font-semibold text-lg">No Memories Found</h3>
          <p className="text-sm text-neutral-400 max-w-xs mt-1">
            Try adjusting your search filters or start capturing new posts using the Camera tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredMemories.map((memory) => (
            <div
              key={memory.id}
              onClick={() => setActiveMemory(memory)}
              className="group aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-850 bg-neutral-900 relative shadow-md hover:shadow-primary/5 cursor-pointer transform hover:-translate-y-0.5 transition duration-200"
            >
              {/* Main Media Preview */}
              <img
                src={memory.url}
                alt="Memory"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
              />

              {/* BeReal overlay selfie */}
              {memory.mode === "BE_REAL" && memory.pipUrl && (
                <div className="absolute top-2 left-2 w-10 aspect-[3/4] rounded-lg overflow-hidden border border-white shadow-md bg-neutral-900 z-10">
                  <img
                    src={memory.pipUrl}
                    alt="Selfie"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Hover Overlay info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-end p-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-red-500" />
                    {memory.location.split(",")[0]}
                  </span>
                  <span>{memory.date}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] text-primary uppercase font-bold">
                    {memory.mode}
                  </span>
                  <button
                    onClick={(e) => handleDeleteMemory(memory.id, e)}
                    className="p-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition"
                    title="Delete Memory"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Memory detail view Modal */}
      {activeMemory && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {activeMemory.mode} Memory
                </span>
              </div>
              <button
                onClick={() => setActiveMemory(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Media Area */}
            <div className="relative aspect-[3/4] bg-neutral-950 flex items-center justify-center">
              <img
                src={activeMemory.url}
                alt="Captured Memory"
                className="w-full h-full object-cover"
              />

              {/* PIP selfie */}
              {activeMemory.mode === "BE_REAL" && activeMemory.pipUrl && (
                <div className="absolute top-4 left-4 w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 border-white shadow-2xl bg-neutral-900 z-10">
                  <img
                    src={activeMemory.pipUrl}
                    alt="Selfie"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Location Badge */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1 pointer-events-none z-10">
                <MapPin className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  {activeMemory.location}
                </span>
              </div>
            </div>

            {/* Meta details footer */}
            <div className="p-4 space-y-3 bg-neutral-900">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-200">
                  {formatDateSafe(activeMemory.createdAt)}
                </div>
                <button
                  onClick={() => handleDeleteMemory(activeMemory.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition text-xs font-bold"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-800">
                {activeMemory.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
