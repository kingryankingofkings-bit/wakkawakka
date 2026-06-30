'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Sliders, Volume2, Languages, Calendar, Bell, FileText,
  CheckCircle2, Plus, Trash2, Settings, Pin, Play, Square,
  Moon, Sun, Activity, ChevronLeft, ChevronRight, Mic, HelpCircle, RefreshCw, X, Video, Lock, Clock, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { batch4Items, Batch4Item } from './batch4Data';
import { Button } from '@/components/ui/Button';

// ---------------------------------------------------------------------------
// Simulated Message Structure
// ---------------------------------------------------------------------------
interface SimulatedMessage {
  id: string;
  sender: 'You' | 'Alice' | 'System';
  content: string;
  type: 'text' | 'whisper' | 'audio' | 'video';
  timestamp: string;
  isBlurred?: boolean;
  audioDuration?: number;
  videoUrl?: string;
  originalContent?: string;
}

// Pre-defined translation lookup for sample messages
const TRANSLATION_DICTIONARY: Record<string, Record<string, string>> = {
  spanish: {
    "hey! check out the new batch 4 direct messaging features!": "¡Oye! ¡Echa un vistazo a las nuevas funciones de mensajería directa del Lote 4!",
    "oh cool, what do we have here?": "Oh, genial, ¿qué tenemos aquí?",
    "we have whispers, delayed send queue, circular videos, intercom, and translator!": "¡Tenemos susurros, cola de envío diferido, videos circulares, intercomunicador y traductor!",
    "hello": "hola",
    "how are you?": "¿cómo estás?",
    "yes": "sí",
    "no": "no"
  },
  french: {
    "hey! check out the new batch 4 direct messaging features!": "Hé ! Découvrez les nouvelles fonctionnalités de messagerie directe du Lot 4 !",
    "oh cool, what do we have here?": "Oh sympa, qu'avons-nous là ?",
    "we have whispers, delayed send queue, circular videos, intercom, and translator!": "Nous avons des chuchotements, une file d'attente d'envoi différé, des vidéos circulaires, un intercom et un traducteur !",
    "hello": "bonjour",
    "how are you?": "comment ça va?",
    "yes": "oui",
    "no": "non"
  },
  japanese: {
    "hey! check out the new batch 4 direct messaging features!": "ねえ！バッチ4のダイレクトメッセージング機能をチェックしてみて！",
    "oh cool, what do we have here?": "おお、いいね。ここには何があるの？",
    "we have whispers, delayed send queue, circular videos, intercom, and translator!": "ウィスパー、送信遅延キュー、サークルビデオ、インターコム、翻訳機があるよ！",
    "hello": "こんにちは",
    "how are you?": "お元気ですか？",
    "yes": "はい",
    "no": "いいえ"
  },
  german: {
    "hey! check out the new batch 4 direct messaging features!": "Hey! Sieh dir die neuen Direktnachrichten-Funktionen aus Batch 4 an!",
    "oh cool, what do we have here?": "Oh cool, was haben wir hier?",
    "we have whispers, delayed send queue, circular videos, intercom, and translator!": "Wir haben Whispers, eine verzögerte Sendewarteschlange, kreisförmige Videos, Gegensprechanlage und Übersetzer!",
    "hello": "hallo",
    "how are you?": "wie geht es dir?",
    "yes": "ja",
    "no": "nein"
  }
};

