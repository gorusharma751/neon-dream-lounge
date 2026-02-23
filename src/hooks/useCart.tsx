import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CartContextType {
  cartCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  refreshCart: () => void;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  cartOpen: false,
  setCartOpen: () => {},
  refreshCart: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);

  const refreshCart = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setCartCount(0); return; }
    const { count } = await supabase.from('cart_items').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id);
    setCartCount(count || 0);
  };

  useEffect(() => {
    refreshCart();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => refreshCart());
    return () => subscription.unsubscribe();
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, cartOpen, setCartOpen, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
