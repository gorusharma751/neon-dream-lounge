import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export default function FoodTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { refreshCart } = useCart();

  useEffect(() => {
    supabase.from('food_categories').select('*').order('sort_order').then(({ data }) => {
      if (data) setCategories(data);
    });
    supabase.from('food_items').select('*').eq('is_available', true).then(({ data }) => {
      if (data) setItems(data);
    });
  }, []);

  const addToCart = async (item: FoodItem) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please login to add items');
      return;
    }

    const qty = quantities[item.id] || 1;

    // Check if item already in cart
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', session.user.id)
      .eq('food_item_id', item.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('cart_items').update({ quantity: existing.quantity + qty }).eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert({
        user_id: session.user.id,
        food_item_id: item.id,
        quantity: qty,
      });
    }

    toast.success(`${item.name} added to cart!`);
    refreshCart();
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  const updateQty = (itemId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta),
    }));
  };

  const filteredItems = activeCategory === 'all' ? items : items.filter(i => i.category_id === activeCategory);

  return (
    <div className="px-4 pb-4">
      {/* Category filter - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'all'
              ? 'bg-primary text-primary-foreground neon-glow-blue'
              : 'glass text-muted-foreground'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground neon-glow-blue'
                : 'glass text-muted-foreground'
            }`}
          >
            {cat.icon && <span className="mr-1">{cat.icon}</span>}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Food grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass rounded-xl overflow-hidden border border-border/30"
          >
            {item.image_url && (
              <div className="h-24 overflow-hidden">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
            <div className="p-3">
              <h3 className="font-semibold text-xs text-foreground truncate">{item.name}</h3>
              <p className="text-primary font-orbitron text-sm font-bold mt-1">₹{item.price}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-6 h-6 rounded-full glass flex items-center justify-center text-muted-foreground"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="text-xs font-bold w-5 text-center">{quantities[item.id] || 1}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="w-6 h-6 rounded-full glass flex items-center justify-center text-muted-foreground"
                  >
                    <Plus size={10} />
                  </button>
                </div>
                <Button
                  size="sm"
                  onClick={() => addToCart(item)}
                  className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 text-[10px] h-7 px-2"
                >
                  <Plus size={10} className="mr-0.5" /> Add
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-16">No items available</p>
      )}
    </div>
  );
}
