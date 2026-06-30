'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Sliders, Eye, Volume2, Layers, Languages, Calendar, Bell, FileText,
  CheckCircle2, XCircle, Plus, Trash2, Settings, Pin, VolumeX, Link2, Play, Square,
  Moon, Sun, Activity, ChevronLeft, ChevronRight, Mic, HelpCircle, RefreshCw, Crop,
  FileImage, Film, Check, Share2, Grid, Filter, Globe, Clock, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { batch3Items, Batch3Item } from './batch3Data';
import { Button } from '@/components/ui/Button';

// ----------------------------------------------------
// Mock Data for Simulators
// ----------------------------------------------------
const MOCK_SHARED_LINKS = [
  { id: 1, url: 'https://github.com/wakkawakka/app', title: 'Wakka Wakka Repo', sharedBy: 'Alice', chat: 'Dev Team', date: '2 hours ago' },
  { id: 2, url: 'https://figma.com/file/design-system', title: 'Main Figma Design File', sharedBy: 'Bob', chat: 'Design Studio', date: '5 hours ago' },
  { id: 3, url: 'https://youtube.com/watch?v=lofi-beats', title: 'Lofi Chill Study Beats', sharedBy: 'Charlie', chat: 'Music Lounge', date: '1 day ago' },
  { id: 4, url: 'https://stackoverflow.com/q/112233', title: 'React Suspense hydration error solution', sharedBy: 'Dave', chat: 'Dev Team', date: '2 days ago' },
  { id: 5, url: 'https://unsplash.com/photos/beautiful-mountains', title: 'Unsplash Mountain Asset', sharedBy: 'Eva', chat: 'Creative Club', date: '3 days ago' },
  { id: 6, url: 'https://medium.com/nextjs/app-router-tips', title: 'App Router Best Practices', sharedBy: 'Frank', chat: 'Dev Team', date: '4 days ago' },
];

const MOCK_POSTS_TRANSLATIONS = [
  {
    id: 'post-1',
    author: 'Jean Dupont',
    handle: 'jeand',
    lang: 'fr',
    original: "J'adore coder des applications avec Next.js et Tailwind CSS !",
    translation: "I love coding apps with Next.js and Tailwind CSS!",
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
  },
  {
    id: 'post-2',
    author: 'Maria Garcia',
    handle: 'mariag',
    lang: 'es',
    original: "¿Alguien quiere jugar a videojuegos esta noche con nosotros?",
    translation: "Anyone want to play video games tonight with us?",
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
  },
  {
    id: 'post-3',
    author: 'Hiroshi Tanaka',
    handle: 'hiroshit',
    lang: 'ja',
    original: "今日の天気がとてもいいですね。みんなで公園に散歩に行きましょう。",
    translation: "Today's weather is very nice. Let's go for a walk in the park together.",
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
  }
];

const TIME_TRAVEL_MOCK_CONTENT: Record<string, { title: string; desc: string; posts: Array<{ author: string; content: string; time: string }> }> = {
  '09:00 AM': {
    title: 'Morning Kickoff',
    desc: 'Waking up, morning coffee reviews, and daily updates.',
    posts: [
      { author: 'Coffee Lover', content: 'Rise and shine! Double espresso to start the sprint. ☕⚡ #grind', time: '09:02 AM' },
      { author: 'Daily Brief', content: 'Good morning! Today we focus on UI polish and foley sound simulations. #milestone4', time: '09:15 AM' }
    ]
  },
  '02:00 PM': {
    title: 'Mid-day Rush',
    desc: 'Peak development hours, hackathons, and lunch sharing.',
    posts: [
      { author: 'Foodie Code', content: 'Lunch hour pizza party at the lounge. Yes, pineapple is on one of them. 🍕🍍', time: '02:05 PM' },
      { author: 'Dev Ops', content: 'Main build pipeline is green! Deploying tests. 🚀 #ci-cd', time: '02:30 PM' }
    ]
  },
  '06:00 PM': {
    title: 'Sunset & Chill',
    desc: 'Wrapping up work, evening commute, and sunset posts.',
    posts: [
      { author: 'Sky Watcher', content: 'Stunning sunset over the office windows tonight. Nature is beautiful. 🌇✨', time: '06:10 PM' },
      { author: 'Hobbyist', content: 'Finally clocking out. Time to head to the gym! 🏋️‍♂️', time: '06:45 PM' }
    ]
  },
  '11:00 PM': {
    title: 'Night Owl Lounge',
    desc: 'Gaming streams, coding under moonlight, and sleep music.',
    posts: [
      { author: 'Cyber Nerd', content: 'Staring at a bug for 3 hours, then realizing I put a semicolon where a comma belonged... 🦉💡', time: '11:05 PM' },
      { author: 'Sleep Vibes', content: 'Listening to lofi rain sounds to wind down. Peaceful night everyone. 🌧️💤', time: '11:30 PM' }
    ]
  }
};

const MOCK_CHANNELS = {
  'Technology': ['#nextjs-devs', '#rust-lang', '#ai-agents', '#web-audio'],
  'Gaming': ['#valorant-clips', '#cozy-gaming', '#retro-arcade', '#speedrunning'],
  'Lifestyle': ['#daily-vlogs', '#travel-hacks', '#wellness-club', '#recipes'],
  'Creative': ['#ui-ux-design', '#photography-tips', '#foley-artists', '#gif-makers'],
  'Music': ['#lofi-vibes', '#synthwave-retro', '#acoustic-covers', '#vocal-isolation']
};

const MOCK_SPEECH_OPTIONS = [
  'find the latest coding streams',
  'show cat memes in group chat',
  'search for lofi study beats'
];

const MOCK_SPEECH_RESULTS: Record<string, string[]> = {
  'find the latest coding streams': ['stream_react_tips.mp4', 'nextjs_tutorial.mov', 'typescript_best_practices.mp4'],
  'show cat memes in group chat': ['cat_surprise.gif', 'sleeping_kitten.png', 'nyan_cat_loop.mp4'],
  'search for lofi study beats': ['lofi_wind_down.mp3', 'chill_coding_session.wav', 'rainy_night_piano.mp3']
};

