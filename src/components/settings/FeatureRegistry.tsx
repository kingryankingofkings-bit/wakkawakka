'use client';

import { useState, useTransition } from 'react';
import { BATCH1_FEATURES, FeatureItem } from './featuresData';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { 
  User, Shield, ShieldAlert, Key, RefreshCw, Send, Check, Download, 
  AlertTriangle, Search, ChevronLeft, ChevronRight, Lock, Eye, 
  AlertCircle, HelpCircle, Users, ToggleLeft, ToggleRight, Laptop,
  Mail, Ban, HelpCircle as HelpIcon, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FeatureRegistry() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'simulations' | 'catalog'>('simulations');

  // --- 1. Multi-Identity Account Switcher ---
  const [activePersona, setActivePersona] = useState<'personal' | 'professional' | 'anonymous'>('personal');
  
  const personaDetails = {
    personal: {
      name: 'Jane Doe (Personal)',
      handle: '@janedoe',
      email: 'jane.doe@example.com',
      avatarBg: 'bg-blue-500',
      badge: 'Personal',
      description: 'Your default profile for friends, family, and casual sharing.'
    },
    professional: {
      name: 'Jane Doe, PhD (Professional)',
      handle: '@jdoe_pro',
      email: 'j.doe@university.edu',
      avatarBg: 'bg-purple-500',
      badge: 'Professional',
      description: 'Your professional persona for research, networking, and public updates.'
    },
    anonymous: {
      name: 'Ghost User',
      handle: '@anon_982',
      email: 'hidden@privacy.org',
      avatarBg: 'bg-zinc-600',
      badge: 'Anonymous',
      description: 'A completely decoupled profile for secure and private browsing.'
    }
  };

  const handlePersonaSwitch = (persona: 'personal' | 'professional' | 'anonymous') => {
    setActivePersona(persona);
    toast.success(`Switched identity to ${personaDetails[persona].name}`);
  };

  // --- 2. Decentralized Password Recovery Network ---
  const [recoveryFriend1, setRecoveryFriend1] = useState('');
  const [recoveryFriend2, setRecoveryFriend2] = useState('');
  const [recoveryFriend3, setRecoveryFriend3] = useState('');
  const [isRecoveryConfigured, setIsRecoveryConfigured] = useState(false);
  const [isGeneratingRecovery, setIsGeneratingRecovery] = useState(false);

  const handleRegisterRecoveryNetwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryFriend1.trim() || !recoveryFriend2.trim() || !recoveryFriend3.trim()) {
      toast.error('Please assign all three trusted recovery friends.');
      return;
    }
    
    setIsGeneratingRecovery(true);
    toast.loading('Splitting cryptographic password key into shares...');

    setTimeout(() => {
      setIsGeneratingRecovery(false);
      setIsRecoveryConfigured(true);
      toast.dismiss();
      toast.success('Decentralized Recovery Network registered successfully!');
    }, 1500);
  };

  const handleResetRecovery = () => {
    setRecoveryFriend1('');
    setRecoveryFriend2('');
    setRecoveryFriend3('');
    setIsRecoveryConfigured(false);
    toast.success('Recovery network configuration reset.');
  };

  // --- 3. Account Alias Migration Redirect Banner ---
  const [newAlias, setNewAlias] = useState('');
  const [aliasActive, setAliasActive] = useState(false);

  const handleToggleAlias = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlias.trim()) {
      toast.error('Please specify a new username alias to redirect to.');
      return;
    }
    if (!newAlias.startsWith('@')) {
      toast.error('Alias username must start with @');
      return;
    }
    setAliasActive(!aliasActive);
    if (!aliasActive) {
      toast.success(`Migration redirect established: old visits will go to ${newAlias}`);
    } else {
      toast.success('Alias migration redirect disabled.');
    }
  };

  // --- 4. 2FA Setup Simulation ---
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFAWizardStep, setTwoFAWizardStep] = useState<1 | 2 | 3>(1);
  const [twoFACode, setTwoFACode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const handleStart2FA = () => {
    setIsSettingUp2FA(true);
    setTwoFAWizardStep(1);
    setTwoFACode('');
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFACode.length !== 6 || isNaN(Number(twoFACode))) {
      toast.error('Please enter a valid 6-digit verification code.');
      return;
    }

    // Success simulation
    setTwoFAWizardStep(3);
    setBackupCodes(['8841-9923', '1042-4912', '7752-0922', '3109-8821']);
  };

  const handleFinish2FA = () => {
    setTwoFAEnabled(true);
    setIsSettingUp2FA(false);
    toast.success('Two-Factor Authentication is now active!');
  };

  const handleDisable2FA = () => {
    setTwoFAEnabled(false);
    toast.success('Two-Factor Authentication has been disabled.');
  };

  // --- 5. Granular Security, Privacy Limits & Data Export ---
  const [securityAlerts, setSecurityAlerts] = useState({
    newDevice: true,
    passwordChange: true,
    suspiciousLocation: true,
  });

  const [privacyLimits, setPrivacyLimits] = useState({
    locationPrecision: 'coarse',
    cameraPermission: 'ask',
    contactsSync: 'weekly',
  });

  const [exportStatus, setExportStatus] = useState<Record<string, 'idle' | 'exporting' | 'ready'>>({
    messages: 'idle',
    logs: 'idle',
    media: 'idle',
  });

  const [exportProgress, setExportProgress] = useState<Record<string, number>>({
    messages: 0,
    logs: 0,
    media: 0,
  });

  const handleTriggerExport = (type: 'messages' | 'logs' | 'media') => {
    setExportStatus(prev => ({ ...prev, [type]: 'exporting' }));
    setExportProgress(prev => ({ ...prev, [type]: 0 }));

    const interval = setInterval(() => {
      setExportProgress(prev => {
        const current = prev[type] || 0;
        if (current >= 100) {
          clearInterval(interval);
          setExportStatus(old => ({ ...old, [type]: 'ready' }));
          toast.success(`Data export archive for ${type} is ready!`);
          return { ...prev, [type]: 100 };
        }
        return { ...prev, [type]: current + 20 };
      });
    }, 200);
  };

  // --- Catalog Search and Pagination ---
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredFeatures = BATCH1_FEATURES.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredFeatures.length / itemsPerPage);
  const paginatedFeatures = filteredFeatures.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Alias Migration Banner Simulation */}
      {aliasActive && newAlias && (
        <div className="rounded-xl border border-amber-500 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">Account Alias Migration Redirect Active</h4>
            <p className="text-xs mt-1">
              Visits to your profile page are being transparently redirected to your migration handle: 
              <span className="font-mono font-bold ml-1 bg-amber-500/20 px-1 rounded">{newAlias}</span>.
            </p>
          </div>
          <Button size="xs" variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20" onClick={() => setAliasActive(false)}>
            Deactivate
          </Button>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-foreground">Advanced Settings & Features</h2>
        <p className="text-sm text-muted-foreground">
          Console and interactive playground simulating Wakka Wakka Batch 1 (Authentication, Account Settings & Privacy) features.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('simulations')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'simulations' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Interactive Simulations
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'catalog' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Batch 1 Feature Catalog ({BATCH1_FEATURES.length})
        </button>
      </div>

      {activeTab === 'simulations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Multi-Identity Account Switcher */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">Multi-Identity Account Switcher</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Allows switching active persona to post, browse, or communicate under different privacy states.
            </p>

            <div className="bg-muted/40 p-4 rounded-xl space-y-3 border border-border/80">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${personaDetails[activePersona].avatarBg}`}>
                  {activePersona === 'anonymous' ? '?' : 'JD'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{personaDetails[activePersona].name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {personaDetails[activePersona].badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{personaDetails[activePersona].handle} · {personaDetails[activePersona].email}</p>
                </div>
              </div>
              <p className="text-xs italic text-muted-foreground">{personaDetails[activePersona].description}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['personal', 'professional', 'anonymous'] as const).map(p => (
                <Button
                  key={p}
                  size="sm"
                  variant={activePersona === p ? 'primary' : 'outline'}
                  onClick={() => handlePersonaSwitch(p)}
                  className="text-xs"
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              ))}
            </div>
          </Card>

          {/* 2. Decentralized Password Recovery Network */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">Decentralized Recovery Network</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Assign 3 trusted recovery friends to hold split cryptographic shares of your master key.
            </p>

            {isRecoveryConfigured ? (
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-700 dark:text-green-400 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <Check className="h-4 w-4" />
                    Recovery Network Configured
                  </div>
                  Shares have been generated and successfully distributed.
                </div>
                <div className="space-y-1 bg-muted/40 p-3 rounded-xl border border-border/60 text-xs">
                  <p className="font-medium text-foreground">Trusted recovery keys assigned to:</p>
                  <p className="font-mono text-muted-foreground mt-1">1. @{recoveryFriend1}</p>
                  <p className="font-mono text-muted-foreground">2. @{recoveryFriend2}</p>
                  <p className="font-mono text-muted-foreground">3. @{recoveryFriend3}</p>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs text-destructive border-destructive/20 hover:bg-destructive/10" onClick={handleResetRecovery}>
                  Reset Network Setup
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRegisterRecoveryNetwork} className="space-y-3">
                <Input
                  required
                  placeholder="Recovery Friend 1 handle (e.g. @alice)"
                  value={recoveryFriend1}
                  onChange={e => setRecoveryFriend1(e.target.value)}
                  className="text-xs"
                  leftIcon={<User className="h-3.5 w-3.5" />}
                />
                <Input
                  required
                  placeholder="Recovery Friend 2 handle (e.g. @bob)"
                  value={recoveryFriend2}
                  onChange={e => setRecoveryFriend2(e.target.value)}
                  className="text-xs"
                  leftIcon={<User className="h-3.5 w-3.5" />}
                />
                <Input
                  required
                  placeholder="Recovery Friend 3 handle (e.g. @charlie)"
                  value={recoveryFriend3}
                  onChange={e => setRecoveryFriend3(e.target.value)}
                  className="text-xs"
                  leftIcon={<User className="h-3.5 w-3.5" />}
                />
                <Button size="sm" type="submit" className="w-full text-xs" isLoading={isGeneratingRecovery}>
                  Generate Recovery Shares
                </Button>
              </form>
            )}
          </Card>

          {/* 3. Account Alias Migration Redirect Banner Console */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <RefreshCw className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">Alias Migration Console</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Simulates redirection of profile traffic when migration to a new handle has been initiated.
            </p>

            <form onSubmit={handleToggleAlias} className="space-y-3">
              <Input
                placeholder="New Alias (e.g. @jdoe_new)"
                value={newAlias}
                onChange={e => setNewAlias(e.target.value)}
                disabled={aliasActive}
                className="text-xs font-mono"
                leftIcon={<User className="h-3.5 w-3.5" />}
              />
              <div className="flex gap-2">
                <Button size="sm" type="submit" variant={aliasActive ? 'destructive' : 'primary'} className="w-full text-xs">
                  {aliasActive ? 'Disable Redirection' : 'Enable Migration Redirect'}
                </Button>
              </div>
            </form>
          </Card>

          {/* 4. 2FA Setup with mock QR code and verification */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">2FA Verification Setup</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure and test TOTP authentication (authenticator app linkage).
            </p>

            {twoFAEnabled ? (
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-700 dark:text-green-400 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <Check className="h-4 w-4" />
                    Two-Factor Authentication Active
                  </div>
                  Your account is protected by code verification.
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs text-destructive border-destructive/20 hover:bg-destructive/10" onClick={handleDisable2FA}>
                  Disable Two-Factor Authentication
                </Button>
              </div>
            ) : isSettingUp2FA ? (
              <div className="space-y-4 bg-muted/20 p-3 rounded-xl border border-border/50">
                {twoFAWizardStep === 1 && (
                  <div className="space-y-3 text-center">
                    <p className="text-xs text-foreground font-medium">1. Scan mock QR code in your app</p>
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 bg-white border border-border rounded-lg">
                        <svg className="w-24 h-24 text-black" viewBox="0 0 100 100">
                          <rect x="5" y="5" width="25" height="25" fill="black" />
                          <rect x="10" y="10" width="15" height="15" fill="white" />
                          <rect x="70" y="5" width="25" height="25" fill="black" />
                          <rect x="75" y="10" width="15" height="15" fill="white" />
                          <rect x="5" y="70" width="25" height="25" fill="black" />
                          <rect x="10" y="75" width="15" height="15" fill="white" />
                          <rect x="35" y="35" width="30" height="30" fill="black" />
                        </svg>
                      </div>
                      <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded font-bold border border-border">MOCK2FASECRETKEY123</code>
                    </div>
                    <Button size="sm" className="w-full text-xs" onClick={() => setTwoFAWizardStep(2)}>
                      Next: Verify Code
                    </Button>
                  </div>
                )}

                {twoFAWizardStep === 2 && (
                  <form onSubmit={handleVerify2FA} className="space-y-3">
                    <p className="text-xs text-foreground font-medium">2. Enter 6-digit confirmation code</p>
                    <Input
                      required
                      placeholder="e.g. 123456"
                      value={twoFACode}
                      onChange={e => setTwoFACode(e.target.value)}
                      maxLength={6}
                      className="text-center font-bold font-mono tracking-widest text-sm"
                      leftIcon={<Key className="h-3.5 w-3.5" />}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="w-1/2 text-xs" onClick={() => setTwoFAWizardStep(1)}>
                        Back
                      </Button>
                      <Button size="sm" type="submit" className="w-1/2 text-xs">
                        Verify
                      </Button>
                    </div>
                  </form>
                )}

                {twoFAWizardStep === 3 && (
                  <div className="space-y-3">
                    <p className="text-xs text-foreground font-bold text-center">3. Secure Backup Codes</p>
                    <p className="text-[10px] text-muted-foreground text-center">Save these code pairs. If you lose your app access, use these.</p>
                    <div className="grid grid-cols-2 gap-1 bg-muted p-2.5 rounded-lg font-mono text-[11px] text-center border border-border">
                      {backupCodes.map((code, idx) => (
                        <div key={idx} className="font-semibold text-foreground">{code}</div>
                      ))}
                    </div>
                    <Button size="sm" className="w-full text-xs" onClick={handleFinish2FA}>
                      Complete & Enable
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button size="sm" className="w-full text-xs" onClick={handleStart2FA}>
                Configure Two-Factor Auth
              </Button>
            )}
          </Card>

          {/* 5. Granular Alerts & Privacy Access Limits */}
          <Card className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">Granular Security alerts & Privacy Access limits</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Security Alert Settings */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Granular Security Notifications</h4>
                <div className="divide-y divide-border/60">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">New Device Logins</p>
                      <p className="text-[10px] text-muted-foreground">Alert when your account is accessed from a new device.</p>
                    </div>
                    <button 
                      onClick={() => setSecurityAlerts(s => ({ ...s, newDevice: !s.newDevice }))} 
                      className="text-primary hover:opacity-85"
                    >
                      {securityAlerts.newDevice ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground/50" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Password Changes</p>
                      <p className="text-[10px] text-muted-foreground">Immediate alerts on any security credential changes.</p>
                    </div>
                    <button 
                      onClick={() => setSecurityAlerts(s => ({ ...s, passwordChange: !s.passwordChange }))} 
                      className="text-primary hover:opacity-85"
                    >
                      {securityAlerts.passwordChange ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground/50" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Suspicious Locations</p>
                      <p className="text-[10px] text-muted-foreground">Trigger alert if logins occur in unfamiliar cities.</p>
                    </div>
                    <button 
                      onClick={() => setSecurityAlerts(s => ({ ...s, suspiciousLocation: !s.suspiciousLocation }))} 
                      className="text-primary hover:opacity-85"
                    >
                      {securityAlerts.suspiciousLocation ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground/50" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy Access Limits */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Privacy Access Constraints</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Location Tracking Accuracy</label>
                    <select
                      value={privacyLimits.locationPrecision}
                      onChange={e => setPrivacyLimits(p => ({ ...p, locationPrecision: e.target.value }))}
                      className="w-full text-xs bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    >
                      <option value="coarse">Coarse Accuracy (Approximate City-Level)</option>
                      <option value="fine">Fine Accuracy (Precise GPS Coordinates)</option>
                      <option value="none">Disabled (Never Share Location Data)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Camera Access Rule</label>
                    <select
                      value={privacyLimits.cameraPermission}
                      onChange={e => setPrivacyLimits(p => ({ ...p, cameraPermission: e.target.value }))}
                      className="w-full text-xs bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    >
                      <option value="ask">Always Ask (Prompt on camera startup)</option>
                      <option value="allow">Always Allow (Background enabled)</option>
                      <option value="deny">Deny Access (Strictly disabled)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Contacts Syncing Frequency</label>
                    <select
                      value={privacyLimits.contactsSync}
                      onChange={e => setPrivacyLimits(p => ({ ...p, contactsSync: e.target.value }))}
                      className="w-full text-xs bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    >
                      <option value="daily">Daily Sync (Live friend updates)</option>
                      <option value="weekly">Weekly Sync (Scheduled updates)</option>
                      <option value="never">Never Sync (Do not load contacts)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Export Triggers Section */}
            <div className="pt-4 border-t border-border/50 space-y-3">
              <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Download className="h-4 w-4" />
                Granular Data Export Triggers
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {([
                  { key: 'messages', label: 'Export Message History' },
                  { key: 'logs', label: 'Export Activity Logs' },
                  { key: 'media', label: 'Export Media Archives' },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="bg-muted/30 border border-border/50 rounded-xl p-3 flex flex-col justify-between gap-2.5">
                    <div>
                      <p className="text-xs font-bold text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Secure snapshot of your {key} database.</p>
                    </div>

                    {exportStatus[key] === 'idle' && (
                      <Button size="xs" variant="outline" className="w-full text-xs" onClick={() => handleTriggerExport(key)}>
                        Trigger Export
                      </Button>
                    )}

                    {exportStatus[key] === 'exporting' && (
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300" 
                            style={{ width: `${exportProgress[key]}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground">Packaging archive {exportProgress[key]}%</p>
                      </div>
                    )}

                    {exportStatus[key] === 'ready' && (
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); toast.success('Mock download started.'); }}
                        className="inline-flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white font-bold h-6 px-2 rounded-full text-xs text-center w-full transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        Download ZIP
                      </a>
                    )}
                  </div>
                ))}
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
              <p className="text-xs text-muted-foreground">Browse all 480 Batch 1 account and privacy features.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Category Selector */}
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="text-xs bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              >
                <option value="All">All Categories</option>
                <option value="Privacy, Security & Safety">Privacy, Security & Safety</option>
                <option value="Account Settings & Authentication">Account Settings & Authentication</option>
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
                  <th className="p-3">Batch</th>
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
                      <td className="p-3 text-muted-foreground font-mono">{feature.batch}</td>
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
              <span className="text-xs text-muted-foreground">
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
