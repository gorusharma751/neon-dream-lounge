import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Menu, X, User, LogOut, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount, setCartOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.rpc('has_role', { _user_id: session.user.id, _role: 'admin' }).then(({ data }) => setIsAdmin(!!data));
      } else {
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.rpc('has_role', { _user_id: session.user.id, _role: 'admin' }).then(({ data }) => setIsAdmin(!!data));
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-orbitron text-xl font-bold text-primary neon-text-blue">
          NEXUS ARENA
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-muted-foreground hover:text-primary transition-colors font-medium">Home</Link>
          <Link to="/booking" className="text-muted-foreground hover:text-primary transition-colors font-medium">Book Slot</Link>
          {user ? (
            <>
              <button onClick={() => setCartOpen(true)} className="relative text-muted-foreground hover:text-primary transition-colors">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
              {isAdmin && (
                <Link to="/admin" className="text-neon-purple hover:text-secondary transition-colors">
                  <Shield size={20} />
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/80 neon-glow-blue font-orbitron text-xs">
                Login
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-border/30"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <Link to="/" onClick={() => setMenuOpen(false)} className="text-muted-foreground hover:text-primary py-2">Home</Link>
              <Link to="/booking" onClick={() => setMenuOpen(false)} className="text-muted-foreground hover:text-primary py-2">Book Slot</Link>
              {user ? (
                <>
                  <button onClick={() => { setCartOpen(true); setMenuOpen(false); }} className="text-left text-muted-foreground hover:text-primary py-2">Cart ({cartCount})</button>
                  {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-neon-purple py-2">Admin Panel</Link>}
                  <button onClick={handleLogout} className="text-left text-destructive py-2">Logout</button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMenuOpen(false)}>
                  <Button size="sm" className="bg-primary text-primary-foreground w-full font-orbitron text-xs">Login</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
