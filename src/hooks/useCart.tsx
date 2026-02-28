import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { restSelect } from '@/lib/supabaseRest';

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
    const { data } = await restSelect('cart_items', {
      select: 'id',
      user_id: `eq.${session.user.id}`,
    }, session.access_token);
    setCartCount(data?.length || 0);
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
