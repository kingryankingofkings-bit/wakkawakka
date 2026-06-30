'use client';

import React, { useState, useMemo } from 'react';
import {
  Search, Sliders, Eye, DollarSign, CreditCard, ShoppingBag, BarChart2,
  MessageSquare, Bot, Key, Webhook, Send, Star, User, Settings,
  ShieldCheck, ChevronLeft, ChevronRight, Lock, CheckCircle2, Copy,
  RefreshCw, Plus, Trash2, Clock, Globe, ArrowRight, Activity, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { batch5Items, Batch5Item } from './batch5Data';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

// ----------------------------------------------------
// Mock Data for Simulators
// ----------------------------------------------------
const MOCK_CREATORS = [
  { id: 'c1', name: 'Alice Dev', handle: 'alicedev', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  { id: 'c2', name: 'Bob Design', handle: 'bobdesign', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
  { id: 'c3', name: 'Charlie Sound', handle: 'charliesound', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
  { id: 'c4', name: 'Dana Vlogs', handle: 'danavlogs', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' }
];

export default function CommerceToolsConsole() {
  const [activeConsoleTab, setActiveConsoleTab] = useState<'catalog' | 'simulators'>('catalog');

  // Catalog State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Feature' | 'Innovation'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Active Simulator Selection
  const [activeSim, setActiveSim] = useState<string>('Digital Tipping Gateway');

  // ----------------------------------------------------
  // Simulator States
  // ----------------------------------------------------

  // 1. Digital Tipping Gateway
  const [selectedCreator, setSelectedCreator] = useState(MOCK_CREATORS[0]);
  const [tipAmount, setTipAmount] = useState<number>(10);
  const [customTipAmount, setCustomTipAmount] = useState<string>('');
  const [tipMessage, setTipMessage] = useState('');
  const [isTipping, setIsTipping] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);

  // 2. Premium Subscriptions
  const [bronzePrice, setBronzePrice] = useState<number>(4.99);
  const [silverPrice, setSilverPrice] = useState<number>(9.99);
  const [goldPrice, setGoldPrice] = useState<number>(19.99);
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedTier, setSelectedTier] = useState<'Bronze' | 'Silver' | 'Gold'>('Silver');
  const [subCardName, setSubCardName] = useState('');
  const [subCardNumber, setSubCardNumber] = useState('');
  const [subCardExpiry, setSubCardExpiry] = useState('');
  const [subCardCVC, setSubCardCVC] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [premiumActive, setPremiumActive] = useState(false);
  const [activePremiumTier, setActivePremiumTier] = useState<string | null>(null);

  // 3. In-chat Product Showcase
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'summary' | 'paying' | 'done'>('summary');
  const [shippingAddress, setShippingAddress] = useState('');
  const [showcaseProduct] = useState({
    id: 'prod-42',
    name: 'Wakka Wakka Official Retro Hoodie',
    price: 49.99,
    rating: 4.9,
    reviews: 142,
    description: 'Limited edition ultra-soft developer hoodie featuring embroidered pixel art graphics.',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400'
  });

  // 4. Engagement Insights
  const [insightsMetric, setInsightsMetric] = useState<'views' | 'profiles' | 'reach' | 'demographics'>('views');
  const [insightsTimeframe, setInsightsTimeframe] = useState<'7d' | '30d'>('7d');

  // 5. Auto-Reply & FAQ Bots
  const [startHours, setStartHours] = useState('09:00');
  const [endHours, setEndHours] = useState('17:00');
  const [awayTemplate, setAwayTemplate] = useState('Hello! Thanks for contacting us. We are currently closed and will respond once we return online.');
  const [faqList, setFaqList] = useState([
    { question: 'refund', answer: 'We offer refunds within 14 days of purchase. Please contact support@wakkawakka.com.' },
    { question: 'shipping', answer: 'Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days.' },
    { question: 'creator', answer: 'You can subscribe to creators by pressing the Premium buttons on their channels.' }
  ]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [botTestQuery, setBotTestQuery] = useState('');
  const [botReplyText, setBotReplyText] = useState<string | null>(null);

  // 6. Developer Tokens & Webhooks
  const [devToken, setDevToken] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('https://api.mybusiness.com/webhooks');
  const [webhookEvent, setWebhookEvent] = useState('tip.received');
  const [webhookLogs, setWebhookLogs] = useState<Array<{ id: string; time: string; payload: string; status: number; response: string }>>([]);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  // ----------------------------------------------------
  // Catalog Filtering & Pagination
  // ----------------------------------------------------
  const filteredItems = useMemo(() => {
    return batch5Items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchQuery, categoryFilter, typeFilter]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ----------------------------------------------------
  // Simulator Functions
  // ----------------------------------------------------

  // 1. Digital Tipping Gateway
  const handleSendTip = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = tipAmount === 0 ? parseFloat(customTipAmount) : tipAmount;
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      toast.error('Please specify a valid tipping amount');
      return;
    }

    setIsTipping(true);
    setTimeout(() => {
      setIsTipping(false);
      setTipSuccess(true);
      toast.success(`Successfully tipped ${selectedCreator.name} $${finalAmount.toFixed(2)}!`);
      // Trigger Webhook if token exists
      simulateWebhookDispatch('tip.received', {
        event: 'tip.received',
        creator: selectedCreator.handle,
        amount: finalAmount,
        message: tipMessage
      });
      setTimeout(() => {
        setTipSuccess(false);
        setTipMessage('');
      }, 5000);
    }, 2000);
  };

  // 2. Premium Subscriptions
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCardName || !subCardNumber || !subCardExpiry || !subCardCVC) {
      toast.error('Please fill in card validation fields');
      return;
    }
    if (subCardNumber.replace(/\s/g, '').length < 16) {
      toast.error('Invalid card number length');
      return;
    }

    setIsSubscribing(true);
    setTimeout(() => {
      setIsSubscribing(false);
      setPremiumActive(true);
      setActivePremiumTier(selectedTier);
      toast.success(`Welcome to Premium! Subscribed to ${selectedTier} tier.`);
      simulateWebhookDispatch('subscription.created', {
        event: 'subscription.created',
        tier: selectedTier,
        billing: billingFrequency,
        status: 'active'
      });
    }, 2500);
  };

  // 3. Product Showcase Buy Now & Checkout
  const handleOpenProductCheckout = () => {
    setCheckoutStep('summary');
    setShowCheckoutModal(true);
  };

  const handleConfirmPurchase = () => {
    if (!shippingAddress.trim()) {
      toast.error('Please enter a shipping address');
      return;
    }
    setCheckoutStep('paying');
    setTimeout(() => {
      setCheckoutStep('done');
      toast.success('Purchase complete! Receipt sent.');
      simulateWebhookDispatch('checkout.success', {
        event: 'checkout.success',
        product_id: showcaseProduct.id,
        amount: showcaseProduct.price,
        shipping: shippingAddress
      });
    }, 2000);
  };

  // 4. Engagement Insights Chart Creators
  const insightsData = useMemo(() => {
    const days = insightsTimeframe === '7d' ? 7 : 30;
    
    if (insightsMetric === 'views') {
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          label: `${date.getMonth() + 1}/${date.getDate()}`,
          value: Math.floor(Math.random() * 1200 + 400)
        };
      });
    } else if (insightsMetric === 'profiles') {
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          label: `${date.getMonth() + 1}/${date.getDate()}`,
          value: Math.floor(Math.random() * 200 + 50)
        };
      });
    } else if (insightsMetric === 'reach') {
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          label: `${date.getMonth() + 1}/${date.getDate()}`,
          value: Math.floor(Math.random() * 2500 + 800)
        };
      });
    } else {
      return [
        { label: 'USA', value: 45 },
        { label: 'Europe', value: 25 },
        { label: 'Canada', value: 15 },
        { label: 'Asia', value: 10 },
        { label: 'Others', value: 5 }
      ];
    }
  }, [insightsMetric, insightsTimeframe]);

  // 5. Bot Auto-Reply & FAQ matches
  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setFaqList([...faqList, { question: newQuestion.toLowerCase().trim(), answer: newAnswer.trim() }]);
    setNewQuestion('');
    setNewAnswer('');
    toast.success('Added FAQ rule');
  };

  const handleRemoveFaq = (idx: number) => {
    const copy = [...faqList];
    copy.splice(idx, 1);
    setFaqList(copy);
    toast.success('Removed FAQ rule');
  };

  const handleTestBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botTestQuery.trim()) return;

    // Check operating hours
    const now = new Date();
    const currentHours = now.getHours();
    const currentMins = now.getMinutes();
    
    const [startH, startM] = startHours.split(':').map(Number);
    const [endH, endM] = endHours.split(':').map(Number);

    const minutesNow = currentHours * 60 + currentMins;
    const minutesStart = startH * 60 + startM;
    const minutesEnd = endH * 60 + endM;

    const isClosed = minutesNow < minutesStart || minutesNow > minutesEnd;

    if (isClosed) {
      setBotReplyText(`[Offline Away-Reply] ${awayTemplate}`);
      return;
    }

    // Match FAQ
    const queryLower = botTestQuery.toLowerCase();
    const match = faqList.find(f => queryLower.includes(f.question));

    if (match) {
      setBotReplyText(`[Auto-Reply FAQ Bot] ${match.answer}`);
    } else {
      setBotReplyText("[FAQ Bot] Sorry, I didn't understand your question. Try asking about 'refund', 'shipping', or 'creator'.");
    }
  };

  // 6. Developer Tokens & Webhooks simulator
  const handleGenerateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = 'wk_live_';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setDevToken(token);
    toast.success('Dev Token generated!');
  };

  const simulateWebhookDispatch = (event: string, payload: any) => {
    if (!webhookUrl.trim() || webhookEvent !== event) return;
    
    setIsSendingWebhook(true);
    const time = new Date().toLocaleTimeString();
    
    setTimeout(() => {
      const mockResponseStatus = 200;
      const mockResponse = JSON.stringify({ success: true, message: 'Received' });
      setWebhookLogs(prev => [
        {
          id: 'log-' + Math.random().toString(36).substr(2, 9),
          time,
          payload: JSON.stringify(payload, null, 2),
          status: mockResponseStatus,
          response: mockResponse
        },
        ...prev
      ]);
      setIsSendingWebhook(false);
      toast.success('Test Webhook payload dispatched successfully!');
    }, 1500);
  };

  const handleTestWebhookSend = () => {
    const samplePayload = {
      event: webhookEvent,
      timestamp: Date.now(),
      data: {
        id: 'evt_' + Math.random().toString(36).substr(2, 9),
        details: 'Mock webhook event validation trigger'
      }
    };
    simulateWebhookDispatch(webhookEvent, samplePayload);
  };

  const clearWebhookLogs = () => {
    setWebhookLogs([]);
    toast.success('Cleared logs');
  };

  return (
    <div className="bg-background text-foreground border border-border rounded-3xl p-5 space-y-6 shadow-sm">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-primary h-6 w-6" />
            Milestone 6 Commerce & Developer Console
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Categories 5, 6, and 8: E-Commerce, Monetization, Creator & Developer Tools
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-muted rounded-full p-1 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveConsoleTab('catalog')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeConsoleTab === 'catalog'
                ? 'bg-card text-card-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Features Catalog (325)
          </button>
          <button
            onClick={() => setActiveConsoleTab('simulators')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeConsoleTab === 'simulators'
                ? 'bg-card text-card-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Interactive Simulators
          </button>
        </div>
      </div>

      {/* Catalog Tab */}
      {activeConsoleTab === 'catalog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="md:col-span-1">
              <Input
                placeholder="Search catalog by name or ID..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              >
                <option value="All">All Categories</option>
                <option value="Monetization & E-Commerce">Monetization & E-Commerce</option>
                <option value="Analytics, Business & Creator Tools">Analytics & Business Tools</option>
                <option value="Developer APIs & Integrations">Developer APIs & Integrations</option>
              </select>
            </div>
            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value as 'All' | 'Feature' | 'Innovation'); setCurrentPage(1); }}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              >
                <option value="All">All Types</option>
                <option value="Feature">Feature</option>
                <option value="Innovation">Innovation</option>
              </select>
            </div>
          </div>

          {/* Table display */}
          <div className="overflow-x-auto border border-border rounded-2xl bg-card/30">
            <table className="w-full border-collapse text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">ID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No matching Batch 5 features found.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map(item => (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{item.id}</td>
                      <td className="p-3 text-muted-foreground text-xs">{item.category}</td>
                      <td className="p-3 font-semibold text-foreground">{item.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.type === 'Innovation'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-1.5 text-xs text-green-500 font-semibold">
                          <CheckCircle2 className="h-4 w-4 fill-current" />
                          Implemented
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                Showing {Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)}-
                {Math.min(filteredItems.length, currentPage * itemsPerPage)} of {filteredItems.length} items
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="text-xs font-semibold px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simulators Tab */}
      {activeConsoleTab === 'simulators' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Simulator Selection List */}
          <div className="lg:col-span-1 space-y-2 border-r border-border/80 pr-0 lg:pr-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">
              Select Module
            </h3>
            {[
              { name: 'Digital Tipping Gateway', icon: DollarSign },
              { name: 'Premium Subscriptions', icon: CreditCard },
              { name: 'In-chat Product Showcase', icon: ShoppingBag },
              { name: 'Engagement Insights', icon: BarChart2 },
              { name: 'Auto-Reply & FAQ Bots', icon: Bot },
              { name: 'Developer Tokens & Webhooks', icon: Webhook }
            ].map(sim => (
              <button
                key={sim.name}
                onClick={() => {
                  setActiveSim(sim.name);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${
                  activeSim === sim.name
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <sim.icon className="h-4 w-4 shrink-0" />
                {sim.name}
              </button>
            ))}
          </div>

          {/* Active Simulator Workspace */}
          <div className="lg:col-span-3 min-h-[350px]">
            {/* 1. Digital Tipping Gateway */}
            {activeSim === 'Digital Tipping Gateway' && (
              <Card padding="md" className="h-full flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Digital Tipping Gateway
                    </h3>
                    {premiumActive && (
                      <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 rounded-full text-[10px] font-bold">
                        Premium Mode Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Support creators on Wakka by sending tips with custom messages.
                  </p>

                  <form onSubmit={handleSendTip} className="space-y-4">
                    {/* Creator Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Select Creator</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {MOCK_CREATORS.map(creator => (
                          <button
                            key={creator.id}
                            type="button"
                            onClick={() => setSelectedCreator(creator)}
                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                              selectedCreator.id === creator.id
                                ? 'border-primary bg-primary/5 text-foreground'
                                : 'border-border bg-card/50 text-muted-foreground hover:text-foreground hover:bg-muted/30'
                            }`}
                          >
                            <img src={creator.avatar} alt={creator.name} className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-[10px] font-semibold truncate max-w-full">{creator.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount Preset */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Tip Amount</label>
                      <div className="flex gap-2">
                        {[5, 10, 20].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => { setTipAmount(amt); setCustomTipAmount(''); }}
                            className={`flex-1 py-2 rounded-xl border font-bold text-xs transition-all ${
                              tipAmount === amt
                                ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                : 'bg-card border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            ${amt}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setTipAmount(0)}
                          className={`flex-1 py-2 rounded-xl border font-bold text-xs transition-all ${
                            tipAmount === 0
                              ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                              : 'bg-card border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {tipAmount === 0 && (
                      <Input
                        type="number"
                        placeholder="Enter custom amount ($)"
                        value={customTipAmount}
                        onChange={e => setCustomTipAmount(e.target.value)}
                        leftIcon={<DollarSign className="h-4 w-4" />}
                      />
                    )}

                    {/* Tip message */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Message (Optional)</label>
                      <textarea
                        value={tipMessage}
                        onChange={e => setTipMessage(e.target.value)}
                        placeholder="Say something nice..."
                        className="w-full text-xs rounded-xl border border-input bg-background p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[60px] resize-none"
                      />
                    </div>

                    <Button type="submit" className="w-full mt-2" isLoading={isTipping}>
                      <Send className="h-3.5 w-3.5" />
                      Send Tip
                    </Button>
                  </form>
                </div>

                {/* Tip Animation overlay */}
                <AnimatePresence>
                  {tipSuccess && (
                    <motion.div
                      className="mt-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center flex-col text-center space-y-2 relative overflow-hidden"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Simulated confetti sparks */}
                      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,theme(colors.green.500)_1px,transparent_1px)] bg-[size:10px_10px]" />
                      <CheckCircle2 className="h-10 w-10 text-green-500 animate-bounce" />
                      <div>
                        <h4 className="font-bold text-sm text-foreground">Tip Sent!</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Thank you for sending ${tipAmount === 0 ? parseFloat(customTipAmount) : tipAmount} to {selectedCreator.name}!
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}

            {/* 2. Premium Subscriptions */}
            {activeSim === 'Premium Subscriptions' && (
              <Card padding="md" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Premium Creator Subscriptions
                  </h3>
                  {premiumActive ? (
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-600 border border-green-500/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      {activePremiumTier} Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-[10px] font-bold">
                      Not Premium
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Set prices, choose billing, fill mock card details, and unlock premium creator privileges.
                </p>

                {/* Tier configurations */}
                <div className="grid grid-cols-3 gap-2 bg-muted/30 p-2.5 rounded-2xl border border-border/80">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground block">Bronze Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-background border border-border rounded-lg text-xs p-1"
                      value={bronzePrice}
                      onChange={e => setBronzePrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground block">Silver Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-background border border-border rounded-lg text-xs p-1"
                      value={silverPrice}
                      onChange={e => setSilverPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-muted-foreground block">Gold Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-background border border-border rounded-lg text-xs p-1"
                      value={goldPrice}
                      onChange={e => setGoldPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <form onSubmit={handleSubscribe} className="space-y-3.5">
                  {/* Frequency & Tier Pick */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Billing Cycle</label>
                      <div className="flex bg-muted p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setBillingFrequency('monthly')}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            billingFrequency === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingFrequency('yearly')}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            billingFrequency === 'yearly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                          }`}
                        >
                          Yearly (20% Off)
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Select Tier</label>
                      <div className="flex bg-muted p-1 rounded-xl">
                        {['Bronze', 'Silver', 'Gold'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedTier(t as any)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              selectedTier === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing preview */}
                  <div className="text-center p-3 rounded-2xl bg-primary/5 border border-primary/20 text-xs font-bold text-primary">
                    Selected Tier Price:{' '}
                    ${(
                      (selectedTier === 'Bronze' ? bronzePrice : selectedTier === 'Silver' ? silverPrice : goldPrice) *
                      (billingFrequency === 'yearly' ? 12 * 0.8 : 1)
                    ).toFixed(2)} / {billingFrequency === 'monthly' ? 'month' : 'year'}
                  </div>

                  {/* Card Credentials Form */}
                  <div className="space-y-2 border-t border-border pt-3">
                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground">Stripe Payment Details</h4>
                    <div className="space-y-2">
                      <Input
                        required
                        placeholder="Cardholder Name"
                        value={subCardName}
                        onChange={e => setSubCardName(e.target.value)}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Input
                            required
                            placeholder="Card Number (e.g. 4242 4242 4242 4242)"
                            value={subCardNumber}
                            onChange={e => setSubCardNumber(e.target.value)}
                            maxLength={19}
                          />
                        </div>
                        <div>
                          <Input
                            required
                            placeholder="MM/YY"
                            value={subCardExpiry}
                            onChange={e => setSubCardExpiry(e.target.value)}
                            maxLength={5}
                          />
                        </div>
                      </div>
                      <Input
                        required
                        placeholder="CVC"
                        value={subCardCVC}
                        onChange={e => setSubCardCVC(e.target.value)}
                        maxLength={3}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" isLoading={isSubscribing}>
                    <Lock className="h-3.5 w-3.5" />
                    Subscribe & Unlock Premium
                  </Button>
                </form>
              </Card>
            )}

            {/* 3. In-chat Product Showcase */}
            {activeSim === 'In-chat Product Showcase' && (
              <Card padding="md" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    In-chat Product Showcase
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Simulate a shoppable card rendered directly in a direct message or group channel.
                </p>

                {/* Simulated Shoppable Card */}
                <div className="border border-border/80 rounded-2xl p-4 bg-muted/20 flex gap-4 max-w-md mx-auto">
                  <img
                    src={showcaseProduct.image}
                    alt={showcaseProduct.name}
                    className="w-24 h-24 rounded-xl object-cover border border-border"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[9px] font-bold uppercase tracking-wider">
                        Shoppable Chat Attachment
                      </span>
                      <h4 className="font-bold text-xs mt-1 text-foreground">{showcaseProduct.name}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                        {showcaseProduct.description}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="font-bold">{showcaseProduct.rating}</span>
                        <span className="text-muted-foreground">({showcaseProduct.reviews} reviews)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                      <span className="text-sm font-bold text-primary">${showcaseProduct.price}</span>
                      <Button size="xs" onClick={handleOpenProductCheckout}>
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Checkout Modal Simulation */}
                <Modal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} title="Checkout Showcase Item">
                  <div className="p-1 space-y-4">
                    {checkoutStep === 'summary' && (
                      <div className="space-y-3">
                        <div className="border border-border p-3 rounded-2xl bg-muted/30">
                          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Order summary</h4>
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{showcaseProduct.name}</span>
                            <span>${showcaseProduct.price}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">Shipping Address</label>
                          <Input
                            placeholder="123 Developer Way, Suite 101, San Jose, CA"
                            value={shippingAddress}
                            onChange={e => setShippingAddress(e.target.value)}
                            required
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-3">
                          <Button variant="ghost" onClick={() => setShowCheckoutModal(false)}>Cancel</Button>
                          <Button onClick={handleConfirmPurchase}>Confirm Purchase</Button>
                        </div>
                      </div>
                    )}

                    {checkoutStep === 'paying' && (
                      <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <div className="h-10 w-10 border-4 border-primary border-t-transparent animate-spin rounded-full" />
                        <span className="text-sm font-bold">Authorizing Sandbox Charge...</span>
                      </div>
                    )}

                    {checkoutStep === 'done' && (
                      <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                        <CheckCircle2 className="h-14 w-14 text-green-500 animate-bounce" />
                        <div>
                          <h4 className="font-bold text-sm">Purchase Complete!</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your order has been authorized and dispatched. Shipping updates will arrive shortly.
                          </p>
                        </div>
                        <Button onClick={() => setShowCheckoutModal(false)} className="w-full">
                          Done
                        </Button>
                      </div>
                    )}
                  </div>
                </Modal>
              </Card>
            )}

            {/* 4. Engagement Insights */}
            {activeSim === 'Engagement Insights' && (
              <Card padding="md" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    Engagement Insights
                  </h3>
                  <div className="flex bg-muted p-0.5 rounded-lg border border-border">
                    <button
                      onClick={() => setInsightsTimeframe('7d')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        insightsTimeframe === '7d' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}
                    >
                      7d
                    </button>
                    <button
                      onClick={() => setInsightsTimeframe('30d')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        insightsTimeframe === '30d' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                      }`}
                    >
                      30d
                    </button>
                  </div>
                </div>

                {/* Metric Selector Buttons */}
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-muted/40 rounded-xl">
                  {[
                    { id: 'views', label: 'View Count', icon: Eye },
                    { id: 'profiles', label: 'Profile Views', icon: User },
                    { id: 'reach', label: 'Weekly Reach', icon: Activity },
                    { id: 'demographics', label: 'Demographics', icon: Globe }
                  ].map(metric => (
                    <button
                      key={metric.id}
                      onClick={() => setInsightsMetric(metric.id as any)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all ${
                        insightsMetric === metric.id
                          ? 'bg-card text-primary shadow-sm border border-border'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <metric.icon className="h-4 w-4" />
                      <span className="text-[9px] font-bold whitespace-nowrap">{metric.label}</span>
                    </button>
                  ))}
                </div>

                {/* Render Mini Charts */}
                {insightsMetric === 'demographics' ? (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Follower Demographics</h4>
                    <div className="space-y-2">
                      {insightsData.map(dem => (
                        <div key={dem.label} className="flex items-center gap-3">
                          <span className="text-xs font-semibold w-16 text-muted-foreground">{dem.label}</span>
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${dem.value}%` }} />
                          </div>
                          <span className="text-xs font-bold w-8 text-right">{dem.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="flex items-end gap-1.5 h-36 border-b border-border/80 pb-1">
                      {insightsData.map((d, i) => {
                        const maxValue = Math.max(...insightsData.map(d => d.value));
                        const pct = (d.value / (maxValue || 1)) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                            <div
                              className="w-full bg-primary/70 group-hover:bg-primary rounded-t transition-all cursor-pointer relative"
                              style={{ height: `${pct}%` }}
                              title={`${d.label}: ${d.value}`}
                            >
                              {/* Hover Value Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                                {d.value}
                              </div>
                            </div>
                            <span className="text-[8px] text-muted-foreground font-mono mt-1 rotate-45 sm:rotate-0">
                              {d.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* 5. Auto-Reply & FAQ Bots */}
            {activeSim === 'Auto-Reply & FAQ Bots' && (
              <Card padding="md" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                    <Bot className="h-5 w-5 text-primary" />
                    Auto-Reply & FAQ Bots
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure business operating hours, away message template, and custom FAQ response rules.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Config Column */}
                  <div className="space-y-3.5 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Settings</h4>
                    
                    {/* Hours */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground">Opening Hours</label>
                        <input
                          type="time"
                          value={startHours}
                          onChange={e => setStartHours(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg text-xs p-1.5"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground">Closing Hours</label>
                        <input
                          type="time"
                          value={endHours}
                          onChange={e => setEndHours(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg text-xs p-1.5"
                        />
                      </div>
                    </div>

                    {/* Away Message */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground">Away Reply Template</label>
                      <textarea
                        value={awayTemplate}
                        onChange={e => setAwayTemplate(e.target.value)}
                        className="w-full text-xs rounded-xl border border-input bg-background p-2.5 min-h-[50px] resize-none"
                      />
                    </div>

                    {/* Add FAQ rule */}
                    <form onSubmit={handleAddFaq} className="space-y-2 border-t border-border pt-3">
                      <h5 className="text-[9px] font-bold text-muted-foreground uppercase">Add FAQ Mapping</h5>
                      <div className="flex gap-2">
                        <input
                          placeholder="keyword"
                          value={newQuestion}
                          onChange={e => setNewQuestion(e.target.value)}
                          className="flex-1 bg-background border border-border rounded-lg text-xs p-1.5"
                        />
                        <input
                          placeholder="auto answer response"
                          value={newAnswer}
                          onChange={e => setNewAnswer(e.target.value)}
                          className="flex-1 bg-background border border-border rounded-lg text-xs p-1.5"
                        />
                        <Button size="xs" type="submit" className="shrink-0 h-8">Add</Button>
                      </div>
                    </form>
                  </div>

                  {/* Test & Mappings Column */}
                  <div className="space-y-3.5">
                    {/* Active Rules list */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active FAQ Mappings</h4>
                      <div className="space-y-1.5 max-h-24 overflow-y-auto border border-border rounded-xl p-2 bg-muted/20">
                        {faqList.map((f, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] bg-card border border-border px-2 py-1 rounded-lg">
                            <span className="font-semibold text-primary font-mono">&quot;{f.question}&quot;</span>
                            <span className="truncate max-w-[120px] ml-2 text-muted-foreground">{f.answer}</span>
                            <button onClick={() => handleRemoveFaq(idx)} className="text-red-500 hover:text-red-600 ml-auto shrink-0">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Simulator chat validation */}
                    <form onSubmit={handleTestBot} className="space-y-2 border-t border-border pt-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Test FAQ Bot</h4>
                      <div className="flex gap-2">
                        <input
                          placeholder="Type a message (e.g. 'refund policy?')"
                          value={botTestQuery}
                          onChange={e => setBotTestQuery(e.target.value)}
                          className="flex-1 bg-background border border-border rounded-lg text-xs p-2"
                        />
                        <Button size="sm" type="submit" className="h-8">Ask Bot</Button>
                      </div>

                      <AnimatePresence>
                        {botReplyText && (
                          <motion.div
                            className="p-3 bg-muted/40 border border-border rounded-xl text-xs space-y-1"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                          >
                            <span className="text-[9px] uppercase font-bold text-primary block">Bot Output Response:</span>
                            <p className="text-foreground leading-relaxed font-medium">{botReplyText}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>
                  </div>
                </div>
              </Card>
            )}

            {/* 6. Developer Tokens & Webhooks */}
            {activeSim === 'Developer Tokens & Webhooks' && (
              <Card padding="md" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                    <Webhook className="h-5 w-5 text-primary" />
                    Developer Tokens & Webhooks
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Generate API credentials, subscribe webhook endpoints to live creator events, and test dispatches.
                </p>

                <div className="space-y-3.5">
                  {/* Token generator */}
                  <div className="p-3 rounded-2xl bg-muted/20 border border-border flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Client API Token</h4>
                      <p className="font-mono text-xs truncate font-semibold mt-1">
                        {devToken || 'Click button to generate a sandbox API Token...'}
                      </p>
                    </div>
                    {devToken ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          navigator.clipboard.writeText(devToken);
                          toast.success('Copied API Token!');
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                    ) : (
                      <Button size="xs" onClick={handleGenerateToken}>
                        <Key className="h-3.5 w-3.5" />
                        Generate
                      </Button>
                    )}
                  </div>

                  {/* Webhook Config Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Webhook Settings</h4>
                      <div className="space-y-2">
                        <Input
                          placeholder="Destination URL (https://...)"
                          value={webhookUrl}
                          onChange={e => setWebhookUrl(e.target.value)}
                        />
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground block">Event Subscription</label>
                          <select
                            value={webhookEvent}
                            onChange={e => setWebhookEvent(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg text-xs p-2"
                          >
                            <option value="tip.received">tip.received</option>
                            <option value="subscription.created">subscription.created</option>
                            <option value="checkout.success">checkout.success</option>
                          </select>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={handleTestWebhookSend}
                          isLoading={isSendingWebhook}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send Mock Test Webhook
                        </Button>
                      </div>
                    </div>

                    {/* Dispatch log tracker */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Webhook Log History</h4>
                        {webhookLogs.length > 0 && (
                          <button onClick={clearWebhookLogs} className="text-red-500 hover:text-red-600 text-[10px] font-bold">
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="border border-border rounded-2xl bg-card/40 p-3 h-32 overflow-y-auto space-y-2 text-[10px]">
                        {webhookLogs.length === 0 ? (
                          <span className="text-muted-foreground block text-center py-8">
                            No webhooks dispatched yet. Trigger an action in the Digital Tipping, Premium, or Chat Showcase simulators.
                          </span>
                        ) : (
                          webhookLogs.map(log => (
                            <div key={log.id} className="border-b border-border/80 pb-2 last:border-b-0 space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-primary font-mono">{log.time}</span>
                                <span className="px-1.5 py-0.5 bg-green-500/10 text-green-600 border border-green-500/30 rounded font-bold">
                                  {log.status} OK
                                </span>
                              </div>
                              <pre className="p-1.5 bg-muted/40 rounded border border-border/50 text-[9px] max-h-16 overflow-y-auto font-mono text-muted-foreground">
                                {log.payload}
                              </pre>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
