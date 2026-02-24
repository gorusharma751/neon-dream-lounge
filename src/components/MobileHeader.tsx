import { useState, useEffect } from 'react';
import { Phone, Gamepad2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function MobileHeader() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    supabase.from('admin_settings').select('*').limit(1).single().then(({ data }) => {
      if (data) setSettings(data);
    });
  }, []);

  const handleContact = () => {
    const num = settings?.whatsapp_number || settings?.contact_number || '+919876543210';
    const cleaned = num.replace(/\s/g, '');
    window.open(`https://wa.me/${cleaned.replace('+', '')}`, '_blank');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 glass border-b border-border/30 flex items-center justify-between px-4 safe-area-top">
      <div className="w-10" />
      <div className="flex items-center gap-2">
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt="Logo" className="h-8 w-auto" />
        ) : (
          <Gamepad2 size={22} className="text-primary" />
        )}
        <span className="font-orbitron text-sm font-bold text-primary neon-text-blue">
          NEXUS ARENA
        </span>
      </div>
      <button
        onClick={handleContact}
        className="w-10 h-10 flex items-center justify-center rounded-full glass text-neon-green hover:neon-glow-blue transition-all"
      >
        <Phone size={18} />
      </button>
    </header>
  );
}
