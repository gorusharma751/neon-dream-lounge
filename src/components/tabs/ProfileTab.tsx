import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { getSessionSafe } from '@/lib/authHelper';
import { restSelect, restUpdate, restRpc } from '@/lib/supabaseRest';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogOut, Shield, Loader2, Download, Smartphone, Share2 } from 'lucide-react';

export default function ProfileTab() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches) setIsAppInstalled(true);
    window.addEventListener('appinstalled', () => setIsAppInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { toast.success('App installing! 🎮'); setIsAppInstalled(true); }
      setDeferredPrompt(null);
    } else {
      toast.info('Tap the Share button (↑) then "Add to Home Screen" to install the app', { duration: 5000 });
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'Nexus Arena - Gaming Lounge',
      text: 'Check out Nexus Arena! Book gaming slots, order food & more 🎮',
      url: window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') toast.error('Share failed');
      }
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success('Link copied to clipboard! 📋');
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const session = await getSessionSafe();
      if (!session) { setLoading(false); return; }
      const token = session.access_token;

      setUser(session.user);

      const { data: profileArr } = await restSelect('profiles', {
        user_id: `eq.${session.user.id}`,
      }, token);
      setProfile(profileArr?.[0] || null);

      const { data: adminCheck } = await restRpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin',
      }, token);
      setIsAdmin(!!adminCheck);

      const { data: settingsArr } = await restSelect('admin_settings', {
        select: 'about_text',
        limit: '1',
      });
      setSettings(settingsArr?.[0] || null);
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const session = await getSessionSafe();
    if (session) {
      await restUpdate('profiles', {
        full_name: profile.full_name,
        username: profile.username,
        mobile_number: profile.mobile_number,
      }, { user_id: `eq.${user.id}` }, session.access_token);
    }
    toast.success('Profile updated!');
    setSaving(false);
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success('Password updated!'); setNewPassword(''); setShowPasswordChange(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>;

  if (!user) {
    return (
      <div className="px-4 text-center py-16">
        <User size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="font-orbitron text-lg font-bold mb-2">Login Required</h2>
        <p className="text-muted-foreground text-sm mb-4">Sign in to view your profile</p>
        <Button onClick={() => navigate('/auth')} className="bg-primary text-primary-foreground font-orbitron neon-glow-blue">Login / Sign Up</Button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 neon-glow-blue">
          <User size={28} className="text-primary" />
        </div>
        <h2 className="font-orbitron text-base font-bold">{profile?.full_name || profile?.username || 'Gamer'}</h2>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        {isAdmin && <span className="inline-flex items-center gap-1 text-[10px] text-accent font-semibold mt-1"><Shield size={10} /> Admin</span>}
      </motion.div>

      <div className="space-y-3">
        <div className="glass rounded-lg p-3 space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Full Name</label>
            <Input value={profile?.full_name || ''} onChange={e => setProfile((p: any) => ({ ...p, full_name: e.target.value }))} className="bg-muted/30 border-border/50 text-sm mt-1" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Username</label>
            <Input value={profile?.username || ''} onChange={e => setProfile((p: any) => ({ ...p, username: e.target.value }))} className="bg-muted/30 border-border/50 text-sm mt-1" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Mobile Number</label>
            <Input value={profile?.mobile_number || ''} onChange={e => setProfile((p: any) => ({ ...p, mobile_number: e.target.value }))} className="bg-muted/30 border-border/50 text-sm mt-1" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Email</label>
            <Input value={user.email} disabled className="bg-muted/30 border-border/50 text-sm mt-1 opacity-60" />
          </div>
          <Button onClick={saveProfile} disabled={saving} className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron text-xs">
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>

        {settings?.about_text && (
          <div className="glass rounded-lg p-3">
            <h3 className="font-orbitron text-xs font-bold text-primary mb-2">About Us</h3>
            <p className="text-sm text-muted-foreground">{settings.about_text}</p>
          </div>
        )}

        <div className="glass rounded-lg p-3">
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="flex items-center gap-2 text-sm font-semibold w-full">
            <Lock size={14} className="text-muted-foreground" /> Change Password
          </button>
          {showPasswordChange && (
            <div className="mt-3 space-y-2">
              <Input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-muted/30 border-border/50 text-sm" />
              <Button onClick={changePassword} className="w-full bg-accent text-accent-foreground font-orbitron text-xs">Update Password</Button>
            </div>
          )}
        </div>

        {isAdmin && (
          <Button onClick={() => navigate('/admin')} variant="outline" className="w-full border-accent text-accent font-orbitron text-xs">
            <Shield size={14} className="mr-1" /> Open Admin Panel
          </Button>
        )}

        {!isAppInstalled && (
          <Button onClick={handleInstallClick} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-orbitron text-xs neon-glow-blue">
            <Download size={14} className="mr-1" /> Download App
          </Button>
        )}
        {isAppInstalled && (
          <div className="glass rounded-lg p-3 flex items-center gap-2 text-xs text-neon-green"><Smartphone size={14} /> App Installed ✓</div>
        )}

        <Button onClick={handleShareApp} variant="outline" className="w-full border-primary/50 text-primary font-orbitron text-xs hover:bg-primary/10">
          <Share2 size={14} className="mr-1" /> Share App
        </Button>

        <Button onClick={handleLogout} variant="ghost" className="w-full text-destructive hover:text-destructive font-orbitron text-xs">
          <LogOut size={14} className="mr-1" /> Logout
        </Button>
      </div>
    </div>
  );
}