const MOCK_NOTIFICATIONS = [
  { id: 1, text: "Direct message from Alice: 'Hey, are we still meeting?'", priority: "Urgent", type: "chat" },
  { id: 2, text: "Bob liked your story", priority: "Low", type: "activity" },
  { id: 3, text: "System Alert: Server maintenance in 15 minutes", priority: "High", type: "system" },
  { id: 4, text: "Channel #nextjs-devs: 'Check out the new compiler update!'", priority: "Medium", type: "channel" },
  { id: 5, text: "Charlie shared a link in Designers chat", priority: "Low", type: "chat" },
  { id: 6, text: "Urgent Security Warning: New login from unrecognized device", priority: "Urgent", type: "system" }
];

export function ContentFeedConsole() {
  // Navigation tabs
  const [activeConsoleTab, setActiveConsoleTab] = useState<'catalog' | 'simulators'>('catalog');

  // Catalog State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Feature' | 'Innovation'>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Active Simulator Selection
  const [activeSim, setActiveSim] = useState<string>('Dynamic Text Stylizer');

  // ----------------------------------------------------
  // Simulator States
  // ----------------------------------------------------
  
  // 1. Dynamic Text Stylizer
  const [stylizerText, setStylizerText] = useState('Wakka Wakka!');
  const [stylizerFont, setStylizerFont] = useState('font-sans');
  const [stylizerColor, setStylizerColor] = useState('text-primary');
  const [stylizerMotion, setStylizerMotion] = useState<'none' | 'bounce' | 'spin' | 'shake' | 'pulse'>('none');

  // 2. Auto-Cropping Canvas
  const [cropRatio, setCropRatio] = useState<'1:1' | '4:5' | '16:9' | '9:16' | '2:3'>('1:1');
  const [cropPlaceholderIndex, setCropPlaceholderIndex] = useState(0);
  const placeholderGradients = [
    'from-pink-500 to-rose-500',
    'from-amber-400 to-orange-600',
    'from-emerald-400 to-teal-700',
    'from-blue-500 to-indigo-600',
    'from-fuchsia-600 to-purple-800'
  ];

  // 3. GIF Designer
  const [gifStartFrame, setGifStartFrame] = useState(10);
  const [gifEndFrame, setGifEndFrame] = useState(70);
  const [gifCaption, setGifCaption] = useState('My Awesome Loop');
  const [gifExporting, setGifExporting] = useState(false);
  const [gifPreviewUrl, setGifPreviewUrl] = useState<string | null>(null);

  // 4. Interest-Based Channels
  const [selectedTopic, setSelectedTopic] = useState('Technology');
  const [joinedChannels, setJoinedChannels] = useState<Set<string>>(new Set(['#nextjs-devs']));

  // 5. Voice-to-Text Search
  const [voiceQueryText, setVoiceQueryText] = useState('');
  const [voiceIsRecording, setVoiceIsRecording] = useState(false);
  const [voiceSearchResults, setVoiceSearchResults] = useState<string[]>([]);

  // 6. Shared Links Library
  const [linkSearchQuery, setLinkSearchQuery] = useState('');

  // 7. Chat Pinning Matrix
  const [pinnedSlots, setPinnedSlots] = useState<Record<number, string>>({
    1: 'Alice',
    2: 'Dev Team',
    5: 'Lofi Music Room'
  });
  const [selectedChatToPin, setSelectedChatToPin] = useState<string>('');
  const [activePinningSlot, setActivePinningSlot] = useState<number | null>(null);
  const chatOptions = ['Alice', 'Bob', 'Charlie', 'Dev Team', 'Designers', 'Family Group', 'Gaming Buddies', 'Announcements', 'Lofi Music Room'];

  // 8. Inline Translation
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const [targetTranslationLang, setTargetTranslationLang] = useState('English');

  // 9. Time-Travel Feed
  const [timeTravelHour, setTimeTravelHour] = useState('09:00 AM');
  const timeTravelHours = ['09:00 AM', '02:00 PM', '06:00 PM', '11:00 PM'];

  // 10. Holographic Depth Mapper
  const [holographicTilt, setHolographicTilt] = useState({ x: 0, y: 0 });

  // 11. Generative Voice-to-Foley
  const [foleyInput, setFoleyInput] = useState('rain');
  const [foleyGenerating, setFoleyGenerating] = useState(false);
  const [foleyGeneratedSound, setFoleyGeneratedSound] = useState<string | null>(null);
  const [foleyPlaying, setFoleyPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  // 12. Notifications Filter
  const [dndEnabled, setDndEnabled] = useState(false);
  const [priorityThreshold, setPriorityThreshold] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Low');

  // ----------------------------------------------------
  // Catalog Calculations
  // ----------------------------------------------------
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    batch3Items.forEach(item => cats.add(item.category));
    return ['All', ...Array.from(cats)];
  }, []);

  const filteredItems = useMemo(() => {
    return batch3Items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'All' ? true : item.type === typeFilter;
      const matchesCategory = categoryFilter === 'All' ? true : item.category === categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [searchQuery, typeFilter, categoryFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, categoryFilter, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // ----------------------------------------------------
  // Interactive Simulators Logic
  // ----------------------------------------------------

  // 3. GIF Designer Export Handler
  const handleGifExport = () => {
    setGifExporting(true);
    setGifPreviewUrl(null);
    setTimeout(() => {
      setGifExporting(false);
      setGifPreviewUrl('loaded');
    }, 1500);
  };

  // 5. Voice search simulator
  const handleSimulateVoice = (phrase: string) => {
    setVoiceIsRecording(true);
    setVoiceQueryText('');
    setVoiceSearchResults([]);
    setTimeout(() => {
      setVoiceIsRecording(false);
      setVoiceQueryText(phrase);
      setVoiceSearchResults(MOCK_SPEECH_RESULTS[phrase] || []);
    }, 2000);
  };

  // 7. Chat Pinning Matrix Assignment
  const handlePinChat = (chatName: string) => {
    if (activePinningSlot !== null) {
      // If conversation is already pinned in another slot, unpin it first
      const updated = { ...pinnedSlots };
      Object.keys(updated).forEach(k => {
        const keyNum = parseInt(k, 10);
        if (updated[keyNum] === chatName) {
          delete updated[keyNum];
        }
      });
      updated[activePinningSlot] = chatName;
      setPinnedSlots(updated);
      setSelectedChatToPin('');
      setActivePinningSlot(null);
    }
  };

  const handleClearPin = (slot: number) => {
    const updated = { ...pinnedSlots };
    delete updated[slot];
    setPinnedSlots(updated);
  };

  // 10. Holographic Tilt Handlers
  const handleHoloMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 2 - 1; // -1 to 1
    const py = (y / rect.height) * 2 - 1; // -1 to 1
    setHolographicTilt({ x: px * 18, y: -py * 18 });
  };

  const handleHoloMouseLeave = () => {
    setHolographicTilt({ x: 0, y: 0 });
  };

  // 11. Foley Generator Synthesis using Web Audio API
  const generateFoley = () => {
    setFoleyGenerating(true);
    setFoleyGeneratedSound(null);
    setFoleyPlaying(false);
    setTimeout(() => {
      setFoleyGenerating(false);
      setFoleyGeneratedSound(foleyInput.toLowerCase().trim() || 'rain');
    }, 1200);
  };

  const stopFoleySound = () => {
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    setFoleyPlaying(false);
  };

  const playFoleySound = (soundName: string) => {
    if (foleyPlaying) {
      stopFoleySound();
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        setFoleyPlaying(true);
        // Fallback simulated playing state
        setTimeout(() => setFoleyPlaying(false), 2000);
        return;
      }

      const ctx = audioContextRef.current || new AudioContextClass();
      audioContextRef.current = ctx;

      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      setFoleyPlaying(true);

      if (soundName === 'rain' || soundName === 'leaves' || soundName === 'rustling leaves') {
        const bufferSize = ctx.sampleRate * 2.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = soundName.includes('leaves') ? 'bandpass' : 'lowpass';
        filter.frequency.setValueAtTime(soundName.includes('leaves') ? 1400 : 700, ctx.currentTime);

        source.connect(filter);
        filter.connect(gain);

        source.start();
        activeSourcesRef.current.push(source);

        // Modulate leaves volume to simulate wind gusts
        if (soundName.includes('leaves')) {
          let time = ctx.currentTime;
          gain.gain.setValueAtTime(0.02, time);
          for (let offset = 0.2; offset < 2.5; offset += 0.4) {
            gain.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.05, time + offset);
            gain.gain.linearRampToValueAtTime(0.02, time + offset + 0.2);
          }
        }

        setTimeout(() => {
          stopFoleySound();
        }, 2500);

      } else if (soundName.includes('laser') || soundName.includes('zap') || soundName.includes('sci-fi')) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.start();
        activeSourcesRef.current.push(osc as any); // cast for storage list

        setTimeout(() => {
          stopFoleySound();
        }, 600);

      } else if (soundName.includes('wave') || soundName.includes('ocean') || soundName.includes('sea')) {
        const bufferSize = ctx.sampleRate * 3.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, ctx.currentTime);

        source.connect(filter);
        filter.connect(gain);

        gain.gain.setValueAtTime(0.005, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.2);
        gain.gain.linearRampToValueAtTime(0.005, ctx.currentTime + 2.8);

        source.start();
        activeSourcesRef.current.push(source);

        setTimeout(() => {
          stopFoleySound();
        }, 3000);
      } else {
        // Simple synthetic ping foley
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.start();
        activeSourcesRef.current.push(osc as any);

        setTimeout(() => {
          stopFoleySound();
        }, 500);
      }

    } catch (e) {
      console.warn("Audio failure", e);
      setFoleyPlaying(true);
      setTimeout(() => setFoleyPlaying(false), 2000);
    }
  };

  useEffect(() => {
    return () => {
      // Stop foley on unmount
      activeSourcesRef.current.forEach(source => {
        try {
          source.stop();
        } catch (e) {}
      });
    };
  }, []);

  // 12. Notifications Filter calculations
  const priorityLevels = ['Low', 'Medium', 'High', 'Urgent'];
  const isNotificationAllowed = (notifPriority: string) => {
    if (dndEnabled) return false;
    const thresholdIdx = priorityLevels.indexOf(priorityThreshold);
    const notifIdx = priorityLevels.indexOf(notifPriority);
    return notifIdx >= thresholdIdx;
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-background text-foreground">
      {/* Console Subheader Switcher */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
          <span className="font-extrabold text-base tracking-tight uppercase">Batch 3 Feed & Discovery Console</span>
        </div>
        <div className="flex bg-muted p-1 rounded-full border border-border">
          <button
            onClick={() => setActiveConsoleTab('catalog')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeConsoleTab === 'catalog'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Catalog ({batch3Items.length})
            </span>
          </button>
          <button
            onClick={() => setActiveConsoleTab('simulators')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeConsoleTab === 'simulators'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5" />
              Interactive Simulators (12)
            </span>
          </button>
        </div>
      </div>

      {/* Main Console Content */}
      <div className="flex-1 overflow-hidden">
        {activeConsoleTab === 'catalog' ? (
          /* TAB 1: SEARCHABLE PAGINATED CATALOG */
          <div className="flex flex-col h-full p-6 space-y-4 overflow-y-auto">
            {/* Filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Search Catalog</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-sm bg-muted border border-border rounded-xl px-3 py-2 pl-9 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Filter by Type</label>
                <div className="flex bg-muted p-1 rounded-xl border border-border">
                  {(['All', 'Feature', 'Innovation'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                        typeFilter === t
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Filter by Category</label>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full text-sm bg-muted border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Catalog list / table */}
            <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-inner">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-muted/80 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Feature Name</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground">
                    {paginatedItems.map(item => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-primary">{item.id}</td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.type === 'Feature'
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-muted-foreground">{item.category}</td>
                        <td className="px-6 py-3.5 font-medium">{item.name}</td>
                        <td className="px-6 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Implemented
                          </span>
                        </td>
                      </tr>
                    ))}
                    {paginatedItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <HelpCircle className="h-8 w-8 text-muted-foreground/60" />
                            <p>No features found matching the filters.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="mt-auto border-t border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Showing <span className="font-bold text-foreground">{filteredItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
                  <span className="font-bold text-foreground">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> of{' '}
                  <span className="font-bold text-foreground">{filteredItems.length}</span> entries
                </span>
                
                <div className="flex items-center gap-4">
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={e => setItemsPerPage(Number(e.target.value))}
                      className="bg-muted border border-border text-xs rounded-lg px-2 py-1 text-foreground focus:outline-none"
                    >
                      {[10, 20, 50].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 !p-0 rounded-lg"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      // Display a subset of pages if totalPages is large
                      if (totalPages > 5 && Math.abs(currentPage - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                        if (pageNum === 2 || pageNum === totalPages - 1) {
                          return <span key={pageNum} className="px-1 text-muted-foreground text-xs">...</span>;
                        }
                        return null;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-8 w-8 !p-0 rounded-lg text-xs font-bold`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 !p-0 rounded-lg"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: INTERACTIVE SIMULATORS SIDEBAR LAYOUT */
          <div className="flex h-full overflow-hidden">
            {/* Simulator list sidebar */}
            <div className="w-64 border-r border-border bg-muted/20 flex flex-col overflow-y-auto">
              <div className="p-4 border-b border-border bg-muted/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Simulation</span>
              </div>
              <div className="p-2 space-y-1">
                {[
                  'Dynamic Text Stylizer',
                  'Auto-Cropping Canvas',
                  'In-app GIF Designer',
                  'Interest-Based Channels Discovery',
                  'Voice-to-Text Search',
                  'Shared Links Library',
                  'Chat Pinning Matrix',
                  'Inline Translation Selector',
                  'Time-Travel Feed Slider',
                  'Holographic Depth Mapper',
                  'Generative Voice-to-Foley',
                  'Notifications Filter'
                ].map(sim => (
                  <button
                    key={sim}
                    onClick={() => {
                      setActiveSim(sim);
                      // Reset relevant states
                      stopFoleySound();
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeSim === sim
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {sim}
                  </button>
                ))}
              </div>
            </div>

            {/* Active simulator display panel */}
            <div className="flex-1 p-6 overflow-y-auto bg-card">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="border-b border-border pb-3">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-primary" />
                    {activeSim}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Interactive simulation module demonstrating Batch 3 capabilities.</p>
                </div>

                {/* SIMULATOR: 1. Dynamic Text Stylizer */}
                {activeSim === 'Dynamic Text Stylizer' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground">Input Text</label>
                        <input
                          type="text"
                          value={stylizerText}
                          onChange={e => setStylizerText(e.target.value)}
                          className="w-full text-sm bg-muted border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          placeholder="Type something stylized..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground">Select Font</label>
                        <select
                          value={stylizerFont}
                          onChange={e => setStylizerFont(e.target.value)}
                          className="w-full text-sm bg-muted border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        >
                          <option value="font-sans">Standard Sans-Serif</option>
                          <option value="font-serif">Elegant Serif</option>
                          <option value="font-mono">Code Monospace</option>
                          <option value="italic tracking-widest font-light">Stylish Wide Italic</option>
                          <option value="font-extrabold tracking-tighter uppercase">Impact Bold</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground">Choose Color Style</label>
                        <div className="flex gap-2">
                          {[
                            { name: 'Primary Purple', class: 'text-primary' },
                            { name: 'Coral Red', class: 'text-rose-500' },
                            { name: 'Emerald', class: 'text-emerald-500' },
                            { name: 'Sky Blue', class: 'text-sky-500' },
                            { name: 'Sunset Gradient', class: 'bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent font-bold' }
                          ].map(color => (
                            <button
                              key={color.class}
                              onClick={() => setStylizerColor(color.class)}
                              className={`h-8 px-3 rounded-lg text-xs font-semibold border ${
                                stylizerColor === color.class
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {color.name.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground">Kinetic Motion Type</label>
                        <div className="grid grid-cols-5 gap-1 bg-muted p-1 rounded-xl border border-border">
                          {(['none', 'bounce', 'spin', 'shake', 'pulse'] as const).map(motion => (
                            <button
                              key={motion}
                              onClick={() => setStylizerMotion(motion)}
                              className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                stylizerMotion === motion
                                  ? 'bg-card text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {motion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Preview box */}
                    <div className="mt-6 border border-border rounded-2xl bg-muted/40 p-12 flex items-center justify-center min-h-[160px] overflow-hidden shadow-inner">
                      <motion.div
                        className={`${stylizerFont} ${stylizerColor} text-3xl text-center`}
                        animate={
                          stylizerMotion === 'bounce' ? { y: [0, -15, 0] } :
                          stylizerMotion === 'spin' ? { rotate: 360 } :
                          stylizerMotion === 'shake' ? { x: [-3, 3, -3, 3, 0] } :
                          stylizerMotion === 'pulse' ? { scale: [1, 1.08, 1] } : {}
                        }
                        transition={
                          stylizerMotion !== 'none' ? {
                            repeat: Infinity,
                            duration: stylizerMotion === 'spin' ? 3 : stylizerMotion === 'shake' ? 0.4 : 0.8,
                            ease: stylizerMotion === 'spin' ? 'linear' : 'easeInOut'
                          } : undefined
                        }
                      >
                        {stylizerText || "No text inputted"}
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* SIMULATOR: 2. Auto-Cropping Canvas */}
                {activeSim === 'Auto-Cropping Canvas' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">Aspect Ratio Template</label>
                        <div className="flex gap-1 bg-muted p-1 rounded-xl border border-border">
                          {(['1:1', '4:5', '16:9', '9:16', '2:3'] as const).map(ratio => (
                            <button
                              key={ratio}
                              onClick={() => setCropRatio(ratio)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                cropRatio === ratio
                                  ? 'bg-card text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {ratio}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1 text-right">
                        <label className="text-xs font-bold text-muted-foreground block">Select Placeholder Image</label>
                        <div className="flex gap-1.5 justify-end">
                          {placeholderGradients.map((g, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCropPlaceholderIndex(idx)}
                              className={`h-6 w-6 rounded-full bg-gradient-to-tr ${g} border-2 ${
                                cropPlaceholderIndex === idx ? 'border-foreground' : 'border-transparent'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {/* Left: Original with Highlight Overlay */}
                      <div className="border border-border bg-muted/20 p-4 rounded-2xl space-y-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          Original Canvas & Crop Safe Zone
                        </span>
                        <div className="relative aspect-video rounded-xl bg-card border border-border overflow-hidden flex items-center justify-center">
                          <div className={`absolute inset-0 bg-gradient-to-tr ${placeholderGradients[cropPlaceholderIndex]} opacity-80`} />
                          <span className="absolute text-[10px] text-white/70 font-semibold uppercase tracking-wider">Original: 16:9 Landscape</span>
                          
                          {/* Simulated Crop Safe Box */}
                          <div
                            className="absolute border-2 border-white border-dashed bg-white/10 transition-all duration-300 flex items-center justify-center"
                            style={{
                              width: cropRatio === '1:1' ? '50%' :
                                     cropRatio === '4:5' ? '40%' :
                                     cropRatio === '16:9' ? '90%' :
                                     cropRatio === '9:16' ? '30%' : '35%',
                              height: cropRatio === '1:1' ? '88%' :
                                      cropRatio === '4:5' ? '90%' :
                                      cropRatio === '16:9' ? '90%' :
                                      cropRatio === '9:16' ? '95%' : '90%',
                            }}
                          >
                            <span className="text-[10px] text-white font-bold bg-black/60 px-2 py-0.5 rounded-full">{cropRatio} crop</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Cropped Result */}
                      <div className="border border-border bg-muted/20 p-4 rounded-2xl space-y-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <Crop className="h-3.5 w-3.5" />
                          Cropped Canvas Output
                        </span>
                        <div className="flex items-center justify-center bg-card border border-border rounded-xl p-4 min-h-[170px]">
                          <div
                            className={`bg-gradient-to-tr ${placeholderGradients[cropPlaceholderIndex]} transition-all duration-300 rounded-lg flex items-center justify-center relative shadow-md`}
                            style={{
                              aspectRatio: cropRatio === '1:1' ? '1/1' :
                                           cropRatio === '4:5' ? '4/5' :
                                           cropRatio === '16:9' ? '16/9' :
                                           cropRatio === '9:16' ? '9/16' : '2/3',
                              height: '140px',
                            }}
                          >
                            <span className="text-[10px] font-bold text-white uppercase bg-black/50 px-2 py-1 rounded-md">
                              {cropRatio} Ready
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SIMULATOR: 3. In-app GIF Designer */}
                {activeSim === 'In-app GIF Designer' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-muted-foreground">Start Frame (Loop Start)</span>
                            <span className="font-bold font-mono text-primary">{gifStartFrame}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={gifStartFrame}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setGifStartFrame(val);
                              if (val >= gifEndFrame) setGifEndFrame(Math.min(val + 10, 100));
                            }}
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-muted-foreground">End Frame (Loop End)</span>
                            <span className="font-bold font-mono text-primary">{gifEndFrame}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={gifEndFrame}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setGifEndFrame(val);
                              if (val <= gifStartFrame) setGifStartFrame(Math.max(val - 10, 0));
                            }}
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground">GIF Overlay Caption</label>
                        <input
                          type="text"
                          value={gifCaption}
                          onChange={e => setGifCaption(e.target.value)}
                          className="w-full text-sm bg-muted border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          placeholder="GIF text..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-center mt-2">
                      <Button
                        onClick={handleGifExport}
                        isLoading={gifExporting}
                        className="px-6 text-xs"
                      >
                        <Film className="h-3.5 w-3.5" />
                        Export Animated GIF Preview
                      </Button>
                    </div>

                    {/* GIF Preview Screen */}
                    <div className="mt-4 border border-border bg-muted/40 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[180px] text-center">
                      {gifExporting ? (
                        <div className="space-y-2 text-center">
                          <RefreshCw className="h-6 w-6 text-primary animate-spin mx-auto" />
                          <p className="text-xs font-bold text-muted-foreground">Compiling keyframes [{gifStartFrame} - {gifEndFrame}]...</p>
                        </div>
                      ) : gifPreviewUrl ? (
                        <div className="space-y-3 w-full max-w-sm">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 flex items-center gap-1 justify-center">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Loop Compiled Successfully
                          </span>
                          <div className="relative aspect-video rounded-xl border border-border overflow-hidden bg-black flex items-center justify-center">
                            {/* Animated colored bar cycling to mimic video loop */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900"
                              animate={{ opacity: [0.6, 0.9, 0.6] }}
                              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                            />
                            
                            {/* Looping pulse animation block */}
                            <motion.div
                              className="w-16 h-16 rounded-full bg-white/20"
                              animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
                              transition={{ repeat: Infinity, duration: 2.0, ease: "linear" }}
                            />

                            {/* Caption Overlay */}
                            <div className="absolute bottom-4 left-4 right-4 text-center">
                              <span className="bg-black/80 text-white font-bold uppercase tracking-wider text-xs px-2.5 py-1 rounded shadow-md border border-white/10 select-none">
                                {gifCaption || "No Caption"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground space-y-1">
                          <HelpCircle className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                          <p className="text-xs">Adjust frames, add a caption, and export to preview the looping GIF.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SIMULATOR: 4. Interest-Based Channels Discovery */}
                {activeSim === 'Interest-Based Channels Discovery' && (
                  <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {Object.keys(MOCK_CHANNELS).map(topic => (
                        <button
                          key={topic}
                          onClick={() => setSelectedTopic(topic)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                            selectedTopic === topic
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-card border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>

                    <div className="bg-muted/40 border border-border rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-border">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Matching Channels for {selectedTopic}</span>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                          {joinedChannels.size} Joined
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {MOCK_CHANNELS[selectedTopic as keyof typeof MOCK_CHANNELS]?.map((chan: string) => {
                          const isJoined = joinedChannels.has(chan);
                          return (
                            <div key={chan} className="bg-card border border-border p-3 rounded-xl flex items-center justify-between hover:shadow-sm transition-shadow">
                              <span className="text-xs font-mono font-bold text-foreground">{chan}</span>
                              <Button
                                size="xs"
                                variant={isJoined ? 'outline' : 'primary'}
                                onClick={() => {
                                  setJoinedChannels(prev => {
                                    const next = new Set(prev);
                                    if (next.has(chan)) next.delete(chan);
                                    else next.add(chan);
                                    return next;
                                  });
                                }}
                                className="h-7 text-[10px]"
                              >
                                {isJoined ? (
                                  <span className="flex items-center gap-1 text-emerald-500">
                                    <Check className="h-3 w-3" /> Joined
                                  </span>
                                ) : (
                                  "Join Channel"
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* SIMULATOR: 5. Voice-to-Text Search */}
                {activeSim === 'Voice-to-Text Search' && (
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-muted-foreground block">Simulate vocal query: select a speech option below</span>
                    <div className="flex flex-col gap-2">
                      {MOCK_SPEECH_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleSimulateVoice(opt)}
                          disabled={voiceIsRecording}
                          className="w-full text-left bg-card hover:bg-muted border border-border px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold transition-all hover:translate-x-1"
                        >
                          <span className="text-foreground">&quot;{opt}&quot;</span>
                          <span className="text-primary flex items-center gap-1 text-[10px] uppercase font-bold">
                            <Mic className="h-3 w-3" /> Click to Speak
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-6 border border-border bg-muted/40 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[160px]">
                      {voiceIsRecording ? (
                        <div className="space-y-3 text-center">
                          <div className="flex justify-center gap-1 h-8 items-center">
                            {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                              <motion.div
                                key={i}
                                className="w-1 bg-primary rounded"
                                animate={{ height: [10, h * 6, 10] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.05 }}
                              />
                            ))}
                          </div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Listening to voice input...</p>
                        </div>
                      ) : voiceQueryText ? (
                        <div className="w-full space-y-4">
                          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 p-3 rounded-xl">
                            <Mic className="h-4 w-4 text-primary" />
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">Transcribed Query</span>
                              <p className="text-sm font-semibold text-foreground italic">&quot;{voiceQueryText}&quot;</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Matched Database Files</span>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {voiceSearchResults.map(res => (
                                <div key={res} className="bg-card border border-border p-2.5 rounded-lg flex items-center gap-2">
                                  {res.endsWith('.mp3') || res.endsWith('.wav') ? (
                                    <Volume2 className="h-4 w-4 text-amber-500" />
                                  ) : res.endsWith('.mp4') || res.endsWith('.mov') ? (
                                    <Film className="h-4 w-4 text-blue-500" />
                                  ) : (
                                    <FileImage className="h-4 w-4 text-emerald-500" />
                                  )}
                                  <span className="text-xs font-mono truncate text-foreground">{res}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground space-y-1 text-center">
                          <Mic className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                          <p className="text-xs">Click one of the mock speech options above to transcribe vocal query.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SIMULATOR: 6. Shared Links Library */}
                {activeSim === 'Shared Links Library' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search shared domain links (e.g. github, figma)..."
                        value={linkSearchQuery}
                        onChange={e => setLinkSearchQuery(e.target.value)}
                        className="w-full text-sm bg-muted border border-border rounded-xl px-3 py-2 pl-9 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="bg-muted/40 border border-border rounded-2xl p-4 space-y-2 max-h-[300px] overflow-y-auto">
                      {MOCK_SHARED_LINKS.filter(l =>
                        l.title.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
                        l.url.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
                        l.chat.toLowerCase().includes(linkSearchQuery.toLowerCase())
                      ).map(link => (
                        <div key={link.id} className="bg-card border border-border p-3.5 rounded-xl flex items-start justify-between hover:shadow-sm transition-shadow">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-foreground block hover:underline cursor-pointer">
                              {link.title}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground block truncate max-w-sm">
                              {link.url}
                            </span>
                            <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                              <span>Shared by <span className="font-bold">{link.sharedBy}</span></span>
                              <span>•</span>
                              <span>In <span className="font-bold text-primary">{link.chat}</span></span>
                              <span>•</span>
                              <span>{link.date}</span>
                            </div>
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Link2 className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SIMULATOR: 7. Chat Pinning Matrix */}
                {activeSim === 'Chat Pinning Matrix' && (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">Select a grid slot and choose a conversation to pin to that slot.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Grid Matrix */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">9-Slot Grid</span>
                        <div className="grid grid-cols-3 gap-2.5 bg-muted/40 p-4 border border-border rounded-2xl">
                          {Array.from({ length: 9 }).map((_, idx) => {
                            const slotNum = idx + 1;
                            const pinnedChat = pinnedSlots[slotNum];
                            const isSelected = activePinningSlot === slotNum;

                            return (
                              <button
                                key={slotNum}
                                onClick={() => {
                                  setActivePinningSlot(slotNum);
                                }}
                                className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-2 transition-all relative ${
                                  isSelected
                                    ? 'bg-primary/20 border-primary shadow-sm scale-95 ring-2 ring-primary ring-offset-2 ring-offset-card'
                                    : pinnedChat
                                    ? 'bg-card border-primary/40 text-foreground hover:bg-muted'
                                    : 'bg-card border-border border-dashed text-muted-foreground hover:border-foreground/50'
                                }`}
                              >
                                <span className="absolute top-1 left-1.5 text-[9px] font-mono text-muted-foreground">Slot {slotNum}</span>
                                {pinnedChat ? (
                                  <>
                                    <Pin className="h-3.5 w-3.5 text-primary rotate-45 mb-1" />
                                    <span className="text-[10px] font-bold truncate max-w-full text-center">{pinnedChat}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearPin(slotNum);
                                      }}
                                      className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors shadow"
                                    >
                                      <X className="h-2 w-2" />
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] font-semibold opacity-60">Empty</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Conversations List Selector */}
                      <div className="space-y-3">
                        <div className="bg-muted/40 p-4 border border-border rounded-2xl space-y-2.5">
                          <span className="text-xs font-bold text-muted-foreground block uppercase">
                            Pinning Config
                          </span>
                          
                          {activePinningSlot !== null ? (
                            <div className="space-y-3">
                              <span className="text-xs font-semibold text-foreground block">
                                Assigning to <span className="text-primary font-bold">Slot {activePinningSlot}</span>:
                              </span>
                              <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                                {chatOptions.map(chat => (
                                  <button
                                    key={chat}
                                    onClick={() => handlePinChat(chat)}
                                    className="px-2.5 py-1.5 border border-border rounded-lg text-xs font-medium text-left bg-card hover:bg-muted text-foreground transition-all"
                                  >
                                    {chat}
                                  </button>
                                ))}
                              </div>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setActivePinningSlot(null)}
                                className="w-full text-[10px]"
                              >
                                Cancel Pinning Selection
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <HelpCircle className="h-6 w-6 mx-auto mb-2 opacity-60" />
                              <p className="text-xs">Click any empty or occupied slot in the matrix to assign a new chat conversation.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SIMULATOR: 8. Inline Translation Selector */}
                {activeSim === 'Inline Translation Selector' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-muted/40 border border-border p-4 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-foreground">Auto-Translate Feed Content</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <select
                          value={targetTranslationLang}
                          onChange={e => setTargetTranslationLang(e.target.value)}
                          className="bg-card border border-border text-xs rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
                        >
                          <option value="English">Translate to English</option>
                          <option value="Spanish">Translate to Spanish</option>
                          <option value="German">Translate to German</option>
                        </select>
                        <input
                          type="checkbox"
                          checked={autoTranslateEnabled}
                          onChange={e => setAutoTranslateEnabled(e.target.checked)}
                          className="h-4.5 w-4.5 accent-primary cursor-pointer rounded"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {MOCK_POSTS_TRANSLATIONS.map(post => (
                        <div key={post.id} className="border border-border bg-card p-4 rounded-2xl space-y-3">
                          <div className="flex items-center gap-3">
                            <img src={post.avatar} alt={post.author} className="h-8 w-8 rounded-full object-cover" />
                            <div>
                              <span className="text-xs font-bold text-foreground block">{post.author}</span>
                              <span className="text-[10px] text-muted-foreground">@{post.handle}</span>
                            </div>
                            <span className="ml-auto text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase font-bold">
                              {post.lang}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">{post.original}</p>
                            
                            {autoTranslateEnabled && (
                              <div className="border-t border-border border-dashed pt-2 flex items-start gap-1.5 text-xs text-primary bg-primary/5 p-2.5 rounded-xl border border-primary/10">
                                <Languages className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary block">Translated inline ({targetTranslationLang})</span>
                                  <p className="italic font-medium">{post.translation}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SIMULATOR: 9. Time-Travel Feed Slider */}
                {activeSim === 'Time-Travel Feed Slider' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-muted-foreground">Timeline Hour (Time Travel)</span>
                        <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {timeTravelHour}
                        </span>
                      </div>
                      
                      {/* Preset slider bar buttons */}
                      <div className="grid grid-cols-4 gap-1.5 bg-muted p-1 border border-border rounded-xl">
                        {timeTravelHours.map(hour => (
                          <button
                            key={hour}
                            onClick={() => setTimeTravelHour(hour)}
                            className={`py-2 rounded-lg text-xs font-bold transition-all ${
                              timeTravelHour === hour
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {hour}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeline Feed Container */}
                    <div className="border border-border bg-card rounded-2xl p-4 space-y-4 shadow-sm">
                      <div className="border-b border-border pb-2">
                        <span className="text-[10px] font-extrabold text-primary uppercase block tracking-wider">Feed Status & Cultural Context</span>
                        <h4 className="text-sm font-bold text-foreground mt-0.5">{TIME_TRAVEL_MOCK_CONTENT[timeTravelHour]?.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{TIME_TRAVEL_MOCK_CONTENT[timeTravelHour]?.desc}</p>
                      </div>

                      <div className="space-y-2.5">
                        {TIME_TRAVEL_MOCK_CONTENT[timeTravelHour]?.posts.map((post, index) => (
                          <div key={index} className="bg-muted/30 border border-border rounded-xl p-3.5 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-foreground">@{post.author}</span>
                              <span className="text-[9px] text-muted-foreground">{post.time}</span>
                            </div>
                            <p className="text-xs font-semibold text-foreground/80">{post.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SIMULATOR: 10. Holographic Depth Mapper */}
                {activeSim === 'Holographic Depth Mapper' && (
                  <div className="space-y-4 flex flex-col items-center">
                    <p className="text-xs text-muted-foreground text-center max-w-md">
                      Simulates interactive 3D gyroscope parallax depth. Move your mouse cursor across the card to tilt the perspective dynamically.
                    </p>

                    <div
                      onMouseMove={handleHoloMouseMove}
                      onMouseLeave={handleHoloMouseLeave}
                      className="cursor-pointer relative overflow-hidden h-64 w-80 rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center bg-slate-900"
                      style={{
                        transform: `perspective(1000px) rotateX(${holographicTilt.y}deg) rotateY(${holographicTilt.x}deg)`,
                        transition: 'transform 0.1s ease-out',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Layer 1: Parallax Background */}
                      <div
                        className="absolute inset-0 bg-gradient-to-tr from-fuchsia-600 via-violet-600 to-indigo-800 transition-all duration-75 select-none"
                        style={{
                          transform: 'translateZ(-40px) scale(1.15)',
                        }}
                      >
                        {/* Overlay grid mesh pattern */}
                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]" />
                      </div>

                      {/* Layer 2: Middle Floating Artwork Avatar */}
                      <div
                        className="h-28 w-28 rounded-full border border-white/35 bg-white/10 backdrop-blur-sm shadow-xl flex items-center justify-center transition-all duration-75"
                        style={{
                          transform: `translateZ(30px) translateX(${holographicTilt.x * 0.4}px) translateY(${-holographicTilt.y * 0.4}px)`,
                        }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                        >
                          <Activity className="h-12 w-12 text-white drop-shadow-[0_4px_8px_rgba(255,255,255,0.4)]" />
                        </motion.div>
                      </div>

                      {/* Layer 3: Foreground Floating Text */}
                      <div
                        className="absolute bottom-6 text-center select-none transition-all duration-75"
                        style={{
                          transform: `translateZ(65px) translateX(${holographicTilt.x * 0.8}px) translateY(${-holographicTilt.y * 0.8}px)`,
                        }}
                      >
                        <h4 className="text-white font-black tracking-widest text-sm uppercase drop-shadow-md">
                          HOLOGRAPHIC Depth
                        </h4>
                        <p className="text-white/70 font-mono text-[9px] mt-0.5">
                          PARALLAX MATRICES ACTIVE
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SIMULATOR: 11. Generative Voice-to-Foley */}
                {activeSim === 'Generative Voice-to-Foley' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">Describe Sound Effects (Text-to-Foley Prompt)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={foleyInput}
                          onChange={e => setFoleyInput(e.target.value)}
                          className="flex-1 text-sm bg-muted border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          placeholder="e.g. rain, rustling leaves, sci-fi zap, ocean waves..."
                        />
                        <Button
                          onClick={generateFoley}
                          disabled={foleyGenerating || foleyPlaying}
                          className="px-5 text-xs whitespace-nowrap"
                        >
                          Generate Foley
                        </Button>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Preset inputs: <span className="underline cursor-pointer hover:text-foreground font-semibold" onClick={() => setFoleyInput('rain')}>rain</span>,{' '}
                        <span className="underline cursor-pointer hover:text-foreground font-semibold" onClick={() => setFoleyInput('rustling leaves')}>rustling leaves</span>,{' '}
                        <span className="underline cursor-pointer hover:text-foreground font-semibold" onClick={() => setFoleyInput('sci-fi zap')}>sci-fi zap</span>,{' '}
                        <span className="underline cursor-pointer hover:text-foreground font-semibold" onClick={() => setFoleyInput('ocean waves')}>ocean waves</span>
                      </span>
                    </div>

                    <div className="mt-4 border border-border bg-muted/40 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[160px]">
                      {foleyGenerating ? (
                        <div className="space-y-2 text-center w-full max-w-xs">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto block" />
                          <p className="text-xs font-bold text-muted-foreground">Analyzing text syntax & synthesizing soundwaves...</p>
                          <div className="w-full bg-muted border border-border rounded-full h-1.5 mt-1 overflow-hidden">
                            <motion.div
                              className="bg-primary h-1.5"
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 1.1 }}
                            />
                          </div>
                        </div>
                      ) : foleyGeneratedSound ? (
                        <div className="text-center space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 block">Foley Sound Generated Successfully</span>
                          <div className="flex items-center gap-3 bg-card border border-border px-5 py-3 rounded-2xl shadow-sm">
                            <Volume2 className="h-5 w-5 text-primary" />
                            <div className="text-left min-w-[120px]">
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground block">Foley Preset</span>
                              <p className="text-xs font-bold text-foreground capitalize">&quot;{foleyGeneratedSound}&quot;</p>
                            </div>
                            
                            <Button
                              onClick={() => playFoleySound(foleyGeneratedSound)}
                              size="sm"
                              className="h-8 text-xs font-semibold px-4"
                            >
                              {foleyPlaying ? (
                                <span className="flex items-center gap-1">
                                  <Square className="h-3.5 w-3.5 fill-current" /> Stop
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Play className="h-3.5 w-3.5 fill-current" /> Play Sound
                                </span>
                              )}
                            </Button>
                          </div>

                          {foleyPlaying && (
                            <div className="flex justify-center gap-0.5 items-end h-6 mt-2">
                              {Array.from({ length: 12 }).map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="w-0.75 bg-primary rounded-t"
                                  animate={{ height: [3, 22 - (i % 3) * 6, 3] }}
                                  transition={{ repeat: Infinity, duration: 0.5 + i * 0.05 }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-muted-foreground space-y-1 text-center">
                          <Volume2 className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                          <p className="text-xs">Input a sound description and hit generate to compile foley acoustics.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SIMULATOR: 12. Notifications Filter */}
                {activeSim === 'Notifications Filter' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 border border-border p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Do Not Disturb (DND) Mode</span>
                        <button
                          onClick={() => setDndEnabled(!dndEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            dndEnabled ? 'bg-primary' : 'bg-muted border border-border'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              dndEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-l border-border pl-4">
                        <span className="text-xs font-bold text-foreground">Priority Threshold</span>
                        <select
                          value={priorityThreshold}
                          onChange={e => setPriorityThreshold(e.target.value as any)}
                          className="bg-card border border-border text-xs rounded-xl px-2.5 py-1 text-foreground focus:outline-none"
                        >
                          <option value="Low">Low & Above</option>
                          <option value="Medium">Medium & Above</option>
                          <option value="High">High & Above</option>
                          <option value="Urgent">Urgent Only</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase block">Simulated Incoming Notification Feed</span>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {MOCK_NOTIFICATIONS.map(notif => {
                          const allowed = isNotificationAllowed(notif.priority);
                          return (
                            <div
                              key={notif.id}
                              className={`p-3.5 border rounded-xl flex items-center justify-between transition-opacity ${
                                allowed ? 'bg-card border-border opacity-100' : 'bg-muted/30 border-border/40 opacity-55'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className={`h-2 w-2 rounded-full mt-1.5 ${
                                  notif.priority === 'Urgent' ? 'bg-red-500' :
                                  notif.priority === 'High' ? 'bg-orange-500' :
                                  notif.priority === 'Medium' ? 'bg-blue-500' : 'bg-slate-400'
                                }`} />
                                <div className="space-y-0.5">
                                  <p className="text-xs font-semibold text-foreground/80">{notif.text}</p>
                                  <div className="flex gap-2 text-[9px] text-muted-foreground uppercase font-bold">
                                    <span>Priority: {notif.priority}</span>
                                    <span>•</span>
                                    <span>Category: {notif.type}</span>
                                  </div>
                                </div>
                              </div>

                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                allowed
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                              }`}>
                                {allowed ? 'Delivered ✅' : 'Blocked 🚫'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
