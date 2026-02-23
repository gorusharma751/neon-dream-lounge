import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  quantity: number;
  food_item_id: string;
  food_items: { name: string; price: number; image_url: string | null } | null;
}

export default function CartPanel() {
  const { cartOpen, setCartOpen, refreshCart } = useCart();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    const { data } = await supabase
      .from('cart_items')
      .select('id, quantity, food_item_id, food_items(name, price, image_url)')
      .eq('user_id', session.user.id);
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (cartOpen) fetchItems();
  }, [cartOpen]);

  const removeItem = async (id: string) => {
    await supabase.from('cart_items').delete().eq('id', id);
    fetchItems();
    refreshCart();
  };

  const updateQty = async (id: string, qty: number) => {
    if (qty < 1) return removeItem(id);
    await supabase.from('cart_items').update({ quantity: qty }).eq('id', id);
    fetchItems();
  };

  const total = items.reduce((sum, i) => sum + (i.food_items?.price || 0) * i.quantity, 0);

  const handleCheckout = async () => {
    setCheckingOut(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setCheckingOut(false); return; }

    const { data: order, error } = await supabase
      .from('orders')
      .insert({ user_id: session.user.id, total_amount: total, status: 'confirmed' })
      .select()
      .single();

    if (error || !order) {
      toast.error('Checkout failed');
      setCheckingOut(false);
      return;
    }

    const orderItems = items.map(i => ({
      order_id: order.id,
      food_item_id: i.food_item_id,
      item_name: i.food_items?.name || 'Item',
      quantity: i.quantity,
      price: (i.food_items?.price || 0) * i.quantity,
    }));

    await supabase.from('order_items').insert(orderItems);
    await supabase.from('cart_items').delete().eq('user_id', session.user.id);

    toast.success('Order placed successfully! 🎮');
    refreshCart();
    setItems([]);
    setCheckingOut(false);
    setCartOpen(false);
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 glass border-l border-border/30 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="font-orbitron text-lg font-bold text-foreground flex items-center gap-2">
                <ShoppingBag size={20} className="text-primary" />
                Your Cart
              </h2>
              <button onClick={() => setCartOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-10">Your cart is empty</p>
              )}
              {items.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass rounded-lg p-3 flex items-center gap-3"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{item.food_items?.name}</p>
                    <p className="text-xs text-primary font-orbitron">₹{(item.food_items?.price || 0) * item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="text-muted-foreground hover:text-foreground"><Minus size={14} /></button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="text-muted-foreground hover:text-foreground"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t border-border/30 space-y-3">
                <div className="flex justify-between font-orbitron">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">₹{total}</span>
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/80 neon-glow-blue font-orbitron animate-glow-pulse"
                >
                  {checkingOut ? 'Processing...' : 'Checkout'}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
