"use client";

import { useState } from "react";
import { useEffect } from "react";
import {
  User,
  UserPlus,
  Bell,
  Eye,
  Shield,
  DollarSign,
  Accessibility,
  Globe,
  Smartphone,
  Moon,
  Sun,
  Monitor,
  Check,
  Download,
  Key,
  Copy,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { CURRENT_USER } from "@/lib/mockData";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";
import { EditProfileModal } from "@/components/profile/EditProfileModal";

type SettingsSection =
  | "account"
  | "privacy"
  | "requests"
  | "notifications"
  | "appearance"
  | "security"
  | "monetization"
  | "accessibility"
  | "fediverse"
  | "advanced";

const SECTIONS = [
  { id: "account" as const, icon: User, label: "Account" },
  { id: "privacy" as const, icon: Eye, label: "Privacy" },
  { id: "requests" as const, icon: UserPlus, label: "Follow Requests" },
  { id: "notifications" as const, icon: Bell, label: "Notifications" },
  { id: "appearance" as const, icon: Monitor, label: "Appearance" },
  { id: "security" as const, icon: Shield, label: "Security" },
  { id: "monetization" as const, icon: DollarSign, label: "Monetization" },
  { id: "accessibility" as const, icon: Accessibility, label: "Accessibility" },
  { id: "fediverse" as const, icon: Globe, label: "Fediverse" },
  {
    id: "advanced" as const,
    icon: ShieldAlert,
    label: "Advanced Settings & Features",
  },
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        checked ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-border/50 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("account");
  const user = useAuthStore((s) => s.user) || CURRENT_USER;
  const updateUser = useAuthStore((s) => s.updateUser);

  // Toggles state
  const [toggles, setToggles] = useState({
    privateAccount: user.isPrivate,
    twoFactor: user.twoFactorEnabled,
    showOnlineStatus: true,
    allowTagging: true,
    showEmail: false,
    showBirthdate: false,
    emailLikes: true,
    emailComments: true,
    emailFollows: true,
    emailDMs: true,
    emailLive: false,
    pushLikes: true,
    pushComments: true,
    pushFollows: true,
    pushDMs: true,
    pushLive: true,
    highContrast: false,
    reduceMotion: false,
    altTextReminders: true,
    fediverseVisible: false,
    tipsEnabled: true,
    subscriptionsEnabled: true,
  });

  const { theme, setTheme } = useTheme();
  const [accentColor, setAccentColor] = useState(user.accentColor || "blue");
  const [dmPermission, setDmPermission] = useState<
    "EVERYONE" | "FOLLOWERS" | "NONE"
  >("EVERYONE");
  const [fontSize, setFontSize] = useState(16);

  // Follow requests state & actions
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (activeSection === "requests") {
      fetchRequests();
    }
  }, [activeSection]);

  async function fetchRequests() {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/users/requests");
      if (res.ok) {
        const json = await res.json();
        setFollowRequests(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRequests(false);
    }
  }

  async function handleRequestAction(
    requestId: string,
    action: "approve" | "reject",
  ) {
    try {
      const res = await fetch(`/api/users/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(
          `Request ${action === "approve" ? "approved" : "rejected"} successfully!`,
        );
        fetchRequests();
      } else {
        toast.error("Failed to process request");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  }

  // 2FA Wizard States
  const [show2FAWizard, setShow2FAWizard] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<1 | 2 | 3 | 4>(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [showEditProfile, setShowEditProfile] = useState(false);

  function setToggle(key: keyof typeof toggles, value: boolean) {
    setToggles((prev) => ({ ...prev, [key]: value }));
    if (key === "privateAccount") {
      updateUser({ isPrivate: value });
    }
    toast.success("Settings saved");
  }

  const ACCENT_COLORS = [
    "blue",
    "purple",
    "pink",
    "red",
    "orange",
    "yellow",
    "green",
    "teal",
  ];

  const handle2FAToggle = (checked: boolean) => {
    if (checked) {
      setTwoFAStep(1);
      setVerificationCode("");
      setShow2FAWizard(true);
    } else {
      setToggles((prev) => ({ ...prev, twoFactor: false }));
      updateUser({ twoFactorEnabled: false });
      toast.success("Two-factor authentication disabled");
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6 || isNaN(Number(verificationCode))) {
      toast.error("Please enter a valid 6-digit numerical code");
      return;
    }
    setTwoFAStep(4);
  };

  const handleFinish2FA = () => {
    setToggles((prev) => ({ ...prev, twoFactor: true }));
    updateUser({ twoFactorEnabled: true });
    setShow2FAWizard(false);
    toast.success("2FA successfully enabled!");
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Section nav */}
        <nav className="md:w-56 md:border-r border-border md:min-h-screen md:sticky md:top-14 p-2 md:py-4 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap md:w-full transition-colors",
                activeSection === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <s.icon className="h-4 w-4 flex-shrink-0" />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 p-4 max-w-2xl">
          {/* Account */}
          {activeSection === "account" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1 text-foreground">
                  Account
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your account information
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 divide-y divide-border">
                <SettingRow label="Display Name" description={user.displayName}>
                  <Button variant="ghost" size="sm" onClick={() => setShowEditProfile(true)}>
                    Edit
                  </Button>
                </SettingRow>
                <SettingRow label="Username" description={`@${user.username}`}>
                  <Button variant="ghost" size="sm" onClick={() => setShowEditProfile(true)}>
                    Change
                  </Button>
                </SettingRow>
                <SettingRow label="Email" description={user.email}>
                  <Button variant="ghost" size="sm">
                    Update
                  </Button>
                </SettingRow>
                <SettingRow label="Password">
                  <Button variant="ghost" size="sm">
                    Change
                  </Button>
                </SettingRow>
                <SettingRow label="Language" description="English">
                  <Button variant="ghost" size="sm">
                    Change
                  </Button>
                </SettingRow>
              </div>
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <h3 className="font-semibold text-destructive">Danger Zone</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Deactivate Account
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Temporarily disable your account
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast("Deactivation requires email confirmation")
                    }
                  >
                    Deactivate
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Delete Account
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete all your data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      toast.error("Account deletion disabled in demo")
                    }
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Follow Requests */}
          {activeSection === "requests" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1 text-foreground">
                  Follow Requests
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage incoming follow requests for your private account
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
                {loadingRequests ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Loading requests...
                  </div>
                ) : followRequests.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No pending follow requests
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {followRequests.map((req: any) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 overflow-hidden relative">
                            {req.follower.avatar ? (
                              <img
                                src={req.follower.avatar}
                                alt={req.follower.displayName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center font-bold text-primary text-sm">
                                {req.follower.displayName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {req.follower.displayName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{req.follower.username}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={() =>
                              handleRequestAction(req.id, "approve")
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() =>
                              handleRequestAction(req.id, "reject")
                            }
                            className="text-destructive hover:bg-destructive/10"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Privacy */}
          {activeSection === "privacy" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1 text-foreground">
                  Privacy
                </h2>
                <p className="text-sm text-muted-foreground">
                  Control who can see your content and interact with you
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 divide-y divide-border">
                <SettingRow
                  label="Private Account"
                  description="Only approved followers can see your posts"
                >
                  <Toggle
                    checked={toggles.privateAccount}
                    onChange={(v) => setToggle("privateAccount", v)}
                  />
                </SettingRow>
                <SettingRow
                  label="Show Online Status"
                  description="Let others see when you're active"
                >
                  <Toggle
                    checked={toggles.showOnlineStatus}
                    onChange={(v) => setToggle("showOnlineStatus", v)}
                  />
                </SettingRow>
                <SettingRow
                  label="Allow Tagging"
                  description="Let others tag you in posts"
                >
                  <Toggle
                    checked={toggles.allowTagging}
                    onChange={(v) => setToggle("allowTagging", v)}
                  />
                </SettingRow>
                <SettingRow label="Show Email on Profile">
                  <Toggle
                    checked={toggles.showEmail}
                    onChange={(v) => setToggle("showEmail", v)}
                  />
                </SettingRow>
                <SettingRow label="Show Birthday on Profile">
                  <Toggle
                    checked={toggles.showBirthdate}
                    onChange={(v) => setToggle("showBirthdate", v)}
                  />
                </SettingRow>
                <SettingRow label="Who can DM you">
                  <select
                    value={dmPermission}
                    onChange={(e) =>
                      setDmPermission(e.target.value as typeof dmPermission)
                    }
                    className="text-sm bg-muted border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  >
                    <option value="EVERYONE">Everyone</option>
                    <option value="FOLLOWERS">Followers</option>
                    <option value="NONE">No one</option>
                  </select>
                </SettingRow>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-3 text-foreground">
                  Data & Privacy
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() =>
                      toast.success(
                        "Export requested! You will receive an email shortly.",
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                    Export My Data
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <User className="h-4 w-4" />
                    View Blocked Users (0)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1 text-foreground">
                  Notifications
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose what you want to be notified about
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
                  Email Notifications
                </h3>
                <div className="divide-y divide-border">
                  {[
                    {
                      key: "emailLikes" as const,
                      label: "Likes on your posts",
                    },
                    {
                      key: "emailComments" as const,
                      label: "Comments on your posts",
                    },
                    { key: "emailFollows" as const, label: "New followers" },
                    { key: "emailDMs" as const, label: "Direct messages" },
                    {
                      key: "emailLive" as const,
                      label: "Live stream notifications",
                    },
                  ].map(({ key, label }) => (
                    <SettingRow key={key} label={label}>
                      <Toggle
                        checked={toggles[key]}
                        onChange={(v) => setToggle(key, v)}
                      />
                    </SettingRow>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
                  Push Notifications
                </h3>
                <div className="divide-y divide-border">
                  {[
                    { key: "pushLikes" as const, label: "Likes" },
                    { key: "pushComments" as const, label: "Comments" },
                    { key: "pushFollows" as const, label: "New followers" },
                    { key: "pushDMs" as const, label: "Direct messages" },
                    { key: "pushLive" as const, label: "Live streams" },
                  ].map(({ key, label }) => (
                    <SettingRow key={key} label={label}>
                      <Toggle
                        checked={toggles[key]}
                        onChange={(v) => setToggle(key, v)}
                      />
                    </SettingRow>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1 text-foreground">
                  Appearance
                </h2>
                <p className="text-sm text-muted-foreground">
                  Customize how Wakka looks for you
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 space-y-5">
                <div>
                  <p className="text-sm font-medium mb-3 text-foreground">
                    Theme
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { value: "light" as const, icon: Sun, label: "Light" },
                        { value: "dark" as const, icon: Moon, label: "Dark" },
                        {
                          value: "system" as const,
                          icon: Monitor,
                          label: "System",
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setTheme(opt.value);
                          updateUser({ theme: opt.value });
                          toast.success(`${opt.label} theme applied`);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                          theme === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/50 text-foreground",
                        )}
                      >
                        <opt.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{opt.label}</span>
                        {theme === opt.value && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-3 text-foreground">
                    Accent Color
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {ACCENT_COLORS.map((color) => {
                      const colorMap: Record<string, string> = {
                        blue: "#3b82f6",
                        purple: "#8b5cf6",
                        pink: "#ec4899",
                        red: "#ef4444",
                        orange: "#f97316",
                        yellow: "#eab308",
                        green: "#22c55e",
                        teal: "#14b8a6",
                      };
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            setAccentColor(color);
                            updateUser({ accentColor: color });
                            toast.success(`${color} accent applied`);
                          }}
                          className={cn(
                            "h-9 w-9 rounded-full transition-all",
                            accentColor === color &&
                              "ring-2 ring-offset-2 ring-foreground scale-110",
                          )}
                          style={{ backgroundColor: colorMap[color] }}
                          title={color}
                        />
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1 text-foreground">
                    Font Size: {fontSize}px
                  </p>
                  <input
                    type="range"
                    min={12}
                    max={22}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Small</span>
                    <span>Large</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1 text-foreground">
                  Security
                </h2>
                <p className="text-sm text-muted-foreground">
                  Protect your account
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 divide-y divide-border">
                <SettingRow
                  label="Two-Factor Authentication"
                  description={
                    toggles.twoFactor
                      ? "Enabled via Authenticator App"
                      : "Add an extra layer of security"
                  }
                >
                  <div className="flex items-center gap-2">
                    {toggles.twoFactor && (
                      <span className="text-xs text-green-500 font-medium">
                        Active
                      </span>
                    )}
                    <Toggle
                      checked={toggles.twoFactor}
                      onChange={handle2FAToggle}
                    />
                  </div>
                </SettingRow>
                <SettingRow label="Active Sessions" description="2 devices">
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                </SettingRow>
                <SettingRow
                  label="Login Activity"
                  description="Last login: Today"
                >
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </SettingRow>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-3 text-foreground">
                  Active Sessions
                </h3>
                {[
                  {
                    device: "Chrome on macOS",
                    location: "San Francisco, CA",
                    time: "Now",
                    current: true,
                  },
                  {
                    device: "iPhone 15 Pro",
                    location: "Los Angeles, CA",
                    time: "2 days ago",
                    current: false,
                  },
                ].map((session, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {session.device}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.location} · {session.time}
                        </p>
                      </div>
                    </div>
                    {session.current ? (
                      <span className="text-xs text-green-500 font-medium">
                        Current
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monetization */}
          {activeSection === "monetization" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1 text-foreground">
                  Monetization
                </h2>
                <p className="text-sm text-muted-foreground">
                  Earn from your content
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 divide-y divide-border">
                <SettingRow
                  label="Accept Tips"
                  description="Let fans send you money"
                >
                  <Toggle
                    checked={toggles.tipsEnabled}
                    onChange={(v) => setToggle("tipsEnabled", v)}
                  />
                </SettingRow>
                <SettingRow
                  label="Subscriptions"
                  description="Offer premium content to paying subscribers"
                >
                  <Toggle
                    checked={toggles.subscriptionsEnabled}
                    onChange={(v) => setToggle("subscriptionsEnabled", v)}
                  />
                </SettingRow>
              </div>
              {toggles.subscriptionsEnabled && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      tier: "Bronze",
                      price: "$2.99",
                      perks: ["Early access", "Bronze badge"],
                    },
                    {
                      tier: "Silver",
                      price: "$9.99",
                      perks: [
                        "Everything in Bronze",
                        "Exclusive posts",
                        "Silver badge",
                      ],
                    },
                    {
                      tier: "Gold",
                      price: "$24.99",
                      perks: [
                        "Everything in Silver",
                        "Direct chat",
                        "Monthly call",
                        "Gold badge",
                      ],
                    },
                  ].map((t) => (
                    <div
                      key={t.tier}
                      className="rounded-xl border border-border bg-card p-3 text-center"
                    >
                      <p className="font-bold text-sm text-foreground">
                        {t.tier}
                      </p>
                      <p className="text-2xl font-extrabold text-primary mt-1">
                        {t.price}
                      </p>
                      <p className="text-xs text-muted-foreground">per month</p>
                      <ul className="mt-2 space-y-1">
                        {t.perks.map((p) => (
                          <li key={p} className="text-xs text-muted-foreground">
                            {p}
                          </li>
                        ))}
                      </ul>
                      <Button
                        size="xs"
                        variant="outline"
                        className="mt-3 w-full"
                      >
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-3 text-foreground">
                  Earnings Overview
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "This Month", value: "$124.50" },
                    { label: "Total Earned", value: "$2,841" },
                    { label: "Subscribers", value: "47" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="text-center p-3 bg-muted rounded-xl"
                    >
                      <p className="text-lg font-bold text-foreground">
                        {value}
                      </p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Accessibility */}
          {activeSection === "accessibility" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1 text-foreground">
                  Accessibility
                </h2>
                <p className="text-sm text-muted-foreground">
                  Make Wakka work better for you
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 divide-y divide-border">
                <SettingRow
                  label="High Contrast Mode"
                  description="Increase contrast for better readability"
                >
                  <Toggle
                    checked={toggles.highContrast}
                    onChange={(v) => setToggle("highContrast", v)}
                  />
                </SettingRow>
                <SettingRow
                  label="Reduce Motion"
                  description="Minimize animations and transitions"
                >
                  <Toggle
                    checked={toggles.reduceMotion}
                    onChange={(v) => setToggle("reduceMotion", v)}
                  />
                </SettingRow>
                <SettingRow
                  label="Alt-Text Reminders"
                  description="Remind you to add alt text to images"
                >
                  <Toggle
                    checked={toggles.altTextReminders}
                    onChange={(v) => setToggle("altTextReminders", v)}
                  />
                </SettingRow>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-3 text-foreground">
                  Keyboard Shortcuts
                </h3>
                <div className="space-y-2">
                  {[
                    { key: "J/K", action: "Next/Previous post" },
                    { key: "L", action: "Like post" },
                    { key: "C", action: "Comment on post" },
                    { key: "/", action: "Focus search" },
                    { key: "G+F", action: "Go to Feed" },
                    { key: "G+E", action: "Go to Explore" },
                    { key: "G+M", action: "Go to Messages" },
                  ].map(({ key, action }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-muted-foreground">
                        {action}
                      </span>
                      <kbd className="text-xs bg-muted border border-border px-2 py-0.5 rounded font-mono text-foreground">
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fediverse */}
          {activeSection === "fediverse" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold mb-1 text-foreground">
                  Fediverse & ActivityPub
                </h2>
                <p className="text-sm text-muted-foreground">
                  Connect with the decentralized social web
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 divide-y divide-border">
                <SettingRow
                  label="Enable Fediverse Visibility"
                  description="Allow Mastodon and other fediverse platforms to interact with your posts"
                >
                  <Toggle
                    checked={toggles.fediverseVisible}
                    onChange={(v) => setToggle("fediverseVisible", v)}
                  />
                </SettingRow>
              </div>
              {toggles.fediverseVisible && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Your ActivityPub Actor URL
                  </h3>
                  <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
                    <code className="text-sm flex-1 text-primary">
                      @{user.username}@wakka.social
                    </code>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `@${user.username}@wakka.social`,
                        );
                        toast.success("Copied!");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Others on the Fediverse can follow you using this address.
                    Your public posts will be federated.
                  </p>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Fediverse Followers
                      </p>
                      <p className="text-xs text-muted-foreground">
                        People following you from external platforms
                      </p>
                    </div>
                    <span className="text-sm font-bold text-foreground">0</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advanced Settings & Features */}
          {activeSection === "advanced" && (
            <div className="text-center py-12 text-muted-foreground">
              Advanced settings are currently unavailable.
            </div>
          )}
        </div>
      </div>

      {/* 2FA Setup Wizard Modal */}
      <Modal
        isOpen={show2FAWizard}
        onClose={() => setShow2FAWizard(false)}
        title="Two-Factor Authentication Setup"
      >
        <div className="p-4 space-y-4">
          <AnimatePresence mode="wait">
            {twoFAStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-center py-4"
              >
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-foreground">
                    Secure your account with 2FA
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Two-factor authentication adds an extra layer of protection.
                    Every time you log in, you will need to enter a 6-digit
                    security code generated by your authenticator app.
                  </p>
                </div>
                <div className="pt-2">
                  <Button onClick={() => setTwoFAStep(2)} className="w-full">
                    Get Started
                  </Button>
                </div>
              </motion.div>
            )}

            {twoFAStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-foreground">
                    1. Link your Authenticator App
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Scan the QR code below using Google Authenticator,
                    1Password, or Authy. If you cannot scan it, you can manually
                    type the secret key.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 py-3">
                  {/* Mock QR Code representation */}
                  <div className="p-2 border-2 border-border rounded-2xl bg-white">
                    <svg className="w-32 h-32 text-black" viewBox="0 0 100 100">
                      <rect x="5" y="5" width="25" height="25" fill="black" />
                      <rect x="10" y="10" width="15" height="15" fill="white" />
                      <rect x="70" y="5" width="25" height="25" fill="black" />
                      <rect x="75" y="10" width="15" height="15" fill="white" />
                      <rect x="5" y="70" width="25" height="25" fill="black" />
                      <rect x="10" y="75" width="15" height="15" fill="white" />
                      <rect x="40" y="20" width="10" height="10" fill="black" />
                      <rect x="50" y="40" width="10" height="10" fill="black" />
                      <rect x="25" y="50" width="15" height="10" fill="black" />
                      <rect x="45" y="75" width="10" height="15" fill="black" />
                      <rect x="80" y="45" width="15" height="10" fill="black" />
                    </svg>
                  </div>
                  <div className="text-center w-full space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">
                      Secret Key
                    </p>
                    <div className="flex items-center justify-center gap-1.5 bg-muted rounded-xl px-3 py-2 border border-border">
                      <code className="text-xs font-mono font-bold text-primary">
                        JBSWY3DPEHPK3PXP
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("JBSWY3DPEHPK3PXP");
                          toast.success("Key copied!");
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="ghost" onClick={() => setTwoFAStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setTwoFAStep(3)}>Next</Button>
                </div>
              </motion.div>
            )}

            {twoFAStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-foreground">
                    2. Verify Setup
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit confirmation code generated in your
                    authenticator app to complete linkage.
                  </p>
                </div>

                <form onSubmit={handleVerify2FA} className="space-y-4 py-2">
                  <Input
                    required
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="text-center text-lg tracking-[0.25em] font-bold text-foreground"
                    leftIcon={<Key className="h-4 w-4 text-muted-foreground" />}
                  />

                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="ghost" onClick={() => setTwoFAStep(2)}>
                      Back
                    </Button>
                    <Button type="submit">Verify Code</Button>
                  </div>
                </form>
              </motion.div>
            )}

            {twoFAStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 text-center py-2"
              >
                <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <Check className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-foreground">
                    2FA Verification Saved!
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Write down these single-use recovery backup codes. If you
                    lose access to your device, you can use these to log back
                    into your account.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-muted/40 border border-border/80 rounded-2xl p-4 font-mono text-sm font-semibold max-w-xs mx-auto text-foreground">
                  <div>1043-9821</div>
                  <div>8854-1290</div>
                  <div>9930-4100</div>
                  <div>4421-0892</div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button onClick={handleFinish2FA} className="w-full">
                    Finish Setup
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>

      {showEditProfile && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditProfile(false)}
        />
      )}
    </div>
  );
}
