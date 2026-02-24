
-- Fix gaming_stations: make SELECT policy permissive
DROP POLICY IF EXISTS "Anyone can view stations" ON public.gaming_stations;
CREATE POLICY "Anyone can view stations" ON public.gaming_stations FOR SELECT USING (true);

-- Fix food_categories: make SELECT policy permissive  
DROP POLICY IF EXISTS "Anyone can view categories" ON public.food_categories;
CREATE POLICY "Anyone can view categories" ON public.food_categories FOR SELECT USING (true);

-- Fix food_items: make SELECT policy permissive
DROP POLICY IF EXISTS "Anyone can view food" ON public.food_items;
CREATE POLICY "Anyone can view food" ON public.food_items FOR SELECT USING (true);

-- Fix time_slots: make SELECT policy permissive
DROP POLICY IF EXISTS "Anyone can view slots" ON public.time_slots;
CREATE POLICY "Anyone can view slots" ON public.time_slots FOR SELECT USING (true);

-- Fix admin_settings: make SELECT policy permissive
DROP POLICY IF EXISTS "Anyone can view settings" ON public.admin_settings;
CREATE POLICY "Anyone can view settings" ON public.admin_settings FOR SELECT USING (true);
