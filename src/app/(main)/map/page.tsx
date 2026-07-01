"use client";

import { useState, useEffect } from "react";
import { useMapStore, FriendLocation } from "@/store/mapStore";
import { MapPin, Shield, ShieldOff, Navigation, Search, Info } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/authStore";

export default function SnapMapPage() {
  const { 
    friendsLocations, 
    isSharingLocation, 
    userLocation,
    fetchFriendsLocations,
    updateUserLocation
  } = useMapStore();
  const { user } = useAuthStore();
  const [selectedFriend, setSelectedFriend] = useState<FriendLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Map bounding coordinates for San Francisco mock viewport mapping
  const latMin = 37.7500;
  const latMax = 37.8000;
  const lngMin = -122.4600;
  const lngMax = -122.3800;

  useEffect(() => {
    if (!user?.id) return;

    fetchFriendsLocations(user.id);
    const interval = setInterval(() => {
      fetchFriendsLocations(user.id);
    }, 10000);

    if (navigator.geolocation && isSharingLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateUserLocation(
            user.id,
            position.coords.latitude,
            position.coords.longitude,
            isSharingLocation
          );
        },
        () => {
          updateUserLocation(user.id, 37.7749, -122.4194, isSharingLocation);
        }
      );
    } else {
      updateUserLocation(user.id, 37.7749, -122.4194, isSharingLocation);
    }

    return () => clearInterval(interval);
  }, [user?.id, isSharingLocation, fetchFriendsLocations, updateUserLocation]);

  const handleToggleSharing = () => {
    if (!user?.id) return;
    const nextSharing = !isSharingLocation;
    
    if (navigator.geolocation && nextSharing) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateUserLocation(
            user.id,
            position.coords.latitude,
            position.coords.longitude,
            nextSharing
          );
        },
        () => {
          updateUserLocation(user.id, 37.7749, -122.4194, nextSharing);
        }
      );
    } else {
      updateUserLocation(user.id, userLocation?.latitude || 37.7749, userLocation?.longitude || -122.4194, nextSharing);
    }
  };

  const handleRecenter = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user?.id) return;
    if (navigator.geolocation && isSharingLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateUserLocation(
            user.id,
            position.coords.latitude,
            position.coords.longitude,
            isSharingLocation
          );
        },
        () => {
          updateUserLocation(user.id, 37.7749, -122.4194, isSharingLocation);
        }
      );
    } else {
      updateUserLocation(user.id, 37.7749, -122.4194, isSharingLocation);
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!user?.id) return;
    
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest("svg")) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const pctX = clickX / rect.width;
    const pctY = 1 - (clickY / rect.height);
    
    const clickedLng = lngMin + pctX * (lngMax - lngMin);
    const clickedLat = latMin + pctY * (latMax - latMin);

    updateUserLocation(user.id, clickedLat, clickedLng, isSharingLocation);
  };

  const getCoordinates = (lat: number, lng: number) => {
    // Convert latitude and longitude to percentage-based X/Y coordinates
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const y = 100 - ((lat - latMin) / (latMax - latMin)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const filteredFriends = friendsLocations.filter(friend =>
    friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-[calc(100vh)] bg-neutral-950 text-white overflow-hidden">
      
      {/* Sidebar - Friend List & Search */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-900/50 backdrop-blur flex flex-col h-[40vh] md:h-full z-10">
        <div className="p-4 border-b border-neutral-800">
          <h1 className="text-xl font-bold tracking-tight mb-3 flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary fill-primary/20" />
            Snap Map
          </h1>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Find friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-800 text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary border border-neutral-700/50"
            />
          </div>
        </div>

        {/* Location Sharing Controller */}
        <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSharingLocation ? (
              <Shield className="h-4 w-4 text-emerald-400" />
            ) : (
              <ShieldOff className="h-4 w-4 text-neutral-500" />
            )}
            <span className="text-xs font-semibold text-neutral-300">Ghost Mode (Incognito)</span>
          </div>
          <button
            onClick={handleToggleSharing}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
              isSharingLocation 
                ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700" 
                : "bg-primary text-white hover:bg-primary/95"
            }`}
          >
            {isSharingLocation ? "Enable" : "Disable"}
          </button>
        </div>

        {/* Friend List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredFriends.map((friend) => {
            const isSelected = selectedFriend?.userId === friend.userId;
            return (
              <button
                key={friend.userId}
                onClick={() => setSelectedFriend(friend)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition ${
                  isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-neutral-800/60"
                }`}
              >
                <div className="relative">
                  <Avatar src={friend.avatar} name={friend.displayName} size="md" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-neutral-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{friend.displayName}</p>
                  <p className="text-xs text-neutral-400 truncate">@{friend.username}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map Visualization */}
      <div className="flex-1 relative bg-neutral-950 flex items-center justify-center p-4">
        
        {/* Mock Map Canvas / Vector Graphic */}
        <div 
          onClick={handleMapClick}
          className="relative w-full h-full max-w-4xl rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl bg-[#0f172a] cursor-crosshair"
        >
          
          {/* Custom Stylized Map Background (SVG street vectors) */}
          <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* San Francisco Bay Water Outline */}
            <path d="M 0 0 Q 300 200 450 150 T 800 250 L 800 0 Z" fill="#1e293b" opacity="0.5" />

            {/* Simulated Highways */}
            <path d="M 0 150 Q 350 400 800 300" fill="none" stroke="#475569" strokeWidth="4" />
            <path d="M 250 0 Q 300 500 400 800" fill="none" stroke="#475569" strokeWidth="4" />

            {/* Simulated Local Streets */}
            <path d="M 50 0 L 50 800" fill="none" stroke="#334155" strokeWidth="1" />
            <path d="M 150 0 L 150 800" fill="none" stroke="#334155" strokeWidth="1" />
            <path d="M 350 0 L 350 800" fill="none" stroke="#334155" strokeWidth="1" />
            <path d="M 550 0 L 550 800" fill="none" stroke="#334155" strokeWidth="1" />
            <path d="M 750 0 L 750 800" fill="none" stroke="#334155" strokeWidth="1" />

            <path d="M 0 100 L 800 100" fill="none" stroke="#334155" strokeWidth="1" />
            <path d="M 0 250 L 800 250" fill="none" stroke="#334155" strokeWidth="1" />
            <path d="M 0 450 L 800 450" fill="none" stroke="#334155" strokeWidth="1" />
            <path d="M 0 650 L 800 650" fill="none" stroke="#334155" strokeWidth="1" />

            {/* Parks / Green areas */}
            <rect x="100" y="300" width="200" height="80" rx="15" fill="#065f46" opacity="0.3" />
            <rect x="500" y="80" width="120" height="100" rx="15" fill="#065f46" opacity="0.3" />
          </svg>

          {/* Map Title Overlay */}
          <div className="absolute top-4 left-4 flex gap-2 z-20">
            <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 flex items-center gap-2 pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">San Francisco Live Feed</span>
            </div>
            <button 
              onClick={handleRecenter}
              className="bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-white p-2 rounded-2xl flex items-center justify-center transition pointer-events-auto"
              title="Recenter / Update Location"
            >
              <Navigation className="h-4 w-4" />
            </button>
          </div>

          {/* Plotting User Location */}
          {isSharingLocation && userLocation && (() => {
            const { x, y } = getCoordinates(userLocation.latitude, userLocation.longitude);
            return (
              <div 
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-20"
              >
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-sm group-hover:bg-primary/30 transition" />
                <div className="w-10 h-10 rounded-full border-2 border-primary bg-neutral-900 shadow-xl overflow-hidden relative">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=current" alt="You" className="w-full h-full object-cover" />
                </div>
                <div className="mt-1 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/10 text-[9px] font-bold tracking-wide uppercase text-primary">
                  You
                </div>
              </div>
            );
          })()}

          {/* Plotting Friends Locations */}
          {friendsLocations.map((friend) => {
            const { x, y } = getCoordinates(friend.latitude, friend.longitude);
            const isSelected = selectedFriend?.userId === friend.userId;

            return (
              <button
                key={friend.userId}
                onClick={() => setSelectedFriend(friend)}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10 transition-transform active:scale-95"
              >
                {/* Active marker ring */}
                <div className={`absolute -inset-3 rounded-full blur transition ${
                  isSelected ? "bg-primary/45" : "bg-transparent group-hover:bg-neutral-800/30"
                }`} />

                {/* Avatar Pin */}
                <div className={`w-11 h-11 rounded-full border-2 bg-neutral-900 shadow-2xl overflow-hidden relative transition ${
                  isSelected ? "border-primary scale-110" : "border-white/20 group-hover:border-white/50"
                }`}>
                  <img src={friend.avatar} alt={friend.displayName} className="w-full h-full object-cover" />
                </div>

                {/* Name tag */}
                <div className={`mt-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-bold transition shadow ${
                  isSelected 
                    ? "bg-primary text-white border-primary" 
                    : "bg-black/75 text-neutral-300 border-white/15 group-hover:text-white"
                }`}>
                  {friend.displayName.split(" ")[0]}
                </div>
              </button>
            );
          })}

          {/* Friend Detail Card Overlay */}
          {selectedFriend && (
            <div className="absolute bottom-4 left-4 right-4 bg-neutral-900/95 backdrop-blur border border-neutral-800 rounded-2xl p-4 shadow-2xl flex items-center justify-between animate-fade-in-up">
              <div className="flex items-center gap-3">
                <Avatar src={selectedFriend.avatar} name={selectedFriend.displayName} size="lg" />
                <div>
                  <h3 className="font-bold text-sm text-white">{selectedFriend.displayName}</h3>
                  <p className="text-xs text-neutral-400">@{selectedFriend.username}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3 w-3 text-red-500 fill-red-500" />
                    <span className="text-[10px] font-semibold text-neutral-300">
                      Coordinates: {selectedFriend.latitude.toFixed(4)}, {selectedFriend.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Online
                </span>
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="text-xs text-neutral-400 hover:text-white underline font-semibold mt-1"
                >
                  Close Pin
                </button>
              </div>
            </div>
          )}

          {/* Location Info Overlay */}
          {!selectedFriend && (
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 text-[10px] text-neutral-400 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-neutral-400" />
              Pins show friends in San Francisco. Click to zoom in on coordinates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