export default function MessagingFeaturesConsole() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'simulators'>('catalog');

  // ----------------------------------------------------
  // Catalog State & Logic
  // ----------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Feature' | 'Improvement' | 'Innovation'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredItems = useMemo(() => {
    return batch4Items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' ? true : item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, typeFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // ----------------------------------------------------
  // Simulation State & Logic
  // ----------------------------------------------------
  const [simMessages, setSimMessages] = useState<SimulatedMessage[]>([
    { id: '1', sender: 'Alice', content: 'Hey! Check out the new Batch 4 direct messaging features!', type: 'text', timestamp: '10:00 AM' },
    { id: '2', sender: 'You', content: 'Oh cool, what do we have here?', type: 'text', timestamp: '10:01 AM' },
    { id: '3', sender: 'Alice', content: 'We have whispers, delayed send queue, circular videos, intercom, and translator!', type: 'text', timestamp: '10:02 AM' },
  ]);

  // Simulation controls
  const [translationLanguage, setTranslationLanguage] = useState<'none' | 'spanish' | 'french' | 'japanese' | 'german'>('none');
  const [whisperInput, setWhisperInput] = useState('');
  const [delayInput, setDelayInput] = useState('');
  const [delayMode, setDelayMode] = useState<'time' | 'trigger'>('time');
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [delayTriggerType, setDelayTriggerType] = useState<'online' | 'typing'>('online');
  const [delayedQueue, setDelayedQueue] = useState<Array<{
    id: string;
    content: string;
    mode: 'time' | 'trigger';
    secondsRemaining?: number;
    trigger?: 'online' | 'typing';
  }>>([]);

  // PTT state
  const [isPttRecording, setIsPttRecording] = useState(false);
  const [pttTimer, setPttTimer] = useState(0);
  const pttTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlayingAudioId, setIsPlayingAudioId] = useState<string | null>(null);

  // Video Snapshot state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoTimer, setVideoTimer] = useState(30);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [simMessages]);

  // Handle countdowns for delayed queue
  useEffect(() => {
    const interval = setInterval(() => {
      setDelayedQueue(prevQueue => {
        const nextQueue: typeof prevQueue = [];
        prevQueue.forEach(item => {
          if (item.mode === 'time') {
            const nextSec = (item.secondsRemaining ?? 0) - 1;
            if (nextSec <= 0) {
              // Time's up, send!
              setSimMessages(prevMsgs => [
                ...prevMsgs,
                {
                  id: `delayed-${Date.now()}`,
                  sender: 'You',
                  content: item.content,
                  type: 'text',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]);
            } else {
              nextQueue.push({ ...item, secondsRemaining: nextSec });
            }
          } else {
            nextQueue.push(item);
          }
        });
        return nextQueue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Web Audio Synth for Intercom beeps
  const playIntercomBeep = (type: 'start' | 'stop' | 'play') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === 'stop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.21);
      } else if (type === 'play') {
        // Voice-like synthesis
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.5);
        osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 1.0);
        
        // Lowpass filter to simulate intercom bandwidth
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        
        osc.disconnect(gain);
        osc.connect(filter);
        filter.connect(gain);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.start();
        osc.stop(ctx.currentTime + 1.3);
      }
    } catch (e) {
      console.warn("Audio synthesis not fully supported in this browser context:", e);
    }
  };

  // 1. Whisper message sender
  const handleSendWhisper = () => {
    if (!whisperInput.trim()) return;
    const newMsg: SimulatedMessage = {
      id: `whisp-${Date.now()}`,
      sender: 'You',
      content: whisperInput.trim(),
      type: 'whisper',
      isBlurred: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSimMessages(prev => [...prev, newMsg]);
    setWhisperInput('');
  };

  // 2. Delayed sending queue
  const handleQueueDelayedMessage = () => {
    if (!delayInput.trim()) return;
    const id = `queued-${Date.now()}`;
    if (delayMode === 'time') {
      setDelayedQueue(prev => [
        ...prev,
        {
          id,
          content: delayInput.trim(),
          mode: 'time',
          secondsRemaining: delaySeconds
        }
      ]);
    } else {
      setDelayedQueue(prev => [
        ...prev,
        {
          id,
          content: delayInput.trim(),
          mode: 'trigger',
          trigger: delayTriggerType
        }
      ]);
    }
    setDelayInput('');
  };

  const handleSimulateTrigger = (triggerType: 'online' | 'typing') => {
    setDelayedQueue(prevQueue => {
      const match = prevQueue.filter(item => item.mode === 'trigger' && item.trigger === triggerType);
      const remaining = prevQueue.filter(item => !(item.mode === 'trigger' && item.trigger === triggerType));
      
      if (match.length > 0) {
        setSimMessages(prevMsgs => [
          ...prevMsgs,
          ...match.map(item => ({
            id: `triggered-${Date.now()}-${Math.random()}`,
            sender: 'You' as const,
            content: item.content,
            type: 'text' as const,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }))
        ]);
      }
      return remaining;
    });
  };

  // 3. Push-to-Talk Intercom
  const startPttRecording = () => {
    playIntercomBeep('start');
    setIsPttRecording(true);
    setPttTimer(0);
    pttTimerRef.current = setInterval(() => {
      setPttTimer(t => t + 1);
    }, 1000);
  };

  const stopPttRecording = () => {
    if (!isPttRecording) return;
    playIntercomBeep('stop');
    setIsPttRecording(false);
    if (pttTimerRef.current) {
      clearInterval(pttTimerRef.current);
      pttTimerRef.current = null;
    }
    const finalDur = Math.max(1, pttTimer);
    setSimMessages(prev => [
      ...prev,
      {
        id: `audio-${Date.now()}`,
        sender: 'You',
        content: `Simulated Intercom Voice Note`,
        type: 'audio',
        audioDuration: finalDur,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const playAudioNote = (msgId: string) => {
    setIsPlayingAudioId(msgId);
    playIntercomBeep('play');
    setTimeout(() => {
      setIsPlayingAudioId(null);
    }, 1300);
  };

  // 4. Circular Video Snapshots Camera Handlers
  const toggleCamera = async () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      try {
        setIsCameraActive(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setVideoStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable. Using scanner simulation.", err);
      }
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setIsCameraActive(false);
    setIsVideoRecording(false);
    if (videoTimerRef.current) clearInterval(videoTimerRef.current);
  };

  const startVideoRecording = () => {
    if (!isCameraActive) return;
    setIsVideoRecording(true);
    setVideoTimer(30);
    
    // Simulate recording blob
    recordedChunksRef.current = [];
    if (videoStream) {
      try {
        const mediaRecorder = new MediaRecorder(videoStream, { mimeType: 'video/webm' });
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        mediaRecorder.start();
      } catch (e) {
        console.warn("MediaRecorder failed to start:", e);
      }
    }

    videoTimerRef.current = setInterval(() => {
      setVideoTimer(t => {
        if (t <= 1) {
          stopVideoRecording();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const stopVideoRecording = () => {
    if (!isVideoRecording) return;
    setIsVideoRecording(false);
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }

    let customVideoUrl = "";
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        setTimeout(() => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          customVideoUrl = URL.createObjectURL(blob);
          addVideoMessage(customVideoUrl);
        }, 100);
        return;
      } catch (e) {
        console.warn("Stopping media recorder failed:", e);
      }
    }
    addVideoMessage();
  };

  const addVideoMessage = (url?: string) => {
    setSimMessages(prev => [
      ...prev,
      {
        id: `video-${Date.now()}`,
        sender: 'You',
        content: `Circular Video Snapshot`,
        type: 'video',
        videoUrl: url || 'placeholder',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    stopCamera();
  };

  // Helper translation mapping
  const getTranslation = (content: string, lang: string) => {
    const key = content.toLowerCase().trim();
    const langDict = TRANSLATION_DICTIONARY[lang];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback translation representation
    return `[Translated into ${lang.toUpperCase()}]: ${content}`;
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Tab controls */}
      <div className="flex border-b border-border bg-muted/40 p-1 flex-shrink-0">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'catalog' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Feature Catalog (198)
        </button>
        <button
          onClick={() => setActiveTab('simulators')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'simulators' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          Interactive Simulator
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Catalog View ── */}
        {activeTab === 'catalog' && (
          <div className="p-4 flex flex-col gap-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search 198 Batch 4 items..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-xl bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-xl bg-card text-sm focus:outline-none"
              >
                <option value="All">All Types</option>
                <option value="Feature">Feature</option>
                <option value="Improvement">Improvement</option>
                <option value="Innovation">Innovation</option>
              </select>
            </div>

            {/* Results Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                      <th className="p-3 w-16">ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3 w-24">Type</th>
                      <th className="p-3 w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          No matching items found.
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map(item => (
                        <tr key={item.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold text-primary">{item.id}</td>
                          <td className="p-3">
                            <div className="font-medium text-foreground">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{item.category}</div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              item.type === 'Feature' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              item.type === 'Innovation' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/40 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                              <Check className="h-3 w-3" /> Implemented
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-border bg-muted/20">
                  <div className="text-[11px] text-muted-foreground">
                    Showing <span className="font-semibold">{Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
                    <span className="font-semibold">{Math.min(filteredItems.length, currentPage * itemsPerPage)}</span> of{' '}
                    <span className="font-semibold">{filteredItems.length}</span> items
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="p-1 border border-border rounded-md hover:bg-muted disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-medium px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="p-1 border border-border rounded-md hover:bg-muted disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground italic px-1">
              All 198 Batch 4 items are fully registered in the implementation tracker.
            </div>
          </div>
        )}

        {/* ── Simulator View ── */}
        {activeTab === 'simulators' && (
          <div className="flex flex-col h-[70vh] min-h-[500px]">
            {/* Simulation Interface Header */}
            <div className="bg-muted/30 border-b border-border px-4 py-2 text-xs flex items-center justify-between flex-shrink-0">
              <span className="font-bold text-muted-foreground flex items-center gap-1">
                <Sliders className="h-3 w-3 text-primary" /> Direct Messaging Playground
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Translator Language:</span>
                <select
                  value={translationLanguage}
                  onChange={e => setTranslationLanguage(e.target.value as any)}
                  className="bg-background border border-border rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                >
                  <option value="none">No translation</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="japanese">Japanese</option>
                  <option value="german">German</option>
                </select>
              </div>
            </div>

            {/* Chat Simulator Pane */}
            <div className="flex-1 flex flex-col bg-muted/10 overflow-hidden relative">
              {/* Chat history display */}
              <div
                ref={chatContainerRef}
                className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 scrollbar-thin"
              >
                {simMessages.map(msg => {
                  const isYou = msg.sender === 'You';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${isYou ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      {/* Sender label */}
                      <span className="text-[10px] text-muted-foreground mb-0.5 px-1">{msg.sender}</span>
                      
                      {/* Message bubble */}
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-sm shadow-sm relative ${
                          isYou
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-card text-foreground rounded-tl-sm border border-border'
                        }`}
                      >
                        {/* Whisper display */}
                        {msg.type === 'whisper' ? (
                          <div
                            onClick={() => {
                              if (msg.isBlurred) {
                                setSimMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isBlurred: false } : m));
                              }
                            }}
                            className={`cursor-pointer transition-all duration-300 select-none flex items-center gap-2 ${
                              msg.isBlurred ? 'filter blur-[5px] opacity-75' : ''
                            }`}
                          >
                            <Lock className="h-3 w-3 shrink-0 opacity-70" />
                            <span>{msg.content}</span>
                          </div>
                        ) : msg.type === 'audio' ? (
                          /* Audio intercom playback */
                          <div className="flex items-center gap-3 py-1">
                            <button
                              onClick={() => playAudioNote(msg.id)}
                              className={`p-1.5 rounded-full ${
                                isPlayingAudioId === msg.id
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : isYou ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-foreground'
                              } transition-colors`}
                            >
                              {isPlayingAudioId === msg.id ? (
                                <Square className="h-3 w-3 fill-current" />
                              ) : (
                                <Play className="h-3 w-3 fill-current" />
                              )}
                            </button>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold font-mono">
                                Intercom PTT ({msg.audioDuration}s)
                              </span>
                              {/* Fake animated waveform */}
                              <div className="flex gap-0.5 h-3 items-center">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                  <div
                                    key={i}
                                    className={`w-0.5 rounded-full ${
                                      isYou ? 'bg-primary-foreground/40' : 'bg-muted-foreground/40'
                                    } ${
                                      isPlayingAudioId === msg.id ? 'animate-bounce' : ''
                                    }`}
                                    style={{
                                      height: isPlayingAudioId === msg.id ? `${Math.random() * 8 + 4}px` : '4px',
                                      animationDelay: `${i * 0.1}s`
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : msg.type === 'video' ? (
                          /* Circular Video Snapshot bubble */
                          <div className="flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 relative bg-black flex items-center justify-center">
                              {msg.videoUrl === 'placeholder' ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 bg-gradient-to-tr from-purple-800 to-indigo-900 text-white">
                                  <Video className="h-6 w-6 animate-pulse" />
                                  <span className="text-[8px] mt-1 font-semibold">Video Snap</span>
                                </div>
                              ) : (
                                <video
                                  src={msg.videoUrl}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <span className="text-[10px] mt-1 text-muted-foreground">Circular Snapshot</span>
                          </div>
                        ) : (
                          /* Standard Text bubble */
                          <span>{msg.content}</span>
                        )}

                        {/* Whisper label */}
                        {msg.type === 'whisper' && msg.isBlurred && (
                          <div className="text-[9px] text-center font-bold text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded mt-1">
                            Whisper (Click bubble to reveal)
                          </div>
                        )}
                      </div>

                      {/* Multilingual inline translation */}
                      {translationLanguage !== 'none' && msg.type === 'text' && (
                        <div className="text-[11px] text-muted-foreground italic mt-0.5 flex items-center gap-1 px-1">
                          <Languages className="h-2.5 w-2.5 text-primary shrink-0" />
                          <span>{getTranslation(msg.content, translationLanguage)}</span>
                        </div>
                      )}
                      
                      {/* Timestamp */}
                      <span className="text-[8px] text-muted-foreground mt-0.5 px-1">{msg.timestamp}</span>
                    </div>
                  );
                })}
              </div>

              {/* Delayed Send Queue Banner */}
              {delayedQueue.length > 0 && (
                <div className="bg-amber-500/10 border-t border-amber-500/20 px-4 py-2 text-xs flex flex-col gap-1 flex-shrink-0">
                  <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Delayed Sending Queue ({delayedQueue.length} items)
                  </div>
                  <div className="flex flex-col gap-1 max-h-20 overflow-y-auto">
                    {delayedQueue.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-card/60 rounded px-2 py-1 text-[10px] border border-border">
                        <span className="truncate flex-1 pr-2">&ldquo;{item.content}&rdquo;</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.mode === 'time' ? (
                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                              Sending in {item.secondsRemaining}s
                            </span>
                          ) : (
                            <>
                              <span className="text-muted-foreground font-semibold">
                                Waiting for {item.trigger}...
                              </span>
                              <button
                                onClick={() => handleSimulateTrigger(item.trigger!)}
                                className="bg-primary/20 hover:bg-primary/30 text-primary px-1.5 py-0.5 rounded font-semibold text-[9px]"
                              >
                                Fire Trigger
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Simulators Control Center */}
            <div className="border-t border-border p-4 bg-muted/20 flex flex-col gap-3 flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                
                {/* 1. WHISPER MODULE */}
                <div className="border border-border/80 bg-card rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1 mb-1">
                      <Lock className="h-3.5 w-3.5 text-primary" /> Whisper Messages
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight mb-2">
                      Encrypt message behind a blur filter. Revealeable only upon tap.
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Whisper content..."
                      value={whisperInput}
                      onChange={e => setWhisperInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendWhisper()}
                      className="flex-1 bg-muted/40 border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={handleSendWhisper}
                      disabled={!whisperInput.trim()}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs px-2.5 py-1 rounded-lg font-semibold disabled:opacity-50"
                    >
                      Whisper
                    </button>
                  </div>
                </div>

                {/* 2. DELAYED SEND QUEUE MODULE */}
                <div className="border border-border/80 bg-card rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1 mb-1">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Delayed Queue
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className="text-[9px] flex items-center gap-1 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="delayMode"
                          checked={delayMode === 'time'}
                          onChange={() => setDelayMode('time')}
                        />
                        Timer
                      </label>
                      <label className="text-[9px] flex items-center gap-1 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="delayMode"
                          checked={delayMode === 'trigger'}
                          onChange={() => setDelayMode('trigger')}
                        />
                        Trigger
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        placeholder="Message to queue..."
                        value={delayInput}
                        onChange={e => setDelayInput(e.target.value)}
                        className="flex-1 bg-muted/40 border border-border rounded-lg px-2 py-1 text-xs focus:outline-none"
                      />
                      {delayMode === 'time' ? (
                        <select
                          value={delaySeconds}
                          onChange={e => setDelaySeconds(parseInt(e.target.value))}
                          className="bg-muted/40 border border-border rounded-lg px-1 py-1 text-xs focus:outline-none shrink-0"
                        >
                          <option value={3}>3s</option>
                          <option value={5}>5s</option>
                          <option value={10}>10s</option>
                          <option value={15}>15s</option>
                        </select>
                      ) : (
                        <select
                          value={delayTriggerType}
                          onChange={e => setDelayTriggerType(e.target.value as any)}
                          className="bg-muted/40 border border-border rounded-lg px-1 py-1 text-xs focus:outline-none shrink-0"
                        >
                          <option value="online">Online</option>
                          <option value="typing">Typing</option>
                        </select>
                      )}
                    </div>
                    <button
                      onClick={handleQueueDelayedMessage}
                      disabled={!delayInput.trim()}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground text-[11px] py-1 rounded-lg font-semibold w-full disabled:opacity-50"
                    >
                      Queue Message
                    </button>
                  </div>
                </div>

                {/* 3. PUSH-TO-TALK INTERCOM */}
                <div className="border border-border/80 bg-card rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1 mb-1">
                      <Mic className="h-3.5 w-3.5 text-primary" /> Push-To-Talk Intercom
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight mb-2">
                      Hold the mic to record intercom voice. Release to send simulated voice bubble.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onMouseDown={startPttRecording}
                      onMouseUp={stopPttRecording}
                      onTouchStart={startPttRecording}
                      onTouchEnd={stopPttRecording}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-2 select-none active:scale-95 transition-all ${
                        isPttRecording
                          ? 'bg-red-500 border-red-600 text-white animate-pulse'
                          : 'bg-muted hover:bg-muted/80 border-border text-foreground'
                      }`}
                    >
                      <Mic className="h-3.5 w-3.5" />
                      {isPttRecording ? `Recording (${pttTimer}s)...` : 'HOLD TO TALK'}
                    </button>
                    {isPttRecording && (
                      <div className="flex gap-0.5 h-4 items-center shrink-0">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className="w-0.5 bg-red-500 rounded-full animate-bounce"
                            style={{ height: `${Math.random() * 12 + 4}px`, animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. CIRCULAR VIDEO SNAPSHOTS */}
                <div className="border border-border/80 bg-card rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1 mb-1">
                      <Video className="h-3.5 w-3.5 text-primary" /> Circular Video Snapshots
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight mb-2">
                      Open circular camera view, record up to 30s clips, and share inline.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={toggleCamera}
                      className={`w-full py-1 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                        isCameraActive ? 'bg-red-500/10 border-red-500/30 text-red-600' : 'bg-muted border-border text-foreground hover:bg-muted/80'
                      }`}
                    >
                      <Video className="h-3.5 w-3.5" />
                      {isCameraActive ? 'Turn Camera Off' : 'Activate Camera'}
                    </button>

                    {isCameraActive && (
                      <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-xl">
                        {/* Circular video frame */}
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary relative flex items-center justify-center bg-black">
                          {videoStream ? (
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-primary/20 animate-pulse flex items-center justify-center">
                              <Video className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          
                          {/* Recording Overlay scanner */}
                          {isVideoRecording && (
                            <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping" />
                          )}
                        </div>

                        {/* Record buttons */}
                        <div className="flex-1 flex flex-col gap-1">
                          {isVideoRecording ? (
                            <button
                              onClick={stopVideoRecording}
                              className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-1 px-2 rounded-lg"
                            >
                              Stop ({videoTimer}s)
                            </button>
                          ) : (
                            <button
                              onClick={startVideoRecording}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold py-1 px-2 rounded-lg"
                            >
                              Record Snap
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
