import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Monitor, UtensilsCrossed, CalendarDays, Package, Plus, Trash2,
  Bell, Clock, Settings, TrendingUp, Users, DollarSign, Gamepad2,
  Download, ChevronLeft, Edit, Ban
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const [stations, setStations] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Forms
  const [stationForm, setStationForm] = useState({ name: '', station_number: '', hourly_rate: '100', description: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '' });
  const [foodForm, setFoodForm] = useState({ name: '', description: '', price: '', category_id: '', image_url: '' });
  const [settingsForm, setSettingsForm] = useState({ contact_number: '', about_text: '', whatsapp_number: '', logo_url: '' });
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

  // Auto-refresh every 15s
  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const fetchAll = () => {
    supabase.from('gaming_stations').select('*').order('station_number').then(({ data }) => data && setStations(data));
    supabase.from('bookings').select('*, gaming_stations(name), time_slots(start_time, end_time)').order('created_at', { ascending: false }).then(({ data }) => data && setBookings(data));
    supabase.from('food_categories').select('*').order('sort_order').then(({ data }) => data && setCategories(data));
    supabase.from('food_items').select('*, food_categories(name)').order('name').then(({ data }) => data && setFoodItems(data));
    supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).then(({ data }) => data && setOrders(data));
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20).then(({ data }) => data && setNotifications(data));
    supabase.from('admin_settings').select('*').limit(1).single().then(({ data }) => {
      if (data) {
        setSettings(data);
        setSettingsForm({ contact_number: data.contact_number || '', about_text: data.about_text || '', whatsapp_number: data.whatsapp_number || '', logo_url: data.logo_url || '' });
      }
    });
    supabase.from('profiles').select('*').then(({ data }) => data && setUsers(data));
  };

  // CRUD handlers
  const addStation = async () => {
    const { error } = await supabase.from('gaming_stations').insert({ name: stationForm.name, station_number: parseInt(stationForm.station_number), hourly_rate: parseFloat(stationForm.hourly_rate), description: stationForm.description || null });
    if (error) toast.error(error.message);
    else { toast.success('Station added!'); setShowStationDialog(false); setStationForm({ name: '', station_number: '', hourly_rate: '100', description: '' }); fetchAll(); }
  };

  const deleteStation = async (id: string) => {
    await supabase.from('gaming_stations').delete().eq('id', id);
    toast.success('Station removed'); fetchAll();
  };

  const addCategory = async () => {
    const { error } = await supabase.from('food_categories').insert({ name: categoryForm.name, icon: categoryForm.icon || null });
    if (error) toast.error(error.message);
    else { toast.success('Category added!'); setShowCategoryDialog(false); setCategoryForm({ name: '', icon: '' }); fetchAll(); }
  };

  const addFoodItem = async () => {
    const { error } = await supabase.from('food_items').insert({ name: foodForm.name, description: foodForm.description || null, price: parseFloat(foodForm.price), category_id: foodForm.category_id, image_url: foodForm.image_url || null });
    if (error) toast.error(error.message);
    else { toast.success('Item added!'); setShowFoodDialog(false); setFoodForm({ name: '', description: '', price: '', category_id: '', image_url: '' }); fetchAll(); }
  };

  const deleteFoodItem = async (id: string) => {
    await supabase.from('food_items').delete().eq('id', id);
    toast.success('Item removed'); fetchAll();
  };

  const generateSlots = async (stationId: string) => {
    const slotsToInsert: any[] = [];
    for (let day = 0; day < 7; day++) {
      const base = new Date();
      base.setDate(base.getDate() + day);
      base.setHours(10, 0, 0, 0);
      for (let h = 0; h < 10; h++) { // 10AM to 8PM
        const start = new Date(base); start.setHours(10 + h);
        const end = new Date(start); end.setHours(start.getHours() + 1);
        slotsToInsert.push({ station_id: stationId, start_time: start.toISOString(), end_time: end.toISOString(), status: 'available' });
      }
    }
    const { error } = await supabase.from('time_slots').insert(slotsToInsert);
    if (error) toast.error(error.message);
    else toast.success('Slots generated for 7 days!');
  };

  const blockSlot = async (slotId: string) => {
    await supabase.from('time_slots').update({ status: 'blocked' }).eq('id', slotId);
    toast.success('Slot blocked'); fetchAll();
  };

  const saveSettings = async () => {
    if (!settings?.id) return;
    await supabase.from('admin_settings').update(settingsForm).eq('id', settings.id);
    toast.success('Settings saved!'); fetchAll();
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(r => Object.values(r).map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
  };

  if (isAdmin === null) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  const today = new Date();
  const todayBookings = bookings.filter(b => new Date(b.created_at).toDateString() === today.toDateString());
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today.toDateString());
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const monthRevenue = orders.filter(o => new Date(o.created_at).getMonth() === today.getMonth()).reduce((s, o) => s + Number(o.total_amount), 0);

  // Chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === d.toDateString());
    return { day: format(d, 'EEE'), revenue: dayOrders.reduce((s, o) => s + Number(o.total_amount), 0) };
  });

  const gameBookingCounts = stations.map(s => ({
    name: s.name,
    count: bookings.filter(b => b.station_id === s.id).length,
  }));

  const CHART_COLORS = ['hsl(190,100%,50%)', 'hsl(270,60%,60%)', 'hsl(145,80%,50%)', 'hsl(330,80%,60%)'];

  const unreadNotifications = notifications.filter(n => !n.read_status).length;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'stations', label: 'Games', icon: Monitor },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'food', label: 'Food', icon: UtensilsCrossed },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen px-4 pb-10 pt-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground"><ChevronLeft size={20} /></button>
          <h1 className="font-orbitron text-lg font-bold text-foreground flex items-center gap-2">
            <span className="text-primary">⚡</span> Admin
          </h1>
          <div className="relative ml-auto">
            <Bell size={18} className="text-muted-foreground" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] flex items-center justify-center text-destructive-foreground animate-pulse-neon">{unreadNotifications}</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground neon-glow-blue' : 'glass text-muted-foreground'
              }`}>
              <tab.icon size={13} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Today's Revenue", value: `₹${todayRevenue}`, icon: DollarSign, color: 'text-neon-green' },
                { label: 'Monthly Revenue', value: `₹${monthRevenue}`, icon: TrendingUp, color: 'text-primary' },
                { label: "Today's Bookings", value: todayBookings.length, icon: CalendarDays, color: 'text-accent' },
                { label: 'Total Users', value: users.length, icon: Users, color: 'text-neon-pink' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="glass rounded-xl p-4 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon size={14} className={stat.color} />
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase">{stat.label}</p>
                  </div>
                  <p className={`font-orbitron text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Revenue chart */}
            <div className="glass rounded-xl p-4 border border-border/30">
              <h3 className="font-orbitron text-xs font-bold mb-3">Revenue (Last 7 Days)</h3>
              <ChartContainer config={{ revenue: { label: 'Revenue', color: 'hsl(var(--primary))' } }} className="h-48">
                <BarChart data={last7Days}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Game performance */}
            <div className="glass rounded-xl p-4 border border-border/30">
              <h3 className="font-orbitron text-xs font-bold mb-3">Game Bookings</h3>
              <ChartContainer config={{ count: { label: 'Bookings' } }} className="h-48">
                <PieChart>
                  <Pie data={gameBookingCounts} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, count }) => `${name}: ${count}`}>
                    {gameBookingCounts.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>

            {/* Export */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => exportCSV(bookings, 'bookings')} className="text-xs border-border/30"><Download size={12} className="mr-1" /> Export Bookings</Button>
              <Button size="sm" variant="outline" onClick={() => exportCSV(orders, 'orders')} className="text-xs border-border/30"><Download size={12} className="mr-1" /> Export Orders</Button>
            </div>
          </div>
        )}

        {/* Stations */}
        {activeTab === 'stations' && (
          <div>
            <Button onClick={() => setShowStationDialog(true)} className="mb-3 bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron text-xs"><Plus size={14} className="mr-1" /> Add Game</Button>
            <div className="space-y-2">
              {stations.map(s => (
                <div key={s.id} className="glass rounded-lg p-3 flex items-center justify-between border border-border/30">
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-primary font-orbitron">₹{s.hourly_rate}/hr</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => generateSlots(s.id)} className="text-[10px] h-7 border-border/30"><Clock size={10} className="mr-0.5" /> Gen Slots</Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteStation(s.id)} className="text-destructive h-7"><Trash2 size={12} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings */}
        {activeTab === 'bookings' && (
          <div>
            <Button size="sm" variant="outline" onClick={() => exportCSV(bookings, 'bookings')} className="mb-3 text-xs border-border/30"><Download size={12} className="mr-1" /> Export CSV</Button>
            <div className="space-y-2">
              {bookings.map(b => (
                <div key={b.id} className="glass rounded-lg p-3 border border-border/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{(b.gaming_stations as any)?.name}</p>
                      <p className="text-xs text-muted-foreground">{b.time_slots ? `${format(new Date((b.time_slots as any).start_time), 'MMM dd, h:mm a')}` : '-'}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">User: {b.user_id.slice(0, 8)}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-neon-green/20 text-neon-green' : 'bg-muted text-muted-foreground'}`}>{b.status}</span>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No bookings</p>}
            </div>
          </div>
        )}

        {/* Food */}
        {activeTab === 'food' && (
          <div>
            <div className="flex gap-2 mb-3">
              <Button onClick={() => setShowCategoryDialog(true)} className="bg-accent text-accent-foreground hover:bg-accent/80 font-orbitron text-xs"><Plus size={14} className="mr-1" /> Category</Button>
              <Button onClick={() => setShowFoodDialog(true)} className="bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron text-xs"><Plus size={14} className="mr-1" /> Item</Button>
            </div>
            <div className="space-y-2">
              {foodItems.map(f => (
                <div key={f.id} className="glass rounded-lg p-3 flex items-center justify-between border border-border/30">
                  <div>
                    <p className="font-semibold text-sm">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{(f.food_categories as any)?.name} · <span className="text-primary">₹{f.price}</span></p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteFoodItem(f.id)} className="text-destructive h-7"><Trash2 size={12} /></Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div>
            <Button size="sm" variant="outline" onClick={() => exportCSV(orders, 'orders')} className="mb-3 text-xs border-border/30"><Download size={12} className="mr-1" /> Export CSV</Button>
            <div className="space-y-2">
              {orders.map(o => (
                <div key={o.id} className="glass rounded-lg p-3 border border-border/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                      <p className="text-primary font-orbitron font-bold text-sm">₹{o.total_amount}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(o.created_at), 'MMM dd, h:mm a')}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${o.status === 'confirmed' ? 'bg-neon-green/20 text-neon-green' : 'bg-muted text-muted-foreground'}`}>{o.status}</span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No orders</p>}
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="glass rounded-xl p-4 border border-border/30 space-y-3">
            <h3 className="font-orbitron text-sm font-bold text-primary">App Settings</h3>
            <Input placeholder="Logo URL" value={settingsForm.logo_url} onChange={e => setSettingsForm(p => ({ ...p, logo_url: e.target.value }))} className="bg-muted/30 border-border/50 text-sm" />
            <Input placeholder="Contact Number" value={settingsForm.contact_number} onChange={e => setSettingsForm(p => ({ ...p, contact_number: e.target.value }))} className="bg-muted/30 border-border/50 text-sm" />
            <Input placeholder="WhatsApp Number" value={settingsForm.whatsapp_number} onChange={e => setSettingsForm(p => ({ ...p, whatsapp_number: e.target.value }))} className="bg-muted/30 border-border/50 text-sm" />
            <textarea
              placeholder="About Text"
              value={settingsForm.about_text}
              onChange={e => setSettingsForm(p => ({ ...p, about_text: e.target.value }))}
              className="w-full h-24 rounded-md bg-muted/30 border border-border/50 px-3 py-2 text-sm text-foreground resize-none"
            />
            <Button onClick={saveSettings} className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron text-xs">Save Settings</Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={showStationDialog} onOpenChange={setShowStationDialog}>
        <DialogContent className="glass border-border/30">
          <DialogHeader><DialogTitle className="font-orbitron text-primary">Add Game</DialogTitle><DialogDescription>Add a new game station</DialogDescription></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Game Name (e.g. Pool Table)" value={stationForm.name} onChange={e => setStationForm(p => ({ ...p, name: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Input placeholder="Station Number" type="number" value={stationForm.station_number} onChange={e => setStationForm(p => ({ ...p, station_number: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Input placeholder="Hourly Rate (₹)" type="number" value={stationForm.hourly_rate} onChange={e => setStationForm(p => ({ ...p, hourly_rate: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Button onClick={addStation} className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron">Add Game</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="glass border-border/30">
          <DialogHeader><DialogTitle className="font-orbitron text-primary">Add Category</DialogTitle><DialogDescription>Create a food category</DialogDescription></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Category Name" value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Input placeholder="Icon (emoji)" value={categoryForm.icon} onChange={e => setCategoryForm(p => ({ ...p, icon: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Button onClick={addCategory} className="w-full bg-accent text-accent-foreground hover:bg-accent/80 font-orbitron">Add Category</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFoodDialog} onOpenChange={setShowFoodDialog}>
        <DialogContent className="glass border-border/30">
          <DialogHeader><DialogTitle className="font-orbitron text-primary">Add Food Item</DialogTitle><DialogDescription>Add to menu</DialogDescription></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Item Name" value={foodForm.name} onChange={e => setFoodForm(p => ({ ...p, name: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Input placeholder="Description" value={foodForm.description} onChange={e => setFoodForm(p => ({ ...p, description: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Input placeholder="Price (₹)" type="number" value={foodForm.price} onChange={e => setFoodForm(p => ({ ...p, price: e.target.value }))} className="bg-muted/30 border-border/50" />
            <select value={foodForm.category_id} onChange={e => setFoodForm(p => ({ ...p, category_id: e.target.value }))} className="w-full h-10 rounded-md bg-muted/30 border border-border/50 px-3 text-sm text-foreground">
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input placeholder="Image URL" value={foodForm.image_url} onChange={e => setFoodForm(p => ({ ...p, image_url: e.target.value }))} className="bg-muted/30 border-border/50" />
            <Button onClick={addFoodItem} className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron">Add Item</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
