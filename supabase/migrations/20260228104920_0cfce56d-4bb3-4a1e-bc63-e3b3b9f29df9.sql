
-- =============================================
-- DROP ALL EXISTING POLICIES ON ALL TABLES
-- =============================================

-- gaming_stations
DROP POLICY IF EXISTS "Anyone can view stations" ON public.gaming_stations;
DROP POLICY IF EXISTS "Admins can manage stations" ON public.gaming_stations;

-- food_categories
DROP POLICY IF EXISTS "Anyone can view categories" ON public.food_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.food_categories;

-- food_items
DROP POLICY IF EXISTS "Anyone can view food" ON public.food_items;
DROP POLICY IF EXISTS "Admins can manage food" ON public.food_items;

-- admin_settings
DROP POLICY IF EXISTS "Anyone can view settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;

-- cart_items
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;

-- orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- order_items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;

-- time_slots
DROP POLICY IF EXISTS "Anyone can view slots" ON public.time_slots;
DROP POLICY IF EXISTS "Admins can manage slots" ON public.time_slots;
DROP POLICY IF EXISTS "Users can reserve available slots" ON public.time_slots;

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- =============================================
-- RECREATE ALL POLICIES AS PERMISSIVE
-- =============================================

-- gaming_stations (public read)
CREATE POLICY "public_read_stations" ON public.gaming_stations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_manage_stations" ON public.gaming_stations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- food_categories (public read)
CREATE POLICY "public_read_categories" ON public.food_categories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_manage_categories" ON public.food_categories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- food_items (public read)
CREATE POLICY "public_read_food" ON public.food_items
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_manage_food" ON public.food_items
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- admin_settings (public read)
CREATE POLICY "public_read_settings" ON public.admin_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_manage_settings" ON public.admin_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- time_slots (public read)
CREATE POLICY "public_read_slots" ON public.time_slots
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_manage_slots" ON public.time_slots
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_reserve_slots" ON public.time_slots
  FOR UPDATE TO authenticated
  USING (status = 'available' OR (status = 'reserved' AND reserved_by = auth.uid()));

-- cart_items (user own data)
CREATE POLICY "user_select_cart" ON public.cart_items
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_insert_cart" ON public.cart_items
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_cart" ON public.cart_items
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_delete_cart" ON public.cart_items
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- profiles
CREATE POLICY "user_select_profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_insert_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- bookings
CREATE POLICY "user_select_bookings" ON public.bookings
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_insert_bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_delete_bookings" ON public.bookings
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- orders
CREATE POLICY "user_select_orders" ON public.orders
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_insert_orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_update_orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- order_items
CREATE POLICY "user_select_order_items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "user_insert_order_items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- notifications
CREATE POLICY "user_select_notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_manage_notifications" ON public.notifications
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "user_select_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_manage_roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
