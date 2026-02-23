import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart } from 'lucide-react';
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

export default function FoodSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { refreshCart } = useCart();

  useEffect(() => {
    supabase.from('food_categories').select('*').order('sort_order').then(({ data }) => {
      if (data && data.length > 0) {
        setCategories(data);
        setActiveCategory(data[0].id);
      }
    });
    supabase.from('food_items').select('*').eq('is_available', true).then(({ data }) => {
      if (data) setItems(data);
    });
  }, []);

  const addToCart = async (item: FoodItem) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please login to add items to cart');
      return;
    }
    const { error } = await supabase.from('cart_items').insert({
      user_id: session.user.id,
      food_item_id: item.id,
      quantity: 1,
    });
    if (error) toast.error('Failed to add to cart');
    else {
      toast.success(`${item.name} added to cart!`);
      refreshCart();
    }
  };

  const filteredItems = activeCategory ? items.filter(i => i.category_id === activeCategory) : items;

  if (categories.length === 0) return null;

  return (
    <section id="food" className="py-20 px-4">
      <div className="container mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-orbitron text-3xl md:text-4xl font-bold text-center mb-12"
        >
          <span className="text-foreground">FUEL</span>{' '}
          <span className="text-primary neon-text-blue">UP</span>
        </motion.h2>

        {/* Category filter */}
        <div className="flex gap-3 justify-center mb-10 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full font-rajdhani font-semibold text-sm transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground neon-glow-blue'
                  : 'glass text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Food grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl overflow-hidden border border-border/30 group hover:neon-border-purple transition-all duration-300"
            >
              {item.image_url && (
                <div className="h-40 overflow-hidden">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-orbitron text-sm font-bold text-foreground">{item.name}</h3>
                {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-primary font-orbitron font-bold">₹{item.price}</span>
                  <Button
                    size="sm"
                    onClick={() => addToCart(item)}
                    className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 text-xs group-hover:animate-pulse-neon"
                  >
                    <Plus size={14} />
                    Add
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <p className="text-center text-muted-foreground py-10">No items available in this category yet.</p>
        )}
      </div>
    </section>
  );
}
