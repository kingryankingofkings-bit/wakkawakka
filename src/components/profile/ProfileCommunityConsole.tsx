'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BATCH2_FEATURES, FeatureItem } from './featuresBatch2Data';
import { 
  Search, ChevronLeft, ChevronRight, Check, X, Play, Pause, Music, Disc3, 
  Users, Plus, Globe, ArrowUp, ArrowDown, Award, Sparkles, MessageSquare, 
  ThumbsUp, ThumbsDown, UserPlus, Heart, Send, MessageCircle, Star 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileCommunityConsole() {
  const [activeTab, setActiveTab] = useState<'simulations' | 'catalog'>('simulations');

  // --- CATALOG STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Feature' | 'Improvement' | 'Innovation'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter & Search Features
  const filteredFeatures = BATCH2_FEATURES.filter(feature => {
    const matchesSearch = 
      feature.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || feature.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredFeatures.length / itemsPerPage);
  const paginatedFeatures = filteredFeatures.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // --- SIMULATION MODULES STATE ---

  // 1. Collaborative Posts (Collabs)
  const [collabStep, setCollabStep] = useState<1 | 2 | 3>(1);
  const [collabCoAuthor, setCollabCoAuthor] = useState('');
  const [collabContent, setCollabContent] = useState('');

  const handleCollabDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabCoAuthor.trim()) {
      toast.error('Please specify a co-author username.');
      return;
    }
    if (!collabContent.trim()) {
      toast.error('Please write some content for the post.');
      return;
    }
    setCollabStep(2);
  };

  const handleSendCollab = () => {
    setCollabStep(3);
    toast.success(`Collaboration invitation sent to ${collabCoAuthor}!`);
  };

  const resetCollab = () => {
    setCollabCoAuthor('');
    setCollabContent('');
    setCollabStep(1);
  };

  // 2. "Add Yours" Prompts
  const [prompts, setPrompts] = useState([
    { id: 1, text: '📸 Show your current view!', responses: ['Sunset from my desk', 'Rainy window vibe'] },
    { id: 2, text: '🎵 Song of the day?', responses: ['Synthwave Horizon - 198X', 'Lofi Morning - Chill Beats'] },
    { id: 3, text: '🍕 Best pizza topping?', responses: ['Pineapple & Jalapeno (fight me)', 'Double pepperoni'] }
  ]);
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [newResponse, setNewResponse] = useState('');

  const handleAddResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResponse.trim() || selectedPromptId === null) return;
    setPrompts(prev => prev.map(p => {
      if (p.id === selectedPromptId) {
        return { ...p, responses: [...p.responses, newResponse.trim()] };
      }
      return p;
    }));
    toast.success('Your response has been added to the prompt box!');
    setNewResponse('');
    setSelectedPromptId(null);
  };

  // 3. Broadcast Channels Simulator
  const [channelMessages, setChannelMessages] = useState([
    { 
      id: 1, 
      sender: 'Tech Hub Announcer', 
      text: 'Welcome to the Broadcast Channel! We are planning a Next.js 16 live deep dive. Who is in? 🎉', 
      reactions: { '👍': 14, '🔥': 8, '❤️': 5 },
      myReaction: ''
    },
    { 
      id: 2, 
      sender: 'Tech Hub Announcer', 
      text: 'Check out this screenshot from our new user profile themes! Smooth gradients incoming. 🌟', 
      reactions: { '👍': 21, '🔥': 18, '❤️': 12 },
      myReaction: ''
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleReact = (msgId: number, reaction: string) => {
    setChannelMessages(prev => prev.map(msg => {
      if (msg.id !== msgId) return msg;

      const nextReactions = { ...msg.reactions };
      let nextMyReaction = msg.myReaction;

      if (msg.myReaction === reaction) {
        // Remove reaction
        nextReactions[reaction as keyof typeof nextReactions] = Math.max(0, (nextReactions[reaction as keyof typeof nextReactions] ?? 0) - 1);
        nextMyReaction = '';
      } else {
        // If there was an old reaction, decrement it
        if (msg.myReaction) {
          nextReactions[msg.myReaction as keyof typeof nextReactions] = Math.max(0, (nextReactions[msg.myReaction as keyof typeof nextReactions] ?? 0) - 1);
        }
        // Add new reaction
        nextReactions[reaction as keyof typeof nextReactions] = (nextReactions[reaction as keyof typeof nextReactions] ?? 0) + 1;
        nextMyReaction = reaction;
      }
      return { ...msg, reactions: nextReactions, myReaction: nextMyReaction };
    }));
  };

  const handleSendChannelMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChannelMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'You (Host)',
        text: newMessage.trim(),
        reactions: { '👍': 0, '🔥': 0, '❤️': 0 },
        myReaction: ''
      }
    ]);
    setNewMessage('');
    toast.success('Broadcast sent to channel members!');
  };

  // 4. Affiliation Badges
  const [affiliationName, setAffiliationName] = useState('Wakka Core Team');
  const [affiliationBadgeColor, setAffiliationBadgeColor] = useState('blue');
  const [isAffiliationVerified, setIsAffiliationVerified] = useState(true);

  // 5. Channel Points Rewards
  const [channelPoints, setChannelPoints] = useState(1500);
  const [activeFrame, setActiveFrame] = useState<'none' | 'rainbow' | 'neon'>('none');
  const [activeBadge, setActiveBadge] = useState<'none' | 'star' | 'crown'>('none');
  const [ownedRewards, setOwnedRewards] = useState<string[]>([]);

  const rewardsList = [
    { id: 'rainbow-frame', name: 'Rainbow Avatar Ring', cost: 500, type: 'frame' },
    { id: 'neon-frame', name: 'Neon Pulsing Border', cost: 750, type: 'frame' },
    { id: 'star-badge', name: 'Exclusive Star Badge', cost: 300, type: 'badge' },
    { id: 'crown-badge', name: 'VIP Crown Badge', cost: 600, type: 'badge' }
  ];

  const handleRedeemReward = (id: string, name: string, cost: number, type: string) => {
    if (channelPoints < cost) {
      toast.error('Insufficient channel points.');
      return;
    }
    if (ownedRewards.includes(id)) {
      toast.error('You already own this reward!');
      return;
    }
    setChannelPoints(prev => prev - cost);
    setOwnedRewards(prev => [...prev, id]);
    toast.success(`Successfully redeemed ${name}!`);

    if (type === 'frame') {
      setActiveFrame(id.split('-')[0] as any);
    } else {
      setActiveBadge(id.split('-')[0] as any);
    }
  };

  const handleToggleEquip = (id: string, type: string) => {
    if (type === 'frame') {
      setActiveFrame(current => current === id.split('-')[0] ? 'none' : (id.split('-')[0] as any));
    } else {
      setActiveBadge(current => current === id.split('-')[0] ? 'none' : (id.split('-')[0] as any));
    }
  };

  // 6. Community Join Requests Queue
  const [joinRequests, setJoinRequests] = useState([
    { id: 'req-1', user: '@creative_mind', community: 'Art & Design', time: '5m ago' },
    { id: 'req-2', user: '@code_runner', community: 'Technology', time: '12m ago' },
    { id: 'req-3', user: '@health_nut', community: 'Health & Wellness', time: '1h ago' }
  ]);

  const handleAcceptJoin = (id: string, user: string, community: string) => {
    setJoinRequests(prev => prev.filter(r => r.id !== id));
    toast.success(`Approved ${user} to join the ${community} community.`);
  };

  const handleRejectJoin = (id: string, user: string, community: string) => {
    setJoinRequests(prev => prev.filter(r => r.id !== id));
    toast.error(`Rejected join request from ${user} for ${community}.`);
  };

  // 7. Custom Soundtrack & Tab Ordering
  const SOUNDTRACK_PRESETS = [
    { id: 'lofi', label: 'Lofi Beats Session', url: 'https://example.com/lofi.mp3' },
    { id: 'synth', label: 'Synthwave Horizon', url: 'https://example.com/synth.mp3' },
    { id: 'acoustic', label: 'Acoustic Chill', url: 'https://example.com/acoustic.mp3' }
  ];
  const [soundtrackId, setSoundtrackId] = useState('lofi');
  const [soundtrackPlaying, setSoundtrackPlaying] = useState(false);
  const [tabsOrder, setTabsOrder] = useState(['Posts', 'Albums', 'Reels', 'Liked', 'Communities']);

  const moveTab = (idx: number, dir: -1 | 1) => {
    const nextTabs = [...tabsOrder];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= nextTabs.length) return;
    [nextTabs[idx], nextTabs[targetIdx]] = [nextTabs[targetIdx], nextTabs[idx]];
    setTabsOrder(nextTabs);
  };

  return (
    <div className="w-full space-y-6">
      {/* Tab Selectors */}
      <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border w-fit">
        <button
          onClick={() => setActiveTab('simulations')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'simulations' 
              ? 'bg-background shadow-md text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Interactive Simulators
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'catalog' 
              ? 'bg-background shadow-md text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Batch 2 Catalog ({BATCH2_FEATURES.length})
        </button>
      </div>

      {activeTab === 'simulations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Collaborative Posts */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base">Collaborative Posts (Collabs)</h3>
            </div>

            {collabStep === 1 && (
              <form onSubmit={handleCollabDraft} className="space-y-3.5">
                <p className="text-xs text-muted-foreground">Invite a co-author to publish a post appearing on both feeds.</p>
                <Input
                  label="Co-Author Username"
                  placeholder="e.g. @nextjs_guru"
                  value={collabCoAuthor}
                  onChange={e => setCollabCoAuthor(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">Post Content</label>
                  <textarea
                    rows={3}
                    placeholder="What would you like to co-author?"
                    value={collabContent}
                    onChange={e => setCollabContent(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 resize-none"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full">
                  Invite & Preview Post
                </Button>
              </form>
            )}

            {collabStep === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground font-semibold">Post Preview (Collab Request):</p>
                <div className="border border-border rounded-2xl p-4 bg-muted/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                      <div className="absolute top-0 left-0 w-7 h-7 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-white ring-2 ring-background">YOU</div>
                      <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-purple-500 text-[10px] font-bold flex items-center justify-center text-white ring-2 ring-background">CO</div>
                    </div>
                    <div>
                      <p className="text-sm font-bold flex items-center gap-1">
                        You <span className="text-xs text-muted-foreground font-medium">collaborating with</span> {collabCoAuthor}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Draft Mode</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{collabContent}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCollabStep(1)} className="flex-1">
                    Edit Draft
                  </Button>
                  <Button size="sm" onClick={handleSendCollab} className="flex-1">
                    Send Invitation
                  </Button>
                </div>
              </div>
            )}

            {collabStep === 3 && (
              <div className="space-y-3 text-center py-6">
                <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm">Invitation Sent!</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Your collaborative post is drafted and pending approval from <span className="font-bold text-foreground">{collabCoAuthor}</span>.
                </p>
                <Button variant="outline" size="sm" onClick={resetCollab} className="mt-2">
                  Create Another Collab
                </Button>
              </div>
            )}
          </Card>

          {/* 2. "Add Yours" Interactive Prompts */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base">&ldquo;Add Yours&rdquo; Prompts</h3>
            </div>
            <p className="text-xs text-muted-foreground">Add responses to trending prompts or write your own answers to custom boxes.</p>
            
            <div className="space-y-3">
              {prompts.map(p => (
                <div key={p.id} className="border border-border/80 rounded-2xl p-3.5 bg-card hover:bg-muted/10 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-primary font-bold uppercase tracking-wider">Add Yours Prompt</p>
                      <p className="text-sm font-bold mt-0.5 text-foreground">{p.text}</p>
                    </div>
                    <Button 
                      size="xs" 
                      variant="outline" 
                      onClick={() => setSelectedPromptId(p.id)}
                    >
                      Add Response
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.responses.map((resp, i) => (
                      <span key={i} className="text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                        {resp}
                      </span>
                    ))}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 pl-1">
                      + {p.responses.length} responses
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedPromptId !== null && (
              <form onSubmit={handleAddResponse} className="bg-muted/30 border border-border p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Your Response to: &ldquo;{prompts.find(p => p.id === selectedPromptId)?.text}&rdquo;
                  </span>
                  <button type="button" onClick={() => setSelectedPromptId(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Type your response..."
                    value={newResponse}
                    onChange={e => setNewResponse(e.target.value)}
                    className="flex-1 bg-background text-xs px-3 py-1.5 rounded-xl border border-input focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                  <Button type="submit" size="xs">
                    Submit
                  </Button>
                </div>
              </form>
            )}
          </Card>

          {/* 3. Broadcast Channels Simulator */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base">Broadcast Channel Feed</h3>
            </div>
            <p className="text-xs text-muted-foreground">Simulator of one-way creator channel feed. React and post announcements.</p>

            <div className="border border-border rounded-2xl bg-muted/10 p-3 h-52 overflow-y-auto space-y-3.5">
              {channelMessages.map(msg => (
                <div key={msg.id} className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded">HOST</span>
                    <span className="text-xs font-bold text-foreground">{msg.sender}</span>
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl p-3 text-xs text-foreground max-w-[90%] shadow-sm">
                    <p>{msg.text}</p>
                    
                    {/* Reactions list */}
                    <div className="flex gap-1.5 mt-2.5">
                      {Object.entries(msg.reactions).map(([reaction, count]) => (
                        <button
                          key={reaction}
                          onClick={() => handleReact(msg.id, reaction)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all ${
                            msg.myReaction === reaction 
                              ? 'bg-primary/20 text-primary border-primary' 
                              : 'bg-muted/50 border-transparent hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          <span>{reaction}</span>
                          <span>{count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChannelMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Broadcast a new message to the channel..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="flex-1 bg-background text-xs px-4 py-2 rounded-xl border border-input focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
              <Button type="submit" size="sm" className="px-4">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </Card>

          {/* 4. Affiliation Badges & Live Profile Preview */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <Award className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base">Affiliation Badges</h3>
            </div>
            <p className="text-xs text-muted-foreground">Setup organization name and verified status to display on your profile badge.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Organization</label>
                  <input
                    type="text"
                    value={affiliationName}
                    onChange={e => setAffiliationName(e.target.value)}
                    className="w-full bg-background text-xs px-3 py-2 rounded-xl border border-input focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase block">Badge Theme</label>
                  <select
                    value={affiliationBadgeColor}
                    onChange={e => setAffiliationBadgeColor(e.target.value)}
                    className="w-full bg-background text-xs px-3 py-2 rounded-xl border border-input focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-semibold"
                  >
                    <option value="blue">Royal Blue</option>
                    <option value="purple">Vibrant Purple</option>
                    <option value="gold">Golden Spark</option>
                    <option value="emerald">Emerald Green</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isAffiliationVerified}
                    onChange={e => setIsAffiliationVerified(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-foreground">Verified Organization</span>
                </label>
              </div>

              {/* Profile Card Preview */}
              <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col items-center justify-center text-center space-y-3">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold border-2 border-background shadow-md`}>
                    JD
                  </div>
                  {isAffiliationVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 border-2 border-background" title="Verified Affiliation">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Jane Doe</h4>
                  <p className="text-[10px] text-muted-foreground">@janedoe</p>
                </div>

                {affiliationName.trim() && (
                  <span 
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm transition-colors ${
                      affiliationBadgeColor === 'blue' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                      affiliationBadgeColor === 'purple' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                      affiliationBadgeColor === 'gold' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    {affiliationName}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* 5. Channel Points & Rewards */}
          <Card className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2 justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base">Channel Points & Rewards</h3>
              </div>
              <div className="bg-primary/10 border border-primary/20 text-primary font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-current" />
                {channelPoints} Points
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Earn points by viewing and participating. Redeem them for exclusive profile customizations and chat items.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Rewards List */}
              <div className="md:col-span-2 space-y-2.5">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Rewards Catalog</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rewardsList.map(reward => {
                    const owned = ownedRewards.includes(reward.id);
                    return (
                      <div key={reward.id} className="border border-border/80 rounded-2xl p-3.5 bg-card flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <div>
                          <p className="font-bold text-sm text-foreground">{reward.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 font-semibold">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {reward.cost} pts
                          </p>
                        </div>
                        {owned ? (
                          <div className="flex gap-2">
                            <span className="text-[10px] font-bold text-green-600 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> Redeemed
                            </span>
                            <Button 
                              size="xs" 
                              variant="outline" 
                              onClick={() => handleToggleEquip(reward.id, reward.type)}
                            >
                              {(reward.type === 'frame' && activeFrame === reward.id.split('-')[0]) ||
                               (reward.type === 'badge' && activeBadge === reward.id.split('-')[0]) ? 'Equipped' : 'Equip'}
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="xs" 
                            disabled={channelPoints < reward.cost} 
                            onClick={() => handleRedeemReward(reward.id, reward.name, reward.cost, reward.type)}
                          >
                            Redeem
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Avatar Frame Preview */}
              <div className="border border-border rounded-3xl p-4 bg-muted/10 flex flex-col items-center justify-center text-center space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Avatar Customization Preview</h4>
                
                {/* Avatar with customized effects */}
                <div className="relative">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-background shadow-lg relative ${
                    activeFrame === 'rainbow' ? 'ring-4 ring-pink-500 animate-pulse border-pink-500' :
                    activeFrame === 'neon' ? 'ring-4 ring-cyan-400 border-cyan-400 shadow-cyan-500/20' : 
                    ''
                  }`}>
                    JD
                    
                    {/* Badge Overlay */}
                    {activeBadge === 'star' && (
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1.5 border-2 border-background shadow-md" title="Star Contributor">
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}
                    {activeBadge === 'crown' && (
                      <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white rounded-full p-1.5 border-2 border-background shadow-md" title="VIP Crown Badge">
                        <Award className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Frame active: <span className="font-bold text-foreground capitalize">{activeFrame}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Badge active: <span className="font-bold text-foreground capitalize">{activeBadge}</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 6. Community Join Requests Queue */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base">Community Join Requests Queue</h3>
            </div>
            <p className="text-xs text-muted-foreground">Approve or reject users requesting membership in your restricted communities.</p>

            <div className="space-y-3.5">
              <AnimatePresence mode="popLayout">
                {joinRequests.length > 0 ? (
                  joinRequests.map(req => (
                    <motion.div
                      key={req.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, x: -30 }}
                      className="border border-border/70 rounded-2xl p-3 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-bold text-foreground">{req.user}</p>
                        <p className="text-xs text-muted-foreground">
                          Wants to join <span className="font-bold text-primary">{req.community}</span> • {req.time}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button 
                          size="xs" 
                          variant="ghost" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleRejectJoin(req.id, req.user, req.community)}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="xs" 
                          onClick={() => handleAcceptJoin(req.id, req.user, req.community)}
                        >
                          Approve
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground text-xs italic">
                    All caught up! No pending join requests.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          {/* 7. Soundtracks & Tab Ordering Customizer */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <Music className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base">Soundtrack & Tab Ordering Customizer</h3>
            </div>

            <div className="space-y-4">
              {/* Soundtrack Choice */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Music className="w-3.5 h-3.5" /> Profile Soundtrack
                </label>
                <div className="flex gap-2">
                  <select
                    value={soundtrackId}
                    onChange={e => {
                      setSoundtrackId(e.target.value);
                      setSoundtrackPlaying(false);
                    }}
                    className="flex-1 bg-background text-xs px-3 py-2 rounded-xl border border-input focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-semibold"
                  >
                    {SOUNDTRACK_PRESETS.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <Button 
                    size="sm" 
                    variant={soundtrackPlaying ? 'primary' : 'outline'}
                    onClick={() => setSoundtrackPlaying(!soundtrackPlaying)}
                    className="relative shrink-0 w-10 h-10 p-0 flex items-center justify-center"
                  >
                    {soundtrackPlaying ? (
                      <Pause className="w-4 h-4 fill-current animate-pulse" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </Button>
                </div>
                
                {/* Soundtrack Player Simulation */}
                {soundtrackPlaying && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                    <Disc3 className="w-8 h-8 text-primary animate-[spin_4s_linear_infinite]" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Now Playing</p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {SOUNDTRACK_PRESETS.find(s => s.id === soundtrackId)?.label}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tab Layout Order */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Tab Layout Order</label>
                <p className="text-[11px] text-muted-foreground">Drag or use arrow buttons to arrange tab ordering on your profile view.</p>
                
                <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border/60">
                  {tabsOrder.map((tab, idx) => (
                    <div key={tab} className="flex items-center justify-between p-3 bg-card hover:bg-muted/10 transition-colors">
                      <span className="text-xs font-bold text-foreground capitalize">{tab}</span>
                      <div className="flex items-center gap-1.5">
                        <button 
                          type="button" 
                          onClick={() => moveTab(idx, -1)} 
                          disabled={idx === 0} 
                          className="p-1 rounded bg-muted hover:bg-border disabled:opacity-30 text-foreground transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => moveTab(idx, 1)} 
                          disabled={idx === tabsOrder.length - 1} 
                          className="p-1 rounded bg-muted hover:bg-border disabled:opacity-30 text-foreground transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'catalog' && (
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pb-2 border-b border-border/50">
            <div>
              <h3 className="font-bold text-base text-foreground">Features Catalog</h3>
              <p className="text-xs text-muted-foreground">Browse and search all 240 Batch 2 Interpersonal & Community Engagement features.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value as any); setCurrentPage(1); }}
                className="text-xs bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              >
                <option value="All">All Types</option>
                <option value="Feature">Feature</option>
                <option value="Improvement">Improvement</option>
                <option value="Innovation">Innovation</option>
              </select>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by ID or Name..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-8 pr-3 py-1.5 text-xs w-full bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Feature List Table */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase">
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {paginatedFeatures.length > 0 ? (
                  paginatedFeatures.map(feature => (
                    <tr key={feature.id} className="hover:bg-muted/20 text-foreground">
                      <td className="p-3 font-mono font-bold text-primary">{feature.id}</td>
                      <td className="p-3 font-semibold">{feature.name}</td>
                      <td className="p-3 text-muted-foreground">{feature.category}</td>
                      <td className="p-3 text-muted-foreground font-semibold">{feature.type}</td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20 font-bold text-[10px]">
                          <Check className="h-3 w-3" />
                          {feature.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                      No features found matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground font-semibold">
                Showing {Math.min(filteredFeatures.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredFeatures.length, currentPage * itemsPerPage)} of {filteredFeatures.length} features
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>
                <span className="text-xs font-bold px-2 text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
