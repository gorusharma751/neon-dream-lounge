import { Gamepad2, Instagram, Twitter, Youtube, MapPin, Phone, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/30 py-12 px-4">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-orbitron text-lg font-bold text-primary neon-text-blue mb-4 flex items-center gap-2">
            <Gamepad2 size={20} /> NEXUS ARENA
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Premium gaming experience with top-tier PCs, latest titles, and an incredible atmosphere.
          </p>
        </div>
        <div>
          <h4 className="font-orbitron text-sm font-bold text-foreground mb-4">CONTACT</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><MapPin size={14} /> 123 Gaming Street, Cyber City</p>
            <p className="flex items-center gap-2"><Phone size={14} /> +91 98765 43210</p>
            <p className="flex items-center gap-2"><Clock size={14} /> Open Daily: 10 AM - 2 AM</p>
          </div>
        </div>
        <div>
          <h4 className="font-orbitron text-sm font-bold text-foreground mb-4">FOLLOW US</h4>
          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram size={20} /></a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter size={20} /></a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Youtube size={20} /></a>
          </div>
        </div>
      </div>
      <div className="container mx-auto mt-8 pt-6 border-t border-border/20 text-center text-xs text-muted-foreground">
        © 2026 Nexus Arena. All rights reserved.
      </div>
    </footer>
  );
}
