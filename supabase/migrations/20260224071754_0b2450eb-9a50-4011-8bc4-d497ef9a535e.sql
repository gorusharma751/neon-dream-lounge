
-- Fix: Make all public SELECT policies PERMISSIVE instead of RESTRICTIVE

-- gaming_stations
DROP POLICY IF EXISTS "Anyone can view stations" ON public.gaming_stations;
CREATE POLICY "Anyone can view stations" ON public.gaming_stations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage stations" ON public.gaming_stations;
CREATE POLICY "Admins can manage stations" ON public.gaming_stations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- food_categories
DROP POLICY IF EXISTS "Anyone can view categories" ON public.food_categories;
CREATE POLICY "Anyone can view categories" ON public.food_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.food_categories;
CREATE POLICY "Admins can manage categories" ON public.food_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- food_items
DROP POLICY IF EXISTS "Anyone can view food" ON public.food_items;
CREATE POLICY "Anyone can view food" ON public.food_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage food" ON public.food_items;
CREATE POLICY "Admins can manage food" ON public.food_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- admin_settings
DROP POLICY IF EXISTS "Anyone can view settings" ON public.admin_settings;
CREATE POLICY "Anyone can view settings" ON public.admin_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
CREATE POLICY "Admins can manage settings" ON public.admin_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- time_slots
DROP POLICY IF EXISTS "Anyone can view slots" ON public.time_slots;
CREATE POLICY "Anyone can view slots" ON public.time_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage slots" ON public.time_slots;
CREATE POLICY "Admins can manage slots" ON public.time_slots FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can reserve available slots" ON public.time_slots;
CREATE POLICY "Authenticated users can reserve available slots" ON public.time_slots FOR UPDATE TO authenticated
USING (status = 'available' OR (status = 'reserved' AND reserved_by = auth.uid()))
WITH CHECK (status IN ('available', 'reserved'));

-- profiles - fix SELECT to be permissive
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- user_roles - allow admins + let users read their own roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;
CREATE POLICY "Users can delete own bookings" ON public.bookings FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- cart_items
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" ON public.cart_items FOR ALL TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can add to cart" ON public.cart_items;
CREATE POLICY "Users can add to cart" ON public.cart_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- order_items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
