'use client';

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Globe, MapPin, Link2, User as UserIcon, FileText, Calendar, Palette, LayoutDashboard, Settings2, Music, EyeOff, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { User as UserType } from '@/types';
import toast from 'react-hot-toast';

const ACCENT_COLORS = [
  { name: 'blue', hex: '#3B82F6' },
  { name: 'purple', hex: '#8B5CF6' },
  { name: 'pink', hex: '#EC4899' },
  { name: 'red', hex: '#EF4444' },
  { name: 'orange', hex: '#F97316' },
  { name: 'yellow', hex: '#EAB308' },
  { name: 'green', hex: '#22C55E' },
  { name: 'teal', hex: '#14B8A6' },
];

const PROFILE_THEMES = [
  { id: 'none', label: 'Default', bg: 'bg-background border-border' },
  { id: 'ocean', label: 'Ocean Depth', bg: 'bg-gradient-to-br from-blue-900/40 to-teal-900/40 border-blue-500/20' },
  { id: 'sunset', label: 'Warm Sunset', bg: 'bg-gradient-to-br from-orange-500/30 to-pink-500/30 border-orange-500/20' },
  { id: 'aurora', label: 'Neon Aurora', bg: 'bg-gradient-to-br from-purple-600/30 via-pink-500/30 to-blue-500/30 border-purple-500/20' },
  { id: 'midnight', label: 'Midnight Glass', bg: 'bg-black/60 backdrop-blur-2xl border-white/10' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
];

const ALL_TABS = ['posts', 'albums', 'reels', 'tagged', 'liked', 'communities'];

const editProfileSchema = z.object({
  displayName: z.string().min(1, 'Name is required').max(50, 'Max 50 characters'),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(160).optional(),
  website: z.string().optional().refine((v) => !v || /^https?:\/\/.+/.test(v), 'Invalid URL'),
  location: z.string().max(50).optional(),
  birthdate: z.string().optional(),
  language: z.string(),
  accentColor: z.string(),
  profileTheme: z.string().optional(),
  profileSoundtrack: z.string().optional(),
  profileSoundtrackVisible: z.boolean().optional(),
  hideFollowerCount: z.boolean().optional(),
  profileTabOrder: z.array(z.string()).optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditProfileModalProps {
  user: UserType;
  onClose: () => void;
}

type TabSection = 'basic' | 'theme' | 'widgets';

export function EditProfileModal({ user, onClose }: EditProfileModalProps) {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [activeSection, setActiveSection] = useState<TabSection>('basic');
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar ?? '');
  const [coverPreview, setCoverPreview] = useState<string>(user.coverImage ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [spotifyQuery, setSpotifyQuery] = useState('');
  const [spotifyResults, setSpotifyResults] = useState<any[]>([]);
  const [searchingSpotify, setSearchingSpotify] = useState(false);

  async function searchSpotify(q: string) {
    if (!q.trim()) return;
    setSearchingSpotify(true);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        setSpotifyResults(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingSpotify(false);
    }
  }

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: user.displayName,
      username: user.username,
      bio: user.bio ?? '',
      website: user.website ?? '',
      location: user.location ?? '',
      birthdate: user.birthdate ?? '',
      language: user.language ?? 'en',
      accentColor: user.accentColor ?? 'blue',
      profileTheme: user.profileTheme ?? 'none',
      profileSoundtrack: user.profileSoundtrack ?? '',
      profileSoundtrackVisible: user.profileSoundtrackVisible ?? true,
      hideFollowerCount: user.hideFollowerCount ?? false,
      profileTabOrder: user.profileTabOrder ?? ALL_TABS,
    },
  });

  const watchedTheme = watch('profileTheme');
  const watchedTabs = watch('profileTabOrder') ?? ALL_TABS;
  const watchedSoundtrack = watch('profileSoundtrack');
  const watchedSoundtrackVisible = watch('profileSoundtrackVisible') ?? true;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  const moveTab = (idx: number, dir: -1 | 1) => {
    const newTabs = [...watchedTabs];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= newTabs.length) return;
    [newTabs[idx], newTabs[targetIdx]] = [newTabs[targetIdx], newTabs[idx]];
    setValue('profileTabOrder', newTabs, { shouldDirty: true });
  };

  async function onSubmit(data: EditProfileFormData) {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        avatar: avatarPreview || user.avatar,
        coverImage: coverPreview || user.coverImage,
      };

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        updateUser(json.data);
        toast.success('Profile customized successfully!');
        onClose();
      } else {
        const errJson = await res.json();
        toast.error(errJson.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  }

  const sectionVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden h-[85vh] max-h-[800px] flex flex-col sm:flex-row"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sidebar */}
          <div className="w-full sm:w-64 bg-muted/30 border-r border-border shrink-0 flex flex-col">
            <div className="p-5 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Customize</h2>
            </div>
            <div className="p-3 space-y-1 flex-1">
              <SidebarBtn 
                active={activeSection === 'basic'} 
                onClick={() => setActiveSection('basic')} 
                icon={UserIcon} label="Profile & Bio" 
              />
              <SidebarBtn 
                active={activeSection === 'theme'} 
                onClick={() => setActiveSection('theme')} 
                icon={Palette} label="Theme & Layout" 
              />
              <SidebarBtn 
                active={activeSection === 'widgets'} 
                onClick={() => setActiveSection('widgets')} 
                icon={Settings2} label="Widgets & Privacy" 
              />

            </div>
            {/* Mobile close button visible only on small screens inside sidebar area */}
            <div className="p-4 sm:hidden">
              <button onClick={onClose} className="w-full py-2 bg-muted rounded-xl text-sm font-semibold">Close</button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 overflow-y-auto">
              <form id="customize-form" onSubmit={handleSubmit(onSubmit)} className="pb-24">
                <AnimatePresence mode="wait">
                  {/* BASIC SECTION */}
                  {activeSection === 'basic' && (
                    <motion.div key="basic" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2 }} className="p-6">
                      <div className="mb-8">
                        <h3 className="text-lg font-bold mb-1">Public Profile</h3>
                        <p className="text-sm text-muted-foreground">This is how others will see you on Wakka.</p>
                      </div>

                      {/* Cover & Avatar */}
                      <div className="mb-10 relative">
                        <div className="h-40 bg-muted rounded-2xl overflow-hidden relative cursor-pointer group border border-border" onClick={() => coverInputRef.current?.click()}>
                          {coverPreview ? <Image src={coverPreview} alt="Cover" fill className="object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20" />}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                        </div>
                        <div className="absolute -bottom-8 left-6">
                          <div className="w-24 h-24 rounded-full ring-4 ring-background bg-card overflow-hidden cursor-pointer group relative" onClick={() => avatarInputRef.current?.click()}>
                            {avatarPreview ? <Image src={avatarPreview} alt="Avatar" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary bg-primary/10">{getInitials(user.displayName)}</div>}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-6 h-6 text-white" />
                            </div>
                            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                          </div>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Display Name</label>
                            <input {...register('displayName')} className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
                            {errors.displayName && <p className="text-xs text-destructive mt-1">{errors.displayName.message}</p>}
                          </div>
                          <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Username</label>
                            <input {...register('username')} className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
                            {errors.username && <p className="text-xs text-destructive mt-1">{errors.username.message}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Bio</label>
                          <textarea {...register('bio')} rows={3} className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all resize-none" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Website</label>
                            <input {...register('website')} type="url" placeholder="https://" className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Location</label>
                            <input {...register('location')} className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* THEME SECTION */}
                  {activeSection === 'theme' && (
                    <motion.div key="theme" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2 }} className="p-6">
                      <div className="mb-8">
                        <h3 className="text-lg font-bold mb-1">Aesthetics & Layout</h3>
                        <p className="text-sm text-muted-foreground">Make your profile truly yours with custom colors and tab arrangements.</p>
                      </div>

                      <div className="space-y-8">
                        {/* Profile Theme Gradients */}
                        <div>
                          <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> Profile Background Theme</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {PROFILE_THEMES.map(theme => (
                              <div
                                key={theme.id}
                                onClick={() => setValue('profileTheme', theme.id)}
                                className={cn(
                                  'relative h-20 rounded-2xl border-2 cursor-pointer overflow-hidden transition-all flex items-end p-2',
                                  theme.bg,
                                  watchedTheme === theme.id ? 'border-primary ring-2 ring-primary/20 scale-[1.02] shadow-md' : 'hover:scale-[1.02] border-border/50'
                                )}
                              >
                                <span className="text-xs font-bold text-foreground/90 bg-background/50 backdrop-blur-sm px-2 py-0.5 rounded-lg">{theme.label}</span>
                                {watchedTheme === theme.id && <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full shadow-sm" />}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Accent Colors */}
                        <div>
                          <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> UI Accent Color</label>
                          <div className="flex gap-3 flex-wrap bg-muted/20 p-4 rounded-2xl border border-border">
                            <Controller
                              name="accentColor"
                              control={control}
                              render={({ field }) => (
                                <>
                                  {ACCENT_COLORS.map(c => (
                                    <button
                                      key={c.name}
                                      type="button"
                                      onClick={() => field.onChange(c.name)}
                                      className={cn('w-10 h-10 rounded-full transition-transform', field.value === c.name ? 'scale-110 ring-4 ring-background shadow-lg' : 'hover:scale-110 opacity-70')}
                                      style={{ backgroundColor: c.hex }}
                                    />
                                  ))}
                                </>
                              )}
                            />
                          </div>
                        </div>

                        {/* Tab Reordering */}
                        <div>
                          <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-primary" /> Tab Layout Order</label>
                          <div className="bg-muted/20 border border-border rounded-2xl overflow-hidden divide-y divide-border">
                            {watchedTabs.map((tab, idx) => (
                              <div key={tab} className="flex items-center justify-between p-3 bg-card hover:bg-muted/50 transition-colors">
                                <span className="text-sm font-semibold capitalize">{tab}</span>
                                <div className="flex items-center gap-1">
                                  <button type="button" onClick={() => moveTab(idx, -1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                  <button type="button" onClick={() => moveTab(idx, 1)} disabled={idx === watchedTabs.length - 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* WIDGETS SECTION */}
                  {activeSection === 'widgets' && (
                    <motion.div key="widgets" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2 }} className="p-6">
                      <div className="mb-8">
                        <h3 className="text-lg font-bold mb-1">Widgets & Privacy</h3>
                        <p className="text-sm text-muted-foreground">Add interactive elements and control visibility on your profile.</p>
                      </div>

                      <div className="space-y-6">
                        {/* Profile Soundtrack */}
                        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-5 rounded-2xl relative overflow-hidden">
                          <Music className="absolute right-4 top-4 w-24 h-24 text-purple-500/10 -rotate-12" />
                          <label className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><Music className="w-4 h-4 text-purple-500" /> Profile Soundtrack Widget</label>
                          <p className="text-xs text-muted-foreground mb-4 max-w-sm">Search and select a soundtrack for your profile header.</p>
                          
                          {/* Visibility Toggle */}
                          <label className="flex items-center justify-between cursor-pointer p-3 bg-background/50 rounded-xl mb-4 border border-border/40 relative z-10">
                            <div>
                              <span className="text-xs font-semibold block">Enable Soundtrack</span>
                              <span className="text-[10px] text-muted-foreground">Toggle whether the soundtrack is visible and playable on your profile.</span>
                            </div>
                            <input type="checkbox" {...register('profileSoundtrackVisible')} className="w-5 h-5 accent-purple-500 rounded cursor-pointer" />
                          </label>

                          {/* Selected Song Preview */}
                          {watchedSoundtrack ? (
                            <div className="mb-4 p-3 bg-background border border-purple-500/30 rounded-xl flex items-center justify-between relative z-10">
                              <div>
                                <p className="text-xs font-semibold text-foreground">Selected Soundtrack</p>
                                <p className="text-[11px] text-muted-foreground">{watchedSoundtrack.split('|')[0].trim()}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setValue('profileSoundtrack', '')}
                                className="text-xs text-destructive hover:underline font-bold"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="mb-4 text-xs text-muted-foreground relative z-10">No soundtrack selected. Search below to add one!</div>
                          )}

                          {/* Search Widget */}
                          <div className="space-y-2 relative z-10">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Search song or artist..."
                                value={spotifyQuery}
                                onChange={e => setSpotifyQuery(e.target.value)}
                                className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => searchSpotify(spotifyQuery)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
                              >
                                Search
                              </button>
                            </div>

                            {searchingSpotify && <div className="text-xs text-muted-foreground">Searching...</div>}

                            {spotifyResults.length > 0 && (
                              <div className="bg-background border border-border rounded-xl divide-y divide-border overflow-hidden max-h-40 overflow-y-auto">
                                {spotifyResults.map(track => {
                                  const metadata = `${track.title} - ${track.artist} | ${track.previewUrl}`;
                                  return (
                                    <button
                                      key={track.id}
                                      type="button"
                                      onClick={() => {
                                        setValue('profileSoundtrack', metadata);
                                        setSpotifyResults([]);
                                        setSpotifyQuery('');
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 flex flex-col"
                                    >
                                      <span className="font-semibold text-foreground">{track.title}</span>
                                      <span className="text-[10px] text-muted-foreground">{track.artist}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Privacy Toggles */}
                        <div className="border border-border p-5 rounded-2xl space-y-4">
                          <label className="text-sm font-bold text-foreground flex items-center gap-2"><EyeOff className="w-4 h-4 text-primary" /> Profile Data Visibility</label>
                          
                          <label className="flex items-center justify-between cursor-pointer p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                            <div>
                              <span className="text-sm font-semibold block">Hide Follower Count</span>
                              <span className="text-xs text-muted-foreground">Your follower count will be hidden from everyone except you.</span>
                            </div>
                            <input type="checkbox" {...register('hideFollowerCount')} className="w-5 h-5 accent-primary rounded cursor-pointer" />
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}


                </AnimatePresence>
              </form>
            </div>

            {/* Bottom Floating Save Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border flex justify-end gap-3 z-20">
              <button onClick={onClose} className="px-6 py-2.5 text-sm font-semibold rounded-xl hover:bg-muted transition-colors">Cancel</button>
              <button
                type="submit"
                form="customize-form"
                disabled={isSaving}
                className="px-8 py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-70 shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                {isSaving ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'Save Profile'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SidebarBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative overflow-hidden',
        active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      {active && <motion.div layoutId="active-sidebar" className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
      <Icon className={cn('w-4 h-4', active && 'fill-primary/20')} />
      {label}
    </button>
  );
}
