import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Clock, Loader2, CheckCircle, ChevronLeft, ChevronRight, Gamepad2 } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';

interface Station {
  id: string;
  name: string;
  station_number: number;
  hourly_rate: number;
  is_active: boolean;
  description: string | null;
}

interface TimeSlot {
  id: string;
  station_id: string;
  start_time: string;
  end_time: string;
  status: string;
  duration_minutes: number;
  reserved_by: string | null;
  reserved_until: string | null;
}

const GAME_IMAGES: Record<string, string> = {
  'Pool Table': 'https://images.unsplash.com/photo-1611068813799-0b4cb6996e72?w=400&h=250&fit=crop',
  'Snooker': 'https://images.unsplash.com/photo-1615212814093-f56085658024?w=400&h=250&fit=crop',
  'PlayStation 4': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=250&fit=crop',
  'PlayStation 5': 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&h=250&fit=crop',
};

export default function GamesTab() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState(0);
  const [booking, setBooking] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase.from('gaming_stations').select('*').eq('is_active', true).order('station_number').then(({ data }) => {
      if (data) setStations(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedStation) return;
    fetchSlots();
  }, [selectedStation, selectedDate]);

  const fetchSlots = async () => {
    if (!selectedStation) return;
    const targetDate = addDays(startOfDay(new Date()), selectedDate);
    const dayStart = targetDate.toISOString();
    const dayEnd = addDays(targetDate, 1).toISOString();

    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('station_id', selectedStation.id)
      .gte('start_time', dayStart)
      .lt('start_time', dayEnd)
      .order('start_time');

    if (error) {
      setSlots([]);
      return;
    }

    setSlots((data ?? []) as TimeSlot[]);
  };

  const handleBookSlot = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!selectedSlot || !selectedStation) return;

    setBooking(true);

    // Re-check slot availability (prevent double booking)
    const { data: freshSlot } = await supabase
      .from('time_slots')
      .select('status')
      .eq('id', selectedSlot.id)
      .single();

    if (!freshSlot || (freshSlot.status !== 'available' && freshSlot.status !== 'reserved')) {
      toast.error('This slot was just booked by another user. Please select another slot.');
      setBooking(false);
      setSelectedSlot(null);
      fetchSlots();
      return;
    }

    // Reserve the slot
    await supabase.from('time_slots').update({
      status: 'reserved',
      reserved_by: user.id,
      reserved_until: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }).eq('id', selectedSlot.id);

    // Create booking
    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      slot_id: selectedSlot.id,
      station_id: selectedStation.id,
    });

    if (!error) {
      // Mark slot as booked
      await supabase.from('time_slots').update({
        status: 'booked',
        reserved_by: null,
        reserved_until: null,
      }).eq('id', selectedSlot.id);

      toast.success('Slot booked successfully! 🎮');
      fetchSlots();
    } else {
      // Rollback reservation
      await supabase.from('time_slots').update({
        status: 'available',
        reserved_by: null,
        reserved_until: null,
      }).eq('id', selectedSlot.id);
      toast.error('Booking failed. Try again.');
    }

    setBooking(false);
    setSelectedSlot(null);
  };

  // Use absolute current time for robust future-slot filtering across devices/timezones
  const getNow = () => new Date();

  const getSlotColor = (slot: TimeSlot) => {
    if (slot.status === 'booked') return 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed';
    if (slot.status === 'reserved') return 'bg-accent/20 text-accent cursor-not-allowed';
    if (slot.status === 'blocked') return 'bg-destructive/20 text-destructive/50 cursor-not-allowed';
    return 'glass border border-neon-green/30 text-neon-green hover:neon-glow-blue hover:text-primary cursor-pointer active:scale-95';
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { index: i, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(d, 'EEE dd') };
  });

  return (
    <div className="px-4 pb-4">
      {!selectedStation ? (
        // Game cards grid
        <div className="space-y-4">
          <h2 className="font-orbitron text-lg font-bold text-foreground text-center">
            Choose Your <span className="text-primary neon-text-blue">Game</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {stations.map((station, i) => (
              <motion.button
                key={station.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedStation(station)}
                className="glass rounded-xl overflow-hidden border border-border/30 hover:neon-border-blue transition-all active:scale-95 text-left"
              >
                <div className="h-28 overflow-hidden">
                  <img
                    src={GAME_IMAGES[station.name] || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=250&fit=crop'}
                    alt={station.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-orbitron text-xs font-bold text-foreground truncate">{station.name}</h3>
                  <p className="text-primary font-orbitron text-sm font-bold mt-1">₹{station.hourly_rate}<span className="text-muted-foreground text-[10px] font-rajdhani">/hour</span></p>
                </div>
              </motion.button>
            ))}
          </div>
          {stations.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <Gamepad2 size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No games available yet</p>
            </div>
          )}
        </div>
      ) : (
        // Booking section
        <div>
          <button
            onClick={() => { setSelectedStation(null); setSlots([]); }}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-3 text-sm"
          >
            <ChevronLeft size={16} /> Back to Games
          </button>

          <div className="glass rounded-xl p-4 border border-border/30 mb-4">
            <div className="flex items-center gap-3">
              <img
                src={GAME_IMAGES[selectedStation.name] || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&h=80&fit=crop'}
                className="w-16 h-16 rounded-lg object-cover"
                alt={selectedStation.name}
              />
              <div>
                <h3 className="font-orbitron text-sm font-bold">{selectedStation.name}</h3>
                <p className="text-primary font-orbitron text-lg font-bold">₹{selectedStation.hourly_rate}<span className="text-muted-foreground text-xs font-rajdhani">/hour</span></p>
              </div>
            </div>
          </div>

          {/* Date selector - horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {dates.map((d) => (
              <button
                key={d.index}
                onClick={() => setSelectedDate(d.index)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedDate === d.index
                    ? 'bg-primary text-primary-foreground neon-glow-blue'
                    : 'glass text-muted-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Time slots */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neon-green" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/50" /> Booked</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive/50" /> Blocked</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {slots.filter((slot) => {
                // For today, hide past slots
                if (selectedDate === 0) {
                  const now = getNow();
                  const slotTime = new Date(slot.start_time);
                  return slotTime > now;
                }
                return true;
              }).map((slot) => {
                const h = new Date(slot.start_time).getHours();
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;
                const isAvailable = slot.status === 'available';
                return (
                  <button
                    key={slot.id}
                    disabled={!isAvailable}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${getSlotColor(slot)}`}
                  >
                    {h12}:00 {ampm}
                  </button>
                );
              })}
            </div>
            {slots.filter((slot) => selectedDate === 0 ? new Date(slot.start_time) > getNow() : true).length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No upcoming slots available for this day</p>
            )}
          </div>
        </div>
      )}

      {/* Booking confirmation dialog */}
      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="glass border-border/30 mx-4">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary">Confirm Booking</DialogTitle>
            <DialogDescription>Review your booking details</DialogDescription>
          </DialogHeader>
          {selectedSlot && selectedStation && (
            <div className="space-y-4 pt-2">
              <div className="glass rounded-lg p-4 space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Game:</span> <span className="font-semibold">{selectedStation.name}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Date:</span> <span className="font-semibold">{format(new Date(selectedSlot.start_time), 'MMM dd, yyyy')}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Time:</span> <span className="font-semibold">{format(new Date(selectedSlot.start_time), 'h:mm a')} - {format(new Date(selectedSlot.end_time), 'h:mm a')}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Price:</span> <span className="font-orbitron text-primary font-bold">₹{selectedStation.hourly_rate}</span></p>
              </div>
              <Button
                onClick={handleBookSlot}
                disabled={booking}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-orbitron neon-glow-blue"
              >
                {booking ? <><Loader2 className="animate-spin mr-2" size={16} /> Booking...</> : <><CheckCircle size={16} className="mr-2" /> Confirm Booking</>}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

