
-- Drop ALL existing restrictive policies and recreate as PERMISSIVE

-- admin_settings
DROP POLICY IF EXISTS "Anyone can view settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
CREATE POLICY "Anyone can view settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.admin_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- gaming_stations
DROP POLICY IF EXISTS "Anyone can view stations" ON public.gaming_stations;
DROP POLICY IF EXISTS "Admins can manage stations" ON public.gaming_stations;
CREATE POLICY "Anyone can view stations" ON public.gaming_stations FOR SELECT USING (true);
CREATE POLICY "Admins can manage stations" ON public.gaming_stations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- food_categories
DROP POLICY IF EXISTS "Anyone can view categories" ON public.food_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.food_categories;
CREATE POLICY "Anyone can view categories" ON public.food_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.food_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- food_items
DROP POLICY IF EXISTS "Anyone can view food" ON public.food_items;
DROP POLICY IF EXISTS "Admins can manage food" ON public.food_items;
CREATE POLICY "Anyone can view food" ON public.food_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage food" ON public.food_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- time_slots
DROP POLICY IF EXISTS "Anyone can view slots" ON public.time_slots;
DROP POLICY IF EXISTS "Admins can manage slots" ON public.time_slots;
DROP POLICY IF EXISTS "Users can reserve available slots" ON public.time_slots;
CREATE POLICY "Anyone can view slots" ON public.time_slots FOR SELECT USING (true);
CREATE POLICY "Admins can manage slots" ON public.time_slots FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can reserve available slots" ON public.time_slots FOR UPDATE USING ((status = 'available') OR (status = 'reserved' AND reserved_by = auth.uid()));

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());

-- bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own bookings" ON public.bookings FOR DELETE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- cart_items
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" ON public.cart_items FOR ALL USING (user_id = auth.uid());

-- orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- order_items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
