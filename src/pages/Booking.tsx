import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Monitor, Clock, Loader2, CheckCircle } from 'lucide-react';
import { format, addHours, startOfDay, addDays } from 'date-fns';

interface Station {
  id: string;
  name: string;
  station_number: number;
  hourly_rate: number;
  is_active: boolean;
}

interface TimeSlot {
  id: string;
  station_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export default function BookingPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [booking, setBooking] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(0); // 0 = today, 1 = tomorrow
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase.from('gaming_stations').select('*').eq('is_active', true).order('station_number').then(({ data }) => {
      if (data) setStations(data);
    });
  }, []);

  useEffect(() => {
    const targetDate = addDays(startOfDay(new Date()), selectedDate);
    const dayStart = targetDate.toISOString();
    const dayEnd = addDays(targetDate, 1).toISOString();

    supabase
      .from('time_slots')
      .select('*')
      .gte('start_time', dayStart)
      .lt('start_time', dayEnd)
      .then(({ data }) => {
        if (data) setSlots(data);
      });
  }, [selectedDate]);

  const getStationSlots = (stationId: string) =>
    slots.filter(s => s.station_id === stationId).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const handleBookSlot = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!selectedSlot || !selectedStation) return;

    setBooking(true);
    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      slot_id: selectedSlot.id,
      station_id: selectedStation.id,
    });

    if (!error) {
      await supabase.from('time_slots').update({ is_booked: true }).eq('id', selectedSlot.id);
      toast.success('Slot booked successfully! 🎮');
      setSlots(prev => prev.map(s => s.id === selectedSlot.id ? { ...s, is_booked: true } : s));
    } else {
      toast.error('Booking failed. Try again.');
    }
    setBooking(false);
    setSelectedSlot(null);
    setSelectedStation(null);
  };

  const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8 AM to 11 PM

  return (
    <div className="min-h-screen pt-20 px-4 pb-10">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="text-foreground">BOOK</span>{' '}
            <span className="text-primary neon-text-blue">YOUR SLOT</span>
          </h1>
          <p className="text-center text-muted-foreground mb-8">Select a station and time slot to reserve your gaming session</p>

          {/* Date selector */}
          <div className="flex justify-center gap-3 mb-8">
            {['Today', 'Tomorrow'].map((label, i) => (
              <button
                key={label}
                onClick={() => setSelectedDate(i)}
                className={`px-6 py-2 rounded-full font-rajdhani font-semibold text-sm transition-all ${
                  selectedDate === i
                    ? 'bg-primary text-primary-foreground neon-glow-blue'
                    : 'glass text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {stations.length === 0 && (
            <div className="text-center text-muted-foreground py-20">
              <Monitor size={48} className="mx-auto mb-4 opacity-50" />
              <p>No gaming stations available yet. Check back soon!</p>
            </div>
          )}

          {/* Station grid */}
          <div className="space-y-6">
            {stations.map(station => {
              const stationSlots = getStationSlots(station.id);
              return (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl p-4 border border-border/30"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Monitor size={20} className="text-primary" />
                    <h3 className="font-orbitron text-sm font-bold">{station.name}</h3>
                    <span className="text-xs text-muted-foreground">₹{station.hourly_rate}/hr</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {stationSlots.length > 0 ? (
                      stationSlots.map(slot => {
                        const hour = new Date(slot.start_time).getHours();
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const h12 = hour % 12 || 12;
                        return (
                          <button
                            key={slot.id}
                            disabled={slot.is_booked}
                            onClick={() => { setSelectedSlot(slot); setSelectedStation(station); }}
                            className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                              slot.is_booked
                                ? 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
                                : 'glass border border-neon-green/30 text-neon-green hover:neon-glow-blue hover:text-primary cursor-pointer'
                            }`}
                          >
                            {h12}{ampm}
                          </button>
                        );
                      })
                    ) : (
                      <p className="col-span-full text-xs text-muted-foreground">No slots configured for this day</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Booking confirmation dialog */}
      <Dialog open={!!selectedSlot} onOpenChange={() => { setSelectedSlot(null); setSelectedStation(null); }}>
        <DialogContent className="glass border-border/30">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary">Confirm Booking</DialogTitle>
            <DialogDescription>Review your slot details</DialogDescription>
          </DialogHeader>
          {selectedSlot && selectedStation && (
            <div className="space-y-4 pt-2">
              <div className="glass rounded-lg p-4 space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Station:</span> <span className="font-semibold">{selectedStation.name}</span></p>
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
