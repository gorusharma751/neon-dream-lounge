import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import HeroScene from '@/components/HeroScene';
import GameCard from '@/components/GameCard';
import FoodSection from '@/components/FoodSection';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Gamepad2, ChevronDown } from 'lucide-react';

const GAMES = [
  { name: 'Valorant', genre: 'Tactical FPS', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop' },
  { name: 'CS2', genre: 'FPS', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b28?w=400&h=300&fit=crop' },
  { name: 'Fortnite', genre: 'Battle Royale', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop' },
  { name: 'FIFA 25', genre: 'Sports', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop' },
  { name: 'GTA V', genre: 'Open World', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop' },
  { name: 'Minecraft', genre: 'Sandbox', image: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400&h=300&fit=crop' },
];

const Index = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [typedText, setTypedText] = useState('');
  const fullText = 'NEXUS ARENA';

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <HeroScene />
        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Gamepad2 size={48} className="mx-auto mb-6 text-primary animate-float" />
            <h1 className="font-orbitron text-5xl md:text-7xl lg:text-8xl font-black tracking-wider mb-4">
              <span className="text-primary neon-text-blue">{typedText}</span>
              <span className="animate-pulse-neon text-primary">|</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-rajdhani max-w-xl mx-auto mb-8">
              Premium Gaming Lounge • High-End PCs • Epic Experience
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/booking">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron px-8 py-6 text-lg neon-glow-blue animate-glow-pulse">
                  BOOK NOW
                </Button>
              </Link>
              <a href="#games">
                <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 font-orbitron px-8 py-6 text-lg">
                  EXPLORE
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
        <a href="#games" className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-muted-foreground animate-bounce">
          <ChevronDown size={32} />
        </a>
      </section>

      {/* Games Section */}
      <section id="games" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-orbitron text-3xl md:text-4xl font-bold text-center mb-12"
          >
            <span className="text-foreground">OUR</span>{' '}
            <span className="text-secondary neon-text-purple">GAMES</span>
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {GAMES.map((game) => (
              <GameCard
                key={game.name}
                name={game.name}
                image={game.image}
                genre={game.genre}
                onClick={() => setSelectedGame(game.name)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Food Section */}
      <FoodSection />

      {/* Footer */}
      <Footer />

      {/* Game booking dialog */}
      <Dialog open={!!selectedGame} onOpenChange={() => setSelectedGame(null)}>
        <DialogContent className="glass border-border/30">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary">{selectedGame}</DialogTitle>
            <DialogDescription>Book a slot to play {selectedGame} at Nexus Arena</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-muted-foreground text-sm">Choose your preferred time slot and gaming station on the booking page.</p>
            <Link to="/booking" onClick={() => setSelectedGame(null)}>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron neon-glow-blue">
                Go to Booking
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
