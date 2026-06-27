'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Globe, MapPin, Link2, User, FileText, Calendar, Palette } from 'lucide-react';
import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { User as UserType } from '@/types';

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

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिंदी' },
];

const editProfileSchema = z.object({
  displayName: z.string().min(1, 'Name is required').max(50, 'Max 50 characters'),
  username: z
    .string()
    .min(3, 'Min 3 characters')
    .max(30, 'Max 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  bio: z.string().max(160, 'Max 160 characters').optional(),
  website: z
    .string()
    .optional()
    .refine((v) => !v || v === '' || /^https?:\/\/.+/.test(v), { message: 'Must be a valid URL' }),
  location: z.string().max(50).optional(),
  birthdate: z.string().optional(),
  language: z.string(),
  accentColor: z.string(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditProfileModalProps {
  user: UserType;
  onClose: () => void;
}

export function EditProfileModal({ user, onClose }: EditProfileModalProps) {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar ?? '');
  const [coverPreview, setCoverPreview] = useState<string>(user.coverImage ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const usernameCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditProfileFormData>({
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
    },
  });

  const watchedBio = watch('bio') ?? '';
  const watchedAccentColor = watch('accentColor');

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

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    setUsernameAvailable(null);
    if (val && val !== user.username && val.length >= 3) {
      usernameCheckTimeout.current = setTimeout(() => {
        // Mock availability check — in a real app, this would be an API call
        const taken = ['admin', 'alex_creates', 'tech_sam', 'maya_lifestyle', 'jordan_music'];
        setUsernameAvailable(!taken.includes(val.toLowerCase()));
      }, 600);
    }
  }

  async function onSubmit(data: EditProfileFormData) {
    setIsSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    updateUser({
      displayName: data.displayName,
      username: data.username,
      bio: data.bio,
      website: data.website,
      location: data.location,
      birthdate: data.birthdate,
      language: data.language,
      accentColor: data.accentColor,
      avatar: avatarPreview || user.avatar,
      coverImage: coverPreview || user.coverImage,
      updatedAt: new Date().toISOString(),
    });
    setIsSaving(false);
    onClose();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <h2 className="text-lg font-semibold">Edit Profile</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">
            <form id="edit-profile-form" onSubmit={handleSubmit(onSubmit)}>
              {/* Cover image */}
              <div className="relative h-32 bg-muted overflow-hidden cursor-pointer group" onClick={() => coverInputRef.current?.click()}>
                {coverPreview ? (
                  <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20" />
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverChange}
                />
              </div>

              {/* Avatar */}
              <div className="px-5 -mt-10 mb-4">
                <div
                  className="relative w-20 h-20 rounded-full ring-4 ring-card overflow-hidden cursor-pointer group"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xl font-bold text-primary">
                      {getInitials(user.displayName)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              {/* Fields */}
              <div className="px-5 pb-5 space-y-4">
                {/* Display Name */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                    <User className="w-3.5 h-3.5" /> Display Name
                  </label>
                  <input
                    {...register('displayName')}
                    type="text"
                    placeholder="Your display name"
                    className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all"
                  />
                  {errors.displayName && (
                    <p className="text-xs text-destructive mt-1">{errors.displayName.message}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                    @ Username
                  </label>
                  <div className="relative">
                    <input
                      {...register('username', {
                        onChange: handleUsernameChange,
                      })}
                      type="text"
                      placeholder="username"
                      className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all pr-8"
                    />
                    {usernameAvailable !== null && (
                      <span className={cn('absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium', usernameAvailable ? 'text-green-500' : 'text-destructive')}>
                        {usernameAvailable ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                  {errors.username && (
                    <p className="text-xs text-destructive mt-1">{errors.username.message}</p>
                  )}
                  {usernameAvailable === true && (
                    <p className="text-xs text-green-500 mt-1">Username is available</p>
                  )}
                  {usernameAvailable === false && (
                    <p className="text-xs text-destructive mt-1">Username is taken</p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                    <FileText className="w-3.5 h-3.5" /> Bio
                  </label>
                  <textarea
                    {...register('bio')}
                    rows={3}
                    placeholder="Tell the world about yourself..."
                    className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all resize-none"
                  />
                  <div className="flex justify-end mt-1">
                    <span className={cn('text-xs', watchedBio.length > 140 ? 'text-orange-500' : 'text-muted-foreground')}>
                      {watchedBio.length}/160
                    </span>
                  </div>
                  {errors.bio && (
                    <p className="text-xs text-destructive">{errors.bio.message}</p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                    <Link2 className="w-3.5 h-3.5" /> Website
                  </label>
                  <input
                    {...register('website')}
                    type="url"
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all"
                  />
                  {errors.website && (
                    <p className="text-xs text-destructive mt-1">{errors.website.message}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </label>
                  <input
                    {...register('location')}
                    type="text"
                    placeholder="City, Country"
                    className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all"
                  />
                </div>

                {/* Birthdate */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Birthdate
                  </label>
                  <input
                    {...register('birthdate')}
                    type="date"
                    className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1.5">
                    <Globe className="w-3.5 h-3.5" /> Language
                  </label>
                  <select
                    {...register('language')}
                    className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-all"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                    <Palette className="w-3.5 h-3.5" /> Accent Color
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setValue('accentColor', color.name)}
                        className={cn(
                          'w-7 h-7 rounded-full ring-offset-2 ring-offset-card transition-all',
                          watchedAccentColor === color.name ? 'ring-2 ring-foreground scale-110' : 'hover:scale-110'
                        )}
                        style={{ backgroundColor: color.hex }}
                        aria-label={`Select ${color.name}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0 bg-card">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-profile-form"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
