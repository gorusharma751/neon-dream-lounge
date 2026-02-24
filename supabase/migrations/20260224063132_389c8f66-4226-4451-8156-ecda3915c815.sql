
-- Add slot status column to time_slots (replacing is_booked boolean)
ALTER TABLE public.time_slots ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'available';
ALTER TABLE public.time_slots ADD COLUMN IF NOT EXISTS reserved_by uuid;
ALTER TABLE public.time_slots ADD COLUMN IF NOT EXISTS reserved_until timestamp with time zone;
ALTER TABLE public.time_slots ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60;

-- Migrate existing data
UPDATE public.time_slots SET status = CASE WHEN is_booked THEN 'booked' ELSE 'available' END;

-- Update RLS: allow authenticated users to update slots (for reservation)
CREATE POLICY "Authenticated users can reserve slots"
ON public.time_slots
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create admin_settings table
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  theme_color text DEFAULT '#00d4ff',
  contact_number text DEFAULT '+91 98765 43210',
  about_text text DEFAULT 'Premium Gaming Lounge',
  whatsapp_number text,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings"
ON public.admin_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings"
ON public.admin_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.admin_settings (contact_number, about_text) VALUES ('+91 98765 43210', 'Premium Gaming Lounge - Pool, Snooker & PlayStation');

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  read_status boolean DEFAULT false,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage notifications"
ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT USING (user_id = auth.uid());

-- Add mobile_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
