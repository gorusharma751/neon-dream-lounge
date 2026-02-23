import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Monitor, UtensilsCrossed, CalendarDays, Package, Plus, Trash2, Bell, Edit, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  // Data
  const [stations, setStations] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Forms
  const [stationForm, setStationForm] = useState({ name: '', station_number: '', hourly_rate: '100', description: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '' });
  const [foodForm, setFoodForm] = useState({ name: '', description: '', price: '', category_id: '', image_url: '' });
  const [showStationDialog, setShowStationDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showFoodDialog, setShowFoodDialog] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/auth'); return; }
      supabase.rpc('has_role', { _user_id: session.user.id, _role: 'admin' }).then(({ data }) => {
        if (!data) { navigate('/'); toast.error('Access denied'); return; }
        setIsAdmin(true);
        fetchAll();
      });
    });
  }, []);

  const fetchAll = () => {
    supabase.from('gaming_stations').select('*').order('station_number').then(({ data }) => data && setStations(data));
    supabase.from('bookings').select('*, gaming_stations(name), time_slots(start_time, end_time)').order('created_at', { ascending: false }).then(({ data }) => data && setBookings(data));
    supabase.from('food_categories').select('*').order('sort_order').then(({ data }) => data && setCategories(data));
    supabase.from('food_items').select('*, food_categories(name)').order('name').then(({ data }) => data && setFoodItems(data));
    supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).then(({ data }) => data && setOrders(data));
  };

  const addStation = async () => {
    const { error } = await supabase.from('gaming_stations').insert({
      name: stationForm.name,
      station_number: parseInt(stationForm.station_number),
      hourly_rate: parseFloat(stationForm.hourly_rate),
      description: stationForm.description || null,
    });
    if (error) toast.error(error.message);
    else { toast.success('Station added!'); setShowStationDialog(false); setStationForm({ name: '', station_number: '', hourly_rate: '100', description: '' }); fetchAll(); }
  };

  const deleteStation = async (id: string) => {
    await supabase.from('gaming_stations').delete().eq('id', id);
    toast.success('Station removed');
    fetchAll();
  };

  const addCategory = async () => {
    const { error } = await supabase.from('food_categories').insert({ name: categoryForm.name, icon: categoryForm.icon || null });
    if (error) toast.error(error.message);
    else { toast.success('Category added!'); setShowCategoryDialog(false); setCategoryForm({ name: '', icon: '' }); fetchAll(); }
  };

  const addFoodItem = async () => {
    const { error } = await supabase.from('food_items').insert({
      name: foodForm.name,
      description: foodForm.description || null,
      price: parseFloat(foodForm.price),
      category_id: foodForm.category_id,
      image_url: foodForm.image_url || null,
    });
    if (error) toast.error(error.message);
    else { toast.success('Food item added!'); setShowFoodDialog(false); setFoodForm({ name: '', description: '', price: '', category_id: '', image_url: '' }); fetchAll(); }
  };

  const generateSlots = async (stationId: string) => {
    // Generate slots for today and tomorrow
    const slotsToInsert: any[] = [];
    for (let day = 0; day < 2; day++) {
      const base = new Date();
      base.setDate(base.getDate() + day);
      base.setHours(8, 0, 0, 0);
      for (let h = 0; h < 16; h++) {
        const start = new Date(base);
        start.setHours(8 + h);
        const end = new Date(start);
        end.setHours(start.getHours() + 1);
        slotsToInsert.push({
          station_id: stationId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        });
      }
    }
    const { error } = await supabase.from('time_slots').insert(slotsToInsert);
    if (error) toast.error(error.message);
    else toast.success('Time slots generated!');
  };

  if (isAdmin === null) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  const todayBookings = bookings.filter(b => {
    const d = new Date(b.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'stations', label: 'Stations', icon: Monitor },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'food', label: 'Food Menu', icon: UtensilsCrossed },
    { id: 'orders', label: 'Orders', icon: Package },
  ];

  return (
    <div className="min-h-screen pt-20 px-4 pb-10">
      <div className="container mx-auto">
        <h1 className="font-orbitron text-2xl font-bold mb-6 text-foreground flex items-center gap-3">
          <span className="text-primary">⚡</span> Admin Panel
          <div className="relative ml-auto">
            <Bell size={20} className="text-muted-foreground" />
            {todayBookings.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] flex items-center justify-center text-destructive-foreground animate-pulse-neon">
                {todayBookings.length}
              </span>
            )}
          </div>
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground neon-glow-blue'
                  : 'glass text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Stations', value: stations.length, color: 'text-primary' },
              { label: "Today's Bookings", value: todayBookings.length, color: 'text-neon-green' },
              { label: 'Menu Items', value: foodItems.length, color: 'text-secondary' },
              { label: 'Total Orders', value: orders.length, color: 'text-neon-pink' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-6 border border-border/30"
              >
                <p className="text-muted-foreground text-xs font-semibold uppercase">{stat.label}</p>
                <p className={`font-orbitron text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stations */}
        {activeTab === 'stations' && (
          <div>
            <Button onClick={() => setShowStationDialog(true)} className="mb-4 bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron text-xs">
              <Plus size={14} className="mr-1" /> Add Station
            </Button>
            <div className="glass rounded-xl border border-border/30 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30">
                    <TableHead className="text-muted-foreground">#</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Rate/hr</TableHead>
                    <TableHead className="text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map(s => (
                    <TableRow key={s.id} className="border-border/20">
                      <TableCell>{s.station_number}</TableCell>
                      <TableCell className="font-semibold">{s.name}</TableCell>
                      <TableCell className="text-primary">₹{s.hourly_rate}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => generateSlots(s.id)} className="text-xs border-border/30">
                            <Clock size={12} className="mr-1" /> Gen Slots
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteStation(s.id)} className="text-destructive hover:text-destructive">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Bookings */}
        {activeTab === 'bookings' && (
          <div className="glass rounded-xl border border-border/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30">
                  <TableHead className="text-muted-foreground">Station</TableHead>
                  <TableHead className="text-muted-foreground">Time</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Booked At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map(b => (
                  <TableRow key={b.id} className="border-border/20">
                    <TableCell className="font-semibold">{(b.gaming_stations as any)?.name}</TableCell>
                    <TableCell className="text-sm">
                      {b.time_slots ? `${format(new Date((b.time_slots as any).start_time), 'h:mm a')} - ${format(new Date((b.time_slots as any).end_time), 'h:mm a')}` : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${b.status === 'confirmed' ? 'bg-neon-green/20 text-neon-green' : 'bg-muted text-muted-foreground'}`}>
                        {b.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(b.created_at), 'MMM d, h:mm a')}</TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No bookings yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Food */}
        {activeTab === 'food' && (
          <div>
            <div className="flex gap-2 mb-4">
              <Button onClick={() => setShowCategoryDialog(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-orbitron text-xs">
                <Plus size={14} className="mr-1" /> Add Category
              </Button>
              <Button onClick={() => setShowFoodDialog(true)} className="bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron text-xs">
                <Plus size={14} className="mr-1" /> Add Item
              </Button>
            </div>
            <div className="glass rounded-xl border border-border/30 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Category</TableHead>
                    <TableHead className="text-muted-foreground">Price</TableHead>
                    <TableHead className="text-muted-foreground">Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {foodItems.map(f => (
                    <TableRow key={f.id} className="border-border/20">
                      <TableCell className="font-semibold">{f.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{(f.food_categories as any)?.name}</TableCell>
                      <TableCell className="text-primary">₹{f.price}</TableCell>
                      <TableCell>{f.is_available ? <span className="text-neon-green text-xs">✓</span> : <span className="text-destructive text-xs">✗</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div className="glass rounded-xl border border-border/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30">
                  <TableHead className="text-muted-foreground">Order ID</TableHead>
                  <TableHead className="text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(o => (
                  <TableRow key={o.id} className="border-border/20">
                    <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-primary font-orbitron">₹{o.total_amount}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${o.status === 'confirmed' ? 'bg-neon-green/20 text-neon-green' : 'bg-muted text-muted-foreground'}`}>
                        {o.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(o.created_at), 'MMM d, h:mm a')}</TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No orders yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Station Dialog */}
      <Dialog open={showStationDialog} onOpenChange={setShowStationDialog}>
        <DialogContent className="glass border-border/30">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary">Add Gaming Station</DialogTitle>
            <DialogDescription>Add a new gaming station to your lounge</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Station Name (e.g. Predator X1)" value={stationForm.name} onChange={e => setStationForm(p => ({ ...p, name: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Input placeholder="Station Number" type="number" value={stationForm.station_number} onChange={e => setStationForm(p => ({ ...p, station_number: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Input placeholder="Hourly Rate (₹)" type="number" value={stationForm.hourly_rate} onChange={e => setStationForm(p => ({ ...p, hourly_rate: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Button onClick={addStation} className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron">Add Station</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="glass border-border/30">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary">Add Food Category</DialogTitle>
            <DialogDescription>Create a new food category</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Category Name" value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Input placeholder="Icon (emoji)" value={categoryForm.icon} onChange={e => setCategoryForm(p => ({ ...p, icon: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Button onClick={addCategory} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-orbitron">Add Category</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Food Item Dialog */}
      <Dialog open={showFoodDialog} onOpenChange={setShowFoodDialog}>
        <DialogContent className="glass border-border/30">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary">Add Food Item</DialogTitle>
            <DialogDescription>Add a new item to the menu</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Item Name" value={foodForm.name} onChange={e => setFoodForm(p => ({ ...p, name: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Input placeholder="Description" value={foodForm.description} onChange={e => setFoodForm(p => ({ ...p, description: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Input placeholder="Price (₹)" type="number" value={foodForm.price} onChange={e => setFoodForm(p => ({ ...p, price: e.target.value }))} className="bg-muted/30 border-border/50" />
            <select
              value={foodForm.category_id}
              onChange={e => setFoodForm(p => ({ ...p, category_id: e.target.value }))}
              className="w-full h-10 rounded-md bg-muted/30 border border-border/50 px-3 text-sm text-foreground"
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Input placeholder="Image URL (optional)" value={foodForm.image_url} onChange={e => setFoodForm(p => ({ ...p, image_url: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Button onClick={addFoodItem} className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron">Add Item</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
