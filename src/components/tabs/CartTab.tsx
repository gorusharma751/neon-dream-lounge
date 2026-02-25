import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingBag, CalendarDays, Loader2, CheckCircle, Clock, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CartItem {
  id: string;
  quantity: number;
  food_item_id: string;
  food_items: { name: string; price: number; image_url: string | null } | null;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: { item_name: string; quantity: number; price: number }[];
}

interface Booking {
  id: string;
  status: string;
  created_at: string;
  gaming_stations: { name: string } | null;
  time_slots: { start_time: string; end_time: string } | null;
}

export default function CartTab() {
  const { refreshCart } = useCart();
  const [items, setItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    // Fetch cart items
    const { data: cartData } = await supabase
      .from('cart_items')
      .select('id, quantity, food_item_id, food_items(name, price, image_url)')
      .eq('user_id', session.user.id);
    setItems((cartData as any) || []);

    // Fetch orders with items
    const { data: orderData } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at, order_items(item_name, quantity, price)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setOrders((orderData as any) || []);

    // Fetch bookings
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('id, status, created_at, gaming_stations(name), time_slots(start_time, end_time)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setBookings((bookingData as any) || []);

    // Fetch profile for auto-fill
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, mobile_number, username')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (profile) {
      setName(profile.full_name || profile.username || '');
      setMobile(profile.mobile_number || '');
    }

    setLoading(false);
  };

  const removeItem = async (id: string) => {
    await supabase.from('cart_items').delete().eq('id', id);
    fetchAll();
    refreshCart();
  };

  const updateQty = async (id: string, qty: number) => {
    if (qty < 1) return removeItem(id);
    await supabase.from('cart_items').update({ quantity: qty }).eq('id', id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const total = items.reduce((sum, i) => sum + (i.food_items?.price || 0) * i.quantity, 0);

  const handleCheckout = async () => {
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    setCheckingOut(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setCheckingOut(false); return; }

    await supabase.from('profiles').update({
      full_name: name,
      mobile_number: mobile,
    }).eq('user_id', session.user.id);

    if (items.length > 0) {
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
    }

    setCheckoutSuccess(true);
    refreshCart();
    setTimeout(() => {
      setCheckoutSuccess(false);
      fetchAll();
    }, 2500);
    setCheckingOut(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>;
  }

  // Active orders = not completed (confirmed/pending/processing)
  const activeOrders = orders.filter(o => o.status !== 'completed');
  const completedOrders = orders.filter(o => o.status === 'completed');

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' && b.time_slots && new Date(b.time_slots.start_time) >= new Date());
  const pastBookings = bookings.filter(b => !upcomingBookings.includes(b));

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-accent/20 text-accent border-accent/30';
      case 'processing': return 'bg-primary/20 text-primary border-primary/30';
      case 'completed': return 'bg-neon-green/20 text-neon-green border-neon-green/30';
      case 'cancelled': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground border-border/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return '⏳ Processing';
      case 'processing': return '🔄 Preparing';
      case 'completed': return '✅ Completed';
      case 'cancelled': return '❌ Cancelled';
      default: return status;
    }
  };

  return (
    <div className="px-4 pb-4">
      {/* Success animation */}
      <AnimatePresence>
        {checkoutSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80"
          >
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                <CheckCircle size={64} className="text-neon-green mx-auto mb-4" />
              </motion.div>
              <h2 className="font-orbitron text-xl font-bold text-foreground">Order Confirmed!</h2>
              <p className="text-muted-foreground text-sm mt-2">Your order has been placed</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle: Cart / History */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowHistory(false)}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            !showHistory ? 'bg-primary text-primary-foreground neon-glow-blue' : 'glass text-muted-foreground'
          }`}
        >
          <ShoppingBag size={14} className="inline mr-1" /> Cart {items.length > 0 && `(${items.length})`} {activeOrders.length > 0 && `· ${activeOrders.length} active`}
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            showHistory ? 'bg-primary text-primary-foreground neon-glow-blue' : 'glass text-muted-foreground'
          }`}
        >
          <CalendarDays size={14} className="inline mr-1" /> History
        </button>
      </div>

      {!showHistory ? (
        <div className="space-y-4">
          {/* Active Orders (Processing) */}
          {activeOrders.length > 0 && (
            <div>
              <h3 className="font-orbitron text-xs font-bold text-accent mb-2 flex items-center gap-1">
                <Clock size={12} /> ACTIVE ORDERS
              </h3>
              <div className="space-y-2">
                {activeOrders.map(order => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass rounded-lg p-3 border ${getStatusStyle(order.status)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-mono">#{order.id.slice(0, 8)}</p>
                        <p className="text-primary font-orbitron font-bold text-sm">₹{order.total_amount}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusStyle(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    {/* Order items list */}
                    <div className="space-y-1">
                      {order.order_items?.map((oi, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="text-foreground/80">{oi.item_name} × {oi.quantity}</span>
                          <span className="text-muted-foreground">₹{oi.price}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">{format(new Date(order.created_at), 'MMM dd, h:mm a')}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Cart Items */}
          {items.length > 0 && (
            <div>
              {activeOrders.length > 0 && (
                <h3 className="font-orbitron text-xs font-bold text-primary mb-2 flex items-center gap-1">
                  <ShoppingBag size={12} /> NEW ITEMS
                </h3>
              )}
              <div className="space-y-2">
                {items.map(item => (
                  <motion.div key={item.id} layout className="glass rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{item.food_items?.name}</p>
                      <p className="text-xs text-primary font-orbitron">₹{(item.food_items?.price || 0) * item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full glass flex items-center justify-center"><Minus size={10} /></button>
                      <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full glass flex items-center justify-center"><Plus size={10} /></button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-3 pt-3">
                <div className="flex justify-between font-orbitron text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">₹{total}</span>
                </div>
                <div className="space-y-2">
                  <Input placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} className="bg-muted/30 border-border/50 text-sm" />
                  <Input placeholder="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} className="bg-muted/30 border-border/50 text-sm" />
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/80 neon-glow-blue font-orbitron"
                >
                  {checkingOut ? <><Loader2 className="animate-spin mr-2" size={16} /> Processing...</> : 'Confirm Order'}
                </Button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {items.length === 0 && activeOrders.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">Your cart is empty</p>
          )}
        </div>
      ) : (
        // History: completed orders + bookings
        <div className="space-y-4">
          {completedOrders.length === 0 && bookings.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">No history yet</p>
          )}

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <div>
              <h3 className="font-orbitron text-xs font-bold text-neon-green mb-2 flex items-center gap-1">
                <Package size={12} /> COMPLETED ORDERS
              </h3>
              {completedOrders.map(order => (
                <div key={order.id} className="glass rounded-lg p-3 mb-2 opacity-70">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-primary font-orbitron font-bold text-sm">₹{order.total_amount}</p>
                      <div className="mt-1 space-y-0.5">
                        {order.order_items?.map((oi, idx) => (
                          <p key={idx} className="text-[10px] text-muted-foreground">{oi.item_name} × {oi.quantity}</p>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(order.created_at), 'MMM dd, h:mm a')}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green">✅ Done</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bookings */}
          {upcomingBookings.length > 0 && (
            <div>
              <h3 className="font-orbitron text-xs font-bold text-neon-green mb-2">UPCOMING BOOKINGS</h3>
              {upcomingBookings.map(b => (
                <div key={b.id} className="glass rounded-lg p-3 mb-2 border border-neon-green/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{(b.gaming_stations as any)?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {b.time_slots && `${format(new Date((b.time_slots as any).start_time), 'MMM dd, h:mm a')} - ${format(new Date((b.time_slots as any).end_time), 'h:mm a')}`}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green">{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pastBookings.length > 0 && (
            <div>
              <h3 className="font-orbitron text-xs font-bold text-muted-foreground mb-2">PAST BOOKINGS</h3>
              {pastBookings.map(b => (
                <div key={b.id} className="glass rounded-lg p-3 mb-2 opacity-60">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{(b.gaming_stations as any)?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {b.time_slots && `${format(new Date((b.time_slots as any).start_time), 'MMM dd, h:mm a')}`}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
